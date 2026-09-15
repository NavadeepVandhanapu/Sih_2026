import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import { ScanLine, ShieldAlert, FileText, ArrowRight, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export const ConsumerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [complaintsList, setComplaintsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scansRes, complaintsRes] = await Promise.all([
          fetch('/api/scans'),
          fetch('/api/complaints'),
        ]);

        if (scansRes.ok) {
          const sData = await scansRes.json();
          setRecentScans(sData.slice(0, 5));
        }
        if (complaintsRes.ok) {
          const cData = await complaintsRes.json();
          setComplaintsList(cData.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load consumer dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="text-xs font-bold text-blue-400 tracking-wider uppercase">
            Legal Metrology Consumer Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Citizen Scanner'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Verify mandatory package declarations (MRP, Net Qty, Mfg Date, Consumer Care) under Legal Metrology Rules, 2011. Protect your consumer rights with AI-assisted evidence screening.
          </p>
        </div>

        <Link
          to="/consumer"
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center gap-2 shrink-0 hover:scale-105"
        >
          <ScanLine className="w-4 h-4" />
          Scan New Package
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ScanLine className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block uppercase">Total Packages Scanned</span>
            <span className="text-2xl font-black text-slate-900">{recentScans.length}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block uppercase">Active Grievances</span>
            <span className="text-2xl font-black text-slate-900">{complaintsList.length}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block uppercase">Verified Resolutions</span>
            <span className="text-2xl font-black text-slate-900">
              {complaintsList.filter((c) => c.status === 'RESOLVED' || c.status === 'VERIFIED').length}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Scans & Grievances Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Scans Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-base text-slate-900">Recent Package Scans</h3>
            </div>
            <Link to="/consumer" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Start Scan <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentScans.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs space-y-2">
              <ScanLine className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
              <p>No packaged commodities scanned yet.</p>
              <Link to="/consumer" className="text-blue-600 font-bold hover:underline inline-block">
                Scan your first product label
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentScans.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block truncate">
                      {s.productNameDetected || s.brandDetected || 'Packaged Commodity'}
                    </span>
                    <span className="text-slate-400 text-[11px] block">
                      {new Date(s.createdAt).toLocaleDateString()} • {s.ruleSetVersion}
                    </span>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-700">{s.overallScore}%</span>
                    <StatusBadge status={s.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Complaints Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-base text-slate-900">Grievances &amp; Complaints</h3>
            </div>
            <Link to="/consumer/complaints" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {complaintsList.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs space-y-2">
              <FileText className="w-8 h-8 mx-auto text-slate-300 stroke-[1.5]" />
              <p>No active non-compliance complaints filed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {complaintsList.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block truncate">
                      Grievance {c.id}
                    </span>
                    <span className="text-slate-500 text-[11px] block truncate">
                      {c.consumerNotes || 'Non-compliance reported on label'}
                    </span>
                  </div>
                  <div className="shrink-0">
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {c.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
