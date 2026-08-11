import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (role: string) => {
    setEmail(`${role}@fundsroom.com`);
    setPassword('Admin@123');
  };

  return (
    <div className="login-page">
      {/* Left branding panel */}
      <div className="login-left">
        <div className="login-left-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div className="login-logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Fundsroom ERP</span>
          </div>
          <h2>Manage your business operations in one place</h2>
          <p>A complete ERP + CRM portal for wholesale and distribution — customers, inventory, and sales challans.</p>
          <div className="login-left-pills">
            <span className="login-pill">Customer CRM</span>
            <span className="login-pill">Inventory</span>
            <span className="login-pill">Sales Challans</span>
            <span className="login-pill">Role-based Access</span>
            <span className="login-pill">PDF Invoices</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-logo">
            <div className="login-title">Welcome back</div>
            <div className="login-subtitle">Sign in to your Fundsroom account</div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@fundsroom.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 24 }}>
            <p style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 10, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Quick Login
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
              {['admin', 'sales', 'warehouse', 'accounts'].map(role => (
                <button
                  key={role}
                  onClick={() => quickLogin(role)}
                  style={{
                    padding: '7px', background: 'var(--surface-2)',
                    border: '1px solid var(--border)', borderRadius: 7,
                    color: 'var(--text-2)', fontSize: 12, cursor: 'pointer',
                    fontWeight: 500, transition: 'all 0.15s', textTransform: 'capitalize',
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--indigo)'; e.currentTarget.style.color = 'var(--indigo)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
