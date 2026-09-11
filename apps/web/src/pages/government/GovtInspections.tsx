import React, { useEffect, useState } from 'react';
import { Inspection, Company } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Calendar,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const GovtInspections: React.FC = () => {
  const { user } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Inspection Modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [targetCompanyId, setTargetCompanyId] = useState<string>('comp-apex');
  const [assignedOfficer, setAssignedOfficer] = useState<string>('Sunita Meena, IO-LM');
  const [facilityAddress, setFacilityAddress] = useState<string>(
    'Plot 42, Industrial Area, Haridwar, Uttarakhand'
  );
  const [scheduledDate, setScheduledDate] = useState<string>('2026-09-22');
  const [findingsSummary, setFindingsSummary] = useState<string>(
    'Statutory audit for verifying net quantity accuracy, tare weight deduction, and mandatory consumer care labeling on secondary packaging.'
  );
  const [creating, setCreating] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [inspRes, compRes] = await Promise.all([
        fetch('/api/inspections'),
        fetch('/api/companies'),
      ]);
      if (inspRes.ok) setInspections(await inspRes.json());
      if (compRes.ok) setCompanies(await compRes.json());
    } catch (err) {
      console.error('Failed to load inspections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: targetCompanyId,
          assignedOfficerId: user?.id || 'usr-officer',
          assignedOfficerName: assignedOfficer,
          facilityAddress,
          scheduledDate,
          findingsSummary,
        }),
      });
      if (res.ok) {
        confetti({ particleCount: 50, spread: 60 });
        setModalOpen(false);
        await loadData();
      }
    } catch (err) {
      console.error('Failed to schedule inspection:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
            On-Site Enforcement Inspections
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Statutory physical warehouse audits, compounding orders, and facility verifications under Legal Metrology Act, 2009.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-md shadow-blue-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Schedule Field Inspection
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading inspections...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {inspections.map((insp) => (
            <div
              key={insp.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-600">{insp.id}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      insp.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {insp.status}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {insp.company?.name || 'Manufacturing Unit'}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{insp.facilityAddress}</span>
                  </p>
                </div>
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {insp.findingsSummary}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {insp.scheduledDate}
                </span>
                <span className="font-semibold text-slate-700">{insp.assignedOfficerName}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Inspection Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm sm:text-base">Order Statutory Field Audit</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInspection} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Target Packaging Enterprise:
                </label>
                <select
                  value={targetCompanyId}
                  onChange={(e) => setTargetCompanyId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-900"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.riskLevel} Risk • Score: {c.riskScore})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Scheduled Date:</label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Inspector:</label>
                  <input
                    type="text"
                    required
                    value={assignedOfficer}
                    onChange={(e) => setAssignedOfficer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Facility Address / Warehouse:
                </label>
                <input
                  type="text"
                  required
                  value={facilityAddress}
                  onChange={(e) => setFacilityAddress(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Inspection Scope &amp; Target Rules:
                </label>
                <textarea
                  rows={3}
                  value={findingsSummary}
                  onChange={(e) => setFindingsSummary(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 disabled:opacity-60"
                >
                  {creating ? 'Ordering Inspection...' : 'Order Inspection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
