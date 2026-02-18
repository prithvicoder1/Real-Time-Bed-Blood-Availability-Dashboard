import React, { useState, useEffect } from 'react';
import { Activity, Droplet, Save, LogOut, Upload, FileText, CheckCircle } from 'lucide-react';

const HospitalDashboard = () => {
    // Get hospital ID from localStorage or fallback
    const storedData = localStorage.getItem('hospital_data');
    const hospitalId = storedData ? JSON.parse(storedData).id : 'del1';

    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        icu: 0,
        oxygen: 0,
        general: 0,
        pediatric: 0,
        maternity: 0,
        isolation: 0,
        occupied: 0,
        blood: {}
    });
    const [certificates, setCertificates] = useState([]);
    const [uploading, setUploading] = useState(null);

    const certificateTypes = [
        { key: 'hospital_registration', label: 'Hospital Registration Certificate', desc: 'Issued by State Health Authority' },
        { key: 'clinical_establishment', label: 'Clinical Establishment License', desc: 'Under CEA 2010' },
        { key: 'fire_safety', label: 'Fire Safety Certificate', desc: 'Issued by Fire Department' },
        { key: 'nabh_nabl', label: 'NABH / NABL Accreditation', desc: 'National Accreditation Board' },
        { key: 'biomedical_waste', label: 'Biomedical Waste License', desc: 'Under BMW Rules' }
    ];

    useEffect(() => {
        // Fetch specific hospital data
        fetch('/api/hospitals')
            .then(res => res.json())
            .then(data => {
                const myHospital = data.find(h => h.id === hospitalId);
                if (myHospital) {
                    setHospital(myHospital);
                    setFormData({
                        icu: myHospital.beds.icu,
                        oxygen: myHospital.beds.oxygen,
                        general: myHospital.beds.general || 0,
                        pediatric: myHospital.beds.pediatric || 0,
                        maternity: myHospital.beds.maternity || 0,
                        isolation: myHospital.beds.isolation || 0,
                        occupied: myHospital.beds.occupied,
                        blood: myHospital.blood
                    });
                }
                setLoading(false);
            });

        // Fetch existing certificates
        fetch(`/api/certificates/${hospitalId}`)
            .then(res => res.json())
            .then(data => setCertificates(data.certificates || []))
            .catch(() => { });
    }, [hospitalId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: parseInt(value) || 0
        }));
    };

    const handleBloodChange = (type, value) => {
        setFormData(prev => ({
            ...prev,
            blood: {
                ...prev.blood,
                [type]: parseInt(value) || 0
            }
        }));
    };

    const handleCertUpload = async (certKey, certLabel) => {
        const fileInput = document.getElementById(`cert-${certKey}`);
        if (!fileInput || !fileInput.files[0]) {
            alert('Please select a file first');
            return;
        }

        setUploading(certKey);
        const formPayload = new FormData();
        formPayload.append('certificate', fileInput.files[0]);
        formPayload.append('docName', certLabel);

        const token = localStorage.getItem('hospital_token');
        try {
            const res = await fetch('/api/upload-certificate', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formPayload
            });
            const data = await res.json();
            if (data.success) {
                setCertificates(data.certificates);
                fileInput.value = '';
                alert(`${certLabel} uploaded successfully!`);
            } else {
                alert(`Upload failed: ${data.message}`);
            }
        } catch (err) {
            alert('Upload error: ' + err.message);
        } finally {
            setUploading(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Optimistic update
        const updatedHospital = {
            ...hospital,
            beds: {
                ...hospital.beds,
                icu: formData.icu,
                oxygen: formData.oxygen,
                general: formData.general,
                pediatric: formData.pediatric,
                maternity: formData.maternity,
                isolation: formData.isolation,
                occupied: formData.occupied
            },
            blood: formData.blood
        };
        setHospital(updatedHospital);

        // Get token
        const token = localStorage.getItem('hospital_token');

        // Send update to server
        const res = await fetch('/api/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                id: hospitalId,
                beds: {
                    total: hospital.beds.total,
                    occupied: formData.occupied,
                    icu: formData.icu,
                    oxygen: formData.oxygen,
                    general: formData.general,
                    pediatric: formData.pediatric,
                    maternity: formData.maternity,
                    isolation: formData.isolation
                },
                blood: formData.blood
            })
        });

        if (!res.ok) {
            const errData = await res.json();
            alert(`Update failed: ${errData.message}`);
            return;
        }

        alert('Data updated successfully!');
    };

    if (loading) return <div className="container center" style={{ color: 'white' }}><div className="loader"></div></div>;
    if (!hospital) return <div className="container" style={{ color: 'white' }}>Access Denied</div>;

    return (
        <div className="container" style={{ padding: 'var(--spacing-xl) 0' }}>
            <div className="card" data-aos="fade-up" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{hospital.name} Dashboard</h2>
                        <span style={{
                            background: 'rgba(14, 165, 233, 0.2)',
                            color: '#38bdf8',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.9rem'
                        }}>
                            Admin Portal
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            className="btn btn-outline"
                            style={{ borderColor: '#3b82f6', color: '#3b82f6' }}
                            onClick={() => window.location.href = 'http://localhost:5001/api/export/hospitals'}
                        >
                            <Save size={18} /> Download CSV
                        </button>
                        <button className="btn btn-outline" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
                {/* Bed Management */}
                <div className="card" data-aos="fade-up" data-aos-delay="100">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <Activity color="#fca5a5" />
                        <h3 style={{ margin: 0 }}>Bed Management</h3>
                    </div>

                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Total Occupied Beds</label>
                            <input
                                type="number"
                                name="occupied"
                                value={formData.occupied}
                                onChange={handleChange}
                                style={{ fontSize: '1.2rem', fontWeight: 'bold' }}
                            />
                            <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Total Capacity: {hospital.beds.total}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fca5a5' }}>ICU Available</label>
                                <input
                                    type="number"
                                    name="icu"
                                    value={formData.icu}
                                    onChange={handleChange}
                                    style={{ borderColor: 'rgba(239, 68, 68, 0.5)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#93c5fd' }}>Oxygen Available</label>
                                <input
                                    type="number"
                                    name="oxygen"
                                    value={formData.oxygen}
                                    onChange={handleChange}
                                    style={{ borderColor: 'rgba(59, 130, 246, 0.5)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a78bfa' }}>General Ward</label>
                                <input
                                    type="number"
                                    name="general"
                                    value={formData.general}
                                    onChange={handleChange}
                                    style={{ borderColor: 'rgba(167, 139, 250, 0.5)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fcd34d' }}>Pediatric</label>
                                <input
                                    type="number"
                                    name="pediatric"
                                    value={formData.pediatric}
                                    onChange={handleChange}
                                    style={{ borderColor: 'rgba(252, 211, 77, 0.5)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f472b6' }}>Maternity</label>
                                <input
                                    type="number"
                                    name="maternity"
                                    value={formData.maternity}
                                    onChange={handleChange}
                                    style={{ borderColor: 'rgba(244, 114, 182, 0.5)' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#34d399' }}>Isolation</label>
                                <input
                                    type="number"
                                    name="isolation"
                                    value={formData.isolation}
                                    onChange={handleChange}
                                    style={{ borderColor: 'rgba(52, 211, 153, 0.5)' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Blood Bank Management */}
                <div className="card" data-aos="fade-up" data-aos-delay="200">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <Droplet color="#ef4444" />
                        <h3 style={{ margin: 0 }}>Blood Inventory</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
                        {Object.entries(formData.blood).map(([type, count]) => (
                            <div key={type}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold',
                                    color: type.includes('+') ? '#fca5a5' : '#fed7aa'
                                }}>
                                    {type}
                                </label>
                                <input
                                    type="number"
                                    value={count}
                                    onChange={(e) => handleBloodChange(type, e.target.value)}
                                    style={{ padding: '8px', textAlign: 'center' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Certificates & Licenses */}
                <div className="card" data-aos="fade-up" data-aos-delay="300" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                        <FileText color="#fbbf24" />
                        <h3 style={{ margin: 0 }}>Certificates & Licenses</h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>PDF, JPG, PNG — Max 5MB</span>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {certificateTypes.map(cert => {
                            const uploaded = certificates.find(c => c.docName === cert.label);
                            return (
                                <div key={cert.key} style={{
                                    display: 'flex', alignItems: 'center', gap: '16px',
                                    background: 'rgba(255,255,255,0.03)', padding: '16px',
                                    borderRadius: '12px', border: uploaded ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.08)',
                                    flexWrap: 'wrap'
                                }}>
                                    <div style={{ flex: '1 1 250px', minWidth: '200px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{cert.label}</span>
                                            {uploaded && <CheckCircle size={16} color="#4ade80" />}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{cert.desc}</div>
                                        {uploaded && (
                                            <a href={`http://localhost:5001${uploaded.filePath}`} target="_blank" rel="noopener noreferrer" style={{
                                                fontSize: '0.75rem', color: '#60a5fa', textDecoration: 'none', marginTop: '4px', display: 'inline-block'
                                            }}>📎 {uploaded.fileName}</a>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '0 0 auto' }}>
                                        <input
                                            type="file"
                                            id={`cert-${cert.key}`}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            style={{ fontSize: '0.8rem', maxWidth: '200px' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleCertUpload(cert.key, cert.label)}
                                            disabled={uploading === cert.key}
                                            className="btn"
                                            style={{
                                                background: uploaded ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                                color: uploaded ? '#4ade80' : '#60a5fa',
                                                border: uploaded ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(59, 130, 246, 0.4)',
                                                padding: '6px 16px', fontSize: '0.85rem', cursor: 'pointer',
                                                opacity: uploading === cert.key ? 0.5 : 1
                                            }}
                                        >
                                            <Upload size={14} /> {uploading === cert.key ? 'Uploading...' : (uploaded ? 'Re-upload' : 'Upload')}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Actions */}
                <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'right' }} data-aos="fade-up">
                    <button type="submit" className="btn btn-primary" style={{ padding: '16px 48px', fontSize: '1.1rem' }}>
                        <Save size={20} /> Update Live Status
                    </button>
                </div>
            </form>
        </div>
    );
};

export default HospitalDashboard;
