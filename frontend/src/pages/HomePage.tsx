import React from 'react';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    title: 'Customer CRM',
    desc: 'Track leads, active clients, follow-ups, and full contact history in one place.',
    color: '#4f46e5',
    bg: '#eef2ff',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    title: 'Inventory Management',
    desc: 'Real-time stock tracking with IN/OUT movements, low-stock alerts, and audit logs.',
    color: '#10b981',
    bg: '#ecfdf5',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    title: 'Sales Challans',
    desc: 'Create, confirm, and export challans as PDF invoices with automatic stock deduction.',
    color: '#f59e0b',
    bg: '#fffbeb',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    title: 'Role-Based Access',
    desc: 'Admin, Sales, Warehouse, and Accounts — each role sees only what they need.',
    color: '#8b5cf6',
    bg: '#f5f3ff',
  },
];

const roles = [
  { role: 'Admin', desc: 'Full access to all modules', color: '#ef4444', bg: '#fef2f2' },
  { role: 'Sales', desc: 'Customers & Challans', color: '#4f46e5', bg: '#eef2ff' },
  { role: 'Warehouse', desc: 'Products & Stock', color: '#10b981', bg: '#ecfdf5' },
  { role: 'Accounts', desc: 'View-only access', color: '#f59e0b', bg: '#fffbeb' },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Navbar */}
      <nav className="home-nav">
        <div className="home-nav-inner">
          <div className="home-nav-logo">
            <div className="home-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <span>Fundsroom ERP</span>
          </div>
          <button className="home-nav-btn" onClick={() => navigate('/login')}>
            Sign In →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-badge">Mini ERP + CRM Operations Portal</div>
          <h1 className="home-hero-title">
            Run your wholesale business<br />
            <span className="home-hero-accent">smarter, not harder</span>
          </h1>
          <p className="home-hero-sub">
            A complete operations portal built for wholesale and distribution companies.
            Manage customers, inventory, and sales challans — all in one place.
          </p>
          <div className="home-hero-actions">
            <button className="home-btn-primary" onClick={() => navigate('/login')}>
              Get Started — Sign In
            </button>
            <button className="home-btn-ghost" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              See Features ↓
            </button>
          </div>
        </div>

        {/* Hero visual */}
        <div className="home-hero-visual">
          <div className="home-hero-card">
            <div className="home-hero-card-header">
              <div className="home-hero-card-dot" style={{ background: '#ef4444' }} />
              <div className="home-hero-card-dot" style={{ background: '#f59e0b' }} />
              <div className="home-hero-card-dot" style={{ background: '#10b981' }} />
              <span style={{ marginLeft: 8, fontSize: 12, color: '#94a3b8' }}>Fundsroom ERP Dashboard</span>
            </div>
            <div className="home-hero-stats">
              {[
                { label: 'Customers', value: '248', color: '#4f46e5' },
                { label: 'Products', value: '94', color: '#10b981' },
                { label: 'Challans', value: '1,302', color: '#f59e0b' },
                { label: 'Low Stock', value: '3', color: '#ef4444' },
              ].map(s => (
                <div key={s.label} className="home-hero-stat" style={{ borderLeftColor: s.color }}>
                  <div className="home-hero-stat-val" style={{ color: s.color }}>{s.value}</div>
                  <div className="home-hero-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="home-hero-rows">
              {['CH-2025-00041 · Confirmed · ₹12,400', 'CH-2025-00040 · Draft · ₹8,750', 'CH-2025-00039 · Confirmed · ₹31,200'].map(r => (
                <div key={r} className="home-hero-row">{r}</div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="home-features" id="features">
        <div className="home-section-inner">
          <div className="home-section-label">Features</div>
          <h2 className="home-section-title">Everything your team needs</h2>
          <p className="home-section-sub">Built for wholesale and distribution — no bloat, just the tools that matter.</p>
          <div className="home-features-grid">
            {features.map(f => (
              <div key={f.title} className="home-feature-card">
                <div className="home-feature-icon" style={{ background: f.bg, color: f.color }}>{f.icon}</div>
                <div className="home-feature-title">{f.title}</div>
                <div className="home-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="home-roles">
        <div className="home-section-inner">
          <div className="home-section-label">Access Control</div>
          <h2 className="home-section-title">One portal, four roles</h2>
          <p className="home-section-sub">Every team member gets exactly the access they need — nothing more, nothing less.</p>
          <div className="home-roles-grid">
            {roles.map(r => (
              <div key={r.role} className="home-role-card" style={{ borderTopColor: r.color }}>
                <div className="home-role-badge" style={{ background: r.bg, color: r.color }}>{r.role}</div>
                <div className="home-role-desc">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="home-cta">
        <div className="home-section-inner" style={{ textAlign: 'center' }}>
          <h2 className="home-cta-title">Ready to get started?</h2>
          <p className="home-cta-sub">Sign in with your credentials to access the portal.</p>
          <button className="home-btn-primary home-btn-lg" onClick={() => navigate('/login')}>
            Sign In to Portal →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-nav-inner">
          <span>© 2025 Fundsroom Infotech. All rights reserved.</span>
          <span style={{ color: '#94a3b8' }}>Mini ERP + CRM Operations Portal</span>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
