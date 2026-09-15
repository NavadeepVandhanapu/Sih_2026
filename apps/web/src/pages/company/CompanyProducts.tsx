import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Product } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Link } from 'react-router-dom';
import { Package, Plus, Search, Sparkles, CheckCircle2, AlertCircle, Edit3 } from 'lucide-react';

export const CompanyProducts: React.FC = () => {
  const { user } = useAuth();
  const companyId = user?.companyId || 'comp-apex';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New product form state
  const [newProductName, setNewProductName] = useState('');
  const [newBrand, setNewBrand] = useState('Apex');
  const [newCategory, setNewCategory] = useState('Packaged Food');
  const [newNetQty, setNewNetQty] = useState('200 g');
  const [newMrp, setNewMrp] = useState('Rs. 40.00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/products?companyId=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        setError('Failed to fetch product catalog from server.');
      }
    } catch (err) {
      console.error('Failed to load product catalog:', err);
      setError('Network error connecting to Legal Metrology API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [companyId]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          name: newProductName,
          brand: newBrand,
          category: newCategory,
          standardNetQuantity: newNetQty,
          standardMrp: newMrp,
          complianceStatus: 'PENDING_AUDIT',
        }),
      });

      if (res.ok) {
        setNewProductName('');
        setShowAddModal(false);
        await loadProducts();
      }
    } catch (err) {
      console.error('Failed to create product:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Manufacturer Portal
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">
            Product Catalog Management
          </h1>
          <p className="text-xs text-slate-500">
            Registered SKUs, label compliance history, and statutory declaration baselines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Register New SKU
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search products by name, brand, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredProducts.length} of {products.length} Products
        </span>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-xs text-rose-800 bg-rose-50 space-y-3">
            <p className="font-bold">{error}</p>
            <button
              onClick={loadProducts}
              className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition"
            >
              Retry Loading Catalog
            </button>
          </div>
        ) : loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 space-y-2">
            <Package className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No products found in catalog matching your filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200/60 flex items-center justify-center shrink-0 text-slate-600">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{p.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {p.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Brand: <span className="text-slate-700 font-medium">{p.brand}</span> • Net Qty:{' '}
                      <span className="text-slate-700 font-medium">{p.standardNetQuantity}</span> • Standard MRP:{' '}
                      <span className="text-slate-700 font-medium">{p.standardMrp}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 justify-between sm:justify-end">
                  <div className="text-right text-xs">
                    <span className="text-slate-400 text-[11px] block">{p.totalScans} Scans Audited</span>
                    <StatusBadge status={p.complianceStatus} size="sm" />
                  </div>

                  <Link
                    to="/company/self-check"
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Self-Check
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Register Product */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4 animate-fadeIn">
            <h2 className="text-base font-extrabold text-slate-900 font-display">Register New Product SKU</h2>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Delight Cream Biscuits Vanilla"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Standard Net Quantity</label>
                  <input
                    type="text"
                    required
                    value={newNetQty}
                    onChange={(e) => setNewNetQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Standard MRP</label>
                  <input
                    type="text"
                    required
                    value={newMrp}
                    onChange={(e) => setNewMrp(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register Product SKU'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
