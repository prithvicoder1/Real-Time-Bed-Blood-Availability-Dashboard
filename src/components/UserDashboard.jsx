import React, { useState, useEffect } from 'react';
import socket from '../socket';
import MapComponent from './MapComponent';
import Analytics from './Analytics';
import AmbulanceBooking from './AmbulanceBooking';
import { Search, Filter, Activity, Droplet, User, Phone, Mail, ShieldCheck } from 'lucide-react';

const UserDashboard = () => {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        // Initial fetch
        fetch('/api/hospitals')
            .then(res => res.json())
            .then(data => {
                setHospitals(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching hospitals:', err);
                setLoading(false);
            });

        // Real-time updates
        socket.on('hospitalUpdated', (updatedHospital) => {
            setHospitals(prev => prev.map(h => h.id === updatedHospital.id ? updatedHospital : h));
        });

        return () => {
            socket.off('hospitalUpdated');
        };
    }, []);

    const filteredHospitals = hospitals.filter(h =>
        h.name.toLowerCase().includes(filter.toLowerCase()) ||
        h.location.toLowerCase().includes(filter.toLowerCase())
    );

    if (loading) return (
        <div className="container" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div className="loader"></div>
            <p>Loading real-time data...</p>
        </div>
    );

    return (
        <div className="container" style={{ padding: 'var(--spacing-xl) 0' }}>
            {/* Header Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" data-aos="fade-up" data-aos-delay="0">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Hospitals</p>
                            <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>{hospitals.length}</h2>
                        </div>
                        <Activity size={32} color="var(--primary-color)" />
                    </div>
                </div>
                <div className="card" data-aos="fade-up" data-aos-delay="100">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>ICU Beds Free</p>
                            <h2 style={{ margin: 0, color: 'var(--secondary-color)' }}>
                                {hospitals.reduce((acc, h) => acc + (h.beds.icu || 0), 0)}
                            </h2>
                        </div>
                        <Activity size={32} color="var(--secondary-color)" />
                    </div>
                </div>
                <div className="card" data-aos="fade-up" data-aos-delay="200">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Oxygen Beds</p>
                            <h2 style={{ margin: 0, color: 'var(--accent-color)' }}>
                                {hospitals.reduce((acc, h) => acc + (h.beds.oxygen || 0), 0)}
                            </h2>
                        </div>
                        <Droplet size={32} color="var(--accent-color)" />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }} className="responsive-grid">
                {/* Analytics Section */}
                <Analytics />

                {/* Ambulance Section */}
                <AmbulanceBooking />
            </div>

            {/* Map Section */}
            <h2 style={{ marginBottom: '1rem' }}>Live Hospital Map</h2>
            <div style={{ marginBottom: '2rem' }}>
                <MapComponent hospitals={hospitals} />
            </div>

            {/* Hospital List */}
            <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h2>Available Hospitals</h2>
                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder="Search by name or location..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--spacing-md)' }}>
                {filteredHospitals.map((hospital, index) => (
                    <div key={hospital.id} className="card" data-aos="fade-up" data-aos-delay={index * 50} style={{
                        borderLeft: `5px solid ${hospital.beds.occupied < hospital.beds.total * 0.8 ? 'var(--secondary-color)' : 'var(--danger-color)'}`
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{hospital.name}</h3>
                                    {hospital.certificates && hospital.certificates.length > 0 && (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            background: 'rgba(34, 197, 94, 0.15)',
                                            color: '#4ade80',
                                            border: '1px solid rgba(34, 197, 94, 0.3)',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            <ShieldCheck size={14} /> Verified
                                        </span>
                                    )}
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>📍 {hospital.location}</p>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                                <span style={{
                                    fontSize: '0.8rem',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    background: hospital.type === 'Private' ? 'rgba(14, 165, 233, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                                    color: hospital.type === 'Private' ? '#38bdf8' : '#c084fc'
                                }}>
                                    {hospital.type}
                                </span>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            {hospital.contact && (
                                <a href={`tel:${hospital.contact}`} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80',
                                    padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem',
                                    textDecoration: 'none', border: '1px solid rgba(34, 197, 94, 0.3)',
                                    transition: 'all 0.2s ease', cursor: 'pointer'
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.3)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34, 197, 94, 0.15)'; }}
                                >
                                    <Phone size={13} /> {hospital.contact}
                                </a>
                            )}
                            {hospital.email && (
                                <a href={`mailto:${hospital.email}`} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa',
                                    padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem',
                                    textDecoration: 'none', border: '1px solid rgba(59, 130, 246, 0.3)',
                                    transition: 'all 0.2s ease', cursor: 'pointer'
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'; }}
                                >
                                    <Mail size={13} /> {hospital.email}
                                </a>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '1rem' }}>
                            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ICU</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fca5a5' }}>
                                    {hospital.beds.icu}
                                </div>
                            </div>

                            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Oxygen</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#93c5fd' }}>
                                    {hospital.beds.oxygen}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>General</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#a78bfa' }}>
                                    {hospital.beds.general || 0}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pediatric</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fcd34d' }}>
                                    {hospital.beds.pediatric || 0}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Maternity</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f472b6' }}>
                                    {hospital.beds.maternity || 0}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Isolation</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#34d399' }}>
                                    {hospital.beds.isolation || 0}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Available</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: hospital.beds.occupied < hospital.beds.total ? '#86efac' : '#fca5a5' }}>
                                    {hospital.beds.total - hospital.beds.occupied}
                                </div>
                            </div>
                        </div>

                        <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px', color: '#FDA4AF' }}>Blood Availability:</div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {Object.entries(hospital.blood).map(([type, count]) => (
                                    count > 0 && (
                                        <span key={type} style={{
                                            backgroundColor: 'rgba(220, 38, 38, 0.2)',
                                            color: '#fca5a5',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            border: '1px solid rgba(220, 38, 38, 0.4)'
                                        }}>
                                            {type}
                                        </span>
                                    )
                                ))}
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-primary"
                                style={{ width: '100%', justifyContent: 'center', fontSize: '0.9rem', padding: '8px' }}
                            >
                                Get Directions
                            </a>
                        </div>
                    </div>
                ))
                }
            </div >
        </div >
    );
};

export default UserDashboard;
