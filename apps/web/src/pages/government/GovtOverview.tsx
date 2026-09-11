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
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Sleek Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">
            Enforcement Command Center
          </h1>
          <p className="text-xs text-slate-400">
            National screening intelligence under Legal Metrology (Packaged Commodities) Rules, 2011.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/government/complaints"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Verification Queue
          </Link>
          <Link
            to="/government/inspections"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" />
            Inspections
          </Link>
        </div>
      </div>

      {/* 4 Minimal Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 block">Total Scanned</span>
          <span className="text-xl font-extrabold text-slate-900 font-display">
            {stats.totalScans.toLocaleString()}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-semibold text-amber-600 block">AI-Flagged Issues</span>
          <span className="text-xl font-extrabold text-amber-600 font-display">
            {stats.potentialViolations.toLocaleString()}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 block">Active Complaints</span>
          <span className="text-xl font-extrabold text-slate-900 font-display">
            {stats.activeComplaints}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-semibold text-rose-600 block">High Risk Firms</span>
          <span className="text-xl font-extrabold text-rose-600 font-display">
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
  );
};
