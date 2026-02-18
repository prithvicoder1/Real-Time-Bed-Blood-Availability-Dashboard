import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ serverStatus }) => {
    return (
        <nav style={{
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            boxShadow: 'var(--glass-shadow)',
            padding: '16px 0',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link to="/" style={{ fontSize: '2.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none' }}>
                    <img src="/carebridge-logo.png" alt="CareBridge Logo" style={{
                        width: '50px',
                        height: '50px',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))'
                    }} />
                    <span style={{
                        background: 'linear-gradient(to right, #fff, #94a3b8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        CareBridge
                    </span>
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <Link
                        to="/login"
                        style={{
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            color: '#60a5fa',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                            e.currentTarget.style.color = '#93c5fd';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                            e.currentTarget.style.color = '#60a5fa';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        Patient Portal
                    </Link>
                    <Link
                        to="/hospital-auth"
                        style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            color: '#34d399',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                            e.currentTarget.style.color = '#6ee7b7';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                            e.currentTarget.style.color = '#34d399';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        Hospital Portal
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: serverStatus === 'Online' ? '#4ade80' : '#ef4444',
                            display: 'inline-block',
                            boxShadow: serverStatus === 'Online' ? '0 0 10px #4ade80' : 'none'
                        }}></span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            System: {serverStatus}
                        </span>
                    </div>

                </div>
            </div>
        </nav>
    );
};

export default Navbar;
