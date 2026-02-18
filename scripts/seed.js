const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Hospital = require('../models/Hospital');

dotenv.config();
connectDB();

const jaipurHospitals = [
    // ... (Your existing 25 hospitals)
    {
        id: 'h1',
        name: 'Sawai Man Singh (SMS) Hospital',
        location: 'Jawahar Lal Nehru Marg, Jaipur',
        lat: 26.8919, lng: 75.8173,
        contact: '0141-2560291',
        type: 'Government',
        beds: { total: 1500, occupied: 1200, icu: 50, oxygen: 100 },
        blood: { 'A+': 50, 'O+': 20, 'B+': 45, 'AB+': 15 }
    },
    {
        id: 'h2',
        name: 'Fortis Escorts Hospital',
        location: 'Malviya Nagar, Jaipur',
        lat: 26.8549, lng: 75.8091,
        contact: '0141-2547000',
        type: 'Private',
        beds: { total: 250, occupied: 180, icu: 40, oxygen: 50 },
        blood: { 'A+': 20, 'O+': 15, 'B+': 25, 'AB+': 10 }
    },
    // Adding more to reach 50+ simulation (Generating dynamically for brevity in seed)
];

// Helper to generate realistic data for standard Jaipur hospitals
const hospitalNames = [
    "Eternal Heart Care Centre", "Narayana Multispeciality", "Mahatma Gandhi Hospital", "Apex Hospitals",
    "CK Birla Hospital", "Rajasthan Hospital", "Jaipur Golden Hospital", "Cocoon Hospital", "Imperial Hospital",
    "SDMH", "Bhagwan Mahaveer Cancer Hospital", "HCG Cancer Centre", "Shelby Hospital", "Metro Mas Hospital",
    "Monilek Hospital", "Marwar Hospital", "Soni Hospital", "JNU Hospital", "Manipal Hospital", "Ghiya Hospital",
    "Saket Hospital", "Khandaka Hospital", "Bhandari Hospital", "Rungta Hospital", "SR Kalla Hospital",
    "Jain ENT Hospital", "Amar Jain Hospital", "Red Cross Hospital", "Satellite Hospital Sethi Colony",
    "Satellite Hospital Bani Park", "Govt. Dispensary Sodala", "Govt. Dispensary Shastri Nagar",
    "Jaipur Calgary Eye Hospital", "Anand Hospital", "Rawal Hospital", "Maxwell Hospital", "Tagore Hospital",
    "Dhanwantri Hospital", "Chirayu Hospital", "K.P. Automotives Hospital", "Liberty Hospital", "Shekhawati Hospital",
    "Global Heart & General Hospital", "Purple Heron Hospital", "Sparsh Hospital", "Vatsalya Hospital", "Surya Hospital"
];

// Generate 48 more hospitals based on real names above
const generatedHospitals = hospitalNames.map((name, index) => ({
    id: `h${index + 3}`,
    name: `${name}`,
    location: 'Jaipur, Rajasthan',
    lat: 26.9124 + (Math.random() - 0.5) * 0.1, // Random spread around Jaipur center
    lng: 75.7873 + (Math.random() - 0.5) * 0.1,
    contact: `0141-${Math.floor(2000000 + Math.random() * 900000)}`,
    type: Math.random() > 0.7 ? 'Government' : 'Private',
    beds: {
        total: Math.floor(50 + Math.random() * 450),
        occupied: Math.floor(20 + Math.random() * 300),
        icu: Math.floor(5 + Math.random() * 50),
        oxygen: Math.floor(10 + Math.random() * 80)
    },
    blood: {
        'A+': Math.floor(Math.random() * 20),
        'B+': Math.floor(Math.random() * 20),
        'O+': Math.floor(Math.random() * 20),
        'AB+': Math.floor(Math.random() * 10),
        'A-': Math.floor(Math.random() * 5),
        'B-': Math.floor(Math.random() * 5),
        'O-': Math.floor(Math.random() * 5),
        'AB-': Math.floor(Math.random() * 2),
    }
}));

const allHospitals = [...jaipurHospitals, ...generatedHospitals];

const importData = async () => {
    try {
        await Hospital.deleteMany();
        await Hospital.create(allHospitals);
        console.log('Data Imported Successfully!');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

importData();
