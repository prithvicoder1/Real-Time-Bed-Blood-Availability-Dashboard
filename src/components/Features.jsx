import React from 'react';
import { Activity, Droplet, Ambulance, Zap, Shield, Smartphone } from 'lucide-react';

const features = [
    {
        title: 'Real-Time Bed Tracking',
        description: 'Live updates on ICU, General, and Oxygen bed availability from verified hospitals.',
        icon: <Activity size={40} color="#38bdf8" />
    },
    {
        title: 'Blood Bank Inventory',
        description: 'Instant access to blood group availability across all connected blood banks.',
        icon: <Droplet size={40} color="#ef4444" />
    },
    {
        title: 'Emergency Ambulance',
        description: 'Direct WhatsApp connection with emergency services for instant dispatch.',
        icon: <Ambulance size={40} color="#f59e0b" />
    },
    {
        title: 'AI Predictions',
        description: 'ML algorithms forecast bed shortages 12 hours in advance.',
        icon: <Zap size={40} color="#eab308" />
    },
    {
        title: 'Verified Data',
        description: 'Direct integration with hospital management systems ensures 100% accuracy.',
        icon: <Shield size={40} color="#10b981" />
    },
    {
        title: 'Mobile Accessible',
        description: 'Works perfectly on smartphones even with low internet connectivity.',
        icon: <Smartphone size={40} color="#8b5cf6" />
    }
];

const Features = () => {
    return (
        <section id="features" style={{ padding: '80px 0', background: 'var(--background-card)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h2 data-aos="fade-up" style={{
                        fontSize: '2.5rem',
                        marginBottom: '16px',
                        color: 'var(--text-primary)'
                    }}>
                        Why Choose <span style={{ color: 'var(--primary-color)' }}>CareBridge?</span>
                    </h2>
                    <p data-aos="fade-up" data-aos-delay="100" style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                        The most advanced emergency response platform.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '32px'
                }}>
                    {features.map((feature, index) => (
                        <div key={index} className="card" data-aos="fade-up" data-aos-delay={index * 100} style={{
                            transition: 'transform 0.3s ease'
                        }}>
                            <div style={{ marginBottom: '24px', background: 'rgba(255,255,255,0.03)', width: 'fit-content', padding: '16px', borderRadius: '16px' }}>{feature.icon}</div>
                            <h3 style={{
                                fontSize: '1.25rem',
                                marginBottom: '12px',
                                color: 'var(--text-primary)'
                            }}>
                                {feature.title}
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
