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
  const [actionError, setActionError] = useState('');

  const fetchChallan = async () => {
    try {
      const res = await api.get(`/challans/${id}`);
      setChallan(res.data.data);
    } catch {
      navigate('/challans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChallan(); }, [id]);

  const updateStatus = async (status: string) => {
    setActionError('');
    setUpdating(true);
    try {
      await api.patch(`/challans/${id}/status`, { status });
      fetchChallan();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to update challan status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;
  if (!challan) return null;

  const totalAmount = challan.items?.reduce(
    (s: number, item: any) => s + item.quantity * item.unitPriceSnapshot, 0
  ) || 0;

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/challans')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Challans
      </button>

      {/* Header Card */}
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

        {/* Inline error for status actions */}
        {actionError && (
          <div style={{ margin: '0 0 16px', padding: '10px 14px', background: 'var(--danger-light)', borderRadius: 6, color: 'var(--danger)', fontSize: 13 }}>
            {actionError}
          </div>
        )}

        {/* All required challan fields */}
        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-label">Challan Number</div>
            <div className="detail-value" style={{ fontFamily: 'monospace', fontSize: 15 }}>{challan.challanNumber}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Status</div>
            <div className="detail-value"><span className={`badge ${statusBadge[challan.status]}`}>{challan.status}</span></div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Customer</div>
            <div className="detail-value">{challan.customer?.name}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Business</div>
            <div className="detail-value">{challan.customer?.businessName || '—'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Created By</div>
            <div className="detail-value">{challan.user?.email}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Role</div>
            <div className="detail-value"><span className="badge badge-default">{challan.user?.role}</span></div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Created Date</div>
            <div className="detail-value">{new Date(challan.createdAt).toLocaleString()}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Last Updated</div>
            <div className="detail-value">{new Date(challan.updatedAt).toLocaleString()}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Total Quantity</div>
            <div className="detail-value">{challan.totalQuantity} units</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Total Amount</div>
            <div className="detail-value" style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
              ₹{totalAmount.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Products / Items Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Products ({challan.items?.length} items)</div>
        </div>
        <div className="challan-items">
          <div className="challan-item-row challan-item-header" style={{ gridTemplateColumns: '2fr 120px 80px 110px 110px' }}>
            <span>Product</span>
            <span>SKU</span>
            <span style={{ textAlign: 'right' }}>Qty</span>
            <span style={{ textAlign: 'right' }}>Unit Price</span>
            <span style={{ textAlign: 'right' }}>Subtotal</span>
          </div>
          {challan.items?.map((item: any) => (
            <div key={item.id} className="challan-item-row" style={{ gridTemplateColumns: '2fr 120px 80px 110px 110px' }}>
              <span><strong>{item.productNameSnapshot}</strong></span>
              <span>
                <code style={{ background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
                  {item.skuSnapshot}
                </code>
              </span>
              <span style={{ textAlign: 'right' }}>{item.quantity}</span>
              <span style={{ textAlign: 'right', color: 'var(--text-muted)' }}>₹{parseFloat(item.unitPriceSnapshot).toFixed(2)}</span>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>₹{(item.quantity * item.unitPriceSnapshot).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="challan-total">
          <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
            {challan.totalQuantity} units total
          </span>
          <span style={{ fontSize: 20, color: 'var(--accent)' }}>₹{totalAmount.toFixed(2)}</span>
        </div>

        {challan.status === 'CONFIRMED' && (
          <div style={{ marginTop: 12, padding: '10px 16px', background: 'var(--success-light)', borderRadius: 8, color: 'var(--success)', fontSize: 13 }}>
            ✓ Challan confirmed. Stock has been deducted from inventory.
          </div>
        )}
        {challan.status === 'CANCELLED' && (
          <div style={{ marginTop: 12, padding: '10px 16px', background: 'var(--danger-light)', borderRadius: 8, color: 'var(--danger)', fontSize: 13 }}>
            ✕ Challan cancelled. No stock was deducted.
          </div>
        )}
        {challan.status === 'DRAFT' && (
          <div style={{ marginTop: 12, padding: '10px 16px', background: 'var(--warning-light)', borderRadius: 8, color: 'var(--warning)', fontSize: 13 }}>
            ⏳ Draft — stock will be deducted only when confirmed.
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallanDetailPage;
