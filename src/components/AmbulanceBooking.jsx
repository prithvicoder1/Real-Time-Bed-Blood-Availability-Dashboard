import React, { useState } from 'react';
import { Ambulance, MapPin, Phone } from 'lucide-react';

const AmbulanceBooking = () => {
    const [formData, setFormData] = useState({
        pincode: '',
        type: 'ICU Ambulance (Ventilator)'
    });
    const [isBooking, setIsBooking] = useState(false);

    // Detect if user is on mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.pincode || formData.pincode.length !== 6) {
            alert('Please enter a valid 6-digit PIN code');
            return;
        }

        setIsBooking(true);

        // Determine which emergency number to call based on ambulance type
        const emergencyNumber = formData.type.includes('ICU') || formData.type.includes('Oxygen') ? '108' : '102';

        // Show detailed emergency information
        const emergencyInfo = `🚨 EMERGENCY AMBULANCE REQUEST\n\n` +
            `📍 PIN Code: ${formData.pincode}\n` +
            `🚑 Ambulance Type: ${formData.type}\n` +
            `📞 Emergency Number: ${emergencyNumber}\n\n` +
            (isMobile
                ? `You will now be connected to ${emergencyNumber}.\n\nClick OK to initiate the call.`
                : `IMPORTANT: Please call ${emergencyNumber} immediately!\n\nOn desktop, you need to manually dial:\n${emergencyNumber}\n\nProvide your PIN code: ${formData.pincode}`
            );

        if (confirm(emergencyInfo)) {
            if (isMobile) {
                // On mobile: Initiate direct phone call
                window.location.href = `tel:${emergencyNumber}`;

                // Also open WhatsApp as backup after a delay
                setTimeout(() => {
                    const text = `🚨 *Emergency Ambulance Request*%0A%0A*PIN Code:* ${formData.pincode}%0A*Type:* ${formData.type}%0A%0APlease dispatch immediately to PIN code area.`;
                    window.open(`https://wa.me/91${emergencyNumber}?text=${text}`, '_blank');
                }, 2000);

                setTimeout(() => {
                    alert(`✅ Call initiated to ${emergencyNumber}!\n\nStay on the line and clearly state:\n1. Your PIN code: ${formData.pincode}\n2. Ambulance type needed: ${formData.type}\n3. Your exact location/landmark`);
                    setIsBooking(false);
                    setFormData({
                        pincode: '',
                        type: 'ICU Ambulance (Ventilator)'
                    });
                }, 3000);
            } else {
                // On desktop: Show emergency number prominently and open WhatsApp
                const callNowPrompt = `📞 CALL NOW: ${emergencyNumber}\n\n` +
                    `Please dial ${emergencyNumber} on your phone immediately!\n\n` +
                    `Tell them:\n` +
                    `• PIN Code: ${formData.pincode}\n` +
                    `• Need: ${formData.type}\n\n` +
                    `Opening WhatsApp for additional support...`;

                alert(callNowPrompt);

                // Open WhatsApp with pre-filled message
                const text = `🚨 *Emergency Ambulance Request*%0A%0A*PIN Code:* ${formData.pincode}%0A*Type:* ${formData.type}%0A%0APlease dispatch immediately to PIN code area.`;
                window.open(`https://wa.me/91${emergencyNumber}?text=${text}`, '_blank');

                // Keep the emergency number visible
                setTimeout(() => {
                    const reminder = `⚠️ REMINDER\n\nDid you call ${emergencyNumber}?\n\nYour PIN code: ${formData.pincode}\nAmbulance type: ${formData.type}\n\nCall ${emergencyNumber} NOW if you haven't already!`;
                    if (confirm(reminder)) {
                        // User confirmed they called
                        setIsBooking(false);
                        setFormData({
                            pincode: '',
                            type: 'ICU Ambulance (Ventilator)'
                        });
                    } else {
                        setIsBooking(false);
                    }
                }, 5000);
            }
        } else {
            setIsBooking(false);
        }
    };

    return (
        <div className="card" data-aos="fade-up" style={{ background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(185, 28, 28, 0.2))', border: '1px solid rgba(220, 38, 38, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: '#ef4444', padding: '12px', borderRadius: '12px' }}>
                    <Ambulance size={32} color="white" />
                </div>
                <div>
                    <h3 style={{ margin: 0, color: '#fca5a5' }}>Emergency Ambulance</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#fecaca' }}>
                        {isMobile ? 'Instant call to emergency services' : 'Get emergency contact details'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fecaca' }}>Pickup Location</label>
                    <div style={{ position: 'relative' }}>
                        <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: '#fca5a5' }} />
                        <input
                            type="text"
                            placeholder="Enter 6-digit PIN code"
                            value={formData.pincode}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setFormData({ ...formData, pincode: value });
                            }}
                            style={{ paddingLeft: '40px', background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                            required
                            maxLength="6"
                            pattern="[0-9]{6}"
                        />
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#fecaca', marginTop: '0.25rem', marginLeft: '40px' }}>
                        Enter your area PIN code for fastest response
                    </p>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fecaca' }}>Ambulance Type</label>
                    <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    >
                        <option value="ICU Ambulance (Ventilator)">ICU Ambulance (Ventilator)</option>
                        <option value="Basic Life Support">Basic Life Support</option>
                        <option value="Oxygen Ambulance">Oxygen Ambulance</option>
                    </select>
                </div>

                <div style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    fontSize: '0.85rem',
                    color: '#fecaca'
                }}>
                    <strong style={{ color: '#fca5a5' }}>📞 Emergency Numbers:</strong><br />
                    • <strong style={{ fontSize: '1.1rem', color: '#fca5a5' }}>108</strong> - Medical Emergency (ICU/Oxygen)<br />
                    • <strong style={{ fontSize: '1.1rem', color: '#fca5a5' }}>102</strong> - Basic Life Support<br />
                    <br />
                    <span style={{ fontSize: '0.75rem', color: '#fed7aa' }}>
                        {isMobile ? '✓ Mobile detected - Direct calling enabled' : '⚠️ Desktop - Manual dialing required'}
                    </span>
                </div>

                <button
                    type="submit"
                    disabled={isBooking}
                    className="btn"
                    style={{
                        background: isBooking ? '#7f1d1d' : '#dc2626',
                        color: 'white',
                        justifyContent: 'center',
                        boxShadow: '0 4px 14px -4px #dc2626',
                        cursor: isBooking ? 'not-allowed' : 'pointer',
                        opacity: isBooking ? 0.7 : 1,
                        fontSize: '1rem',
                        fontWeight: 'bold'
                    }}
                >
                    <Phone size={18} /> {isBooking ? 'Connecting...' : (isMobile ? 'Call Emergency Now' : 'Get Emergency Contact')}
                </button>
            </form>
        </div>
    );
};

export default AmbulanceBooking;
