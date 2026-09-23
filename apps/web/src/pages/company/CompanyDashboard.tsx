import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Company, Product, Complaint } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Link } from 'react-router-dom';
import { Sparkles, FileText, ArrowRight } from 'lucide-react';

export const CompanyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const companyId = user?.companyId || 'comp-apex';

  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        setLoading(true);
        const [compRes, prodRes, complaintsRes] = await Promise.all([
          fetch(`/api/companies/${companyId}`),
          fetch(`/api/products?companyId=${companyId}`),
          fetch(`/api/complaints?companyId=${companyId}`),
        ]);

        if (compRes.ok) setCompany(await compRes.json());
        if (prodRes.ok) setProducts(await prodRes.json());
        if (complaintsRes.ok) setComplaints(await complaintsRes.json());
      } catch (err) {
        console.error('Failed to load company dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCompanyData();
  }, [companyId]);

  const activeComplaints = complaints.filter(
    (c) => !['RESOLVED', 'CLOSED', 'REJECTED'].includes(c.status)
  );

  return (
    <div className="min-h-screen bg-slate-50 relative pb-12">
      {/* BACKGROUND GLOW */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-300/10 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-indigo-300/10 blur-[80px]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Sleek Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider mb-2 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Manufacturer Dashboard</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 font-display">
              {company?.name || 'Apex Foods Pvt Ltd'}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Reg: {company?.registrationNo} • {company?.state}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/company/self-check"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 hover:border-blue-200 text-slate-700 transition-all flex items-center gap-2 shadow-sm shadow-slate-200/50"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              Check New Label
            </Link>
            <Link
              to="/company/complaints"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all flex items-center gap-2 shadow-md shadow-slate-900/20"
            >
              <FileText className="w-4 h-4" />
              Customer Reports ({activeComplaints.length})
            </Link>
          </div>
        </div>

        {/* 3 Clean Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/40 space-y-3 transition-transform hover:-translate-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Label Health Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-900 font-display">
                {company?.complianceRate || 71}%
              </span>
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Needs Attention</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                style={{ width: `${company?.complianceRate || 71}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/40 space-y-3 transition-transform hover:-translate-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Open Reports</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-amber-600 font-display">
                {activeComplaints.length}
              </span>
              <span className="text-xs font-bold text-slate-400">pending replies</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Reply to buyers to resolve reports quickly</p>
          </div>

          <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/40 space-y-3 transition-transform hover:-translate-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inspection Priority</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-rose-600 font-display">
                {company?.riskScore || 78}
              </span>
              <span className="text-xs font-bold text-slate-400">/100</span>
            </div>
            <div className="inline-flex">
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-full border border-rose-100">
                RISK LEVEL: {company?.riskLevel || 'HIGH'}
              </span>
            </div>
          </div>
        </div>

        {/* Clean Product List */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/40 overflow-hidden mt-8">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-base font-extrabold text-slate-900">Registered Product Portfolio</h3>
            <p className="text-xs text-slate-500 mt-1">Products currently tracked in VidhiTrace platform</p>
          </div>
          <div className="divide-y divide-slate-100 p-2">
            {products.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 rounded-2xl transition-colors cursor-default">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">{p.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-500 text-[11px] font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                      {p.brand}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {p.standardNetQuantity} • {p.standardMrp}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400 text-[11px] font-medium hidden sm:inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {p.totalScans} AI Scans
                  </span>
                  <StatusBadge status={p.complianceStatus} size="sm" />
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm font-medium">
                No products found. Add products to start tracking.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
