import React from 'react';
import { Activity } from 'lucide-react';

const Hero = () => {
    return (
        <section style={{
            padding: '80px 0',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
        }} className="hero">
            <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                <div data-aos="fade-down" style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(14, 165, 233, 0.1)', padding: '8px 16px', borderRadius: '30px', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                    <Activity size={18} color="#38bdf8" />
                    <span style={{ color: '#38bdf8', fontWeight: '600', fontSize: '0.9rem' }}>Live Jaipur Hospital Data</span>
                </div>
                <h1 data-aos="fade-up" data-aos-delay="100" style={{
                    fontSize: '4rem',
                    fontWeight: '800',
                    marginBottom: '24px',
                    lineHeight: '1.1'
                }}>
                    Every Second Counts.<br />
                    <span style={{ color: 'var(--primary-light)' }}>CareBridge Connects.</span>
                </h1>
                <p data-aos="fade-up" data-aos-delay="200" style={{
                    fontSize: '1.25rem',
                    color: 'var(--text-secondary)',
                    maxWidth: '700px',
                    margin: '0 auto 40px',
                    lineHeight: '1.6'
                }}>
                    Real-time hospital bed tracking, AI-powered predictions, and instant ambulance booking. The winning edge for smart healthcare.
                </p>
                <div data-aos="fade-up" data-aos-delay="300" style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <a href="/dashboard/user" className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '1.1rem' }}>
                        Find Beds Now
                    </a>
                    <a href="#features" className="btn btn-outline" style={{ padding: '16px 40px', fontSize: '1.1rem' }}>
                        Learn More
                    </a>
                </div>
            </div>

            {/* Background Decor */}
            <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', background: 'var(--primary-color)', opacity: '0.1', filter: 'blur(100px)', borderRadius: '50%' }}></div>
            <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '300px', height: '300px', background: 'var(--secondary-color)', opacity: '0.1', filter: 'blur(80px)', borderRadius: '50%' }}></div>
        </section>
    );
};

export default Hero;
