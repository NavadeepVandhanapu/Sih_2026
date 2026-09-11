import React, { useEffect, useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

export const AdminRules: React.FC = () => {
  const [ruleData, setRuleData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/rules')
      .then((res) => res.json())
      .then((data) => setRuleData(data))
      .catch((err) => console.error('Failed to load rules:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !ruleData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center text-slate-400">
        Loading Legal Metrology Rule Registry...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
            <Sliders className="w-3.5 h-3.5" />
            Statutory Rule Configuration Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display">
            {ruleData.ruleSet}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
            <span>
              Active Version: <strong className="font-mono text-emerald-400">v{ruleData.version}</strong>
            </span>
            <span>•</span>
            <span>Effective Date: {ruleData.effectiveDate}</span>
            <span>•</span>
            <span>Authority: {ruleData.statutoryAuthority}</span>
          </div>
        </div>
      </div>

      {/* Rules Registry Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            Enforced Statutory Rule Definitions ({ruleData.rules.length})
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
            Engine Status: ACTIVE
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider bg-slate-50">
                <th className="py-3 px-3">Rule Identifier</th>
                <th className="py-3 px-3">Statutory Title</th>
                <th className="py-3 px-3">Statute Reference</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Mandatory Requirement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ruleData.rules.map((rule: any) => (
                <tr key={rule.ruleId} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-3 font-mono font-bold text-blue-600">{rule.ruleId}</td>
                  <td className="py-3.5 px-3 font-bold text-slate-900">{rule.name}</td>
                  <td className="py-3.5 px-3 text-slate-600 font-medium">
                    {rule.sectionReference}
                  </td>
                  <td className="py-3.5 px-3 text-slate-500">{rule.category}</td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        rule.severity === 'HIGH'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rule.severity}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-700 max-w-xs">{rule.expectedRequirement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
