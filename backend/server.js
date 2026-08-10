const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const connectDB = require('./config/db');
const { pool, dbStatus } = require('./config/db');
const chatbot = require('./chatbot/manager');
const demoHospitals = require('./data/hospitals.json');

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT || 5001);
const JWT_SECRET = process.env.JWT_SECRET || 'development-only-change-me';
const uploadsDir = path.join(__dirname, 'uploads', 'certificates');
fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, done) => done(null, ['application/pdf', 'image/png', 'image/jpeg'].includes(file.mimetype)),
});

function sign(payload, expiresIn = '2h') { return jwt.sign(payload, JWT_SECRET, { expiresIn }); }
function authenticate(role) {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
      const user = jwt.verify(token, JWT_SECRET);
      if (role && user.role !== role) return res.status(403).json({ message: 'Insufficient access' });
      req.user = user; next();
    } catch { return res.status(401).json({ message: 'Valid access token required' }); }
  };
}

async function seedDemoData() {
  if (dbStatus() !== 'connected') return;
  for (const h of demoHospitals) {
    await pool.query(`INSERT INTO hospitals(id,name,email,city,state,address,latitude,longitude,facility_type,verification_status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'demo') ON CONFLICT(id) DO NOTHING`,
      [h.id,h.name,h.email,h.city,h.state,h.location,h.lat,h.lng,h.type]);
    const exists = await pool.query('SELECT 1 FROM resource_snapshots WHERE hospital_id=$1 LIMIT 1',[h.id]);
    if (!exists.rowCount) await pool.query(`INSERT INTO resource_snapshots(hospital_id,total_beds,occupied_beds,icu_available,oxygen_beds_available,blood_inventory)
      VALUES($1,$2,$3,$4,$5,$6)`,[h.id,h.beds.total,h.beds.occupied,h.beds.icu,h.beds.oxygen,JSON.stringify(h.blood)]);
  }
}

async function listHospitals() {
  if (dbStatus() !== 'connected') return demoHospitals;
  const result = await pool.query(`SELECT h.*,s.total_beds,s.occupied_beds,s.icu_available,s.oxygen_beds_available,s.blood_inventory,s.recorded_at
    FROM hospitals h LEFT JOIN LATERAL (SELECT * FROM resource_snapshots WHERE hospital_id=h.id ORDER BY recorded_at DESC LIMIT 1) s ON true ORDER BY h.name`);
  return result.rows.map(r=>({id:r.id,name:r.name,email:r.email,city:r.city,state:r.state,location:r.address,lat:r.latitude,lng:r.longitude,type:r.facility_type,
    beds:{total:r.total_beds||0,occupied:r.occupied_beds||0,icu:r.icu_available||0,oxygen:r.oxygen_beds_available||0},blood:r.blood_inventory||{},lastUpdated:r.recorded_at,verificationStatus:r.verification_status}));
}

app.get('/api/health', (_req,res)=>res.json({status:'Online',database:dbStatus(),model:fs.existsSync(path.join(__dirname,'../ml/occupancy_model.pkl'))?'ready':'not-trained'}));
app.get('/api/hospitals', async (_req,res)=>{ try { res.json(await listHospitals()); } catch { res.json(demoHospitals); } });

app.post('/api/admin/login', async (req,res)=>{
  const email = process.env.ADMIN_EMAIL || 'admin@carebridge.in';
  const configured = process.env.ADMIN_PASSWORD_HASH;
  const fallback = process.env.ADMIN_PASSWORD || 'CareBridgeDemo2026!';
  const valid = req.body.email === email && (configured ? await bcrypt.compare(req.body.password||'',configured) : req.body.password === fallback);
  if (!valid) return res.status(401).json({message:'Invalid administrator credentials'});
  res.json({token:sign({email,role:'admin'}),expiresIn:7200});
});

app.post('/api/hospitals/login', async (req,res)=>{
  if (dbStatus() !== 'connected') return res.status(503).json({message:'Hospital login requires PostgreSQL'});
  const result=await pool.query('SELECT id,name,email,password_hash FROM hospitals WHERE email=$1',[req.body.email]);
  const hospital=result.rows[0];
  if(!hospital?.password_hash || !await bcrypt.compare(req.body.password||'',hospital.password_hash)) return res.status(401).json({message:'Invalid credentials'});
  res.json({token:sign({id:hospital.id,email:hospital.email,role:'hospital'},'8h'),hospital:{id:hospital.id,name:hospital.name,email:hospital.email}});
});

app.put('/api/hospitals/:id/resources',authenticate('hospital'),async(req,res)=>{
  if(req.user.id!==req.params.id)return res.status(403).json({message:'Cannot update another facility'});
  const {total,occupied,icu,oxygen,blood={}}=req.body;
  if(![total,occupied,icu,oxygen].every(Number.isFinite)||occupied>total||Math.min(total,occupied,icu,oxygen)<0)return res.status(400).json({message:'Invalid non-negative inventory values'});
  await pool.query(`INSERT INTO resource_snapshots(hospital_id,total_beds,occupied_beds,icu_available,oxygen_beds_available,blood_inventory) VALUES($1,$2,$3,$4,$5,$6)`,[req.params.id,total,occupied,icu,oxygen,JSON.stringify(blood)]);
  res.json({success:true});
});

app.get('/api/analyze',(req,res)=>{
  const occupancy=Number(req.query.current_occupancy??70);
  if(!Number.isFinite(occupancy)||occupancy<0||occupancy>100)return res.status(400).json({message:'current_occupancy must be between 0 and 100'});
  const script=path.join(__dirname,'../ml/predict.py');
  execFile(process.env.PYTHON_BIN||'python3',[script,JSON.stringify({current_occupancy:occupancy})],{timeout:10000},(error,stdout)=>{
    if(error)return res.status(503).json({message:'Forecast service unavailable'});
    const prediction=JSON.parse(stdout);const peak=Math.max(...prediction.occupancy_trend);
    res.json({...prediction,model_score:prediction.metrics?.r2||0,insight:peak>=90?`Forecast reaches ${peak}%. Confirm capacity before dispatch.`:`Forecast peaks at ${peak}%. Continue monitoring live updates.`});
  });
});

app.post('/api/chat',async(req,res)=>{
  if(!String(req.body.message||'').trim())return res.status(400).json({message:'Message required'});
  const answer=chatbot.getResponse(req.body.message);
  if(['blood_availability','bed_availability','location_query'].includes(answer.intent)){
    const facilities=await listHospitals().catch(()=>demoHospitals);
    if(answer.intent==='blood_availability'){
      const requested=(String(req.body.message).toUpperCase().match(/\b(?:A|B|AB|O)[+-]\b/)||['O-'])[0];
      const matches=facilities.filter(item=>(item.blood?.[requested]||0)>0).sort((a,b)=>b.blood[requested]-a.blood[requested]).slice(0,3);
      answer.response=matches.length?`${requested} inventory: ${matches.map(item=>`${item.name} (${item.blood[requested]} units, ${item.city})`).join('; ')}. Call the hospital to confirm before travelling.`:`No ${requested} inventory is currently listed. Call 112 for an emergency and contact the nearest licensed blood bank.`;
    } else {
      const matches=facilities.map(item=>({...item,available:Math.max(0,item.beds.total-item.beds.occupied)})).filter(item=>item.available>0).sort((a,b)=>b.available-a.available).slice(0,3);
      answer.response=matches.length?`Listed bed capacity: ${matches.map(item=>`${item.name} (${item.available} beds, ${item.beds.icu||0} ICU, ${item.city})`).join('; ')}. Confirm availability directly before dispatch.`:'No available beds are currently listed. Call 112 for urgent assistance.';
    }
  }
  res.json(answer);
});
app.get('/api/chat/status',(_req,res)=>res.json(chatbot.getStatus()));

app.post('/api/certificates',authenticate('hospital'),upload.single('certificate'),async(req,res)=>{
  if(!req.file)return res.status(400).json({message:'PDF, PNG or JPG certificate required'});
  const bytes=fs.readFileSync(req.file.path);const sha256=crypto.createHash('sha256').update(bytes).digest('hex');
  const {certificateType='Other',issuer='',registrationNumber='',hfrId=''}=req.body;const signals=[];let risk=10;
  if(!issuer){risk+=20;signals.push('Issuer missing')}if(!registrationNumber){risk+=25;signals.push('Registration number missing')}if(!hfrId){risk+=10;signals.push('HFR ID missing')}if(req.file.size<20000){risk+=15;signals.push('Unusually small file')}
  risk=Math.min(100,risk);const analysis={riskScore:risk,signals,sha256,disclaimer:'Automated screening is not proof of authenticity. Verify with ABDM HFR and the issuer.'};
  if(dbStatus()==='connected')await pool.query(`INSERT INTO certificates(hospital_id,certificate_type,issuer,registration_number,file_path,sha256,risk_score,analysis) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[req.user.id,certificateType,issuer,registrationNumber,req.file.path,sha256,risk,JSON.stringify({...analysis,hfrId})]);
  res.status(201).json({reviewStatus:'manual_review',analysis});
});

app.get('/api/admin/audit',authenticate('admin'),async(_req,res)=>{if(dbStatus()!=='connected')return res.json([]);res.json((await pool.query('SELECT * FROM audit_events ORDER BY created_at DESC LIMIT 100')).rows)});
app.use((err,_req,res,_next)=>res.status(err.code==='LIMIT_FILE_SIZE'?413:500).json({message:err.message||'Unexpected server error'}));

async function start(){await connectDB();await seedDemoData();await chatbot.train();app.listen(PORT,'0.0.0.0',()=>console.log(`CareBridge API listening on ${PORT}`));}
if(require.main===module)start();
module.exports={app,start};
