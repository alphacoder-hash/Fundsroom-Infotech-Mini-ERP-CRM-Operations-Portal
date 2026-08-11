import React, { useState, useEffect, useCallback } from 'react';
import api from '../config';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const statusBadge: Record<string, string> = { LEAD: 'badge-warning', ACTIVE: 'badge-success', INACTIVE: 'badge-default' };
const typeBadge: Record<string, string> = { RETAIL: 'badge-info', WHOLESALE: 'badge-default', DISTRIBUTOR: 'badge-success' };

const initialForm = { name: '', mobile: '', email: '', businessName: '', gstNumber: '', type: 'RETAIL', address: '', status: 'LEAD', followUpDate: '', notes: '' };

const CustomersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'SALES';

  const [customers, setCustomers] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const fetchCustomers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/customers', { params });
      setCustomers(res.data.data);
      setMeta(res.data.meta);
    } catch { } finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchCustomers(1); }, [fetchCustomers]);

  const openAdd = () => { setEditCustomer(null); setForm(initialForm); setShowModal(true); };
  const openEdit = (c: any) => {
    setEditCustomer(c);
    setForm({ name: c.name, mobile: c.mobile, email: c.email || '', businessName: c.businessName || '', gstNumber: c.gstNumber || '', type: c.type, address: c.address || '', status: c.status, followUpDate: c.followUpDate ? c.followUpDate.split('T')[0] : '', notes: c.notes || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editCustomer) await api.put(`/customers/${editCustomer.id}`, form);
      else await api.post('/customers', form);
      setShowModal(false);
      fetchCustomers(1);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Customers</div>
            <div className="card-subtitle">{meta.total} total customers</div>
          </div>
          {canEdit && <button className="btn btn-primary" onClick={openAdd}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Customer</button>}
        </div>

        <div className="toolbar">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="search-input" placeholder="Search name, mobile, business..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{ width: 140 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="LEAD">Lead</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Name</th><th>Mobile</th><th>Business</th><th>Type</th><th>Status</th><th>Follow Up</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr><td colSpan={7}><div className="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><h3>No customers found</h3><p>Add your first customer to get started</p></div></td></tr>
                  ) : customers.map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.name}</strong><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.email}</div></td>
                      <td>{c.mobile}</td>
                      <td>{c.businessName || '—'}</td>
                      <td><span className={`badge ${typeBadge[c.type]}`}>{c.type}</span></td>
                      <td><span className={`badge ${statusBadge[c.status]}`}>{c.status}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/customers/${c.id}`)}>View</button>
                          {canEdit && <button className="btn btn-sm btn-secondary" onClick={() => openEdit(c)}>Edit</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <div className="pagination-info">Showing {customers.length} of {meta.total} customers</div>
              <div className="pagination-controls">
                <button className="page-btn" disabled={meta.page <= 1} onClick={() => fetchCustomers(meta.page - 1)}>← Prev</button>
                <button className="page-btn active">{meta.page}</button>
                <button className="page-btn" disabled={meta.page * meta.limit >= meta.total} onClick={() => fetchCustomers(meta.page + 1)}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editCustomer ? 'Edit Customer' : 'Add New Customer'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Customer name" /></div>
                <div className="form-group"><label className="form-label">Mobile *</label><input className="form-input" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} placeholder="Mobile number" /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email address" /></div>
                <div className="form-group"><label className="form-label">Business Name</label><input className="form-input" value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} placeholder="Business name" /></div>
                <div className="form-group"><label className="form-label">GST Number</label><input className="form-input" value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value })} placeholder="GSTIN" /></div>
                <div className="form-group"><label className="form-label">Customer Type *</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="RETAIL">Retail</option><option value="WHOLESALE">Wholesale</option><option value="DISTRIBUTOR">Distributor</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="LEAD">Lead</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Follow-up Date</label><input className="form-input" type="date" value={form.followUpDate} onChange={e => setForm({ ...form, followUpDate: e.target.value })} /></div>
              </div>
              <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Full address" /></div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes..." /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Customer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
