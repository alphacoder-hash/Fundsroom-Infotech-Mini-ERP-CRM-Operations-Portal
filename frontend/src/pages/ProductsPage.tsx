import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockProduct, setStockProduct] = useState<any>(null);
  const [stockForm, setStockForm] = useState(initialStock);
  const [stockError, setStockError] = useState('');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showMovements, setShowMovements] = useState(false);
  const [movements, setMovements] = useState<any[]>([]);
  const [movementsProduct, setMovementsProduct] = useState<any>(null);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      const res = await api.get('/products', { params });
      setProducts(res.data.data);
      setMeta(res.data.meta);
    } catch { } finally { setLoading(false); }
  }, [search, categoryFilter]);

  useEffect(() => { fetchProducts(1); }, [fetchProducts]);

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    if (!form.sku.trim()) e.sku = 'SKU is required';
    if (!form.category.trim()) e.category = 'Category is required';
    if (!form.unitPrice) e.unitPrice = 'Unit price is required';
    else if (parseFloat(form.unitPrice) <= 0) e.unitPrice = 'Unit price must be greater than 0';
    if (!editProduct && form.currentStock !== '' && parseInt(form.currentStock) < 0) e.currentStock = 'Stock cannot be negative';
    if (form.minStockAlert !== '' && parseInt(form.minStockAlert) < 0) e.minStockAlert = 'Cannot be negative';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStock = () => {
    if (!stockForm.quantity || parseInt(stockForm.quantity) <= 0) {
      setStockError('Quantity must be a positive number');
      return false;
    }
    setStockError('');
    return true;
  };

  const openAdd = () => {
    setEditProduct(null);
    setForm(initialForm);
    setFormErrors({});
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setEditProduct(p);
    setForm({ name: p.name, sku: p.sku, category: p.category, unitPrice: p.unitPrice, currentStock: p.currentStock, minStockAlert: p.minStockAlert, location: p.location || '' });
    setFormErrors({});
    setImageFile(null);
    setImagePreview(p.imageUrl || '');
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      let savedId: string;
      if (editProduct) {
        await api.put(`/products/${editProduct.id}`, {
          name: form.name, sku: form.sku, category: form.category,
          unitPrice: form.unitPrice, minStockAlert: form.minStockAlert, location: form.location,
        });
        savedId = editProduct.id;
      } else {
        const res = await api.post('/products', form);
        savedId = res.data.data.id;
      }
      if (imageFile) {
        setUploadingImage(true);
        const fd = new FormData();
        fd.append('image', imageFile);
        await api.post(`/products/${savedId}/image`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setUploadingImage(false);
      }
      setShowModal(false);
      fetchProducts(1);
    } catch (err: any) {
      setFormErrors({ submit: err.response?.data?.message || 'Failed to save product' });
      setUploadingImage(false);
    } finally { setSaving(false); }
  };

  const openStock = (p: any) => {
    setStockProduct(p);
    setStockForm(initialStock);
    setStockError('');
    setShowStockModal(true);
  };

  const handleStockUpdate = async () => {
    if (!validateStock()) return;
    setSaving(true);
    try {
      await api.post(`/products/${stockProduct.id}/stock`, stockForm);
      setShowStockModal(false);
      fetchProducts(meta.page);
    } catch (err: any) {
      setStockError(err.response?.data?.message || 'Failed to update stock');
    } finally { setSaving(false); }
  };

  const openMovements = async (p: any) => {
    setMovementsProduct(p);
    setShowMovements(true);
    try {
      const res = await api.get(`/products/${p.id}/movements`);
      setMovements(res.data.data);
    } catch { setMovements([]); }
  };

  const f = (field: string, val: string) => setForm(p => ({ ...p, [field]: val }));

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Products & Inventory</div>
            <div className="card-subtitle">{meta.total} total products</div>
          </div>
          {canEdit && (
            <button className="btn btn-primary" onClick={openAdd}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Product
            </button>
          )}
        </div>

        <div className="toolbar">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="search-input" placeholder="Search name or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <input className="form-input" style={{ width: 180 }} placeholder="Filter by category..." value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} />
        </div>

        {loading ? <div className="loading-overlay"><div className="spinner" /></div> : (
          <>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Image</th><th>Product</th><th>SKU</th><th>Category</th><th>Unit Price</th><th>Stock</th><th>Location</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr><td colSpan={8}>
                      <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                        <h3>No products found</h3>
                        <p>Add your first product to get started</p>
                      </div>
                    </td></tr>
                  ) : products.map(p => (
                    <tr key={p.id}>
                      <td>
                        {p.imageUrl
                          ? <img src={p.imageUrl} alt={p.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                          : <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.5" style={{ width: 18, height: 18 }}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            </div>
                        }
                      </td>
                      <td><strong>{p.name}</strong></td>
                      <td><code style={{ background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{p.sku}</code></td>
                      <td>{p.category}</td>
                      <td>₹{parseFloat(p.unitPrice).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${p.currentStock <= p.minStockAlert ? 'badge-danger' : 'badge-success'}`}>
                          {p.currentStock} {p.currentStock <= p.minStockAlert && '⚠️'}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.location || '—'}</td>
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

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editProduct ? 'Edit Product' : 'Add Product'}</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {formErrors.submit && (
                <div className="banner banner-danger" style={{ marginBottom: 14 }}>{formErrors.submit}</div>
              )}

              <div className="form-group">
                <label className="form-label">Product Image</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{ width: 72, height: 72, borderRadius: 10, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0, background: 'var(--surface-2)' }}
                  >
                    {imagePreview
                      ? <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.5" style={{ width: 24, height: 24 }}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    }
                  </div>
                  <div>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
                      {imagePreview ? 'Change Image' : 'Upload Image'}
                    </button>
                    <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 5 }}>JPEG, PNG or WebP · Max 5MB</div>
                    {imageFile && <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 3 }}>✓ {imageFile.name}</div>}
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleImageChange} />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input className={`form-input ${formErrors.name ? 'input-error' : ''}`} value={form.name} onChange={e => f('name', e.target.value)} placeholder="Product name" />
                  {formErrors.name && <div className="form-error">{formErrors.name}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">SKU / Code *</label>
                  <input className={`form-input ${formErrors.sku ? 'input-error' : ''}`} value={form.sku} onChange={e => f('sku', e.target.value)} placeholder="e.g. PROD-001" />
                  {formErrors.sku && <div className="form-error">{formErrors.sku}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <input className={`form-input ${formErrors.category ? 'input-error' : ''}`} value={form.category} onChange={e => f('category', e.target.value)} placeholder="e.g. Electronics" />
                  {formErrors.category && <div className="form-error">{formErrors.category}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Unit Price (₹) *</label>
                  <input className={`form-input ${formErrors.unitPrice ? 'input-error' : ''}`} type="number" min="0" step="0.01" value={form.unitPrice} onChange={e => f('unitPrice', e.target.value)} placeholder="0.00" />
                  {formErrors.unitPrice && <div className="form-error">{formErrors.unitPrice}</div>}
                </div>
                {!editProduct ? (
                  <div className="form-group">
                    <label className="form-label">Opening Stock</label>
                    <input className={`form-input ${formErrors.currentStock ? 'input-error' : ''}`} type="number" min="0" value={form.currentStock} onChange={e => f('currentStock', e.target.value)} placeholder="0" />
                    {formErrors.currentStock && <div className="form-error">{formErrors.currentStock}</div>}
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Current Stock</label>
                    <input className="form-input" value={form.currentStock} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                    <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>Use Stock IN/OUT to change stock</div>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Min Stock Alert</label>
                  <input className={`form-input ${formErrors.minStockAlert ? 'input-error' : ''}`} type="number" min="0" value={form.minStockAlert} onChange={e => f('minStockAlert', e.target.value)} placeholder="0" />
                  {formErrors.minStockAlert && <div className="form-error">{formErrors.minStockAlert}</div>}
                </div>
                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                  <label className="form-label">Location / Warehouse</label>
                  <input className="form-input" value={form.location} onChange={e => f('location', e.target.value)} placeholder="e.g. Warehouse A, Rack 3" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || uploadingImage}>
                {uploadingImage ? 'Uploading image…' : saving ? 'Saving…' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Update Modal */}
      {showStockModal && stockProduct && (
        <div className="modal-overlay" onClick={() => setShowStockModal(false)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Update Stock — {stockProduct.name}</div>
              <button className="modal-close" onClick={() => setShowStockModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Current Stock</span>
                <strong style={{ fontSize: 20 }}>{stockProduct.currentStock} units</strong>
              </div>
              {stockError && <div className="banner banner-danger" style={{ marginBottom: 12 }}>{stockError}</div>}
              <div className="form-group">
                <label className="form-label">Movement Type *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {(['IN', 'OUT'] as const).map(t => (
                    <button key={t} onClick={() => setStockForm(s => ({ ...s, type: t }))}
                      className={`btn ${stockForm.type === t ? (t === 'IN' ? 'btn-success' : 'btn-danger') : 'btn-secondary'}`}
                      style={{ justifyContent: 'center' }}>
                      {t === 'IN' ? '↑ Stock IN' : '↓ Stock OUT'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Quantity *</label>
                <input className="form-input" type="number" min="1" value={stockForm.quantity}
                  onChange={e => setStockForm(s => ({ ...s, quantity: e.target.value }))} placeholder="Enter quantity" />
              </div>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <input className="form-input" value={stockForm.reason}
                  onChange={e => setStockForm(s => ({ ...s, reason: e.target.value }))}
                  placeholder="e.g. Purchase order received" />
              </div>
              {stockForm.quantity && parseInt(stockForm.quantity) > 0 && (
                <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 16px', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-3)' }}>Stock after update</span>
                  <strong style={{ color: stockForm.type === 'IN' ? 'var(--green)' : 'var(--red)' }}>
                    {stockForm.type === 'IN'
                      ? stockProduct.currentStock + parseInt(stockForm.quantity)
                      : stockProduct.currentStock - parseInt(stockForm.quantity)} units
                  </strong>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowStockModal(false)}>Cancel</button>
              <button className={`btn ${stockForm.type === 'IN' ? 'btn-success' : 'btn-danger'}`} onClick={handleStockUpdate} disabled={saving}>
                {saving ? 'Updating…' : `${stockForm.type === 'IN' ? '↑ Add' : '↓ Remove'} Stock`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Movement Log Modal */}
      {showMovements && movementsProduct && (
        <div className="modal-overlay" onClick={() => setShowMovements(false)}>
          <div className="modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Stock Movement Log</div>
                <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>{movementsProduct.name} · SKU: {movementsProduct.sku}</div>
              </div>
              <button className="modal-close" onClick={() => setShowMovements(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: 0 }}>
              {movements.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}><p>No stock movements yet</p></div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>Type</th><th>Qty Changed</th><th>Reason</th><th>Created By</th><th>Role</th><th>Timestamp</th></tr>
                    </thead>
                    <tbody>
                      {movements.map((m: any) => (
                        <tr key={m.id}>
                          <td><span className={`badge ${m.type === 'IN' ? 'badge-success' : 'badge-danger'}`}>{m.type}</span></td>
                          <td><strong style={{ color: m.type === 'IN' ? 'var(--green)' : 'var(--red)' }}>{m.type === 'IN' ? '+' : '-'}{m.quantityChanged}</strong></td>
                          <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{m.reason || '—'}</td>
                          <td style={{ fontSize: 12 }}>{m.user?.email || '—'}</td>
                          <td><span className="badge badge-default" style={{ fontSize: 10 }}>{m.user?.role || '—'}</span></td>
                          <td style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{new Date(m.createdAt).toLocaleString()}</td>
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
