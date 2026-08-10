const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const { Server } = require('socket.io');
const { execFile } = require('child_process');
const connectDB = require('./config/db');
const mongoose = require('mongoose'); // Added to fix ReferenceError in health check
const path = require('path');
const Hospital = require('./models/Hospital');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createObjectCsvStringifier } = require('csv-writer');
const sendEmail = require('./utils/sendEmail');
const sendSMS = require('./utils/sendSMS');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const { dbStatus } = require('./config/db');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { content: { cors: { origin: '*' } } });

app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads', 'certificates');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer config for certificate uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, JPG, and PNG files are allowed'));
        }
    }
});

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'carebridge_secret_key_2024';

app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body || {};
    const expectedEmail = process.env.ADMIN_EMAIL || 'admin@carebridge.in';
    const expectedPassword = process.env.ADMIN_PASSWORD || 'CareBridgeDemo2026!';
    if (email !== expectedEmail || password !== expectedPassword) {
        return res.status(401).json({ message: 'Invalid administrator credentials' });
    }
    const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, expiresIn: 7200 });
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, hospital) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.hospital = hospital;
        next();
    });
};

// Mock Data - India-Wide Hospital Network (50+ Hospitals)
let mockHospitals = [
    // Delhi NCR (10 hospitals)
    { id: 'del1', name: 'AIIMS Delhi', city: 'Delhi', state: 'Delhi', location: 'Ansari Nagar, New Delhi', lat: 28.5672, lng: 77.2100, contact: '011-26588500', email: 'aiims@hospital.in', type: 'Government', beds: { total: 450, occupied: 380, icu: 50, oxygen: 100, general: 200, pediatric: 40, maternity: 40, isolation: 20 }, blood: { 'A+': 100, 'B+': 80, 'O+': 120, 'AB+': 40, 'A-': 20, 'B-': 15, 'O-': 10, 'AB-': 5 }, lastUpdated: new Date() },
    { id: 'del2', name: 'Safdarjung Hospital', city: 'Delhi', state: 'Delhi', location: 'Safdarjung Enclave, New Delhi', lat: 28.5677, lng: 77.2065, contact: '011-26165060', email: 'safdarjung@hospital.in', type: 'Government', beds: { total: 350, occupied: 300, icu: 30, oxygen: 80, general: 150, pediatric: 30, maternity: 40, isolation: 20 }, blood: { 'A+': 60, 'B+': 50, 'O+': 70, 'AB+': 25, 'A-': 10, 'B-': 8, 'O-': 5, 'AB-': 3 }, lastUpdated: new Date() },
    { id: 'del3', name: 'Max Super Speciality Hospital', city: 'Delhi', state: 'Delhi', location: 'Saket, New Delhi', lat: 28.5244, lng: 77.2066, contact: '011-26515050', email: 'max.saket@hospital.in', type: 'Private', beds: { total: 450, occupied: 350, icu: 80, oxygen: 120, general: 150, pediatric: 45, maternity: 35, isolation: 20 }, blood: { 'A+': 150, 'B+': 120, 'O+': 180, 'AB+': 60, 'A-': 30, 'B-': 25, 'O-': 15, 'AB-': 10 }, lastUpdated: new Date() },
    { id: 'del4', name: 'Fortis Escorts Heart Institute', city: 'Delhi', state: 'Delhi', location: 'Okhla Road, New Delhi', lat: 28.5355, lng: 77.2730, contact: '011-47135000', email: 'fortis.escorts@hospital.in', type: 'Private', beds: { total: 320, occupied: 280, icu: 60, oxygen: 90, general: 100, pediatric: 30, maternity: 25, isolation: 15 }, blood: { 'A+': 80, 'B+': 70, 'O+': 100, 'AB+': 35, 'A-': 15, 'B-': 12, 'O-': 8, 'AB-': 5 }, lastUpdated: new Date() },
    { id: 'del5', name: 'Apollo Hospital Delhi', city: 'Delhi', state: 'Delhi', location: 'Sarita Vihar, New Delhi', lat: 28.5355, lng: 77.2910, contact: '011-26825858', email: 'apollo.delhi@hospital.in', type: 'Private', beds: { total: 550, occupied: 450, icu: 100, oxygen: 150, general: 200, pediatric: 45, maternity: 35, isolation: 20 }, blood: { 'A+': 200, 'B+': 180, 'O+': 250, 'AB+': 80, 'A-': 40, 'B-': 35, 'O-': 20, 'AB-': 15 }, lastUpdated: new Date() },
    { id: 'del6', name: 'Sir Ganga Ram Hospital', city: 'Delhi', state: 'Delhi', location: 'Rajinder Nagar, New Delhi', lat: 28.6358, lng: 77.1907, contact: '011-25750000', email: 'gangaram@hospital.in', type: 'Private', beds: { total: 470, occupied: 400, icu: 75, oxygen: 110, general: 180, pediatric: 50, maternity: 35, isolation: 20 }, blood: { 'A+': 120, 'B+': 100, 'O+': 140, 'AB+': 50, 'A-': 25, 'B-': 20, 'O-': 12, 'AB-': 8 }, lastUpdated: new Date() },
    { id: 'del7', name: 'Medanta The Medicity', city: 'Gurugram', state: 'Haryana', location: 'Sector 38, Gurugram', lat: 28.4421, lng: 77.0414, contact: '0124-4141414', email: 'medanta@hospital.in', type: 'Private', beds: { total: 800, occupied: 650, icu: 150, oxygen: 200, general: 300, pediatric: 60, maternity: 50, isolation: 40 }, blood: { 'A+': 250, 'B+': 220, 'O+': 300, 'AB+': 100, 'A-': 50, 'B-': 45, 'O-': 25, 'AB-': 20 }, lastUpdated: new Date() },
    { id: 'del8', name: 'Artemis Hospital', city: 'Gurugram', state: 'Haryana', location: 'Sector 51, Gurugram', lat: 28.4270, lng: 77.0688, contact: '0124-4511111', email: 'artemis@hospital.in', type: 'Private', beds: { total: 355, occupied: 300, icu: 70, oxygen: 100, general: 120, pediatric: 30, maternity: 20, isolation: 15 }, blood: { 'A+': 90, 'B+': 80, 'O+': 110, 'AB+': 40, 'A-': 18, 'B-': 15, 'O-': 10, 'AB-': 6 }, lastUpdated: new Date() },
    { id: 'del9', name: 'Fortis Memorial Research Institute', city: 'Gurugram', state: 'Haryana', location: 'Sector 44, Gurugram', lat: 28.4501, lng: 77.0637, contact: '0124-4962200', email: 'fortis.fmri@hospital.in', type: 'Private', beds: { total: 1000, occupied: 850, icu: 120, oxygen: 180, general: 500, pediatric: 100, maternity: 50, isolation: 50 }, blood: { 'A+': 180, 'B+': 160, 'O+': 220, 'AB+': 75, 'A-': 35, 'B-': 30, 'O-': 18, 'AB-': 12 }, lastUpdated: new Date() },
    { id: 'del10', name: 'Manipal Hospital Dwarka', city: 'Delhi', state: 'Delhi', location: 'Sector 6, Dwarka, New Delhi', lat: 28.5921, lng: 77.0460, contact: '011-45771000', email: 'manipal.dwarka@hospital.in', type: 'Private', beds: { total: 380, occupied: 300, icu: 65, oxygen: 95, general: 150, pediatric: 30, maternity: 25, isolation: 15 }, blood: { 'A+': 85, 'B+': 75, 'O+': 105, 'AB+': 38, 'A-': 17, 'B-': 14, 'O-': 9, 'AB-': 5 }, lastUpdated: new Date() },

    // Mumbai (10 hospitals)
    { id: 'mum1', name: 'Tata Memorial Hospital', city: 'Mumbai', state: 'Maharashtra', location: 'Parel, Mumbai', lat: 19.0030, lng: 72.8440, contact: '022-24177000', email: 'tata.memorial@hospital.in', type: 'Government', beds: { total: 630, occupied: 600, icu: 40, oxygen: 70, general: 400, pediatric: 50, maternity: 40, isolation: 30 }, blood: { 'A+': 110, 'B+': 95, 'O+': 130, 'AB+': 45, 'A-': 22, 'B-': 18, 'O-': 11, 'AB-': 7 }, lastUpdated: new Date() },
    { id: 'mum2', name: 'KEM Hospital', city: 'Mumbai', state: 'Maharashtra', location: 'Parel, Mumbai', lat: 18.9984, lng: 72.8420, contact: '022-24107000', email: 'kem@hospital.in', type: 'Government', beds: { total: 1800, occupied: 1700, icu: 45, oxygen: 90, general: 1200, pediatric: 200, maternity: 150, isolation: 115 }, blood: { 'A+': 95, 'B+': 85, 'O+': 115, 'AB+': 40, 'A-': 19, 'B-': 16, 'O-': 10, 'AB-': 6 }, lastUpdated: new Date() },
    { id: 'mum3', name: 'Lilavati Hospital', city: 'Mumbai', state: 'Maharashtra', location: 'Bandra West, Mumbai', lat: 19.0596, lng: 72.8295, contact: '022-26567891', email: 'lilavati@hospital.in', type: 'Private', beds: { total: 325, occupied: 280, icu: 75, oxygen: 110, general: 80, pediatric: 25, maternity: 20, isolation: 15 }, blood: { 'A+': 140, 'B+': 125, 'O+': 170, 'AB+': 58, 'A-': 28, 'B-': 24, 'O-': 14, 'AB-': 9 }, lastUpdated: new Date() },
    { id: 'mum4', name: 'Hinduja Hospital', city: 'Mumbai', state: 'Maharashtra', location: 'Mahim, Mumbai', lat: 19.0410, lng: 72.8397, contact: '022-24447000', email: 'hinduja@hospital.in', type: 'Private', beds: { total: 350, occupied: 310, icu: 80, oxygen: 115, general: 90, pediatric: 30, maternity: 20, isolation: 15 }, blood: { 'A+': 155, 'B+': 135, 'O+': 185, 'AB+': 63, 'A-': 31, 'B-': 26, 'O-': 16, 'AB-': 10 }, lastUpdated: new Date() },
    { id: 'mum5', name: 'Breach Candy Hospital', city: 'Mumbai', state: 'Maharashtra', location: 'Breach Candy, Mumbai', lat: 18.9726, lng: 72.8050, contact: '022-23667788', email: 'breachcandy@hospital.in', type: 'Private', beds: { total: 165, occupied: 140, icu: 40, oxygen: 60, general: 30, pediatric: 15, maternity: 10, isolation: 10 }, blood: { 'A+': 75, 'B+': 65, 'O+': 90, 'AB+': 32, 'A-': 15, 'B-': 12, 'O-': 8, 'AB-': 4 }, lastUpdated: new Date() },
    { id: 'mum6', name: 'Kokilaben Dhirubhai Ambani Hospital', city: 'Mumbai', state: 'Maharashtra', location: 'Andheri West, Mumbai', lat: 19.1334, lng: 72.8360, contact: '022-30999999', email: 'kokilaben@hospital.in', type: 'Private', beds: { total: 750, occupied: 650, icu: 110, oxygen: 160, general: 300, pediatric: 80, maternity: 60, isolation: 40 }, blood: { 'A+': 210, 'B+': 190, 'O+': 260, 'AB+': 88, 'A-': 43, 'B-': 38, 'O-': 22, 'AB-': 16 }, lastUpdated: new Date() },
    { id: 'mum7', name: 'Nanavati Super Speciality Hospital', city: 'Mumbai', state: 'Maharashtra', location: 'Vile Parle West, Mumbai', lat: 19.1076, lng: 72.8263, contact: '022-26267800', email: 'nanavati@hospital.in', type: 'Private', beds: { total: 350, occupied: 300, icu: 70, oxygen: 105, general: 100, pediatric: 35, maternity: 25, isolation: 15 }, blood: { 'A+': 130, 'B+': 115, 'O+': 155, 'AB+': 53, 'A-': 26, 'B-': 22, 'O-': 13, 'AB-': 8 }, lastUpdated: new Date() },
    { id: 'mum8', name: 'Jaslok Hospital', city: 'Mumbai', state: 'Maharashtra', location: 'Pedder Road, Mumbai', lat: 18.9695, lng: 72.8050, contact: '022-66573333', email: 'jaslok@hospital.in', type: 'Private', beds: { total: 350, occupied: 295, icu: 65, oxygen: 100, general: 110, pediatric: 35, maternity: 25, isolation: 15 }, blood: { 'A+': 125, 'B+': 110, 'O+': 150, 'AB+': 51, 'A-': 25, 'B-': 21, 'O-': 12, 'AB-': 8 }, lastUpdated: new Date() },
    { id: 'mum9', name: 'Fortis Hospital Mulund', city: 'Mumbai', state: 'Maharashtra', location: 'Mulund West, Mumbai', lat: 19.1722, lng: 72.9565, contact: '022-67914444', email: 'fortis.mulund@hospital.in', type: 'Private', beds: { total: 315, occupied: 270, icu: 60, oxygen: 90, general: 100, pediatric: 35, maternity: 20, isolation: 10 }, blood: { 'A+': 105, 'B+': 95, 'O+': 130, 'AB+': 44, 'A-': 21, 'B-': 18, 'O-': 11, 'AB-': 7 }, lastUpdated: new Date() },
    { id: 'mum10', name: 'Wockhardt Hospital', city: 'Mumbai', state: 'Maharashtra', location: 'Mumbai Central, Mumbai', lat: 18.9750, lng: 72.8258, contact: '022-24987777', email: 'wockhardt@hospital.in', type: 'Private', beds: { total: 350, occupied: 300, icu: 70, oxygen: 105, general: 110, pediatric: 30, maternity: 20, isolation: 15 }, blood: { 'A+': 120, 'B+': 105, 'O+': 145, 'AB+': 49, 'A-': 24, 'B-': 20, 'O-': 12, 'AB-': 7 }, lastUpdated: new Date() },

    // Bangalore (8 hospitals)
    { id: 'blr1', name: 'Manipal Hospital Bangalore', city: 'Bangalore', state: 'Karnataka', location: 'HAL Airport Road, Bangalore', lat: 12.9576, lng: 77.6450, contact: '080-25023344', email: 'manipal.blr@hospital.in', type: 'Private', beds: { total: 650, occupied: 550, icu: 95, oxygen: 140, general: 250, pediatric: 70, maternity: 55, isolation: 40 }, blood: { 'A+': 175, 'B+': 155, 'O+': 210, 'AB+': 72, 'A-': 35, 'B-': 30, 'O-': 18, 'AB-': 12 }, lastUpdated: new Date() },
    { id: 'blr2', name: 'Fortis Hospital Bangalore', city: 'Bangalore', state: 'Karnataka', location: 'Bannerghatta Road, Bangalore', lat: 12.8996, lng: 77.6036, contact: '080-66214444', email: 'fortis.blr@hospital.in', type: 'Private', beds: { total: 400, occupied: 340, icu: 75, oxygen: 110, general: 140, pediatric: 35, maternity: 25, isolation: 15 }, blood: { 'A+': 140, 'B+': 125, 'O+': 170, 'AB+': 58, 'A-': 28, 'B-': 24, 'O-': 14, 'AB-': 9 }, lastUpdated: new Date() },
    { id: 'blr3', name: 'Apollo Hospital Bangalore', city: 'Bangalore', state: 'Karnataka', location: 'Bannerghatta Road, Bangalore', lat: 12.9116, lng: 77.5946, contact: '080-26304050', email: 'apollo.blr@hospital.in', type: 'Private', beds: { total: 250, occupied: 210, icu: 55, oxygen: 85, general: 70, pediatric: 20, maternity: 10, isolation: 10 }, blood: { 'A+': 100, 'B+': 90, 'O+': 125, 'AB+': 43, 'A-': 21, 'B-': 18, 'O-': 11, 'AB-': 7 }, lastUpdated: new Date() },
    { id: 'blr4', name: 'Narayana Health City', city: 'Bangalore', state: 'Karnataka', location: 'Bommasandra, Bangalore', lat: 12.8458, lng: 77.6839, contact: '080-71222222', email: 'narayana@hospital.in', type: 'Private', beds: { total: 1400, occupied: 1200, icu: 180, oxygen: 250, general: 600, pediatric: 150, maternity: 120, isolation: 100 }, blood: { 'A+': 280, 'B+': 250, 'O+': 340, 'AB+': 115, 'A-': 56, 'B-': 48, 'O-': 28, 'AB-': 20 }, lastUpdated: new Date() },
    { id: 'blr5', name: 'Columbia Asia Hospital', city: 'Bangalore', state: 'Karnataka', location: 'Whitefield, Bangalore', lat: 12.9698, lng: 77.7499, contact: '080-66146666', email: 'columbia.blr@hospital.in', type: 'Private', beds: { total: 200, occupied: 170, icu: 45, oxygen: 70, general: 50, pediatric: 15, maternity: 10, isolation: 10 }, blood: { 'A+': 80, 'B+': 70, 'O+': 100, 'AB+': 35, 'A-': 17, 'B-': 14, 'O-': 9, 'AB-': 5 }, lastUpdated: new Date() },
    { id: 'blr6', name: 'St. Johns Medical College Hospital', city: 'Bangalore', state: 'Karnataka', location: 'Koramangala, Bangalore', lat: 12.9266, lng: 77.6117, contact: '080-22065000', email: 'stjohns@hospital.in', type: 'Private', beds: { total: 1050, occupied: 950, icu: 120, oxygen: 175, general: 500, pediatric: 100, maternity: 100, isolation: 55 }, blood: { 'A+': 195, 'B+': 175, 'O+': 240, 'AB+': 82, 'A-': 40, 'B-': 34, 'O-': 20, 'AB-': 14 }, lastUpdated: new Date() },
    { id: 'blr7', name: 'Sakra World Hospital', city: 'Bangalore', state: 'Karnataka', location: 'Marathahalli, Bangalore', lat: 12.9591, lng: 77.6974, contact: '080-43692222', email: 'sakra@hospital.in', type: 'Private', beds: { total: 350, occupied: 300, icu: 70, oxygen: 105, general: 100, pediatric: 30, maternity: 30, isolation: 15 }, blood: { 'A+': 130, 'B+': 115, 'O+': 155, 'AB+': 53, 'A-': 26, 'B-': 22, 'O-': 13, 'AB-': 8 }, lastUpdated: new Date() },
    { id: 'blr8', name: 'BGS Gleneagles Global Hospital', city: 'Bangalore', state: 'Karnataka', location: 'Kengeri, Bangalore', lat: 12.9082, lng: 77.4854, contact: '080-46801000', email: 'bgs@hospital.in', type: 'Private', beds: { total: 500, occupied: 425, icu: 85, oxygen: 125, general: 180, pediatric: 40, maternity: 40, isolation: 30 }, blood: { 'A+': 160, 'B+': 140, 'O+': 190, 'AB+': 65, 'A-': 32, 'B-': 27, 'O-': 16, 'AB-': 11 }, lastUpdated: new Date() },

    // Chennai (6 hospitals)
    { id: 'che1', name: 'Apollo Hospital Chennai', city: 'Chennai', state: 'Tamil Nadu', location: 'Greams Road, Chennai', lat: 13.0569, lng: 80.2497, contact: '044-28293333', email: 'apollo.chennai@hospital.in', type: 'Private', beds: { total: 550, occupied: 480, icu: 90, oxygen: 135, general: 200, pediatric: 50, maternity: 45, isolation: 30 }, blood: { 'A+': 165, 'B+': 145, 'O+': 200, 'AB+': 68, 'A-': 33, 'B-': 28, 'O-': 17, 'AB-': 11 }, lastUpdated: new Date() },
    { id: 'che2', name: 'Fortis Malar Hospital', city: 'Chennai', state: 'Tamil Nadu', location: 'Adyar, Chennai', lat: 13.0067, lng: 80.2548, contact: '044-42892222', email: 'fortis.malar@hospital.in', type: 'Private', beds: { total: 180, occupied: 155, icu: 40, oxygen: 65, general: 40, pediatric: 15, maternity: 10, isolation: 10 }, blood: { 'A+': 75, 'B+': 65, 'O+': 90, 'AB+': 32, 'A-': 15, 'B-': 12, 'O-': 8, 'AB-': 4 }, lastUpdated: new Date() },
    { id: 'che3', name: 'MIOT International', city: 'Chennai', state: 'Tamil Nadu', location: 'Manapakkam, Chennai', lat: 13.0199, lng: 80.1625, contact: '044-42002000', email: 'miot@hospital.in', type: 'Private', beds: { total: 1000, occupied: 850, icu: 125, oxygen: 185, general: 450, pediatric: 100, maternity: 80, isolation: 60 }, blood: { 'A+': 220, 'B+': 195, 'O+': 270, 'AB+': 92, 'A-': 45, 'B-': 38, 'O-': 23, 'AB-': 15 }, lastUpdated: new Date() },
    { id: 'che4', name: 'Gleneagles Global Health City', city: 'Chennai', state: 'Tamil Nadu', location: 'Perumbakkam, Chennai', lat: 12.9047, lng: 80.2279, contact: '044-44777000', email: 'gleneagles.chennai@hospital.in', type: 'Private', beds: { total: 2000, occupied: 1750, icu: 200, oxygen: 300, general: 1000, pediatric: 200, maternity: 150, isolation: 150 }, blood: { 'A+': 320, 'B+': 285, 'O+': 390, 'AB+': 133, 'A-': 65, 'B-': 55, 'O-': 33, 'AB-': 22 }, lastUpdated: new Date() },
    { id: 'che5', name: 'Kauvery Hospital', city: 'Chennai', state: 'Tamil Nadu', location: 'Alwarpet, Chennai', lat: 13.0338, lng: 80.2554, contact: '044-40015555', email: 'kauvery@hospital.in', type: 'Private', beds: { total: 250, occupied: 215, icu: 55, oxygen: 85, general: 60, pediatric: 20, maternity: 15, isolation: 15 }, blood: { 'A+': 100, 'B+': 90, 'O+': 125, 'AB+': 43, 'A-': 21, 'B-': 18, 'O-': 11, 'AB-': 7 }, lastUpdated: new Date() },
    { id: 'che6', name: 'Vijaya Hospital', city: 'Chennai', state: 'Tamil Nadu', location: 'Vadapalani, Chennai', lat: 13.0524, lng: 80.2121, contact: '044-28151500', email: 'vijaya@hospital.in', type: 'Private', beds: { total: 325, occupied: 280, icu: 65, oxygen: 100, general: 100, pediatric: 30, maternity: 20, isolation: 10 }, blood: { 'A+': 120, 'B+': 105, 'O+': 145, 'AB+': 49, 'A-': 24, 'B-': 20, 'O-': 12, 'AB-': 7 }, lastUpdated: new Date() },

    // Kolkata (5 hospitals)
    { id: 'kol1', name: 'AMRI Hospital', city: 'Kolkata', state: 'West Bengal', location: 'Dhakuria, Kolkata', lat: 22.5093, lng: 88.3671, contact: '033-66800000', email: 'amri@hospital.in', type: 'Private', beds: { total: 400, occupied: 340, icu: 75, oxygen: 110, general: 140, pediatric: 35, maternity: 25, isolation: 15 }, blood: { 'A+': 140, 'B+': 125, 'O+': 170, 'AB+': 58, 'A-': 28, 'B-': 24, 'O-': 14, 'AB-': 9 }, lastUpdated: new Date() },
    { id: 'kol2', name: 'Apollo Gleneagles Hospital', city: 'Kolkata', state: 'West Bengal', location: 'EM Bypass, Kolkata', lat: 22.5186, lng: 88.3885, contact: '033-23203040', email: 'apollo.kolkata@hospital.in', type: 'Private', beds: { total: 510, occupied: 440, icu: 85, oxygen: 130, general: 200, pediatric: 40, maternity: 35, isolation: 20 }, blood: { 'A+': 155, 'B+': 135, 'O+': 185, 'AB+': 63, 'A-': 31, 'B-': 26, 'O-': 16, 'AB-': 10 }, lastUpdated: new Date() },
    { id: 'kol3', name: 'Fortis Hospital Kolkata', city: 'Kolkata', state: 'West Bengal', location: 'Anandapur, Kolkata', lat: 22.5093, lng: 88.3974, contact: '033-66284444', email: 'fortis.kolkata@hospital.in', type: 'Private', beds: { total: 380, occupied: 325, icu: 70, oxygen: 105, general: 130, pediatric: 35, maternity: 25, isolation: 15 }, blood: { 'A+': 130, 'B+': 115, 'O+': 155, 'AB+': 53, 'A-': 26, 'B-': 22, 'O-': 13, 'AB-': 8 }, lastUpdated: new Date() },
    { id: 'kol4', name: 'Medica Superspecialty Hospital', city: 'Kolkata', state: 'West Bengal', location: 'Mukundapur, Kolkata', lat: 22.4969, lng: 88.3961, contact: '033-66521000', email: 'medica@hospital.in', type: 'Private', beds: { total: 430, occupied: 370, icu: 80, oxygen: 120, general: 150, pediatric: 40, maternity: 30, isolation: 10 }, blood: { 'A+': 145, 'B+': 130, 'O+': 175, 'AB+': 60, 'A-': 29, 'B-': 25, 'O-': 15, 'AB-': 9 }, lastUpdated: new Date() },
    { id: 'kol5', name: 'Peerless Hospital', city: 'Kolkata', state: 'West Bengal', location: 'Panchasayar, Kolkata', lat: 22.5093, lng: 88.3974, contact: '033-24321000', email: 'peerless@hospital.in', type: 'Private', beds: { total: 450, occupied: 385, icu: 75, oxygen: 115, general: 160, pediatric: 40, maternity: 35, isolation: 25 }, blood: { 'A+': 135, 'B+': 120, 'O+': 165, 'AB+': 56, 'A-': 27, 'B-': 23, 'O-': 14, 'AB-': 8 }, lastUpdated: new Date() },

    // Hyderabad (5 hospitals)
    { id: 'hyd1', name: 'Apollo Hospital Hyderabad', city: 'Hyderabad', state: 'Telangana', location: 'Jubilee Hills, Hyderabad', lat: 17.4239, lng: 78.4138, contact: '040-23607777', email: 'apollo.hyd@hospital.in', type: 'Private', beds: { total: 550, occupied: 480, icu: 90, oxygen: 135, general: 210, pediatric: 50, maternity: 40, isolation: 25 }, blood: { 'A+': 165, 'B+': 145, 'O+': 200, 'AB+': 68, 'A-': 33, 'B-': 28, 'O-': 17, 'AB-': 11 }, lastUpdated: new Date() },
    { id: 'hyd2', name: 'Yashoda Hospital', city: 'Hyderabad', state: 'Telangana', location: 'Somajiguda, Hyderabad', lat: 17.4239, lng: 78.4738, contact: '040-23557777', email: 'yashoda@hospital.in', type: 'Private', beds: { total: 500, occupied: 430, icu: 85, oxygen: 125, general: 200, pediatric: 40, maternity: 30, isolation: 20 }, blood: { 'A+': 155, 'B+': 135, 'O+': 185, 'AB+': 63, 'A-': 31, 'B-': 26, 'O-': 16, 'AB-': 10 }, lastUpdated: new Date() },
    { id: 'hyd3', name: 'KIMS Hospital', city: 'Hyderabad', state: 'Telangana', location: 'Secunderabad, Hyderabad', lat: 17.4399, lng: 78.4983, contact: '040-44885000', email: 'kims@hospital.in', type: 'Private', beds: { total: 300, occupied: 260, icu: 60, oxygen: 90, general: 100, pediatric: 25, maternity: 15, isolation: 10 }, blood: { 'A+': 110, 'B+': 95, 'O+': 130, 'AB+': 45, 'A-': 22, 'B-': 18, 'O-': 11, 'AB-': 7 }, lastUpdated: new Date() },
    { id: 'hyd4', name: 'Continental Hospitals', city: 'Hyderabad', state: 'Telangana', location: 'Gachibowli, Hyderabad', lat: 17.4399, lng: 78.3489, contact: '040-67000000', email: 'continental@hospital.in', type: 'Private', beds: { total: 750, occupied: 650, icu: 110, oxygen: 160, general: 350, pediatric: 70, maternity: 40, isolation: 20 }, blood: { 'A+': 195, 'B+': 175, 'O+': 240, 'AB+': 82, 'A-': 40, 'B-': 34, 'O-': 20, 'AB-': 14 }, lastUpdated: new Date() },
    { id: 'hyd5', name: 'Care Hospital', city: 'Hyderabad', state: 'Telangana', location: 'Banjara Hills, Hyderabad', lat: 17.4126, lng: 78.4486, contact: '040-61656565', email: 'care@hospital.in', type: 'Private', beds: { total: 435, occupied: 375, icu: 80, oxygen: 120, general: 150, pediatric: 40, maternity: 30, isolation: 15 }, blood: { 'A+': 145, 'B+': 130, 'O+': 175, 'AB+': 60, 'A-': 29, 'B-': 25, 'O-': 15, 'AB-': 9 }, lastUpdated: new Date() },

    // Pune (3 hospitals)
    { id: 'pun1', name: 'Ruby Hall Clinic', city: 'Pune', state: 'Maharashtra', location: 'Sassoon Road, Pune', lat: 18.5314, lng: 73.8446, contact: '020-26163000', email: 'rubyhall@hospital.in', type: 'Private', beds: { total: 750, occupied: 650, icu: 110, oxygen: 160, general: 300, pediatric: 80, maternity: 50, isolation: 50 }, blood: { 'A+': 195, 'B+': 175, 'O+': 240, 'AB+': 82, 'A-': 40, 'B-': 34, 'O-': 20, 'AB-': 14 }, lastUpdated: new Date() },
    { id: 'pun2', name: 'Jehangir Hospital', city: 'Pune', state: 'Maharashtra', location: 'Sassoon Road, Pune', lat: 18.5196, lng: 73.8553, contact: '020-26331000', email: 'jehangir@hospital.in', type: 'Private', beds: { total: 350, occupied: 300, icu: 70, oxygen: 105, general: 100, pediatric: 30, maternity: 25, isolation: 20 }, blood: { 'A+': 130, 'B+': 115, 'O+': 155, 'AB+': 53, 'A-': 26, 'B-': 22, 'O-': 13, 'AB-': 8 }, lastUpdated: new Date() },
    { id: 'pun3', name: 'Sahyadri Hospital', city: 'Pune', state: 'Maharashtra', location: 'Deccan Gymkhana, Pune', lat: 18.5204, lng: 73.8567, contact: '020-67206720', email: 'sahyadri@hospital.in', type: 'Private', beds: { total: 200, occupied: 170, icu: 45, oxygen: 70, general: 50, pediatric: 15, maternity: 10, isolation: 10 }, blood: { 'A+': 80, 'B+': 70, 'O+': 100, 'AB+': 35, 'A-': 17, 'B-': 14, 'O-': 9, 'AB-': 5 }, lastUpdated: new Date() },

    // Ahmedabad (3 hospitals)
    { id: 'ahm1', name: 'Sterling Hospital', city: 'Ahmedabad', state: 'Gujarat', location: 'Off Gurukul Road, Ahmedabad', lat: 23.0258, lng: 72.5347, contact: '079-40004000', email: 'sterling@hospital.in', type: 'Private', beds: { total: 200, occupied: 170, icu: 45, oxygen: 70, general: 50, pediatric: 15, maternity: 10, isolation: 10 }, blood: { 'A+': 80, 'B+': 70, 'O+': 100, 'AB+': 35, 'A-': 17, 'B-': 14, 'O-': 9, 'AB-': 5 }, lastUpdated: new Date() },
    { id: 'ahm2', name: 'Apollo Hospital Ahmedabad', city: 'Ahmedabad', state: 'Gujarat', location: 'Bhat, Gandhinagar', lat: 23.1685, lng: 72.6369, contact: '079-66701800', email: 'apollo.ahm@hospital.in', type: 'Private', beds: { total: 550, occupied: 480, icu: 90, oxygen: 135, general: 210, pediatric: 50, maternity: 40, isolation: 25 }, blood: { 'A+': 165, 'B+': 145, 'O+': 200, 'AB+': 68, 'A-': 33, 'B-': 28, 'O-': 17, 'AB-': 11 }, lastUpdated: new Date() },
    { id: 'ahm3', name: 'Zydus Hospital', city: 'Ahmedabad', state: 'Gujarat', location: 'Thaltej, Ahmedabad', lat: 23.0470, lng: 72.5098, contact: '079-33669000', email: 'zydus@hospital.in', type: 'Private', beds: { total: 300, occupied: 260, icu: 60, oxygen: 90, general: 100, pediatric: 25, maternity: 15, isolation: 10 }, blood: { 'A+': 110, 'B+': 95, 'O+': 130, 'AB+': 45, 'A-': 22, 'B-': 18, 'O-': 11, 'AB-': 7 }, lastUpdated: new Date() },

    // Jaipur (3 hospitals - keeping original)
    { id: 'jai1', name: 'SMS Hospital', city: 'Jaipur', state: 'Rajasthan', location: 'Jawahar Lal Nehru Marg, Jaipur', lat: 26.8919, lng: 75.8080, contact: '0141-2560291', email: 'sms@hospital.in', type: 'Government', beds: { total: 500, occupied: 450, icu: 50, oxygen: 100, general: 250, pediatric: 50, maternity: 30, isolation: 20 }, blood: { 'A+': 5, 'B+': 2, 'O+': 0, 'AB+': 1, 'A-': 0, 'B-': 0, 'O-': 0, 'AB-': 0 }, lastUpdated: new Date() },
    { id: 'jai2', name: 'Fortis Escorts', city: 'Jaipur', state: 'Rajasthan', location: 'Malviya Nagar, Jaipur', lat: 26.8550, lng: 75.8150, contact: '0141-2547000', email: 'fortis.jaipur@hospital.in', type: 'Private', beds: { total: 200, occupied: 120, icu: 30, oxygen: 50, general: 80, pediatric: 20, maternity: 10, isolation: 10 }, blood: { 'A+': 20, 'B+': 15, 'O+': 10, 'AB+': 5, 'A-': 2, 'B-': 1, 'O-': 0, 'AB-': 0 }, lastUpdated: new Date() },
    { id: 'jai3', name: 'Eternal Heart Care', city: 'Jaipur', state: 'Rajasthan', location: 'Jawahar Circle, Jaipur', lat: 26.8370, lng: 75.7950, contact: '0141-2773333', email: 'eternal@hospital.in', type: 'Private', beds: { total: 150, occupied: 40, icu: 20, oxygen: 30, general: 60, pediatric: 20, maternity: 10, isolation: 10 }, blood: { 'A+': 50, 'B+': 40, 'O+': 30, 'AB+': 10, 'A-': 5, 'B-': 5, 'O-': 2, 'AB-': 1 }, lastUpdated: new Date() }
];

// API Routes

// Hospital Registration
app.post('/api/register', async (req, res) => {
    try {
        const { name, location, city, state, lat, lng, contact, email, password, type } = req.body;

        // Validation
        if (!name || !email || !password || !city || !state) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if hospital already exists
        const existingHospital = mockHospitals.find(h => h.email === email);
        if (existingHospital) {
            return res.status(400).json({ message: 'Hospital with this email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new hospital
        const newHospitalData = {
            id: 'h' + Date.now(),
            name,
            location: location || city,
            city,
            state,
            lat: lat || 0,
            lng: lng || 0,
            contact: contact || '',
            email,
            password: hashedPassword,
            type: type || 'Private',
            beds: { total: 0, occupied: 0, icu: 0, oxygen: 0, general: 0, pediatric: 0, maternity: 0, isolation: 0 },
            blood: { 'A+': 0, 'B+': 0, 'O+': 0, 'AB+': 0, 'A-': 0, 'B-': 0, 'O-': 0, 'AB-': 0 },
            lastUpdated: new Date()
        };

        let hospital;
        if (mongoose.connection.readyState === 1) {
            hospital = new Hospital(newHospitalData);
            await hospital.save();
        } else {
            // Fallback to mock if DB down
            hospital = newHospitalData;
            mockHospitals.push(hospital);
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: hospital.id, email: hospital.email, name: hospital.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Remove password from response
        const { password: _, ...hospitalData } = hospital.toObject ? hospital.toObject() : hospital;

        res.status(201).json({
            message: 'Hospital registered successfully',
            token,
            hospital: hospitalData
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ message: 'Registration failed', error: err.message });
    }
});

// Hospital Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        // Find hospital
        let hospital;
        if (mongoose.connection.readyState === 1) {
            hospital = await Hospital.findOne({ email });
        }

        // Fallback to mock
        if (!hospital) {
            hospital = mockHospitals.find(h => h.email === email);
        }

        if (!hospital) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, hospital.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: hospital.id, email: hospital.email, name: hospital.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Remove password from response
        const { password: _, ...hospitalData } = hospital.toObject ? hospital.toObject() : hospital;

        res.json({
            message: 'Login successful',
            token,
            hospital: hospitalData
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Login failed', error: err.message });
    }
});

// Forgot Password
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { emailOrPhone } = req.body;
        console.log(`Password reset requested for: ${emailOrPhone}`);

        if (!emailOrPhone) {
            return res.status(400).json({ message: 'Email or Phone is required' });
        }

        let hospital;
        if (mongoose.connection.readyState === 1) {
            hospital = await Hospital.findOne({
                $or: [{ email: emailOrPhone }, { contact: emailOrPhone }]
            });
        } else {
            // Mock mode
            hospital = mockHospitals.find(h => h.email === emailOrPhone || h.contact === emailOrPhone);
        }

        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found with this email or phone' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save OTP to DB
        if (mongoose.connection.readyState === 1) {
            hospital.resetPasswordOtp = otp;
            hospital.resetPasswordExpires = otpExpires;
            await hospital.save();
        } else {
            // Mock mode update
            const index = mockHospitals.findIndex(h => h.id === hospital.id);
            if (index !== -1) {
                mockHospitals[index].resetPasswordOtp = otp;
                mockHospitals[index].resetPasswordExpires = otpExpires;
            }
        }

        // Send OTP
        const isEmail = emailOrPhone.includes('@');
        if (isEmail) {
            await sendEmail({
                email: hospital.email,
                subject: 'CareBridge Password Reset OTP',
                message: `Your OTP is ${otp}`,
                otp
            });
            res.json({ message: 'OTP sent to your email', type: 'email' });
        } else {
            await sendSMS({
                phone: hospital.contact,
                message: `CareBridge: Your password reset OTP is ${otp}. Valid for 10 mins.`
            });
            res.json({ message: 'OTP sent to your phone', type: 'phone' });
        }

    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: 'Failed to process request', error: err.message });
    }
});

// Reset Password
app.post('/api/reset-password', async (req, res) => {
    try {
        const { emailOrPhone, otp, newPassword } = req.body;

        if (!emailOrPhone || !otp || !newPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        let hospital;
        if (mongoose.connection.readyState === 1) {
            hospital = await Hospital.findOne({
                $or: [{ email: emailOrPhone }, { contact: emailOrPhone }],
                resetPasswordOtp: otp,
                resetPasswordExpires: { $gt: Date.now() }
            });
        } else {
            // Mock mode check
            hospital = mockHospitals.find(h =>
                (h.email === emailOrPhone || h.contact === emailOrPhone) &&
                h.resetPasswordOtp === otp &&
                new Date(h.resetPasswordExpires) > new Date()
            );
        }

        if (!hospital) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        if (mongoose.connection.readyState === 1) {
            hospital.password = hashedPassword;
            hospital.resetPasswordOtp = undefined;
            hospital.resetPasswordExpires = undefined;
            await hospital.save();
        } else {
            // Mock mode update
            const index = mockHospitals.findIndex(h => h.id === hospital.id);
            if (index !== -1) {
                mockHospitals[index].password = hashedPassword;
                mockHospitals[index].resetPasswordOtp = undefined;
                mockHospitals[index].resetPasswordExpires = undefined;
            }
        }

        res.json({ message: 'Password reset successful. You can now login.' });

    } catch (err) {
        console.error('Reset password error:', err);
        res.status(500).json({ message: 'Failed to reset password', error: err.message });
    }
});

// CSV Export
app.get('/api/export/hospitals', async (req, res) => {
    try {
        let hospitals = [];
        if (mongoose.connection.readyState === 1) {
            hospitals = await Hospital.find().sort({ 'beds.occupied': -1 });
        }

        // If no DB data, verify if we should use mock? 
        // For now, let's merge or use whichever has data. 
        // Actually, let's just use what we found, or mock if empty and DB is down.
        if (hospitals.length === 0) {
            hospitals = mockHospitals;
        }

        const csvStringifier = createObjectCsvStringifier({
            header: [
                { id: 'id', title: 'ID' },
                { id: 'name', title: 'Name' },
                { id: 'city', title: 'City' },
                { id: 'state', title: 'State' },
                { id: 'type', title: 'Type' },
                { id: 'contact', title: 'Contact' },
                { id: 'email', title: 'Email' },
                { id: 'totalBeds', title: 'Total Beds' },
                { id: 'occupiedBeds', title: 'Occupied Beds' },
                { id: 'icuBeds', title: 'ICU Beds' },
                { id: 'oxygenBeds', title: 'Oxygen Beds' },
                { id: 'lastUpdated', title: 'Last Updated' }
            ]
        });

        const records = hospitals.map(h => {
            // Handle mongoose document vs plain object
            const data = h.toObject ? h.toObject() : h;
            return {
                ...data,
                totalBeds: data.beds?.total || 0,
                occupiedBeds: data.beds?.occupied || 0,
                icuBeds: data.beds?.icu || 0,
                oxygenBeds: data.beds?.oxygen || 0,
                lastUpdated: data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : ''
            };
        });

        const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=\"hospitals.csv\"');
        res.send(csv);

    } catch (err) {
        console.error('CSV Export error:', err);
        res.status(500).json({ message: 'Export failed', error: err.message });
    }
});

// Verify Token
app.get('/api/verify', authenticateToken, (req, res) => {
    const hospital = mockHospitals.find(h => h.id === req.hospital.id);
    if (!hospital) {
        return res.status(404).json({ message: 'Hospital not found' });
    }
    const { password: _, ...hospitalData } = hospital;
    res.json({ valid: true, hospital: hospitalData });
});

app.get('/api/hospitals', async (req, res) => {
    try {
        // Try MongoDB first, fall back to mock data
        if (mongoose.connection.readyState === 1) {
            const hospitals = await Hospital.find().sort({ 'beds.occupied': -1 });
            if (hospitals.length > 0) return res.json(hospitals);
        }
        res.json(mockHospitals);
    } catch (err) {
        console.log('Using mock data due to DB error');
        res.json(mockHospitals);
    }
});

app.get('/api/analyze', async (req, res) => {
    try {
        const averageOccupancy = mockHospitals.reduce((total, hospital) => {
            return total + (hospital.beds.occupied / hospital.beds.total) * 100;
        }, 0) / mockHospitals.length;
        const currentOccupancy = Number(req.query.current_occupancy ?? averageOccupancy);
        if (!Number.isFinite(currentOccupancy) || currentOccupancy < 0 || currentOccupancy > 100) {
            return res.status(400).json({ message: 'current_occupancy must be between 0 and 100.' });
        }

        const script = path.join(__dirname, '../ml/predict.py');
        const payload = JSON.stringify({
            current_occupancy: currentOccupancy,
            hour: new Date().getHours(),
            day_of_week: new Date().getDay(),
        });
        const output = await new Promise((resolve, reject) => {
            execFile(process.env.PYTHON_BIN || 'python3', [script, payload], { timeout: 5000 }, (error, stdout, stderr) => {
                if (error) return reject(new Error(stderr || error.message));
                resolve(stdout);
            });
        });
        const prediction = JSON.parse(output.trim());
        const peak = Math.max(...prediction.occupancy_trend);
        const r2 = Number(prediction.metrics?.r2 ?? 0);

        res.json({
            occupancy_trend: prediction.occupancy_trend,
            model_score: r2,
            insight: peak >= 90
                ? `Forecast occupancy reaches ${peak}%. Confirm capacity with the hospital before dispatch.`
                : `Forecast occupancy peaks at ${peak}%. Continue monitoring live hospital updates.`,
        });
    } catch (err) {
        console.error('Occupancy forecast error:', err.message);
        res.status(503).json({ message: 'Occupancy model is unavailable. Train the model and try again.' });
    }
});

app.get('/api/data-sources', (req, res) => {
    res.json({
        inventory: {
            status: 'demonstration',
            message: 'Capacity values are local demonstration inventory, not a live hospital feed.',
        },
        facilityDirectory: {
            status: 'reference',
            name: 'National Hospital Directory with Geo Code',
            publisher: 'Open Government Data Platform India',
            url: 'https://www.data.gov.in/resource/national-hospital-directory-geo-code-and-additional-parameters-updated-till-last-month',
        },
        historicalBeds: {
            status: 'reference',
            name: 'Central Government Hospitals beds dataset (2025)',
            url: 'https://kerala.data.gov.in/resource/hospital-wise-total-number-beds-available-central-government-hospitals-data-national',
        },
    });
});

app.post('/api/update', authenticateToken, async (req, res) => {
    const { id, beds, blood } = req.body;

    // Verify hospital can only update their own data
    if (req.hospital.id !== id) {
        return res.status(403).json({ message: 'You can only update your own hospital data' });
    }
    try {
        let hospital;
        if (mongoose.connection.readyState === 1) {
            hospital = await Hospital.findOneAndUpdate(
                { id },
                { beds, blood, lastUpdated: Date.now() },
                { new: true }
            );
        }

        // If DB update failed or didn't happen, use mock data
        if (!hospital) {
            const index = mockHospitals.findIndex(h => h.id === id);
            if (index !== -1) {
                mockHospitals[index] = { ...mockHospitals[index], beds, blood, lastUpdated: new Date() };
                hospital = mockHospitals[index];
            }
        }

        if (hospital) {
            // Emit real-time update
            io.emit('hospitalUpdated', hospital);
            res.json({ success: true, hospital });
        } else {
            res.status(404).json({ message: 'Hospital not found' });
        }

    } catch (err) {
        // Fallback to mock update
        const index = mockHospitals.findIndex(h => h.id === id);
        if (index !== -1) {
            mockHospitals[index] = { ...mockHospitals[index], beds, blood, lastUpdated: new Date() };
            io.emit('hospitalUpdated', mockHospitals[index]);
            return res.json({ success: true, hospital: mockHospitals[index] });
        }
        res.status(500).json({ message: err.message });
    }
});

// Upload Certificate
app.post('/api/upload-certificate', authenticateToken, upload.single('certificate'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { docName, issuer = '', registrationNumber = '', hfrId = '' } = req.body;
        if (!docName) {
            return res.status(400).json({ message: 'Document name is required' });
        }

        const hospitalId = req.hospital.id;
        const fileBuffer = fs.readFileSync(req.file.path);
        const sha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        const signals = [];
        let riskScore = 15;
        if (!issuer.trim()) { riskScore += 20; signals.push('Issuer was not supplied'); }
        if (!registrationNumber.trim()) { riskScore += 25; signals.push('Registration or accreditation number is missing'); }
        if (!hfrId.trim()) { riskScore += 10; signals.push('ABDM Health Facility ID was not supplied'); }
        if (req.file.size < 20_000) { riskScore += 15; signals.push('Unusually small document; inspect image quality'); }
        if (!['.pdf', '.png', '.jpg', '.jpeg'].includes(path.extname(req.file.originalname).toLowerCase())) {
            riskScore += 30; signals.push('Unexpected file type');
        }
        riskScore = Math.min(100, riskScore);
        const analysis = {
            riskScore,
            decision: riskScore <= 25 ? 'low_risk_manual_review' : riskScore <= 55 ? 'review_required' : 'high_risk_review',
            signals: signals.length ? signals : ['Required metadata supplied; confirm against the issuing registry'],
            sha256,
            registryChecks: [
                { registry: 'ABDM Health Facility Registry', status: hfrId ? 'ready_for_external_check' : 'identifier_missing' },
                { registry: issuer || 'Accreditation issuer', status: registrationNumber ? 'ready_for_external_check' : 'identifier_missing' }
            ],
            disclaimer: 'Automated screening is not proof of authenticity. A trained reviewer must verify identifiers with the issuing authority.'
        };
        const certEntry = {
            docName,
            fileName: req.file.originalname,
            filePath: `/uploads/certificates/${req.file.filename}`,
            issuer,
            registrationNumber,
            hfrId,
            analysis,
            reviewStatus: 'manual_review',
            uploadedAt: new Date()
        };

        // Try MongoDB
        let hospital;
        if (mongoose.connection.readyState === 1) {
            hospital = await Hospital.findOneAndUpdate(
                { id: hospitalId },
                { $push: { certificates: certEntry } },
                { new: true }
            );
        }

        // Fallback to mock
        if (!hospital) {
            const index = mockHospitals.findIndex(h => h.id === hospitalId);
            if (index !== -1) {
                if (!mockHospitals[index].certificates) mockHospitals[index].certificates = [];
                mockHospitals[index].certificates.push(certEntry);
                hospital = mockHospitals[index];
            }
        }

        if (hospital) {
            res.json({ success: true, certificate: certEntry, certificates: hospital.certificates || [] });
        } else {
            res.status(404).json({ message: 'Hospital not found' });
        }
    } catch (err) {
        console.error('Certificate upload error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Get certificates for a hospital
app.get('/api/certificates/:hospitalId', async (req, res) => {
    try {
        const { hospitalId } = req.params;
        let hospital;
        if (mongoose.connection.readyState === 1) {
            hospital = await Hospital.findOne({ id: hospitalId });
        }
        if (!hospital) {
            hospital = mockHospitals.find(h => h.id === hospitalId);
        }
        if (hospital) {
            res.json({ certificates: hospital.certificates || [] });
        } else {
            res.status(404).json({ message: 'Hospital not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Chatbot Route
const chatRoute = require('./routes/chat');
app.use('/api/chat', chatRoute);

app.get('/api/chat/status', (req, res) => res.json(require('./chatbot/manager').getStatus()));

app.get('/api/health', (req, res) => res.json({ status: 'Online', database: dbStatus(), model: fs.existsSync(path.join(__dirname, '../ml/occupancy_model.pkl')) ? 'ready' : 'not-trained' }));

const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
