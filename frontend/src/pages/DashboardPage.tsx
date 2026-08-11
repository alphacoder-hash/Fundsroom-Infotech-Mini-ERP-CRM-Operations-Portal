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
    { label: 'Total Customers',    value: stats.customers, color: '#4f46e5', bg: '#eef2ff', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:'#4f46e5'}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>, path: '/customers' },
    { label: 'Products in Catalog', value: stats.products, color: '#059669', bg: '#ecfdf5', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:'#059669'}}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>, path: '/products' },
    { label: 'Sales Challans',       value: stats.challans, color: '#d97706', bg: '#fffbeb', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:'#d97706'}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, path: '/challans' },
    { label: 'Low Stock Alerts',     value: stats.lowStock, color: '#dc2626', bg: '#fef2f2', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color:'#dc2626'}}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, path: '/products' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
          Welcome back, {user?.email?.split('@')[0]} 👋
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>Here's what's happening with your business today.</p>
      </div>

      {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
        <div className="stats-grid">
          {statCards.map(card => (
            <div key={card.label} className="stat-card" onClick={() => navigate(card.path)} style={{ cursor: 'pointer' }}>
              <div className="stat-icon" style={{ background: card.bg }}>{card.icon}</div>
              <div>
                <div className="stat-value">{card.value}</div>
                <div className="stat-label">{card.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">Quick Actions</div></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: '+ Add New Customer', path: '/customers' },
              { label: '+ Add New Product', path: '/products' },
              { label: '+ Create Sales Challan', path: '/challans' },
            ].map(a => (
              <button key={a.label} className="btn btn-secondary" onClick={() => navigate(a.path)} style={{ justifyContent: 'flex-start', width: '100%' }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">Role Permissions</div></div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { role: 'ADMIN', perms: 'Full access to all modules' },
              { role: 'SALES', perms: 'Customers, Challans' },
              { role: 'WAREHOUSE', perms: 'Products, Stock' },
              { role: 'ACCOUNTS', perms: 'View only access' },
            ].map(r => (
              <div key={r.role} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span className={`badge ${r.role === user?.role ? 'badge-info' : 'badge-default'}`}>{r.role}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.perms}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
