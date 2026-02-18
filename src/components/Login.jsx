import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, User } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [userType, setUserType] = useState('patient'); // 'patient' or 'hospital'
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Store token and user data based on type
                if (userType === 'hospital') {
                    localStorage.setItem('hospital_token', data.token);
                    localStorage.setItem('hospital_data', JSON.stringify(data.hospital));
                    navigate('/dashboard/hospital');
                } else {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user || data.hospital));
                    navigate('/dashboard/user');
                }
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ padding: 'var(--spacing-xxl) 0', maxWidth: '450px' }}>
            <div style={{
                backgroundColor: 'var(--surface-color)',
                padding: 'var(--spacing-xl)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)'
            }}>
                <h2 style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)', color: 'var(--primary-color)' }}>Welcome Back</h2>

                {/* User Type Toggle */}
                <div style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: 'var(--spacing-lg)',
                    padding: '4px',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    borderRadius: 'var(--radius-md)'
                }}>
                    <button
                        type="button"
                        onClick={() => setUserType('patient')}
                        style={{
                            flex: 1,
                            padding: 'var(--spacing-sm)',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            backgroundColor: userType === 'patient' ? 'var(--primary-color)' : 'transparent',
                            color: userType === 'patient' ? 'white' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '0.95rem',
                            fontWeight: '500',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <User size={18} />
                        Patient
                    </button>
                    <button
                        type="button"
                        onClick={() => setUserType('hospital')}
                        style={{
                            flex: 1,
                            padding: 'var(--spacing-sm)',
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            backgroundColor: userType === 'hospital' ? 'var(--primary-color)' : 'transparent',
                            color: userType === 'hospital' ? 'white' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontSize: '0.95rem',
                            fontWeight: '500',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <Building2 size={18} />
                        Hospital
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: 'var(--spacing-sm)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid #ccc',
                                fontSize: '1rem'
                            }}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: 'var(--spacing-sm)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid #ccc',
                                fontSize: '1rem'
                            }}
                            required
                        />
                    </div>
                    {error && (
                        <div style={{
                            marginBottom: 'var(--spacing-md)',
                            padding: 'var(--spacing-sm)',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: 'var(--radius-sm)',
                            color: '#ef4444',
                            fontSize: '0.9rem'
                        }}>
                            {error}
                        </div>
                    )}
                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: 'var(--spacing-md)', fontSize: '0.9rem' }}>
                    Don't have an account? <Link to={userType === 'hospital' ? '/hospital-auth' : '/register'} style={{ color: 'var(--primary-color)' }}>Register here</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
