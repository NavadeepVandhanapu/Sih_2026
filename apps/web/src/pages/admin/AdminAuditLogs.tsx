import React, { useEffect, useState } from 'react';
import { History, ShieldCheck, User, Clock, Terminal } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/audit-logs')
      .then((res) => res.json())
      .then((data) => setLogs(data))
      .catch((err) => console.error('Failed to load audit logs:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
          Statutory Audit Trail &amp; Non-Repudiation Log
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Immutable event ledger recording consumer grievances, enterprise replies, and officer enforcement orders.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading audit trail...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Actor Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Metadata Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {logs.map((log) => (
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
                            ? 'bg-indigo-100 text-indigo-800'
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
