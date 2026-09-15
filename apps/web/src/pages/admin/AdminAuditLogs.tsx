import React, { useEffect, useState } from 'react';
import { History, ShieldCheck, User, Clock, Search, Hash, Lock } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      } else {
        setError('Failed to fetch audit log ledger from server.');
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError('Network error connecting to Legal Metrology API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.actorRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entityType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Immutable Audit System
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">
            Statutory Audit Trail &amp; Non-Repudiation Log
          </h1>
          <p className="text-xs text-slate-500">
            Immutable event ledger recording consumer grievances, enterprise responses, and officer enforcement orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Append-Only Verification
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit logs by action, actor, or entity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {filteredLogs.length} Recorded Ledger Events
        </span>
      </div>

      {/* Audit Log Table */}
      {error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center space-y-3">
          <p className="text-xs font-bold text-rose-900">{error}</p>
          <button
            onClick={loadLogs}
            className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition"
          >
            Retry Loading Audit Ledger
          </button>
        </div>
      ) : loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading audit ledger...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Actor Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity Reference</th>
                  <th className="py-3 px-4">Payload Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-blue-600 font-bold">{log.id}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          log.actorRole === 'GOVERNMENT_OFFICER'
                            ? 'bg-rose-100 text-rose-800'
                            : log.actorRole === 'COMPANY'
                            ? 'bg-amber-100 text-amber-800'
                            : log.actorRole === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{log.action}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {log.entityType}: {log.entityId}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {log.detailsJson || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
