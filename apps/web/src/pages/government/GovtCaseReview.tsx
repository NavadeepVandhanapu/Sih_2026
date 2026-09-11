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
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const GovtCaseReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [officerNotes, setOfficerNotes] = useState<string>(
    'Verified statutory non-compliance under Rule 6(1)(n). Mandatory consumer care contact omitted on packaging.'
  );
  const [penaltyAmount, setPenaltyAmount] = useState<number>(25000);
  const [submittingDecision, setSubmittingDecision] = useState<boolean>(false);

  const loadCase = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/complaints/${id}`);
      if (res.ok) {
        const data = await res.json();
        setComplaint(data);
      }
    } catch (err) {
      console.error('Failed to load dossier:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadCase();
  }, [id]);

  const handleDecision = async (decision: 'VERIFIED_VIOLATION' | 'REJECTED') => {
    if (!complaint) return;
    setSubmittingDecision(true);

    try {
      const res = await fetch(`/api/complaints/${complaint.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officerId: user?.id || 'usr-officer',
          officerName: user?.name || 'Sunita Meena, IO-LM',
          decision,
          officerNotes,
          penaltyNoticeSection: 'Section 36(1) of Legal Metrology Act, 2009',
          penaltyAmount: decision === 'VERIFIED_VIOLATION' ? penaltyAmount : 0,
        }),
      });

      if (res.ok) {
        if (decision === 'VERIFIED_VIOLATION') {
          confetti({ particleCount: 60, spread: 60 });
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
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-400 text-xs">Loading case...</div>;
  }

  if (!complaint) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-700 text-xs">Docket not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/government/complaints')}
            className="text-xs font-bold text-slate-400 hover:text-slate-800 flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Queue
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold text-slate-900 font-display">
              {complaint.id}
            </h1>
            <StatusBadge status={complaint.status} size="md" />
          </div>
          <p className="text-xs text-slate-400">
            {complaint.product?.name} • {complaint.company?.name}
          </p>
        </div>

        {complaint.scan?.id && (
          <a
            href={`/api/reports/${complaint.scan.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            PDF Dossier
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left: Package Image & Consumer Claim */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="rounded-2xl bg-slate-950 flex items-center justify-center p-3 max-h-[260px] overflow-hidden">
            <img
              src={complaint.scan?.imagePath || '/samples/apex_biscuits.svg'}
              alt="Evidence"
              className="max-h-[240px] w-auto object-contain rounded-lg"
            />
          </div>

          <div className="text-xs space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="font-bold text-slate-800 block">Consumer Statement:</span>
            <p className="text-slate-600 italic">"{complaint.consumerNotes}"</p>
          </div>
        </div>

        {/* Right: Adjudication Workbench */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Officer Adjudication</h3>
            <p className="text-slate-400 text-[11px]">
              Human verification under Section 36(1) Legal Metrology Act, 2009.
            </p>
          </div>

          {/* Core findings */}
          <div className="space-y-1.5">
            {complaint.declarations?.slice(0, 4).map((d: any) => (
              <div
                key={d.id}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
              >
                <span className="font-semibold text-slate-700 truncate mr-2">{d.label}</span>
                <span className="font-mono text-slate-900 text-[11px] truncate">
                  {d.detectedValue || <span className="text-rose-600 font-bold">Missing</span>}
                </span>
              </div>
            ))}
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Order Summary Notes:</label>
            <textarea
              rows={3}
              value={officerNotes}
              onChange={(e) => setOfficerNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Compounding Penalty (₹):</label>
            <input
              type="number"
              value={penaltyAmount}
              onChange={(e) => setPenaltyAmount(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => handleDecision('VERIFIED_VIOLATION')}
              disabled={submittingDecision}
              className="py-2.5 px-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Verify Violation
            </button>
            <button
              onClick={() => handleDecision('REJECTED')}
              disabled={submittingDecision}
              className="py-2.5 px-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <X className="w-3.5 h-3.5" />
              Dismiss Case
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
