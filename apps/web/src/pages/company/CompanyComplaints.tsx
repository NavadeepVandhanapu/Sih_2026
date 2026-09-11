import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Complaint } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Send, Check, Search, Sparkles, MapPin, Calendar, Store, Image as ImageIcon } from 'lucide-react';
import confetti from 'canvas-confetti';

// Helper to sanitize any legacy technical jargon into everyday words
function toPlainNote(note?: string): string {
  if (!note) return 'Customer reported an issue with the product packaging.';
  if (note.includes('Automated consumer') || note.includes('grievance regarding') || note.includes('statutory')) {
    return 'Customer support email and phone number are missing from the back of the packet.';
  }
  return note;
}

export const CompanyComplaints: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'replied'>('all');

  // Response Form State in plain everyday language
  const [responseText, setResponseText] = useState<string>(
    'Thank you for letting us know. We have updated our packaging design so that our support email and toll-free phone number are clearly printed on the front label.'
  );
  const [actionType, setActionType] = useState<string>('Updated packaging label');
  const [attachProof, setAttachProof] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const companyId = user?.companyId || 'comp-apex';

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/complaints?companyId=${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
        if (data.length > 0 && !selectedComplaint) {
          setSelectedComplaint(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [companyId]);

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/complaints/${selectedComplaint.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          responseText,
          correctiveActionType: actionType,
          correctedLabelImageUrl: attachProof ? '/samples/apex_biscuits_corrected.svg' : undefined,
          batchNumber: 'APX-9824',
        }),
      });

      if (res.ok) {
        confetti({ particleCount: 50, spread: 60 });
        await loadComplaints();
        setSelectedComplaint({
          ...selectedComplaint,
          status: 'COMPANY_RESPONDED',
          companyResponse: {
            responseText,
            correctiveActionType: actionType,
            correctedLabelImageUrl: attachProof ? '/samples/apex_biscuits_corrected.svg' : undefined,
            batchNumber: 'APX-9824',
            submittedAt: new Date().toISOString(),
          },
        });
      }
    } catch (err) {
      console.error('Failed to submit response:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter complaints
  const filteredComplaints = complaints.filter((comp) => {
    const matchesSearch =
      (comp.product?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      toPlainNote(comp.consumerNotes).toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'pending') {
      return comp.status !== 'COMPANY_RESPONDED' && comp.status !== 'RESOLVED' && comp.status !== 'CLOSED';
    }
    if (filterTab === 'replied') {
      return comp.status === 'COMPANY_RESPONDED' || comp.status === 'RESOLVED';
    }
    return true;
  });

  const pendingCount = complaints.filter(
    (c) => c.status !== 'COMPANY_RESPONDED' && c.status !== 'RESOLVED' && c.status !== 'CLOSED'
  ).length;
  const repliedCount = complaints.filter(
    (c) => c.status === 'COMPANY_RESPONDED' || c.status === 'RESOLVED'
  ).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Customer Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Packaging issues reported by shoppers, and your direct replies.
          </p>
        </div>

        {/* Clean Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 self-start text-xs font-medium">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterTab === 'all'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All ({complaints.length})
          </button>
          <button
            onClick={() => setFilterTab('pending')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              filterTab === 'pending'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Needs Reply</span>
            {pendingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilterTab('replied')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterTab === 'replied'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Replied ({repliedCount})
          </button>
        </div>
      </div>

      {/* Main 2-Column Minimal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Search & Clean Reports List */}
        <div className="lg:col-span-5 space-y-3">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reports or products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200/80 rounded-xl placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 transition"
            />
          </div>

          {/* List of Cards */}
          <div className="space-y-2">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-100">
                Loading reports...
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-100">
                No reports found.
              </div>
            ) : (
              filteredComplaints.map((comp) => {
                const isSelected = selectedComplaint?.id === comp.id;
                const cleanNote = toPlainNote(comp.consumerNotes);
                const shortId = comp.id.replace('LM-2026-00', '#');

                return (
                  <div
                    key={comp.id}
                    onClick={() => setSelectedComplaint(comp)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition text-left space-y-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white border-slate-200/70 hover:border-slate-300 text-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] font-mono ${
                          isSelected ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        {shortId}
                      </span>
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
                      className={`text-[11px] line-clamp-2 leading-relaxed ${
                        isSelected ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      "{cleanNote}"
                    </p>

                    <div
                      className={`text-[10px] flex items-center justify-between pt-1 border-t ${
                        isSelected ? 'border-white/10 text-slate-400' : 'border-slate-100 text-slate-400'
                      }`}
                    >
                      <span>{comp.purchaseStore || 'Retail Store'}</span>
                      <span>{new Date(comp.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Report Details & Reply Box */}
        <div className="lg:col-span-7">
          {selectedComplaint ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5 text-xs">
              {/* Report Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">
                      Report {selectedComplaint.id.replace('LM-2026-00', '#')}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(selectedComplaint.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    {selectedComplaint.product?.name || 'Product Packaging'}
                  </h3>
                </div>
                <StatusBadge status={selectedComplaint.status} size="md" />
              </div>

              {/* Purchase Details */}
              <div className="grid grid-cols-2 gap-3 text-slate-600">
                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 block">Bought at</span>
                    <span className="text-xs font-semibold text-slate-800">
                      {selectedComplaint.purchaseStore || 'Local Store'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] text-slate-400 block">Location</span>
                    <span className="text-xs font-semibold text-slate-800">
                      {selectedComplaint.consumerLocation || 'Retail Market'}
                    </span>
                  </div>
                </div>
              </div>

              {/* What the customer said */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Customer's Feedback
                </span>
                <p className="text-slate-900 leading-relaxed text-xs italic">
                  "{toPlainNote(selectedComplaint.consumerNotes)}"
                </p>
              </div>

              {/* Response Section */}
              {selectedComplaint.companyResponse ? (
                /* Already Replied Card */
                <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-200/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="font-bold text-emerald-900 text-xs">
                        Reply Sent to Customer
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                      {selectedComplaint.companyResponse.correctiveActionType || 'Updated Label'}
                    </span>
                  </div>

                  <p className="text-emerald-950 leading-relaxed bg-white p-3.5 rounded-xl border border-emerald-100 text-xs">
                    {selectedComplaint.companyResponse.responseText}
                  </p>

                  {selectedComplaint.companyResponse.correctedLabelImageUrl && (
                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-emerald-900 block mb-1.5">
                        Updated Label Attached:
                      </span>
                      <img
                        src={selectedComplaint.companyResponse.correctedLabelImageUrl}
                        alt="Updated Label"
                        className="max-h-36 rounded-xl border border-emerald-200 bg-white p-1 shadow-sm"
                      />
                    </div>
                  )}

                  <span className="text-[10px] text-emerald-700 block text-right pt-1">
                    Sent on{' '}
                    {selectedComplaint.companyResponse.submittedAt
                      ? new Date(selectedComplaint.companyResponse.submittedAt).toLocaleDateString()
                      : 'Recently'}
                  </span>
                </div>
              ) : (
                /* Plain Everyday Reply Form */
                <form onSubmit={handleSubmitResponse} className="space-y-4 pt-1">
                  <span className="text-xs font-bold text-slate-900 block">Send a Reply</span>

                  <div>
                    <label className="text-slate-500 font-medium block mb-1">
                      What are you doing to fix this?
                    </label>
                    <select
                      value={actionType}
                      onChange={(e) => setActionType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition"
                    >
                      <option value="Updated packaging label">We updated the packaging label</option>
                      <option value="Replacing store batches">We are replacing batches in stores</option>
                      <option value="Checked packaging line">We checked our factory packaging line</option>
                      <option value="Label already has this info">The label already includes this information</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-500 font-medium block mb-1">
                      Your message to the customer:
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Write a clear, friendly reply explaining how you addressed the feedback..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                      <input
                        type="checkbox"
                        checked={attachProof}
                        onChange={(e) => setAttachProof(e.target.checked)}
                        className="rounded text-slate-900 focus:ring-0"
                      />
                      <span className="text-[11px] font-medium flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                        Attach updated label preview
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition shadow-sm flex items-center gap-1.5 disabled:opacity-60 text-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isSubmitting ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-100">
              Select a report from the left to view details and reply.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
