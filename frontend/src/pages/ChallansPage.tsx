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
  const [status, setStatus] = useState('DRAFT');
  const [items, setItems] = useState([{ productId: '', quantity: '1' }]);
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
    const [cRes, pRes] = await Promise.all([api.get('/customers?limit=100'), api.get('/products?limit=100')]);
    setCustomers(cRes.data.data);
    setProducts(pRes.data.data);
    setCustomerId(''); setStatus('DRAFT'); setItems([{ productId: '', quantity: '1' }]);
    setShowModal(true);
  };

  const addItem = () => setItems([...items, { productId: '', quantity: '1' }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, val: string) => setItems(items.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const handleCreate = async () => {
    if (!customerId || items.some(i => !i.productId || !i.quantity)) { alert('Please fill all fields'); return; }
    setSaving(true);
    try {
      await api.post('/challans', { customerId, status, items: items.map(i => ({ productId: i.productId, quantity: parseInt(i.quantity) })) });
      setShowModal(false); fetchChallans(1);
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to create challan'); }
    finally { setSaving(false); }
  };

  const totalQty = items.reduce((s, i) => s + (parseInt(i.quantity) || 0), 0);
  const getProductPrice = (productId: string) => products.find(p => p.id === productId)?.unitPrice || 0;
  const totalAmount = items.reduce((s, i) => s + ((parseInt(i.quantity) || 0) * getProductPrice(i.productId)), 0);

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div><div className="card-title">Sales Challans</div><div className="card-subtitle">{meta.total} total challans</div></div>
          {canCreate && <button className="btn btn-primary" onClick={openCreate}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> New Challan</button>}
        </div>

        <div className="toolbar">
          <select className="form-select" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
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
                <thead><tr><th>Challan #</th><th>Customer</th><th>Items</th><th>Total Qty</th><th>Status</th><th>Created By</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {challans.length === 0 ? (
                    <tr><td colSpan={8}><div className="empty-state"><h3>No challans yet</h3><p>Create your first sales challan</p></div></td></tr>
                  ) : challans.map(ch => (
                    <tr key={ch.id}>
                      <td><strong style={{ color: 'var(--accent)' }}>{ch.challanNumber}</strong></td>
                      <td><div>{ch.customer?.name}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ch.customer?.businessName}</div></td>
                      <td>{ch.items?.length} items</td>
                      <td>{ch.totalQuantity}</td>
                      <td><span className={`badge ${statusBadge[ch.status]}`}>{ch.status}</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ch.user?.email?.split('@')[0]}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(ch.createdAt).toLocaleDateString()}</td>
                      <td><button className="btn btn-sm btn-secondary" onClick={() => navigate(`/challans/${ch.id}`)}>View</button></td>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Create New Challan</div><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-grid" style={{ marginBottom: 20 }}>
                <div className="form-group"><label className="form-label">Customer *</label>
                  <select className="form-select" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                    <option value="">Select customer...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.businessName ? `— ${c.businessName}` : ''}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Save as</label>
                  <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="DRAFT">Draft (no stock deduction)</option>
                    <option value="CONFIRMED">Confirmed (deducts stock)</option>
                  </select>
                </div>
              </div>

              <div className="form-label" style={{ marginBottom: 10 }}>Products *</div>
              <div className="challan-items">
                <div className="challan-item-row challan-item-header">
                  <span>Product</span><span>Price</span><span style={{ textAlign: 'right' }}>Qty</span><span></span>
                </div>
                {items.map((item, i) => (
                  <div key={i} className="challan-item-row">
                    <select className="form-select" value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)}>
                      <option value="">Select product...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>)}
                    </select>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>₹{parseFloat(getProductPrice(item.productId)).toFixed(2)}</span>
                    <input type="number" className="form-input" style={{ width: 80, textAlign: 'right' }} value={item.quantity} min="1" onChange={e => updateItem(i, 'quantity', e.target.value)} />
                    <button className="btn btn-sm btn-danger" onClick={() => removeItem(i)} disabled={items.length === 1}>✕</button>
                  </div>
                ))}
              </div>
              <button className="btn btn-secondary btn-sm" onClick={addItem} style={{ marginTop: 10 }}>+ Add Product</button>

              <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '14px 16px', marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Total: <strong style={{ color: 'var(--text-primary)' }}>{totalQty} units</strong></div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>₹{totalAmount.toFixed(2)}</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>{saving ? 'Creating...' : 'Create Challan'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallansPage;
