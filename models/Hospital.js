const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    location: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    contact: { type: String },
    type: { type: String, enum: ['Government', 'Private'], default: 'Private' },
    beds: {
        total: { type: Number, default: 0 },
        occupied: { type: Number, default: 0 },
        icu: { type: Number, default: 0 },
        oxygen: { type: Number, default: 0 },
        general: { type: Number, default: 0 },
        pediatric: { type: Number, default: 0 },
        maternity: { type: Number, default: 0 },
        isolation: { type: Number, default: 0 }
    },
    blood: {
        'A+': { type: Number, default: 0 },
        'B+': { type: Number, default: 0 },
        'O+': { type: Number, default: 0 },
        'AB+': { type: Number, default: 0 },
        'A-': { type: Number, default: 0 },
        'B-': { type: Number, default: 0 },
        'O-': { type: Number, default: 0 },
        'AB-': { type: Number, default: 0 }
    },
    lastUpdated: { type: Date, default: Date.now },
    certificates: [{
        docName: { type: String, required: true },
        fileName: { type: String, required: true },
        filePath: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
    }],
    resetPasswordOtp: { type: String },
    resetPasswordExpires: { type: Date }
});

module.exports = mongoose.model('Hospital', hospitalSchema);
