import React, { useState, useEffect, useCallback } from 'react';
import api from '../config';
import { useAuth } from '../context/AuthContext';

const initialForm = { name: '', sku: '', category: '', unitPrice: '', currentStock: '', minStockAlert: '', location: '' };
const initialStock = { quantity: '', type: 'IN', reason: '' };

const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const canEdit = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  const [products, setProducts] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockProduct, setStockProduct] = useState<any>(null);
  const [stockForm, setStockForm] = useState(initialStock);
  const [showMovements, setShowMovements] = useState(false);
  const [movements, setMovements] = useState<any[]>([]);
  const [movementsProduct, setMovementsProduct] = useState<any>(null);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      const res = await api.get('/products', { params });
      setProducts(res.data.data);
      setMeta(res.data.meta);
    } catch { } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchProducts(1); }, [fetchProducts]);

  const openAdd = () => { setEditProduct(null); setForm(initialForm); setShowModal(true); };
  const openEdit = (p: any) => {
    setEditProduct(p);
    setForm({ name: p.name, sku: p.sku, category: p.category, unitPrice: p.unitPrice, currentStock: p.currentStock, minStockAlert: p.minStockAlert, location: p.location || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editProduct) await api.put(`/products/${editProduct.id}`, form);
      else await api.post('/products', form);
      setShowModal(false); fetchProducts(1);
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const openStock = (p: any) => { setStockProduct(p); setStockForm(initialStock); setShowStockModal(true); };
  const handleStockUpdate = async () => {
    setSaving(true);
    try {
      await api.post(`/products/${stockProduct.id}/stock`, stockForm);
      setShowStockModal(false); fetchProducts(meta.page);
    } catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const openMovements = async (p: any) => {
    setMovementsProduct(p);
    const res = await api.get(`/products/${p.id}/movements`);
    setMovements(res.data.data);
    setShowMovements(true);
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div><div className="card-title">Products & Inventory</div><div className="card-subtitle">{meta.total} total products</div></div>
          {canEdit && <button className="btn btn-primary" onClick={openAdd}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Product</button>}
        </div>

        <div className="toolbar">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="search-input" placeholder="Search name or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Location</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan={7}><div className="empty-state"><h3>No products found</h3></div></td></tr>
                  ) : products.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td><code style={{ background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{p.sku}</code></td>
                      <td>{p.category}</td>
                      <td>₹{parseFloat(p.unitPrice).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${p.currentStock <= p.minStockAlert ? 'badge-danger' : 'badge-success'}`}>
                          {p.currentStock} {p.currentStock <= p.minStockAlert && '⚠️'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.location || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {canEdit && <button className="btn btn-sm btn-secondary" onClick={() => openStock(p)}>Stock</button>}
                          <button className="btn btn-sm btn-secondary" onClick={() => openMovements(p)}>Log</button>
                          {canEdit && <button className="btn btn-sm btn-secondary" onClick={() => openEdit(p)}>Edit</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <div className="pagination-info">Showing {products.length} of {meta.total}</div>
              <div className="pagination-controls">
                <button className="page-btn" disabled={meta.page <= 1} onClick={() => fetchProducts(meta.page - 1)}>← Prev</button>
                <button className="page-btn active">{meta.page}</button>
                <button className="page-btn" disabled={meta.page * meta.limit >= meta.total} onClick={() => fetchProducts(meta.page + 1)}>Next →</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">{editProduct ? 'Edit Product' : 'Add Product'}</div><button className="modal-close" onClick={() => setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">Product Name *</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Product name" /></div>
                <div className="form-group"><label className="form-label">SKU / Code *</label><input className="form-input" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="e.g. PROD-001" /></div>
                <div className="form-group"><label className="form-label">Category *</label><input className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Electronics" /></div>
                <div className="form-group"><label className="form-label">Unit Price (₹) *</label><input className="form-input" type="number" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} placeholder="0.00" /></div>
                <div className="form-group"><label className="form-label">Current Stock</label><input className="form-input" type="number" value={form.currentStock} onChange={e => setForm({ ...form, currentStock: e.target.value })} placeholder="0" /></div>
                <div className="form-group"><label className="form-label">Min Stock Alert</label><input className="form-input" type="number" value={form.minStockAlert} onChange={e => setForm({ ...form, minStockAlert: e.target.value })} placeholder="0" /></div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}><label className="form-label">Location / Warehouse</label><input className="form-input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Warehouse A, Rack 3" /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Update Modal */}
      {showStockModal && stockProduct && (
        <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Update Stock — {stockProduct.name}</div><button className="modal-close" onClick={() => setShowStockModal(false)}>✕</button></div>
            <div className="modal-body">
              <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Current Stock</span>
                <strong style={{ fontSize: 18 }}>{stockProduct.currentStock} units</strong>
              </div>
              <div className="form-group"><label className="form-label">Movement Type *</label>
                <select className="form-select" value={stockForm.type} onChange={e => setStockForm({ ...stockForm, type: e.target.value })}>
                  <option value="IN">IN — Add to Stock</option>
                  <option value="OUT">OUT — Remove from Stock</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Quantity *</label><input className="form-input" type="number" value={stockForm.quantity} onChange={e => setStockForm({ ...stockForm, quantity: e.target.value })} placeholder="Enter quantity" /></div>
              <div className="form-group"><label className="form-label">Reason</label><input className="form-input" value={stockForm.reason} onChange={e => setStockForm({ ...stockForm, reason: e.target.value })} placeholder="e.g. Purchase order received" /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowStockModal(false)}>Cancel</button>
              <button className={`btn ${stockForm.type === 'IN' ? 'btn-success' : 'btn-danger'}`} onClick={handleStockUpdate} disabled={saving}>{saving ? 'Updating...' : `${stockForm.type === 'IN' ? 'Add' : 'Remove'} Stock`}</button>
            </div>
          </div>
        </div>
      )}

      {/* Movements Log Modal */}
      {showMovements && movementsProduct && (
        <div className="modal-overlay" onClick={() => setShowMovements(false)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><div className="modal-title">Stock Log — {movementsProduct.name}</div><button className="modal-close" onClick={() => setShowMovements(false)}>✕</button></div>
            <div className="modal-body" style={{ padding: 0 }}>
              {movements.length === 0 ? <div className="empty-state" style={{ padding: 40 }}><p>No stock movements yet</p></div> : (
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Type</th><th>Quantity</th><th>Reason</th><th>By</th><th>Date</th></tr></thead>
                    <tbody>
                      {movements.map((m: any) => (
                        <tr key={m.id}>
                          <td><span className={`badge ${m.type === 'IN' ? 'badge-success' : 'badge-danger'}`}>{m.type}</span></td>
                          <td><strong>{m.type === 'IN' ? '+' : '-'}{m.quantityChanged}</strong></td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.reason || '—'}</td>
                          <td style={{ fontSize: 12 }}>{m.user?.email || '—'}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(m.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
