import React, { useState, useEffect, useCallback } from 'react';
import api from '../config';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const statusBadge: Record<string, string> = { DRAFT: 'badge-warning', CONFIRMED: 'badge-success', CANCELLED: 'badge-danger' };

const ChallansPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canCreate = user?.role === 'ADMIN' || user?.role === 'SALES';

  const [challans, setChallans] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [challanStatus, setChallanStatus] = useState('DRAFT');
  const [items, setItems] = useState([{ productId: '', quantity: '1' }]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchChallans = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/challans', { params });
      setChallans(res.data.data);
      setMeta(res.data.meta);
    } catch { } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchChallans(1); }, [fetchChallans]);

  const openCreate = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        api.get('/customers?limit=200'),
        api.get('/products?limit=200'),
      ]);
      setCustomers(cRes.data.data);
      setProducts(pRes.data.data);
    } catch { setCustomers([]); setProducts([]); }
    setCustomerId('');
    setChallanStatus('DRAFT');
    setItems([{ productId: '', quantity: '1' }]);
    setFormError('');
    setShowModal(true);
  };

  const addItem = () => setItems(prev => [...prev, { productId: '', quantity: '1' }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, val: string) =>
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const validate = (): string => {
    if (!customerId) return 'Please select a customer';
    for (let i = 0; i < items.length; i++) {
      if (!items[i].productId) return `Please select a product for item ${i + 1}`;
      const qty = parseInt(items[i].quantity);
      if (!qty || qty <= 0) return `Quantity for item ${i + 1} must be at least 1`;
    }
    // Check duplicates
    const ids = items.map(i => i.productId);
    if (new Set(ids).size !== ids.length) return 'Duplicate products found — combine quantities instead';
    return '';
  };

  const handleCreate = async () => {
    const err = validate();
    if (err) { setFormError(err); return; }
    setFormError('');
    setSaving(true);
    try {
      await api.post('/challans', {
        customerId,
        status: challanStatus,
        items: items.map(i => ({ productId: i.productId, quantity: parseInt(i.quantity) })),
      });
      setShowModal(false);
      fetchChallans(1);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create challan');
    } finally { setSaving(false); }
  };

  const getProduct = (productId: string) => products.find(p => p.id === productId);
  const totalQty = items.reduce((s, i) => s + (parseInt(i.quantity) || 0), 0);
  const totalAmount = items.reduce((s, i) => {
    const p = getProduct(i.productId);
    return s + ((parseInt(i.quantity) || 0) * (p?.unitPrice || 0));
  }, 0);

  const getChallanTotal = (ch: any) =>
    ch.items?.reduce((s: number, item: any) => s + (item.quantity * item.unitPriceSnapshot), 0) || 0;

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Sales Challans</div>
            <div className="card-subtitle">{meta.total} total challans</div>
          </div>
          {canCreate && (
            <button className="btn btn-primary" onClick={openCreate}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Challan
            </button>
          )}
        </div>

        <div className="toolbar">
          <select className="form-select" style={{ width: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Challan #</th><th>Customer</th><th>Items</th><th>Total Qty</th>
                    <th>Total Amount</th><th>Status</th><th>Created By</th><th>Date</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {challans.length === 0 ? (
                    <tr><td colSpan={9}>
                      <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <h3>No challans yet</h3>
                        <p>Create your first sales challan</p>
                      </div>
                    </td></tr>
                  ) : challans.map(ch => (
                    <tr key={ch.id}>
                      <td><strong style={{ color: 'var(--accent)' }}>{ch.challanNumber}</strong></td>
                      <td>
                        <div>{ch.customer?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ch.customer?.businessName || ''}</div>
                      </td>
                      <td>{ch.items?.length} items</td>
                      <td>{ch.totalQuantity}</td>
                      <td style={{ fontWeight: 600 }}>₹{getChallanTotal(ch).toFixed(2)}</td>
                      <td><span className={`badge ${statusBadge[ch.status]}`}>{ch.status}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ch.user?.email?.split('@')[0]}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(ch.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/challans/${ch.id}`)}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <div className="pagination-info">Showing {challans.length} of {meta.total}</div>
              <div className="pagination-controls">
                <button className="page-btn" disabled={meta.page <= 1} onClick={() => fetchChallans(meta.page - 1)}>← Prev</button>
                <button className="page-btn active">{meta.page}</button>
                <button className="page-btn" disabled={meta.page * meta.limit >= meta.total} onClick={() => fetchChallans(meta.page + 1)}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Challan Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Create New Challan</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">

              {formError && (
                <div className="form-error" style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--danger-light)', borderRadius: 6 }}>
                  {formError}
                </div>
              )}

              <div className="form-grid" style={{ marginBottom: 20 }}>
                <div className="form-group">
                  <label className="form-label">Customer *</label>
                  <select className={`form-select ${!customerId && formError ? 'input-error' : ''}`} value={customerId} onChange={e => setCustomerId(e.target.value)}>
                    <option value="">Select customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}{c.businessName ? ` — ${c.businessName}` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Save as</label>
                  <select className="form-select" value={challanStatus} onChange={e => setChallanStatus(e.target.value)}>
                    <option value="DRAFT">Draft — no stock deduction</option>
                    <option value="CONFIRMED">Confirmed — deducts stock immediately</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label className="form-label" style={{ margin: 0 }}>Products *</label>
                <button className="btn btn-sm btn-secondary" onClick={addItem}>+ Add Row</button>
              </div>

              <div className="challan-items">
                <div className="challan-item-row challan-item-header">
                  <span>Product</span><span>Stock</span><span>Unit Price</span><span style={{ textAlign: 'right' }}>Qty</span><span style={{ textAlign: 'right' }}>Subtotal</span><span></span>
                </div>
                {items.map((item, i) => {
                  const prod = getProduct(item.productId);
                  const subtotal = (parseInt(item.quantity) || 0) * (prod?.unitPrice || 0);
                  const lowStock = prod && parseInt(item.quantity) > prod.currentStock;
                  return (
                    <div key={i} className="challan-item-row" style={{ gridTemplateColumns: '2fr 80px 90px 80px 90px 36px' }}>
                      <select
                        className={`form-select ${!item.productId && formError ? 'input-error' : ''}`}
                        value={item.productId}
                        onChange={e => updateItem(i, 'productId', e.target.value)}
                      >
                        <option value="">Select product...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <span style={{ fontSize: 12, color: lowStock ? 'var(--danger)' : 'var(--text-muted)' }}>
                        {prod ? `${prod.currentStock}${lowStock ? ' ⚠️' : ''}` : '—'}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {prod ? `₹${parseFloat(prod.unitPrice).toFixed(2)}` : '—'}
                      </span>
                      <input
                        type="number" min="1"
                        className={`form-input ${lowStock ? 'input-error' : ''}`}
                        style={{ textAlign: 'right' }}
                        value={item.quantity}
                        onChange={e => updateItem(i, 'quantity', e.target.value)}
                      />
                      <span style={{ textAlign: 'right', fontSize: 13, fontWeight: 600 }}>
                        {prod ? `₹${subtotal.toFixed(2)}` : '—'}
                      </span>
                      <button className="btn btn-sm btn-danger" onClick={() => removeItem(i)} disabled={items.length === 1}>✕</button>
                    </div>
                  );
                })}
              </div>

              <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '14px 16px', marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {items.length} product{items.length > 1 ? 's' : ''} · <strong style={{ color: 'var(--text-primary)' }}>{totalQty} units</strong>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>₹{totalAmount.toFixed(2)}</div>
              </div>

              {challanStatus === 'CONFIRMED' && (
                <div style={{ marginTop: 10, padding: '8px 14px', background: 'var(--warning-light)', borderRadius: 6, fontSize: 12, color: 'var(--warning)' }}>
                  ⚠️ Confirming will immediately deduct stock from inventory. This cannot be undone.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating...' : `Create as ${challanStatus === 'DRAFT' ? 'Draft' : 'Confirmed'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallansPage;
