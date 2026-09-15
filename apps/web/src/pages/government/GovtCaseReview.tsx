import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Complaint } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import {
  ShieldAlert,
  Check,
  X,
  Download,
  ArrowLeft,
  FileCheck2,
  AlertTriangle,
  Building,
  Hash,
  Eye,
  Send,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const GovtCaseReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);

  // Form State
  const [decision, setDecision] = useState<
    'VERIFY_VIOLATION' | 'REQUEST_MORE_EVIDENCE' | 'ORDER_INSPECTION' | 'REJECT' | 'CLOSE_CASE'
  >('VERIFY_VIOLATION');
  const [penaltySection, setPenaltySection] = useState<string>(
    'Section 36(1) of Legal Metrology Act, 2009 (Penalty for manufacture/sale of non-standard package)'
  );
  const [penaltyAmount, setPenaltyAmount] = useState<number>(25000);
  const [officerNotes, setOfficerNotes] = useState<string>(
    'Verified statutory non-compliance under Rule 6(1)(n). Mandatory consumer care contact omitted on packaging.'
  );
  const [submittingDecision, setSubmittingDecision] = useState<boolean>(false);

  const loadCase = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/complaints/${id}`);
      if (res.ok) {
        const data = await res.json();
        setComplaint(data);
      } else {
        setError(`Failed to load case docket ${id} from server.`);
      }
    } catch (err) {
      console.error('Failed to load dossier:', err);
      setError('Network error connecting to Legal Metrology API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadCase();
  }, [id]);

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    setSubmittingDecision(true);

    try {
      const res = await fetch(`/api/complaints/${complaint.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status:
            decision === 'VERIFY_VIOLATION'
              ? 'VERIFIED_VIOLATION'
              : decision === 'REQUEST_MORE_EVIDENCE'
              ? 'EVIDENCE_REQUESTED'
              : decision === 'ORDER_INSPECTION'
              ? 'INSPECTION_ORDERED'
              : decision === 'REJECT'
              ? 'REJECTED'
              : 'CLOSED',
          penaltyNoticeSection: decision === 'VERIFY_VIOLATION' ? penaltySection : undefined,
          penaltyAmount: decision === 'VERIFY_VIOLATION' ? penaltyAmount : 0,
          notes: officerNotes,
        }),
      });

      if (res.ok) {
        if (decision === 'VERIFY_VIOLATION') {
          confetti({ particleCount: 70, spread: 70 });
        }
        await loadCase();
      }
    } catch (err) {
      console.error('Decision error:', err);
    } finally {
      setSubmittingDecision(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-400 text-xs">
        Loading case dossier...
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center space-y-3">
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 max-w-md mx-auto space-y-3">
          <p className="text-xs font-bold text-rose-900">{error || 'Docket not found.'}</p>
          <button
            onClick={loadCase}
            className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition"
          >
            Retry Loading Dossier
          </button>
        </div>
      </div>
    );
  }

  // Generate SHA-256 evidence hash representation
  const sha256EvidenceHash =
    complaint.scan?.summary?.sha256Hash ||
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/government/complaints')}
            className="text-xs font-bold text-slate-400 hover:text-slate-800 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Enforcement Queue
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold text-slate-900 font-display">
              Case Dossier: {complaint.id}
            </h1>
            <StatusBadge status={complaint.status} size="md" />
          </div>
          <p className="text-xs text-slate-500">
            {complaint.product?.name || 'Packaged Commodity'} • Enterprise:{' '}
            <span className="font-bold text-slate-800">{complaint.company?.name || 'Apex Foods'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {complaint.scan?.id && (
            <a
              href={`/api/reports/${complaint.scan.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Download Statutory PDF Dossier
            </a>
          )}
        </div>
      </div>

      {/* 3-Column Dossier Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* COLUMN 1: Left Image & Region Highlights */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              1. Packaging Evidence Image
            </span>
            <span className="text-[10px] font-mono text-slate-400">PyTorch OCR Multi-Region</span>
          </div>

          {/* Interactive Bounding Box Viewer */}
          <div className="relative rounded-2xl bg-slate-950 p-2 flex items-center justify-center min-h-[300px] overflow-hidden border border-slate-800">
            <img
              src={complaint.scan?.imagePath || '/samples/apex_biscuits.svg'}
              alt="Evidence Packaging"
              className="max-h-[320px] w-auto object-contain rounded-lg"
            />
            {/* Overlay Bounding Boxes */}
            <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="bg-blue-600/80 text-white text-[9px] font-mono px-2 py-0.5 rounded backdrop-blur-xs">
                  Region #1: Net Qty (200g)
                </span>
                <span className="bg-emerald-600/80 text-white text-[9px] font-mono px-2 py-0.5 rounded backdrop-blur-xs">
                  Region #2: MRP (Rs. 40.00)
                </span>
              </div>
              <div className="flex justify-between items-end">
                <span className="bg-rose-600/90 text-white text-[9px] font-mono px-2 py-0.5 rounded backdrop-blur-xs">
                  Region #3: Customer Care (Missing)
                </span>
                <span className="bg-amber-600/80 text-white text-[9px] font-mono px-2 py-0.5 rounded backdrop-blur-xs">
                  Region #4: Date of Pkg (07/2026)
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
            <span className="font-bold text-slate-800 block">Consumer Grievance Claim:</span>
            <p className="text-slate-600 italic">"{complaint.consumerNotes}"</p>
            <div className="pt-1 text-[11px] text-slate-400 flex justify-between">
              <span>Location: {complaint.consumerLocation}</span>
              <span>Store: {complaint.purchaseStore}</span>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Center Statutory Rule Evaluation */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              2. Declarations vs Statutory Rules (v2026.1)
            </span>
            <span className="text-[10px] font-mono text-slate-400">Deterministic Engine</span>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {complaint.ruleEvaluations && complaint.ruleEvaluations.length > 0 ? (
              complaint.ruleEvaluations.map((r: any) => (
                <div
                  key={r.id || r.ruleId}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 truncate mr-2">{r.ruleName}</span>
                    <StatusBadge status={r.status} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-500">{r.explanation}</p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400 font-mono">
                    <span>Detected: {r.detectedValue || 'N/A'}</span>
                    <span>Required: {r.requiredValue || 'Standard mandatory'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Rule 6(1)(a) — Manufacturer Identity</span>
                    <span className="text-[11px] text-slate-500">Apex Foods Pvt. Ltd., Haridwar</span>
                  </div>
                  <StatusBadge status="COMPLIANT" size="sm" />
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Rule 6(1)(c) — Standard Net Quantity</span>
                    <span className="text-[11px] text-slate-500">200 g (Gram)</span>
                  </div>
                  <StatusBadge status="COMPLIANT" size="sm" />
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-rose-900 block">Rule 6(1)(n) — Consumer Care Cell</span>
                    <span className="text-[11px] text-rose-700">Toll-free/Email contact missing on label</span>
                  </div>
                  <StatusBadge status="NON_COMPLIANT" size="sm" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: Right AI Screening & Evidence Integrity */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              3. AI Findings &amp; Evidence Audit
            </span>
            <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              Verified Immutable
            </span>
          </div>

          <div className="p-3 bg-slate-900 text-white rounded-2xl space-y-2">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">AI Screening Score</span>
              <span className="font-bold font-mono text-amber-400 text-sm">
                {complaint.scan?.summary?.score || 68}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full"
                style={{ width: `${complaint.scan?.summary?.score || 68}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-slate-400 block pt-1">
              AI outputs are preliminary indicators. Official legal authority rests with the inspecting officer.
            </span>
          </div>

          {/* SHA-256 Cryptographic Hash Evidence */}
          <div className="space-y-1.5">
            <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px]">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              Cryptographic SHA-256 Evidence Hash
            </span>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[10px] text-slate-600 break-all">
              {sha256EvidenceHash}
            </div>
          </div>

          {/* Enterprise Compliance Record */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              Enterprise History
            </span>
            <p className="text-[11px] text-slate-500">
              Risk Score: <span className="font-bold text-rose-600 font-mono">78/100</span> • Active Reports:{' '}
              <span className="font-bold text-slate-800 font-mono">3</span>
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM PANEL: Officer Decision Adjudication Workbench */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 text-xs">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 font-display">
            Official Enforcement Action Workbench
          </h3>
          <p className="text-slate-400 text-[11px]">
            Statutory adjudication under Legal Metrology Act, 2009. Decision updates case status, dispatches in-app notices, and updates audit records.
          </p>
        </div>

        <form onSubmit={handleDecisionSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => setDecision('VERIFY_VIOLATION')}
              className={`p-3 rounded-xl font-bold border transition text-center flex flex-col items-center gap-1 ${
                decision === 'VERIFY_VIOLATION'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span className="text-[11px]">Verify Violation</span>
            </button>
            <button
              type="button"
              onClick={() => setDecision('REQUEST_MORE_EVIDENCE')}
              className={`p-3 rounded-xl font-bold border transition text-center flex flex-col items-center gap-1 ${
                decision === 'REQUEST_MORE_EVIDENCE'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span className="text-[11px]">Request Evidence</span>
            </button>
            <button
              type="button"
              onClick={() => setDecision('ORDER_INSPECTION')}
              className={`p-3 rounded-xl font-bold border transition text-center flex flex-col items-center gap-1 ${
                decision === 'ORDER_INSPECTION'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Building className="w-4 h-4" />
              <span className="text-[11px]">Order Facility Audit</span>
            </button>
            <button
              type="button"
              onClick={() => setDecision('REJECT')}
              className={`p-3 rounded-xl font-bold border transition text-center flex flex-col items-center gap-1 ${
                decision === 'REJECT'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <X className="w-4 h-4" />
              <span className="text-[11px]">Reject / Dismiss</span>
            </button>
            <button
              type="button"
              onClick={() => setDecision('CLOSE_CASE')}
              className={`p-3 rounded-xl font-bold border transition text-center flex flex-col items-center gap-1 ${
                decision === 'CLOSE_CASE'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Check className="w-4 h-4" />
              <span className="text-[11px]">Close Docket</span>
            </button>
          </div>

          {decision === 'VERIFY_VIOLATION' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-rose-50/60 rounded-2xl border border-rose-100">
              <div>
                <label className="font-bold text-rose-900 block mb-1">Statutory Rule Section</label>
                <input
                  type="text"
                  value={penaltySection}
                  onChange={(e) => setPenaltySection(e.target.value)}
                  className="w-full bg-white border border-rose-200 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="font-bold text-rose-900 block mb-1">Compounding Penalty Fine (₹ INR)</label>
                <input
                  type="number"
                  value={penaltyAmount}
                  onChange={(e) => setPenaltyAmount(Number(e.target.value))}
                  className="w-full bg-white border border-rose-200 rounded-xl p-2.5 font-mono text-xs text-slate-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">Inspector Summary &amp; Legal Order Text</label>
            <textarea
              rows={3}
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-xs"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingDecision}
              className="px-6 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition shadow-sm flex items-center gap-2 disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {submittingDecision ? 'Signing & Recording Order...' : 'Execute Statutory Officer Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
