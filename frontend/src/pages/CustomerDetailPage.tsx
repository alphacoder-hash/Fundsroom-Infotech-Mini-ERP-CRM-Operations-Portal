import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config';
import { useAuth } from '../context/AuthContext';

const statusBadge: Record<string, string> = { LEAD: 'badge-warning', ACTIVE: 'badge-success', INACTIVE: 'badge-default' };
const typeBadge: Record<string, string> = { RETAIL: 'badge-info', WHOLESALE: 'badge-default', DISTRIBUTOR: 'badge-success' };

const CustomerDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'SALES';
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const fetchCustomer = async () => {
    try { const res = await api.get(`/customers/${id}`); setCustomer(res.data.data); }
    catch { navigate('/customers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomer(); }, [id]);

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setSavingNote(true);
    try { await api.post(`/customers/${id}/notes`, { note }); setNote(''); fetchCustomer(); }
    catch (err: any) { alert(err.response?.data?.message || 'Failed to add note'); }
    finally { setSavingNote(false); }
  };

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
  if (!customer) return null;

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/customers')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Customers
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div>
                <div className="card-title">{customer.name}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <span className={`badge ${typeBadge[customer.type]}`}>{customer.type}</span>
                  <span className={`badge ${statusBadge[customer.status]}`}>{customer.status}</span>
                </div>
              </div>
            </div>
            <div className="detail-grid">
              <div className="detail-item"><div className="detail-label">Mobile</div><div className="detail-value">{customer.mobile}</div></div>
              <div className="detail-item"><div className="detail-label">Email</div><div className="detail-value">{customer.email || '—'}</div></div>
              <div className="detail-item"><div className="detail-label">Business Name</div><div className="detail-value">{customer.businessName || '—'}</div></div>
              <div className="detail-item"><div className="detail-label">GST Number</div><div className="detail-value">{customer.gstNumber || '—'}</div></div>
              <div className="detail-item"><div className="detail-label">Address</div><div className="detail-value">{customer.address || '—'}</div></div>
              <div className="detail-item"><div className="detail-label">Follow-up Date</div><div className="detail-value">{customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : '—'}</div></div>
              <div className="detail-item"><div className="detail-label">Created At</div><div className="detail-value">{new Date(customer.createdAt).toLocaleDateString()}</div></div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Recent Challans</div></div>
            {customer.challans?.length === 0 ? (
              <div className="empty-state" style={{ padding: 30 }}><p>No challans yet</p></div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>Challan #</th><th>Items</th><th>Qty</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {customer.challans?.map((ch: any) => (
                      <tr key={ch.id} onClick={() => navigate(`/challans/${ch.id}`)} style={{ cursor: 'pointer' }}>
                        <td><strong>{ch.challanNumber}</strong></td>
                        <td>{ch.items?.length} items</td>
                        <td>{ch.totalQuantity}</td>
                        <td><span className={`badge ${ch.status === 'CONFIRMED' ? 'badge-success' : ch.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'}`}>{ch.status}</span></td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(ch.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header"><div className="card-title">Follow-up Notes</div></div>
            {canEdit && (
              <div style={{ marginBottom: 16 }}>
                <textarea className="form-textarea" placeholder="Add a follow-up note..." value={note} onChange={e => setNote(e.target.value)} style={{ marginBottom: 8 }} />
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAddNote} disabled={savingNote || !note.trim()}>
                  {savingNote ? 'Saving...' : '+ Add Note'}
                </button>
              </div>
            )}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              {customer.notes ? (
                customer.notes.split('\n').filter(Boolean).reverse().map((n: string, i: number) => (
                  <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{n}</div>
                ))
              ) : (
                <div className="empty-state" style={{ padding: 20 }}><p>No notes yet</p></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailPage;
