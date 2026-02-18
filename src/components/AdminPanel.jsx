import React from 'react';
import { Activity, Users, DollarSign, TrendingUp } from 'lucide-react';

const AdminPanel = () => {
    const stats = {
        totalPatients: 1245,
        occupiedBeds: 85,
        revenue: 450000,
        efficiency: 94
    };

    return (
        <div className="container" style={{ padding: '2rem 0' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', background: 'linear-gradient(to right, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Admin Control Center
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {[
                    { title: 'Total Patients', value: stats.totalPatients, icon: <Users size={24} color="#60a5fa" />, change: '+12%' },
                    { title: 'Bed Occupancy', value: `${stats.occupiedBeds}%`, icon: <Activity size={24} color="#fca5a5" />, change: '+5%' },
                    { title: 'Daily Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: <DollarSign size={24} color="#bef264" />, change: '+8%' },
                    { title: 'ML Accuracy', value: `${stats.efficiency}%`, icon: <TrendingUp size={24} color="#c084fc" />, change: '+2%' }
                ].map((stat, idx) => (
                    <div key={idx} className="card" data-aos="fade-up" data-aos-delay={idx * 100}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{stat.title}</span>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '12px' }}>
                                {stat.icon}
                            </div>
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stat.value}</div>
                        <div style={{ color: '#4ade80', fontSize: '0.9rem', marginTop: '0.5rem' }}>{stat.change} from yesterday</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div className="card" data-aos="fade-up">
                    <h3 style={{ marginBottom: '1.5rem' }}>Recent Admissions</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '10px' }}>Patient ID</th>
                                <th style={{ padding: '10px' }}>Name</th>
                                <th style={{ padding: '10px' }}>Ward</th>
                                <th style={{ padding: '10px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                                { id: '#P-101', name: 'Rahul Sharma', ward: 'ICU-4', status: 'Critical' },
                                { id: '#P-102', name: 'Priya Verma', ward: 'Gen-12', status: 'Stable' },
                                { id: '#P-103', name: 'Amit Singh', ward: 'Emergency', status: 'Admitting' }
                            ].map((row, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '12px 10px' }}>{row.id}</td>
                                    <td style={{ padding: '12px 10px' }}>{row.name}</td>
                                    <td style={{ padding: '12px 10px' }}>{row.ward}</td>
                                    <td style={{ padding: '12px 10px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            background: row.status === 'Critical' ? 'rgba(239,68,68,0.2)' : 'rgba(74,222,128,0.2)',
                                            color: row.status === 'Critical' ? '#ef4444' : '#4ade80',
                                            fontSize: '0.85rem'
                                        }}>
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="card" data-aos="fade-left">
                    <h3 style={{ marginBottom: '1.5rem' }}>System Alerts</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            { msg: 'Oxygen supply below 15%', type: 'critical' },
                            { msg: 'New ambulance request: Sector 4', type: 'warning' },
                            { msg: 'Staff shift change in 30 mins', type: 'info' }
                        ].map((alert, i) => (
                            <div key={i} style={{
                                padding: '1rem',
                                borderRadius: '12px',
                                background: alert.type === 'critical' ? 'rgba(239,68,68,0.1)' : 'rgba(56,189,248,0.1)',
                                borderLeft: `4px solid ${alert.type === 'critical' ? '#ef4444' : '#38bdf8'}`
                            }}>
                                {alert.msg}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
