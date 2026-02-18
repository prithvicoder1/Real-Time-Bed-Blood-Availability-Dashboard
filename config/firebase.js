const admin = require('firebase-admin');

let db = null;

/**
 * Initialize Firebase Admin SDK
 * Note: For production, use a service account key file
 * For now, we'll use environment variables or skip if not configured
 */
const initializeFirebase = () => {
    try {
        // Check if Firebase is already initialized
        if (admin.apps.length > 0) {
            console.log('Firebase already initialized');
            db = admin.firestore();
            return db;
        }

        // Check if Firebase credentials are provided
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

        if (!projectId || !privateKey || !clientEmail) {
            console.log('Firebase credentials not configured. Skipping Firebase initialization.');
            console.log('To enable Firebase, set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL in .env');
            return null;
        }

        // Initialize Firebase Admin
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                privateKey,
                clientEmail
            })
        });

        db = admin.firestore();
        console.log('Firebase initialized successfully');
        return db;
    } catch (error) {
        console.error('Error initializing Firebase:', error.message);
        return null;
    }
};

/**
 * Sync hospital data to Firebase
 */
const syncHospitalToFirebase = async (hospital) => {
    if (!db) return null;

    try {
        const hospitalRef = db.collection('hospitals').doc(hospital.id);
        await hospitalRef.set({
            id: hospital.id,
            name: hospital.name,
            city: hospital.city,
            state: hospital.state,
            location: hospital.location,
            lat: hospital.lat,
            lng: hospital.lng,
            contact: hospital.contact,
            email: hospital.email,
            type: hospital.type,
            beds: hospital.beds,
            blood: hospital.blood,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return { success: true, hospitalId: hospital.id };
    } catch (error) {
        console.error('Error syncing hospital to Firebase:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Sync patient data to Firebase
 */
const syncPatientToFirebase = async (patient) => {
    if (!db) return null;

    try {
        const patientRef = db.collection('patients').doc(patient._id.toString());
        await patientRef.set({
            name: patient.name,
            email: patient.email,
            phone: patient.phone,
            bloodGroup: patient.bloodGroup,
            gender: patient.gender,
            address: patient.address,
            emergencyContact: patient.emergencyContact,
            createdAt: patient.createdAt,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return { success: true, patientId: patient._id };
    } catch (error) {
        console.error('Error syncing patient to Firebase:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Sync emergency request to Firebase
 */
const syncEmergencyToFirebase = async (emergency) => {
    if (!db) return null;

    try {
        const emergencyRef = db.collection('emergencies').doc(emergency._id.toString());
        await emergencyRef.set({
            patientId: emergency.patientId.toString(),
            patientName: emergency.patientName,
            patientPhone: emergency.patientPhone,
            hospitalId: emergency.hospitalId,
            hospitalName: emergency.hospitalName,
            requestType: emergency.requestType,
            priority: emergency.priority,
            status: emergency.status,
            location: emergency.location,
            bloodType: emergency.bloodType,
            description: emergency.description,
            createdAt: emergency.createdAt,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return { success: true, emergencyId: emergency._id };
    } catch (error) {
        console.error('Error syncing emergency to Firebase:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Batch sync all hospitals to Firebase
 */
const syncAllHospitalsToFirebase = async (hospitals) => {
    if (!db) return { success: false, message: 'Firebase not initialized' };

    try {
        const batch = db.batch();
        hospitals.forEach(hospital => {
            const hospitalRef = db.collection('hospitals').doc(hospital.id);
            batch.set(hospitalRef, {
                id: hospital.id,
                name: hospital.name,
                city: hospital.city,
                state: hospital.state,
                location: hospital.location,
                lat: hospital.lat,
                lng: hospital.lng,
                contact: hospital.contact,
                email: hospital.email,
                type: hospital.type,
                beds: hospital.beds,
                blood: hospital.blood,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });

        await batch.commit();
        return { success: true, count: hospitals.length };
    } catch (error) {
        console.error('Error batch syncing hospitals:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    initializeFirebase,
    syncHospitalToFirebase,
    syncPatientToFirebase,
    syncEmergencyToFirebase,
    syncAllHospitalsToFirebase,
    getFirestore: () => db
};
