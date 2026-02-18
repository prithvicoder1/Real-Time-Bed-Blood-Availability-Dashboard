
import React from 'react';
import { Link } from 'react-router-dom';
import Features from './Features';
import ParticlesBackground from './ParticlesBackground';

const Hero = () => {
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <ParticlesBackground />
      <header style={{
        textAlign: 'center',
        padding: '8rem 2rem',
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 1) 100%)',
        position: 'relative',
        zIndex: 1
      }}>
        <div data-aos="fade-up">
          <span style={{
            color: '#38bdf8',
            fontWeight: '600',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontSize: '0.9rem',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '8px 16px',
            borderRadius: '20px',
            background: 'rgba(56, 189, 248, 0.1)'
          }}>
            Emergency Response System
          </span>
          <h1 style={{
            fontSize: '4.5rem',
            margin: '2rem 0 1rem',
            fontWeight: '800',
            lineHeight: '1.2',
            background: 'linear-gradient(to right, #ffffff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Every Second Counts.<br />
            <span style={{ color: '#3b82f6' }}>CareBridge</span> Connects.
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: '#94a3b8',
            maxWidth: '600px',
            margin: '0 auto 3rem',
            lineHeight: '1.8'
          }}>
            Real-time hospital bed tracking, AI-powered occupancy prediction,
            and instant ambulance booking.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/dashboard/user" className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '1.1rem' }}>
              Find Beds Now
            </Link>

          </div>
        </div>
      </header>
      <Features />
    </div>
  );
};

export default Hero;

