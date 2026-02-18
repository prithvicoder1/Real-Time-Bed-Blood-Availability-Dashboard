import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, MapPin, Phone, User, Key } from 'lucide-react';

const HospitalAuth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });

    const [registerData, setRegisterData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        city: '',
        state: '',
        location: '',
        contact: '',
        type: 'Private',
        lat: '',
        lng: ''
    });

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('hospital_token', data.token);
                localStorage.setItem('hospital_data', JSON.stringify(data.hospital));
                navigate('/dashboard/hospital');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (registerData.password !== registerData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (registerData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: registerData.name,
                    email: registerData.email,
                    password: registerData.password,
                    city: registerData.city,
                    state: registerData.state,
                    location: registerData.location,
                    contact: registerData.contact,
                    type: registerData.type,
                    lat: parseFloat(registerData.lat) || 0,
                    lng: parseFloat(registerData.lng) || 0
                })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('hospital_token', data.token);
                localStorage.setItem('hospital_data', JSON.stringify(data.hospital));
                navigate('/dashboard/hospital');
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Forgot Password Logic
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [forgotStep, setForgotStep] = useState(1);
    const [forgotData, setForgotData] = useState({
        emailOrPhone: '',
        otp: '',
        newPassword: ''
    });

    const handleForgotRequest = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailOrPhone: forgotData.emailOrPhone })
            });
            const data = await res.json();
            if (res.ok) {
                setForgotStep(2);
                alert(data.message); // Simple feedback for demo
            } else {
                setError(data.message);
            }
        } catch {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(forgotData)
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                setIsForgotPassword(false);
                setIsLogin(true);
                setForgotStep(1);
                setForgotData({ emailOrPhone: '', otp: '', newPassword: '' });
            } else {
                setError(data.message);
            }
        } catch {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        }}>
            <div className="card" style={{
                maxWidth: '500px',
                width: '100%',
                padding: '40px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <Building2 size={48} color="#3b82f6" style={{ marginBottom: '15px' }} />
                    <h2 style={{ margin: 0, marginBottom: '10px' }}>Hospital Portal</h2>
                    <p style={{ color: '#94a3b8', margin: 0 }}>
                        {isForgotPassword ? 'Reset your password' : (isLogin ? 'Login to manage your hospital data' : 'Register your hospital with CareBridge')}
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                {isLogin ? (
                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0' }}>
                                <Mail size={16} style={{ display: 'inline', marginRight: '8px' }} />
                                Email
                            </label>
                            <input
                                type="email"
                                required
                                value={loginData.email}
                                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    fontSize: '1rem'
                                }}
                                placeholder="hospital@example.com"
                            />
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0' }}>
                                <Lock size={16} style={{ display: 'inline', marginRight: '8px' }} />
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={loginData.password}
                                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    fontSize: '1rem'
                                }}
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{
                                width: '100%',
                                padding: '14px',
                                fontSize: '1rem',
                                marginBottom: '15px'
                            }}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>

                        <div style={{ textAlign: 'right', marginBottom: '15px' }}>
                            <span
                                onClick={() => setIsForgotPassword(true)}
                                style={{ color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}
                            >
                                Forgot Password?
                            </span>
                        </div>

                        <p style={{ textAlign: 'center', color: '#94a3b8', margin: 0 }}>
                            Don't have an account?{' '}
                            <span
                                onClick={() => setIsLogin(false)}
                                style={{ color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Register here
                            </span>
                        </p>
                    </form>

                ) : isForgotPassword ? (
                    <div style={{ animation: 'fadeIn 0.5s' }}>
                        <h3 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
                            {forgotStep === 1 ? 'Reset Password' : 'Verify & Set Password'}
                        </h3>
                        {forgotStep === 1 ? (
                            <form onSubmit={handleForgotRequest}>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0' }}>
                                        <Mail size={16} style={{ display: 'inline', marginRight: '8px' }} />
                                        Email or Phone
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={forgotData.emailOrPhone}
                                        onChange={(e) => setForgotData({ ...forgotData, emailOrPhone: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'white',
                                            fontSize: '1rem'
                                        }}
                                        placeholder="Enter registered email or phone"
                                    />
                                </div>
                                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1rem' }}>
                                    {loading ? 'Sending OTP...' : 'Send OTP'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0' }}>
                                        <Key size={16} style={{ display: 'inline', marginRight: '8px' }} />
                                        Enter OTP
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={forgotData.otp}
                                        onChange={(e) => setForgotData({ ...forgotData, otp: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'white',
                                            letterSpacing: '5px',
                                            textAlign: 'center',
                                            fontSize: '1.2rem'
                                        }}
                                        placeholder="------"
                                        maxLength="6"
                                    />
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0' }}>
                                        <Lock size={16} style={{ display: 'inline', marginRight: '8px' }} />
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={forgotData.newPassword}
                                        onChange={(e) => setForgotData({ ...forgotData, newPassword: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'white',
                                            fontSize: '1rem'
                                        }}
                                        placeholder="New Password"
                                    />
                                </div>
                                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1rem' }}>
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </form>
                        )}
                        <p style={{ textAlign: 'center', marginTop: '20px', color: '#94a3b8' }}>
                            <span
                                onClick={() => { setIsForgotPassword(false); setIsLogin(true); }}
                                style={{ color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Back to Login
                            </span>
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleRegister} style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', color: '#e2e8f0', fontSize: '0.9rem' }}>
                                <Building2 size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                Hospital Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={registerData.name}
                                onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    fontSize: '0.9rem'
                                }}
                                placeholder="City General Hospital"
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', color: '#e2e8f0', fontSize: '0.9rem' }}>
                                <Mail size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                Email *
                            </label>
                            <input
                                type="email"
                                required
                                value={registerData.email}
                                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    fontSize: '0.9rem'
                                }}
                                placeholder="contact@hospital.com"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', color: '#e2e8f0', fontSize: '0.9rem' }}>
                                    <Lock size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={registerData.password}
                                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        fontSize: '0.9rem'
                                    }}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', color: '#e2e8f0', fontSize: '0.9rem' }}>
                                    <Lock size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                    Confirm *
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={registerData.confirmPassword}
                                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        fontSize: '0.9rem'
                                    }}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', color: '#e2e8f0', fontSize: '0.9rem' }}>
                                    <MapPin size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                    City *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={registerData.city}
                                    onChange={(e) => setRegisterData({ ...registerData, city: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        fontSize: '0.9rem'
                                    }}
                                    placeholder="Mumbai"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', color: '#e2e8f0', fontSize: '0.9rem' }}>
                                    <MapPin size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                    State *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={registerData.state}
                                    onChange={(e) => setRegisterData({ ...registerData, state: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        fontSize: '0.9rem'
                                    }}
                                    placeholder="Maharashtra"
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', color: '#e2e8f0', fontSize: '0.9rem' }}>
                                <MapPin size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                Full Address
                            </label>
                            <input
                                type="text"
                                value={registerData.location}
                                onChange={(e) => setRegisterData({ ...registerData, location: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    fontSize: '0.9rem'
                                }}
                                placeholder="123 Main Street, Area Name"
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', color: '#e2e8f0', fontSize: '0.9rem' }}>
                                <Phone size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                Contact Number
                            </label>
                            <input
                                type="tel"
                                value={registerData.contact}
                                onChange={(e) => setRegisterData({ ...registerData, contact: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    fontSize: '0.9rem'
                                }}
                                placeholder="+91 1234567890"
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', color: '#e2e8f0', fontSize: '0.9rem' }}>
                                <User size={14} style={{ display: 'inline', marginRight: '6px' }} />
                                Hospital Type
                            </label>
                            <select
                                value={registerData.type}
                                onChange={(e) => setRegisterData({ ...registerData, type: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <option value="Private">Private</option>
                                <option value="Government">Government</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', color: '#e2e8f0', fontSize: '0.9rem' }}>
                                    Latitude (optional)
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={registerData.lat}
                                    onChange={(e) => setRegisterData({ ...registerData, lat: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        fontSize: '0.9rem'
                                    }}
                                    placeholder="19.0760"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', color: '#e2e8f0', fontSize: '0.9rem' }}>
                                    Longitude (optional)
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={registerData.lng}
                                    onChange={(e) => setRegisterData({ ...registerData, lng: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        fontSize: '0.9rem'
                                    }}
                                    placeholder="72.8777"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{
                                width: '100%',
                                padding: '12px',
                                fontSize: '0.95rem',
                                marginBottom: '15px'
                            }}
                        >
                            {loading ? 'Registering...' : 'Register Hospital'}
                        </button>

                        <p style={{ textAlign: 'center', color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
                            Already registered?{' '}
                            <span
                                onClick={() => setIsLogin(true)}
                                style={{ color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Login here
                            </span>
                        </p>
                    </form>
                )}
            </div>
        </div >
    );
};

export default HospitalAuth;
