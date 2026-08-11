import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../config';
import { useAuth } from '../context/AuthContext';

const statusBadge: Record<string, string> = { DRAFT: 'badge-warning', CONFIRMED: 'badge-success', CANCELLED: 'badge-danger' };

const ChallanDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'SALES';
  const [challan, setChallan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchChallan = async () => {
    try { const res = await api.get(`/challans/${id}`); setChallan(res.data.data); }
    catch { navigate('/challans'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchChallan(); }, [id]);

  const updateStatus = async (status: string) => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this challan?`)) return;
    setUpdating(true);
    try { await api.patch(`/challans/${id}/status`, { status }); fetchChallan(); }
    catch (err: any) { alert(err.response?.data?.message || 'Failed to update'); }
    finally { setUpdating(false); }
  };

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
  if (!challan) return null;

  const totalAmount = challan.items?.reduce((s: number, item: any) => s + (item.quantity * item.unitPriceSnapshot), 0) || 0;

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/challans')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Challans
      </button>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <div>
            <div className="card-title" style={{ fontSize: 20 }}>{challan.challanNumber}</div>
            <div style={{ marginTop: 6 }}>
              <span className={`badge ${statusBadge[challan.status]}`}>{challan.status}</span>
            </div>
          </div>
          {canManage && challan.status === 'DRAFT' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-success" onClick={() => updateStatus('CONFIRMED')} disabled={updating}>
                ✓ Confirm Challan
              </button>
              <button className="btn btn-danger" onClick={() => updateStatus('CANCELLED')} disabled={updating}>
                ✕ Cancel
              </button>
            </div>
          )}
        </div>
        <div className="detail-grid">
          <div className="detail-item"><div className="detail-label">Customer</div><div className="detail-value">{challan.customer?.name}</div></div>
          <div className="detail-item"><div className="detail-label">Business</div><div className="detail-value">{challan.customer?.businessName || '—'}</div></div>
          <div className="detail-item"><div className="detail-label">Created By</div><div className="detail-value">{challan.user?.email}</div></div>
          <div className="detail-item"><div className="detail-label">Created At</div><div className="detail-value">{new Date(challan.createdAt).toLocaleString()}</div></div>
          <div className="detail-item"><div className="detail-label">Total Quantity</div><div className="detail-value">{challan.totalQuantity} units</div></div>
          <div className="detail-item"><div className="detail-label">Total Amount</div><div className="detail-value" style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>₹{totalAmount.toFixed(2)}</div></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Challan Items</div></div>
        <div className="challan-items">
          <div className="challan-item-row challan-item-header">
            <span>Product</span><span>SKU</span><span style={{ textAlign: 'right' }}>Qty</span><span style={{ textAlign: 'right' }}>Unit Price</span><span style={{ textAlign: 'right' }}>Total</span>
          </div>
          {challan.items?.map((item: any) => (
            <div key={item.id} className="challan-item-row" style={{ gridTemplateColumns: '1fr 120px 80px 100px 100px' }}>
              <span><strong>{item.productNameSnapshot}</strong></span>
              <span><code style={{ background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>{item.skuSnapshot}</code></span>
              <span style={{ textAlign: 'right' }}>{item.quantity}</span>
              <span style={{ textAlign: 'right', color: 'var(--text-muted)' }}>₹{parseFloat(item.unitPriceSnapshot).toFixed(2)}</span>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>₹{(item.quantity * item.unitPriceSnapshot).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="challan-total">
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Total</span>
          <span style={{ fontSize: 20, color: 'var(--accent)' }}>₹{totalAmount.toFixed(2)}</span>
        </div>
        {challan.status === 'CONFIRMED' && (
          <div style={{ marginTop: 12, padding: '10px 16px', background: 'var(--success-light)', borderRadius: 8, color: 'var(--success)', fontSize: 13 }}>
            ✓ This challan has been confirmed. Stock has been deducted from inventory.
          </div>
        )}
        {challan.status === 'CANCELLED' && (
          <div style={{ marginTop: 12, padding: '10px 16px', background: 'var(--danger-light)', borderRadius: 8, color: 'var(--danger)', fontSize: 13 }}>
            ✕ This challan has been cancelled. No stock was deducted.
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallanDetailPage;
