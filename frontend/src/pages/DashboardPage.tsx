import React, { useEffect, useState } from 'react';
import api from '../config';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Stats { customers: number; products: number; challans: number; lowStock: number; }

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ customers: 0, products: 0, challans: 0, lowStock: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/customers?limit=1'),
      api.get('/products?limit=100'),
      api.get('/challans?limit=1'),
    ]).then(([c, p, ch]) => {
      const products = p.data.data;
      const lowStock = products.filter((prod: any) => prod.currentStock <= prod.minStockAlert).length;
      setStats({
        customers: c.data.meta?.total || 0,
        products: p.data.meta?.total || 0,
        challans: ch.data.meta?.total || 0,
        lowStock,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: 'Total Customers', value: stats.customers,
      color: '#4f46e5', bg: '#eef2ff',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      path: '/app/customers',
    },
    {
      label: 'Products in Catalog', value: stats.products,
      color: '#10b981', bg: '#ecfdf5',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
      path: '/app/products',
    },
    {
      label: 'Sales Challans', value: stats.challans,
      color: '#f59e0b', bg: '#fffbeb',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
      path: '/app/challans',
    },
    {
      label: 'Low Stock Alerts', value: stats.lowStock,
      color: '#ef4444', bg: '#fef2f2',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
      path: '/app/products',
    },
  ];

  const rolePerms = [
    { role: 'ADMIN',     perms: 'Full access to all modules',  badge: 'badge-danger' },
    { role: 'SALES',     perms: 'Customers + Challans',        badge: 'badge-info' },
    { role: 'WAREHOUSE', perms: 'Products + Stock',            badge: 'badge-warning' },
    { role: 'ACCOUNTS',  perms: 'View only access',            badge: 'badge-default' },
  ];

  const quickActions = [
    { label: 'Add New Customer', path: '/app/customers', color: '#4f46e5', bg: '#eef2ff',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> },
    { label: 'Manage Products', path: '/app/products', color: '#10b981', bg: '#ecfdf5',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
    { label: 'Create Sales Challan', path: '/app/challans', color: '#f59e0b', bg: '#fffbeb',
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg> },
  ];

  return (
    <div>
      {/* Welcome header */}
      <div style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        borderRadius: 16, padding: '24px 28px', marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
        boxShadow: '0 8px 32px rgba(79,70,229,0.25)',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.3px' }}>
            Welcome back, {user?.email?.split('@')[0]} 👋
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginTop: 5, fontSize: 13.5 }}>
            Here's what's happening with your business today.
          </p>
        </div>
        <button
          onClick={() => navigate('/app/challans')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', background: '#fff', color: '#4f46e5',
            border: 'none', borderRadius: 9, fontSize: 13.5, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            transition: 'all 0.17s',
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:14,height:14}}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Challan
        </button>
      </div>

      {/* Stat cards */}
      {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
        <div className="stats-grid">
          {statCards.map(card => (
            <div
              key={card.label}
              className="stat-card"
              onClick={() => navigate(card.path)}
              style={{ '--stat-color': card.color } as React.CSSProperties}
            >
              <div className="stat-icon" style={{ background: card.bg }}>{card.icon}</div>
              <div>
                <div className="stat-value">{card.value}</div>
                <div className="stat-label">{card.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom two-column section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Quick Actions</div>
              <div className="card-subtitle">Navigate to key modules</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quickActions.map(a => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', background: a.bg,
                  border: `1px solid transparent`, borderRadius: 10,
                  cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                  fontSize: 13.5, fontWeight: 600, color: a.color,
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateX(4px)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateX(0)'; }}
              >
                <span style={{ width: 32, height: 32, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  {a.icon}
                </span>
                {a.label}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14,marginLeft:'auto',opacity:0.5}}><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            ))}
          </div>
        </div>

        {/* Role Permissions */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Role Permissions</div>
              <div className="card-subtitle">Your current access level</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rolePerms.map(r => (
              <div
                key={r.role}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 9,
                  background: r.role === user?.role ? 'linear-gradient(135deg, #eef2ff, #f5f3ff)' : 'var(--surface-2)',
                  border: r.role === user?.role ? '1px solid #c7d2fe' : '1px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {r.role === user?.role && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4f46e5', flexShrink: 0 }} />}
                  <span className={`badge ${r.badge}`}>{r.role}</span>
                </div>
                <span style={{ fontSize: 12, color: r.role === user?.role ? 'var(--indigo)' : 'var(--text-3)', fontWeight: r.role === user?.role ? 600 : 400 }}>{r.perms}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
