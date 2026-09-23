import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ShieldAlert, ArrowRight, Building2 } from 'lucide-react';

export const GovtOverview: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/government/analytics')
      .then((res) => res.json())
      .then((data) => setAnalytics(data))
      .catch((err) => console.error('Failed to load analytics:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !analytics) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-slate-400 text-xs">
        Loading Command Center...
      </div>
    );
  }

  const { stats, violationsByRule, violationsByCategory, riskWatchlist } = analytics;

  return (
    <div className="min-h-screen bg-slate-50 relative pb-12">
      {/* BACKGROUND GLOW */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-20 right-20 w-[400px] h-[400px] rounded-full bg-blue-300/10 blur-[80px]" />
        <div className="absolute bottom-20 left-20 w-[400px] h-[400px] rounded-full bg-amber-300/10 blur-[80px]" />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Sleek Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider mb-2 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Government Command Center</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 font-display">
              National Enforcement Docket
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Real-time screening intelligence and enforcement queue under Legal Metrology Rules, 2011.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/government/complaints"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all flex items-center gap-2 shadow-md shadow-slate-900/20"
            >
              <ShieldAlert className="w-4 h-4" />
              Verification Queue
            </Link>
            <Link
              to="/government/inspections"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-50 hover:border-blue-200 text-slate-700 transition-all flex items-center gap-2 shadow-sm shadow-slate-200/50"
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              Inspections
            </Link>
          </div>
        </div>

        {/* 4 Minimal Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/40 hover:-translate-y-1 transition-transform">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Scanned</span>
            <span className="text-3xl font-extrabold text-slate-900 font-display">
              {stats.totalScans.toLocaleString()}
            </span>
          </div>
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/40 hover:-translate-y-1 transition-transform">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block mb-1">AI-Flagged Issues</span>
            <span className="text-3xl font-extrabold text-amber-600 font-display">
              {stats.potentialViolations.toLocaleString()}
            </span>
          </div>
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/40 hover:-translate-y-1 transition-transform">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Active Complaints</span>
            <span className="text-3xl font-extrabold text-blue-600 font-display">
              {stats.activeComplaints}
            </span>
          </div>
          <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/40 hover:-translate-y-1 transition-transform">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block mb-1">High Risk Firms</span>
            <span className="text-3xl font-extrabold text-rose-600 font-display">
              {stats.highRiskCompanies}
            </span>
          </div>
        </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Violations by Rule */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Violations by Legal Rule
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={violationsByRule} layout="vertical" margin={{ left: 10, right: 10 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis
                  type="category"
                  dataKey="ruleName"
                  width={120}
                  tick={{ fontSize: 10, fill: '#334155' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Violations by Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Commodity Group Breakdown
          </h3>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={violationsByCategory}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={65}
                  paddingAngle={3}
                >
                  {violationsByCategory.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-1 text-[11px] text-slate-500">
            {violationsByCategory.map((cat: any) => (
              <span key={cat.category} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.fill }} />
                {cat.category}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* High Risk Firms Watchlist */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          High-Risk Packaging Enterprise Watchlist
        </h3>
        <div className="divide-y divide-slate-100 text-xs">
          {riskWatchlist.slice(0, 4).map((c: any) => (
            <div key={c.id} className="py-2.5 flex items-center justify-between gap-2">
              <div>
                <span className="font-bold text-slate-900 block">{c.name}</span>
                <span className="text-slate-400 text-[11px]">
                  {c.category} • State: {c.state} • {c.activeComplaintsCount} Active Reports
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`font-mono font-bold block ${
                    c.riskScore > 70 ? 'text-rose-600' : 'text-amber-600'
                  }`}
                >
                  Risk: {c.riskScore}/100
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
};
