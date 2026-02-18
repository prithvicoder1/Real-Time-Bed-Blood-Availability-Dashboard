
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import Loading from './components/Loading';
import './index.css';

const LandingPage = lazy(() => import('./components/LandingPage'));
const Login = lazy(() => import('./components/Login'));
const Register = lazy(() => import('./components/Register'));
const UserDashboard = lazy(() => import('./components/UserDashboard'));
const HospitalDashboard = lazy(() => import('./components/HospitalDashboard'));
const HospitalAuth = lazy(() => import('./components/HospitalAuth'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const Terms = lazy(() => import('./components/Terms'));

function App() {
  const [serverStatus, setServerStatus] = useState('Checking...');

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-out-cubic'
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    fetch(`${API_URL}/api/health`)
      .then(res => res.json())
      .then(() => setServerStatus('Online'))
      .catch(() => setServerStatus('Offline'));
  }, []);

  return (
    <Router>
      <div className="app">
        <Navbar serverStatus={serverStatus} />
        <main style={{ minHeight: '80vh', paddingTop: '20px' }}>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard/user" element={<UserDashboard />} />
              <Route path="/hospital-auth" element={<HospitalAuth />} />
              <Route path="/dashboard/hospital" element={<HospitalDashboard />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/terms" element={<Terms />} />
            </Routes>
          </Suspense>
        </main>
        <Chatbot />
        <footer style={{
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 1) 100%)',
          color: '#94a3b8',
          padding: '3rem 0 2rem',
          marginTop: 'auto',
          borderTop: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
            <h2 style={{
              fontSize: '2rem',
              color: '#f8fafc',
              marginBottom: '0.75rem',
              fontWeight: '700',
              letterSpacing: '-0.02em'
            }}>CareBridge</h2>
            <p style={{
              marginBottom: '2rem',
              fontSize: '1.05rem',
              color: '#cbd5e1',
              fontWeight: '400',
              letterSpacing: '0.01em'
            }}>Saving Lives with Real-Time Data & AI.</p>
            <p style={{
              fontSize: '0.9rem',
              color: '#94a3b8'
            }}>© 2026 CareBridge. <a href="/terms" style={{ color: '#60a5fa', textDecoration: 'none', borderBottom: '1px solid transparent', transition: 'border-color 0.2s' }} onMouseEnter={(e) => e.target.style.borderBottomColor = '#60a5fa'} onMouseLeave={(e) => e.target.style.borderBottomColor = 'transparent'}>Terms & Conditions</a></p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;

