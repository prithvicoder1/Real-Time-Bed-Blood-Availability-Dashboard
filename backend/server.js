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
const { pool, dbStatus, migrateDatabase } = require('./config/db');
const chatbot = require('./chatbot/manager');
const demoHospitals = require('./data/hospitals.json');

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT || 5001);
const JWT_SECRET = process.env.JWT_SECRET || 'development-only-change-me';
const uploadsRoot = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
const uploadsDir = path.join(uploadsRoot, 'certificates');
fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(uploadsRoot));

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
  await pool.query('ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS phone TEXT');
  await pool.query('ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS license_number TEXT');
  await pool.query('ALTER TABLE certificates ADD COLUMN IF NOT EXISTS original_filename TEXT');
  await pool.query("DELETE FROM hospitals WHERE verification_status IN ('demo','public_directory')");
  for (const h of demoHospitals) {
    await pool.query(`INSERT INTO hospitals(id,name,email,city,state,address,latitude,longitude,facility_type,verification_status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'public_directory') ON CONFLICT(id) DO NOTHING`,
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

app.get('/api/health', (_req,res)=>res.json({status:'Online',database:dbStatus(),model:fs.existsSync(path.join(__dirname,'../ml/occupancy_model.pkl'))?'ready':'not-trained',facilities:demoHospitals.length}));
app.get('/api/hospitals', async (req,res)=>{
  try { const all=await listHospitals();const query=String(req.query.q||'').trim().toLowerCase();const state=String(req.query.state||'').trim().toLowerCase();const filtered=all.filter(h=>!query||`${h.name} ${h.city} ${h.state} ${h.location}`.toLowerCase().includes(query)).filter(h=>!state||h.state.toLowerCase()===state);const limit=Math.min(150,Math.max(1,Number(req.query.limit)||30));const page=Math.max(1,Number(req.query.page)||1);const start=(page-1)*limit;
    res.json({data:filtered.slice(start,start+limit),pagination:{page,limit,total:filtered.length,pages:Math.ceil(filtered.length/limit)},source:{name:'National Hospital Directory / Living Atlas India',inventory:'simulated_demo',notice:'Directory identity and location are public data. Bed and blood values are simulated and must be confirmed directly.'}});
  } catch { res.status(503).json({message:'Hospital directory unavailable'}); }
});

app.post('/api/hospitals/register',async(req,res)=>{
  if(dbStatus()!=='connected')return res.status(503).json({message:'Registration requires PostgreSQL'});
  const name=String(req.body.name||'').trim();const email=String(req.body.email||'').trim().toLowerCase();const password=String(req.body.password||'');const city=String(req.body.city||'').trim();const state=String(req.body.state||'').trim();const address=String(req.body.address||'').trim();const facilityType=String(req.body.facilityType||'Hospital').trim();
  if(name.length<3||!/^\S+@\S+\.\S+$/.test(email)||password.length<8||!city||!state||!address)return res.status(400).json({message:'Name, valid email, 8+ character password, city, state and address are required'});
  const id=`hospital-${crypto.randomUUID()}`;const passwordHash=await bcrypt.hash(password,12);
  try{
    await pool.query('BEGIN');
    await pool.query(`INSERT INTO hospitals(id,name,email,password_hash,city,state,address,facility_type,hfr_id,verification_status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending_review')`,[id,name,email,passwordHash,city,state,address,facilityType,String(req.body.hfrId||'').trim()||null]);
    await pool.query(`INSERT INTO resource_snapshots(hospital_id,total_beds,occupied_beds,icu_available,oxygen_beds_available,blood_inventory) VALUES($1,0,0,0,0,'{}'::jsonb)`,[id]);
    await pool.query(`INSERT INTO audit_events(actor_id,action,entity_type,entity_id,metadata) VALUES($1,'hospital_registered','hospital',$1,$2)`,[id,JSON.stringify({name,email,city,state})]);
    await pool.query('COMMIT');
    res.status(201).json({message:'Registration submitted. You can sign in now and complete inventory and certificate verification.',hospital:{id,name,email,verificationStatus:'pending_review'},token:sign({id,email,role:'hospital'},'8h')});
  }catch(error){await pool.query('ROLLBACK');if(error.code==='23505')return res.status(409).json({message:'A hospital account already uses this email'});throw error;}
});

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

app.get('/api/hospitals/me',authenticate('hospital'),async(req,res)=>{
  const result=await pool.query('SELECT id,name,email,city,state,address,facility_type,hfr_id,phone,license_number,verification_status,created_at FROM hospitals WHERE id=$1',[req.user.id]);
  if(!result.rowCount)return res.status(404).json({message:'Hospital account not found'});res.json(result.rows[0]);
});

app.patch('/api/hospitals/me',authenticate('hospital'),async(req,res)=>{
  const phone=String(req.body.phone||'').trim();const license=String(req.body.licenseNumber||'').trim();const hfr=String(req.body.hfrId||'').trim();const address=String(req.body.address||'').trim();
  if(phone&&!/^[+0-9 ()-]{7,20}$/.test(phone))return res.status(400).json({message:'Enter a valid phone number'});
  const result=await pool.query(`UPDATE hospitals SET phone=$1,license_number=$2,hfr_id=$3,address=COALESCE(NULLIF($4,''),address),updated_at=NOW() WHERE id=$5 RETURNING id,name,email,city,state,address,facility_type,hfr_id,phone,license_number,verification_status`,[phone||null,license||null,hfr||null,address,req.user.id]);
  await pool.query(`INSERT INTO audit_events(actor_id,action,entity_type,entity_id) VALUES($1,'hospital_profile_updated','hospital',$1)`,[req.user.id]);res.json(result.rows[0]);
});

app.get('/api/hospitals/me/resources',authenticate('hospital'),async(req,res)=>{const result=await pool.query('SELECT * FROM resource_snapshots WHERE hospital_id=$1 ORDER BY recorded_at DESC LIMIT 1',[req.user.id]);res.json(result.rows[0]||null)});
app.get('/api/hospitals/me/certificates',authenticate('hospital'),async(req,res)=>{const result=await pool.query('SELECT id,certificate_type,issuer,registration_number,original_filename,risk_score,review_status,uploaded_at FROM certificates WHERE hospital_id=$1 ORDER BY uploaded_at DESC',[req.user.id]);res.json(result.rows)});

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
    const prediction=JSON.parse(stdout);const peak=Math.max(...prediction.occupancy_trend);const start=new Date();const time_labels=prediction.occupancy_trend.map((_,index)=>new Date(start.getTime()+(index+1)*2*60*60*1000).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'}));const risk_level=peak>=90?'critical':peak>=80?'high':peak>=70?'moderate':'stable';const insight=risk_level==='critical'?`Critical pressure may reach ${peak}%. Confirm beds and prepare escalation now.`:risk_level==='high'?`High pressure may reach ${peak}%. Review staffing and discharge plans.`:risk_level==='moderate'?`Moderate pressure may reach ${peak}%. Monitor updates and keep reserve capacity.`:`Capacity looks stable, peaking near ${peak}%. Continue routine monitoring.`;
    res.json({...prediction,time_labels,risk_level,model_score:prediction.metrics?.r2||0,insight});
  });
});

app.post('/api/chat',async(req,res)=>{
  if(!String(req.body.message||'').trim())return res.status(400).json({message:'Message required'});
  const answer=await chatbot.getResponse(req.body.message);
  if(['blood_availability','bed_availability','location_query'].includes(answer.intent)){
    const facilities=await listHospitals().catch(()=>demoHospitals);const message=String(req.body.message).toLowerCase();const requestedLocation=[...new Set(facilities.flatMap(item=>[item.city,item.state]).filter(Boolean))].find(location=>message.includes(location.toLowerCase()));const localFacilities=requestedLocation?facilities.filter(item=>[item.city,item.state].some(value=>value?.toLowerCase()===requestedLocation.toLowerCase())):facilities;
    if(answer.intent==='blood_availability'){
      const requested=(String(req.body.message).toUpperCase().match(/\b(?:A|B|AB|O)[+-]\b/)||['O-'])[0];
      const matches=localFacilities.filter(item=>(item.blood?.[requested]||0)>0).sort((a,b)=>b.blood[requested]-a.blood[requested]).slice(0,3);
      answer.response=matches.length?`${requested} inventory: ${matches.map(item=>`${item.name} (${item.blood[requested]} units, ${item.city})`).join('; ')}. Call the hospital to confirm before travelling.`:`No ${requested} inventory is currently listed. Call 112 for an emergency and contact the nearest licensed blood bank.`;
    } else {
      const matches=localFacilities.map(item=>({...item,available:Math.max(0,item.beds.total-item.beds.occupied)})).filter(item=>item.available>0).sort((a,b)=>b.available-a.available).slice(0,3);
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
  if(dbStatus()==='connected')await pool.query(`INSERT INTO certificates(hospital_id,certificate_type,issuer,registration_number,file_path,original_filename,sha256,risk_score,analysis) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[req.user.id,certificateType,issuer,registrationNumber,req.file.path,req.file.originalname,sha256,risk,JSON.stringify({...analysis,hfrId})]);
  res.status(201).json({reviewStatus:'manual_review',certificate:{type:certificateType,name:req.file.originalname,issuer,registrationNumber},analysis});
});

app.get('/api/admin/audit',authenticate('admin'),async(_req,res)=>{if(dbStatus()!=='connected')return res.json([]);res.json((await pool.query('SELECT * FROM audit_events ORDER BY created_at DESC LIMIT 100')).rows)});
app.get('/api/admin/dashboard',authenticate('admin'),async(_req,res)=>{const [facilities,pending,snapshots,certificates]=await Promise.all([pool.query('SELECT COUNT(*)::int count FROM hospitals'),pool.query("SELECT COUNT(*)::int count FROM hospitals WHERE verification_status='pending_review'"),pool.query('SELECT COUNT(*)::int count FROM resource_snapshots'),pool.query("SELECT COUNT(*)::int count FROM certificates WHERE review_status='manual_review'")]);res.json({facilities:facilities.rows[0].count,pendingHospitals:pending.rows[0].count,inventorySnapshots:snapshots.rows[0].count,pendingCertificates:certificates.rows[0].count})});
app.get('/api/admin/hospitals',authenticate('admin'),async(req,res)=>{const status=String(req.query.status||'');const result=status?await pool.query('SELECT id,name,email,city,state,facility_type,hfr_id,phone,license_number,verification_status,created_at FROM hospitals WHERE verification_status=$1 ORDER BY created_at DESC',[status]):await pool.query('SELECT id,name,email,city,state,facility_type,hfr_id,phone,license_number,verification_status,created_at FROM hospitals ORDER BY created_at DESC LIMIT 200');res.json(result.rows)});
app.patch('/api/admin/hospitals/:id/verification',authenticate('admin'),async(req,res)=>{const status=String(req.body.status||'');if(!['approved','rejected','pending_review'].includes(status))return res.status(400).json({message:'Invalid verification status'});const result=await pool.query('UPDATE hospitals SET verification_status=$1,updated_at=NOW() WHERE id=$2 RETURNING id,name,verification_status',[status,req.params.id]);if(!result.rowCount)return res.status(404).json({message:'Hospital not found'});await pool.query(`INSERT INTO audit_events(actor_id,action,entity_type,entity_id,metadata) VALUES($1,'hospital_verification_changed','hospital',$2,$3)`,[req.user.email,req.params.id,JSON.stringify({status})]);res.json(result.rows[0])});

const frontendDir = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDir)) {
  app.use(express.static(frontendDir));
  app.get(/^(?!\/api(?:\/|$)|\/uploads(?:\/|$)).*/, (_req, res) => res.sendFile(path.join(frontendDir, 'index.html')));
}
app.use((err,_req,res,_next)=>res.status(err.code==='LIMIT_FILE_SIZE'?413:500).json({message:err.message||'Unexpected server error'}));

async function start(){await connectDB();await migrateDatabase();await seedDemoData();await chatbot.train();app.listen(PORT,'0.0.0.0',()=>console.log(`CareBridge listening on ${PORT}`));}
if(require.main===module)start();
module.exports={app,start};
