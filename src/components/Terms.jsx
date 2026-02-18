import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Terms = () => {
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="container" style={{ padding: '4rem 2rem', color: 'var(--text-primary)', maxWidth: '800px' }}>
            <button
                onClick={() => navigate(-1)}
                className="btn btn-outline"
                style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
                <ArrowLeft size={20} /> Back
            </button>

            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Terms and Conditions</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>Last Updated: February 2026</p>

            <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>1. Disclaimer of Medical Liability</h2>
                <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                    CareBridge is an information aggregation platform designed to assist in locating hospital resources.
                    <strong> We do not provide medical advice, diagnosis, or treatment.</strong>
                    In a life-threatening emergency, always call your local emergency services (108/112) immediately.
                    Do not rely solely on this application for critical medical decisions.
                </p>
            </section>

            <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>2. Data Accuracy</h2>
                <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                    While we strive for real-time accuracy, hospital resource availability (beds, oxygen, blood) is subject to rapid change.
                    The data displayed is provided directly by registered hospitals. CareBridge cannot guarantee the absolute real-time precision of this data due to potential syncing delays or manual entry errors by hospital staff.
                </p>
            </section>

            <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>3. User Location Services</h2>
                <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                    To provide relevant hospital recommendations and ambulance dispatch services, CareBridge requires access to your device's location.
                    This location data is processed in real-time to calculate distances and is not stored permanently on our servers without your explicit consent for account functionality.
                </p>
            </section>

            <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>4. Hospital Registrations</h2>
                <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                    Hospitals registering on CareBridge must provide verified licenses and certificates. We reserve the right to suspend or remove any hospital account found to be providing false information or manipulating data.
                </p>
            </section>

            <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>5. Intellectual Property</h2>
                <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                    The CareBridge platform, including its source code, design, logos, and algorithms, is the intellectual property of the development team. Unauthorized reproduction or redistribution is prohibited.
                </p>
            </section>
        </div>
    );
};

export default Terms;
