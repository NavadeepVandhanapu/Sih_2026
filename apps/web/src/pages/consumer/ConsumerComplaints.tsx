import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Complaint } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Check, ShieldAlert, ChevronRight, MessageSquare } from 'lucide-react';
import confetti from 'canvas-confetti';

function toPlainNote(note?: string): string {
  if (!note) return 'Packaging issue reported on label.';
  if (note.includes('Automated consumer') || note.includes('grievance regarding') || note.includes('statutory')) {
    return 'Customer support email and phone number are missing from the back of the packet.';
  }
  return note;
}

export const ConsumerComplaints: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [escalating, setEscalating] = useState<boolean>(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/complaints?consumerId=${user?.id || 'usr-consumer'}`);
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
        if (data.length > 0 && !selectedComplaint) {
          setSelectedComplaint(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [user]);

  const handleEscalate = async (complaintId: string) => {
    setEscalating(true);
    try {
      const res = await fetch(`/api/complaints/${complaintId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actorId: user?.id || 'usr-consumer',
          reason: 'Consumer requested officer review for resolution.',
        }),
      });
      if (res.ok) {
        confetti({ particleCount: 50, spread: 60 });
        await fetchComplaints();
        if (selectedComplaint && selectedComplaint.id === complaintId) {
          setSelectedComplaint({ ...selectedComplaint, status: 'ESCALATED' });
        }
      }
    } catch (err) {
      console.error('Escalation error:', err);
    } finally {
      setEscalating(false);
    }
  };

  const steps = [
    { label: 'Submitted', key: 'SUBMITTED' },
    { label: 'Sent to Maker', key: 'UNDER_COMPANY_REVIEW' },
    { label: 'Maker Replied', key: 'COMPANY_RESPONDED' },
    { label: 'Officer Review', key: 'ESCALATED' },
    { label: 'Resolved', key: 'RESOLVED' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 0;
      case 'UNDER_COMPANY_REVIEW':
        return 1;
      case 'COMPANY_RESPONDED':
        return 2;
      case 'ESCALATED':
      case 'UNDER_GOVERNMENT_REVIEW':
        return 3;
      case 'VERIFIED':
      case 'RESOLVED':
      case 'CLOSED':
        return 4;
      default:
        return 0;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">
            My Reports
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track packaging issues you reported and check company replies.
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-500 font-mono">
          {complaints.length} Reports
        </span>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-xs">Loading reports...</div>
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 text-xs text-slate-500">
          No reports submitted yet. When you scan a product with issues, you can report it with one click.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left: Complaints List */}
          <div className="md:col-span-5 space-y-2">
            {complaints.map((comp) => {
              const isSelected = selectedComplaint?.id === comp.id;
              return (
                <div
                  key={comp.id}
                  onClick={() => setSelectedComplaint(comp)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition text-left space-y-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold">{comp.id}</span>
                    <StatusBadge
                      status={comp.status}
                      size="sm"
                      className={isSelected ? 'bg-white/10 text-white border-white/20' : ''}
                    />
                  </div>
                  <h4 className="text-xs font-bold truncate">
                    {comp.product?.name || 'Packaged Product'}
                  </h4>
                  <p
                    className={`text-[11px] line-clamp-2 ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    "{toPlainNote(comp.consumerNotes)}"
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right: Detail View */}
          <div className="md:col-span-7">
            {selectedComplaint && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-400 font-mono block">
                      Report {selectedComplaint.id}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedComplaint.product?.name}
                    </h3>
                  </div>
                  <StatusBadge status={selectedComplaint.status} size="md" />
                </div>

                {/* Simple 5-step timeline */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider block">
                    Progress Timeline
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {steps.map((s, idx) => {
                      const cur = getStepIndex(selectedComplaint.status);
                      const isPast = idx < cur;
                      const isCur = idx === cur;
                      return (
                        <div key={idx} className="text-center space-y-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              isPast || isCur ? 'bg-slate-900' : 'bg-slate-100'
                            }`}
                          ></div>
                          <span
                            className={`text-[10px] block font-medium ${
                              isCur
                                ? 'text-slate-900 font-bold'
                                : isPast
                                ? 'text-slate-700'
                                : 'text-slate-300'
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* What you reported */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                  <span className="font-bold text-slate-700 block">What you reported:</span>
                  <p className="text-slate-900 italic">"{toPlainNote(selectedComplaint.consumerNotes)}"</p>
                </div>

                {/* Company response */}
                {selectedComplaint.companyResponse && (
                  <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/60 space-y-2">
                    <span className="font-bold text-emerald-900 block">
                      Company Reply ({selectedComplaint.companyResponse.correctiveActionType || 'Updated'}):
                    </span>
                    <p className="text-emerald-950 bg-white/80 p-3 rounded-xl border border-emerald-100">
                      {selectedComplaint.companyResponse.responseText}
                    </p>
                    {selectedComplaint.companyResponse.correctedLabelImageUrl && (
                      <img
                        src={selectedComplaint.companyResponse.correctedLabelImageUrl}
                        alt="Corrected Label"
                        className="max-h-36 rounded-xl border border-emerald-200 bg-white p-1 mt-1"
                      />
                    )}
                  </div>
                )}

                {/* Officer escalation button if needed */}
                {selectedComplaint.status !== 'ESCALATED' &&
                  selectedComplaint.status !== 'VERIFIED' &&
                  selectedComplaint.status !== 'UNDER_GOVERNMENT_REVIEW' && (
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-slate-400 text-[11px]">
                        Still unsatisfied with the reply?
                      </span>
                      <button
                        onClick={() => handleEscalate(selectedComplaint.id)}
                        disabled={escalating}
                        className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 transition disabled:opacity-60"
                      >
                        {escalating ? 'Sending...' : 'Ask Officer to Review'}
                      </button>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
