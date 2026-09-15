import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Complaint } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Search, Eye, ArrowRight } from 'lucide-react';

export const GovtComplaints: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/complaints');
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      } else {
        setError('Failed to fetch grievance queue from server.');
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
      setError('Network error connecting to Legal Metrology API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const filtered = complaints.filter((c) => {
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    const matchesSearch =
      searchQuery === '' ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.product?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">
            Grievance Verification Queue
          </h1>
          <p className="text-xs text-slate-400">
            Adjudicate AI-screened packaged commodity grievances under Legal Metrology Act, 2009.
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-500 font-mono">
          {filtered.length} dockets
        </span>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200/80 shadow-sm flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search docket ID, company, product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-medium text-slate-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
          {[
            { key: 'ALL', label: 'All' },
            { key: 'ESCALATED', label: 'Escalated' },
            { key: 'UNDER_COMPANY_REVIEW', label: 'Under Review' },
            { key: 'VERIFIED', label: 'Verified' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1.5 rounded-lg transition shrink-0 ${
                filterStatus === tab.key
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clean Dockets List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
        {error ? (
          <div className="p-8 text-center text-xs text-rose-800 bg-rose-50 space-y-3">
            <p className="font-bold">{error}</p>
            <button
              onClick={loadQueue}
              className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition"
            >
              Retry Loading Queue
            </button>
          </div>
        ) : loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading queue...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No cases match filter.</div>
        ) : (
          filtered.map((comp) => (
            <div
              key={comp.id}
              className="p-4 hover:bg-slate-50/70 transition flex items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">{comp.id}</span>
                  <StatusBadge status={comp.status} size="sm" />
                </div>
                <div className="text-slate-600 font-medium">
                  {comp.product?.name || 'Packaged Product'} •{' '}
                  <span className="text-slate-400">{comp.company?.name}</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                  "{comp.consumerNotes}"
                </p>
              </div>

              <Link
                to={`/government/complaints/${comp.id}`}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 transition shrink-0 flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                Review
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
