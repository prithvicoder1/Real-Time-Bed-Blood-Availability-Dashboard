const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const path = require('path');
const fs = require('fs');

// Ensure exports directory exists
const exportsDir = path.join(__dirname, '../exports');
if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
}

/**
 * Export hospitals data to CSV
 */
const exportHospitalsToCSV = async (hospitals) => {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `hospitals_${timestamp}.csv`;
    const filepath = path.join(exportsDir, filename);

    const csvWriter = createCsvWriter({
        path: filepath,
        header: [
            { id: 'id', title: 'Hospital ID' },
            { id: 'name', title: 'Hospital Name' },
            { id: 'city', title: 'City' },
            { id: 'state', title: 'State' },
            { id: 'location', title: 'Address' },
            { id: 'lat', title: 'Latitude' },
            { id: 'lng', title: 'Longitude' },
            { id: 'contact', title: 'Contact' },
            { id: 'email', title: 'Email' },
            { id: 'type', title: 'Type' },
            { id: 'totalBeds', title: 'Total Beds' },
            { id: 'occupiedBeds', title: 'Occupied Beds' },
            { id: 'availableBeds', title: 'Available Beds' },
            { id: 'icuBeds', title: 'ICU Beds' },
            { id: 'oxygenBeds', title: 'Oxygen Beds' },
            { id: 'bloodA+', title: 'Blood A+' },
            { id: 'bloodB+', title: 'Blood B+' },
            { id: 'bloodO+', title: 'Blood O+' },
            { id: 'bloodAB+', title: 'Blood AB+' },
            { id: 'bloodA-', title: 'Blood A-' },
            { id: 'bloodB-', title: 'Blood B-' },
            { id: 'bloodO-', title: 'Blood O-' },
            { id: 'bloodAB-', title: 'Blood AB-' },
            { id: 'lastUpdated', title: 'Last Updated' }
        ]
    });

    const records = hospitals.map(h => ({
        id: h.id,
        name: h.name,
        city: h.city || '',
        state: h.state || '',
        location: h.location,
        lat: h.lat,
        lng: h.lng,
        contact: h.contact || '',
        email: h.email || '',
        type: h.type,
        totalBeds: h.beds?.total || 0,
        occupiedBeds: h.beds?.occupied || 0,
        availableBeds: (h.beds?.total || 0) - (h.beds?.occupied || 0),
        icuBeds: h.beds?.icu || 0,
        oxygenBeds: h.beds?.oxygen || 0,
        'bloodA+': h.blood?.['A+'] || 0,
        'bloodB+': h.blood?.['B+'] || 0,
        'bloodO+': h.blood?.['O+'] || 0,
        'bloodAB+': h.blood?.['AB+'] || 0,
        'bloodA-': h.blood?.['A-'] || 0,
        'bloodB-': h.blood?.['B-'] || 0,
        'bloodO-': h.blood?.['O-'] || 0,
        'bloodAB-': h.blood?.['AB-'] || 0,
        lastUpdated: h.lastUpdated || new Date()
    }));

    await csvWriter.writeRecords(records);
    return { filename, filepath, recordCount: records.length };
};

/**
 * Export patients data to CSV
 */
const exportPatientsToCSV = async (patients) => {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `patients_${timestamp}.csv`;
    const filepath = path.join(exportsDir, filename);

    const csvWriter = createCsvWriter({
        path: filepath,
        header: [
            { id: 'id', title: 'Patient ID' },
            { id: 'name', title: 'Name' },
            { id: 'email', title: 'Email' },
            { id: 'phone', title: 'Phone' },
            { id: 'bloodGroup', title: 'Blood Group' },
            { id: 'gender', title: 'Gender' },
            { id: 'dateOfBirth', title: 'Date of Birth' },
            { id: 'city', title: 'City' },
            { id: 'state', title: 'State' },
            { id: 'emergencyContactName', title: 'Emergency Contact Name' },
            { id: 'emergencyContactPhone', title: 'Emergency Contact Phone' },
            { id: 'allergies', title: 'Allergies' },
            { id: 'createdAt', title: 'Registered On' }
        ]
    });

    const records = patients.map(p => ({
        id: p._id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        bloodGroup: p.bloodGroup,
        gender: p.gender || '',
        dateOfBirth: p.dateOfBirth || '',
        city: p.address?.city || '',
        state: p.address?.state || '',
        emergencyContactName: p.emergencyContact?.name || '',
        emergencyContactPhone: p.emergencyContact?.phone || '',
        allergies: p.allergies?.join(', ') || '',
        createdAt: p.createdAt
    }));

    await csvWriter.writeRecords(records);
    return { filename, filepath, recordCount: records.length };
};

/**
 * Export emergency requests to CSV
 */
const exportEmergenciesToCSV = async (emergencies) => {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `emergencies_${timestamp}.csv`;
    const filepath = path.join(exportsDir, filename);

    const csvWriter = createCsvWriter({
        path: filepath,
        header: [
            { id: 'id', title: 'Request ID' },
            { id: 'patientName', title: 'Patient Name' },
            { id: 'patientPhone', title: 'Patient Phone' },
            { id: 'hospitalName', title: 'Hospital Name' },
            { id: 'requestType', title: 'Request Type' },
            { id: 'priority', title: 'Priority' },
            { id: 'status', title: 'Status' },
            { id: 'bloodType', title: 'Blood Type' },
            { id: 'location', title: 'Location' },
            { id: 'description', title: 'Description' },
            { id: 'createdAt', title: 'Created At' },
            { id: 'completedAt', title: 'Completed At' }
        ]
    });

    const records = emergencies.map(e => ({
        id: e._id,
        patientName: e.patientName,
        patientPhone: e.patientPhone,
        hospitalName: e.hospitalName,
        requestType: e.requestType,
        priority: e.priority,
        status: e.status,
        bloodType: e.bloodType || '',
        location: e.location?.address || `${e.location?.lat}, ${e.location?.lng}`,
        description: e.description || '',
        createdAt: e.createdAt,
        completedAt: e.completedAt || ''
    }));

    await csvWriter.writeRecords(records);
    return { filename, filepath, recordCount: records.length };
};

module.exports = {
    exportHospitalsToCSV,
    exportPatientsToCSV,
    exportEmergenciesToCSV
};
