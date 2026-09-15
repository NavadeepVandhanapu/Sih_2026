import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Company, Product, Complaint } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Link } from 'react-router-dom';
import { Sparkles, FileText, Package, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export const CompanyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const companyId = user?.companyId || 'comp-apex';

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [compRes, prodRes, complaintsRes] = await Promise.all([
        fetch(`/api/companies/${companyId}`),
        fetch(`/api/products?companyId=${companyId}`),
        fetch(`/api/complaints?companyId=${companyId}`),
      ]);

      if (compRes.ok) setCompany(await compRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (complaintsRes.ok) setComplaints(await complaintsRes.json());

      if (!compRes.ok && !prodRes.ok && !complaintsRes.ok) {
        setError('Failed to fetch company dashboard data from server.');
      }
    } catch (err) {
      console.error('Failed to load company dashboard:', err);
      setError('Network error loading enterprise dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanyData();
  }, [companyId]);

  const activeComplaints = complaints.filter(
    (c) => !['RESOLVED', 'CLOSED', 'REJECTED'].includes(c.status)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center space-y-2">
          <p className="text-xs font-bold text-rose-900">{error}</p>
          <button
            onClick={loadCompanyData}
            className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition"
          >
            Retry Loading Dashboard
          </button>
        </div>
      )}
      {/* Sleek Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">
            {company?.name || 'Apex Foods Pvt Ltd'}
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Reg: {company?.registrationNo} • {company?.state} • Legal Metrology Portal
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/company/products"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5 text-slate-600" />
            SKU Catalog ({products.length})
          </Link>
          <Link
            to="/company/self-check"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Check New Label
          </Link>
          <Link
            to="/company/complaints"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            Reports ({activeComplaints.length})
          </Link>
        </div>
      </div>

      {/* 3 Clean Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-400">Label Health Score</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-display">
              {company?.complianceRate || 71}%
            </span>
            <span className="text-xs text-amber-600 font-medium">Action Recommended</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-slate-900 h-full rounded-full"
              style={{ width: `${company?.complianceRate || 71}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-400 font-display">Active Customer Reports</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 font-display">
              {activeComplaints.length}
            </span>
            <span className="text-xs text-slate-400">Pending Response</span>
          </div>
          <p className="text-[11px] text-slate-400">Reply to buyers to resolve statutory reports</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-400">Inspection Priority Index</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 font-display">
              {company?.riskScore || 78}/100
            </span>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
              {company?.riskLevel || 'HIGH'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Based on unresolved consumer notices</p>
        </div>
      </div>

      {/* Registered Products Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Registered SKU Catalog</h3>
          <Link
            to="/company/products"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Manage Catalog
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {products.map((p) => (
            <div key={p.id} className="py-3 flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-900 block">{p.name}</span>
                <span className="text-slate-400 text-[11px]">
                  {p.brand} • {p.standardNetQuantity} • {p.standardMrp}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-[11px] hidden sm:inline">
                  {p.totalScans} scans
                </span>
                <StatusBadge status={p.complianceStatus} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

