import React, { useEffect, useState } from 'react';
import { Sliders, Plus, CheckCircle2, ShieldCheck, GitBranch, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RuleVersion {
  id: string;
  version: string;
  statutoryAuthority: string;
  status: 'DRAFT' | 'REVIEW' | 'ACTIVE' | 'RETIRED';
  ruleSetJson: string;
  createdBy: string;
  effectiveDate: string;
  createdAt: string;
}

export const AdminRules: React.FC = () => {
  const [versions, setVersions] = useState<RuleVersion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showDraftModal, setShowDraftModal] = useState<boolean>(false);

  // New Draft Version form state
  const [newVersionNum, setNewVersionNum] = useState('2026.2');
  const [newAuthority, setNewAuthority] = useState(
    'Legal Metrology (Packaged Commodities) Rules, 2011 (Amendment 2026)'
  );
  const [newEffectiveDate, setNewEffectiveDate] = useState('2026-10-01');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/rules');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.ruleVersions)
          ? data.ruleVersions
          : [];
        setVersions(list);
      } else {
        setError('Failed to fetch statutory rule versions from server.');
      }
    } catch (err) {
      console.error('Failed to load rules:', err);
      setError('Network error connecting to Legal Metrology API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleStatusChange = async (id: string, newStatus: 'DRAFT' | 'REVIEW' | 'ACTIVE' | 'RETIRED') => {
    try {
      const res = await fetch(`/api/admin/rules/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        if (newStatus === 'ACTIVE') {
          confetti({ particleCount: 60, spread: 60 });
        }
        await loadRules();
      }
    } catch (err) {
      console.error('Failed to transition rule version state:', err);
    }
  };

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: newVersionNum,
          statutoryAuthority: newAuthority,
          effectiveDate: newEffectiveDate,
          rules: [
            {
              ruleId: 'RULE-01',
              name: 'Manufacturer Identity & Address',
              sectionReference: 'Rule 6(1)(a)',
              category: 'IDENTITY',
              severity: 'HIGH',
              expectedRequirement: 'Name and complete registered address of manufacturer or packer.',
            },
            {
              ruleId: 'RULE-02',
              name: 'Country of Origin',
              sectionReference: 'Rule 6(1)(aa)',
              category: 'ORIGIN',
              severity: 'HIGH',
              expectedRequirement: 'Mandatory explicit statement for imported goods.',
            },
            {
              ruleId: 'RULE-03',
              name: 'Standard Net Quantity',
              sectionReference: 'Rule 6(1)(c)',
              category: 'MEASUREMENT',
              severity: 'HIGH',
              expectedRequirement: 'Standard unit of weight, measure, or number with prescribed symbol.',
            },
            {
              ruleId: 'RULE-04',
              name: 'Date of Packing / Import',
              sectionReference: 'Rule 6(1)(e)',
              category: 'TEMPORAL',
              severity: 'MEDIUM',
              expectedRequirement: 'Month and year of manufacture or packing.',
            },
            {
              ruleId: 'RULE-05',
              name: 'Maximum Retail Price (MRP)',
              sectionReference: 'Rule 6(1)(d)',
              category: 'COMMERCIAL',
              severity: 'HIGH',
              expectedRequirement: 'MRP in INR inclusive of all taxes.',
            },
            {
              ruleId: 'RULE-06',
              name: 'Consumer Care Cell Details',
              sectionReference: 'Rule 6(1)(n)',
              category: 'CONSUMER_RIGHTS',
              severity: 'HIGH',
              expectedRequirement: 'Name, address, telephone number, and email of person or office for consumer complaints.',
            },
          ],
        }),
      });

      if (res.ok) {
        setShowDraftModal(false);
        await loadRules();
      }
    } catch (err) {
      console.error('Failed to create draft rule:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Rule Lifecycle Engine
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">
            Versioned Statutory Compliance Rules
          </h1>
          <p className="text-xs text-slate-500">
            Lifecycle state machine (DRAFT &rarr; REVIEW &rarr; ACTIVE &rarr; RETIRED) for Legal Metrology evaluation rules.
          </p>
        </div>

        <button
          onClick={() => setShowDraftModal(true)}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Draft Rule Version
        </button>
      </div>

      {/* Rules Registry List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-xs text-rose-800 bg-rose-50 space-y-3">
            <p className="font-bold">{error}</p>
            <button
              onClick={loadRules}
              className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition"
            >
              Retry Loading Rules
            </button>
          </div>
        ) : loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading rule versions...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {versions.map((v) => {
              const authority =
                v.statutoryAuthority ||
                (v as any).name ||
                'Legal Metrology (Packaged Commodities) Rules, 2011';
              const effDate = v.effectiveDate || (v as any).effectiveFrom || '2026-07-01';
              const author = v.createdBy || 'DoCA Enforcement';

              return (
                <div key={v.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-base font-display">
                        Version {v.version}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase ${
                          v.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : v.status === 'REVIEW'
                            ? 'bg-amber-100 text-amber-800'
                            : v.status === 'DRAFT'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {v.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{authority}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Effective Date: {effDate} • Created by: {author}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {v.status === 'DRAFT' && (
                      <button
                        onClick={() => handleStatusChange(v.id, 'REVIEW')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 transition"
                      >
                        Submit for Review
                      </button>
                    )}
                    {v.status === 'REVIEW' && (
                      <button
                        onClick={() => handleStatusChange(v.id, 'ACTIVE')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs"
                      >
                        Activate Version
                      </button>
                    )}
                    {v.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleStatusChange(v.id, 'RETIRED')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      >
                        Retire Version
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Draft Rule */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4 animate-fadeIn">
            <h2 className="text-base font-extrabold text-slate-900 font-display">Create Draft Rule Version</h2>
            <form onSubmit={handleCreateDraft} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Version Number</label>
                <input
                  type="text"
                  required
                  value={newVersionNum}
                  onChange={(e) => setNewVersionNum(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Statutory Authority Description</label>
                <input
                  type="text"
                  required
                  value={newAuthority}
                  onChange={(e) => setNewAuthority(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Effective Date</label>
                <input
                  type="date"
                  required
                  value={newEffectiveDate}
                  onChange={(e) => setNewEffectiveDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Draft...' : 'Create Draft Version'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDraftModal(false)}
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
