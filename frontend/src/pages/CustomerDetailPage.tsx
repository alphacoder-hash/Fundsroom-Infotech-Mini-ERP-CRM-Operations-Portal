import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config';
import { useAuth } from '../context/AuthContext';

const statusBadge: Record<string, string> = { LEAD: 'badge-warning', ACTIVE: 'badge-success', INACTIVE: 'badge-default' };
const typeBadge: Record<string, string> = { RETAIL: 'badge-info', WHOLESALE: 'badge-default', DISTRIBUTOR: 'badge-success' };

const initialForm = {
  name: '', mobile: '', email: '', businessName: '',
  gstNumber: '', type: 'RETAIL', address: '', status: 'LEAD', followUpDate: '',
};

const CustomerDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'SALES';

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchCustomer = async () => {
    try {
      const res = await api.get(`/customers/${id}`);
      setCustomer(res.data.data);
    } catch {
      navigate('/app/customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomer(); }, [id]);

  const openEdit = () => {
    setForm({
      name: customer.name, mobile: customer.mobile, email: customer.email || '',
      businessName: customer.businessName || '', gstNumber: customer.gstNumber || '',
      type: customer.type, address: customer.address || '', status: customer.status,
      followUpDate: customer.followUpDate ? customer.followUpDate.split('T')[0] : '',
    });
    setErrors({});
    setShowEditModal(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.mobile.trim()) e.mobile = 'Mobile is required';
    else if (!/^\d{10,15}$/.test(form.mobile.trim())) e.mobile = 'Enter a valid 10-15 digit mobile number';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await api.put(`/customers/${id}`, form);
      setShowEditModal(false);
      fetchCustomer();
    } catch (err: any) {
      setErrors({ submit: err.response?.data?.message || 'Failed to save' });
    } finally { setSaving(false); }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      await api.post(`/customers/${id}/notes`, { note });
      setNote('');
      fetchCustomer();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add note');
    } finally { setSavingNote(false); }
  };

  const f = (field: string, val: string) => setForm(p => ({ ...p, [field]: val }));

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
  if (!customer) return null;

  const isOverdue = customer.followUpDate && new Date(customer.followUpDate) < new Date();

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/customers')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Customers
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        <div>
          {/* Customer Info Card */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div>
                <div className="card-title">{customer.name}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <span className={`badge ${typeBadge[customer.type]}`}>{customer.type}</span>
                  <span className={`badge ${statusBadge[customer.status]}`}>{customer.status}</span>
                </div>
              </div>
              {canEdit && (
                <button className="btn btn-secondary" onClick={openEdit}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit
                </button>
              )}
            </div>
            <div className="detail-grid">
              <div className="detail-item"><div className="detail-label">Mobile</div><div className="detail-value">{customer.mobile}</div></div>
              <div className="detail-item"><div className="detail-label">Email</div><div className="detail-value">{customer.email || '—'}</div></div>
              <div className="detail-item"><div className="detail-label">Business Name</div><div className="detail-value">{customer.businessName || '—'}</div></div>
              <div className="detail-item"><div className="detail-label">GST Number</div><div className="detail-value">{customer.gstNumber || '—'}</div></div>
              <div className="detail-item"><div className="detail-label">Address</div><div className="detail-value">{customer.address || '—'}</div></div>
              <div className="detail-item">
                <div className="detail-label">Follow-up Date</div>
                <div className="detail-value" style={{ color: isOverdue ? 'var(--red)' : undefined }}>
                  {customer.followUpDate ? `${new Date(customer.followUpDate).toLocaleDateString()}${isOverdue ? ' ⚠️ Overdue' : ''}` : '—'}
                </div>
              </div>
              <div className="detail-item"><div className="detail-label">Created At</div><div className="detail-value">{new Date(customer.createdAt).toLocaleDateString()}</div></div>
            </div>
          </div>

          {/* Recent Challans */}
          <div className="card">
            <div className="card-header"><div className="card-title">Recent Challans</div></div>
            {!customer.challans?.length ? (
              <div className="empty-state" style={{ padding: 30 }}><p>No challans yet</p></div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Challan #</th><th>Items</th><th>Qty</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {customer.challans.map((ch: any) => (
                      <tr key={ch.id} onClick={() => navigate(`/app/challans/${ch.id}`)} style={{ cursor: 'pointer' }}>
                        <td><strong>{ch.challanNumber}</strong></td>
                        <td>{ch.items?.length} items</td>
                        <td>{ch.totalQuantity}</td>
                        <td><span className={`badge ${ch.status === 'CONFIRMED' ? 'badge-success' : ch.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'}`}>{ch.status}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{new Date(ch.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Follow-up Notes */}
        <div>
          <div className="card">
            <div className="card-header"><div className="card-title">Follow-up Notes</div></div>
            {canEdit && (
              <div style={{ marginBottom: 16 }}>
                <textarea
                  className="form-textarea"
                  placeholder="Add a follow-up note..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  style={{ marginBottom: 8 }}
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAddNote(); }}
                />
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAddNote} disabled={savingNote || !note.trim()}>
                  {savingNote ? 'Saving...' : '+ Add Note'}
                </button>
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>Ctrl+Enter to save</div>
              </div>
            )}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              {customer.notes ? (
                customer.notes.split('\n').filter(Boolean).reverse().map((n: string, i: number) => {
                  const match = n.match(/^\[(.+?)\] (.+)$/);
                  return (
                    <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      {match ? (
                        <>
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 4 }}>{match[1]}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>{match[2]}</div>
                        </>
                      ) : (
                        <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6 }}>{n}</div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="empty-state" style={{ padding: 20 }}><p>No notes yet</p></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Edit Customer</div>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {errors.submit && <div className="form-error" style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--red-light)', borderRadius: 6 }}>{errors.submit}</div>}
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className={`form-input ${errors.name ? 'input-error' : ''}`} value={form.name} onChange={e => f('name', e.target.value)} />
                  {errors.name && <div className="form-error">{errors.name}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile *</label>
                  <input className={`form-input ${errors.mobile ? 'input-error' : ''}`} value={form.mobile} onChange={e => f('mobile', e.target.value)} maxLength={15} />
                  {errors.mobile && <div className="form-error">{errors.mobile}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className={`form-input ${errors.email ? 'input-error' : ''}`} type="email" value={form.email} onChange={e => f('email', e.target.value)} />
                  {errors.email && <div className="form-error">{errors.email}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Business Name</label>
                  <input className="form-input" value={form.businessName} onChange={e => f('businessName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">GST Number <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>(optional)</span></label>
                  <input className="form-input" value={form.gstNumber} onChange={e => f('gstNumber', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Type *</label>
                  <select className="form-select" value={form.type} onChange={e => f('type', e.target.value)}>
                    <option value="RETAIL">Retail</option>
                    <option value="WHOLESALE">Wholesale</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => f('status', e.target.value)}>
                    <option value="LEAD">Lead</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Follow-up Date</label>
                  <input className="form-input" type="date" value={form.followUpDate} onChange={e => f('followUpDate', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" value={form.address} onChange={e => f('address', e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetailPage;
