import React, { useState } from 'react';
import { StatusBadge } from '../../components/StatusBadge';
import { ScanResult } from '../../types';
import { Sparkles, Check, AlertTriangle, ArrowRight, History, GitCompare } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CompanySelfCheck: React.FC = () => {
  const [selectedArtwork, setSelectedArtwork] = useState<'draft_label' | 'corrected_label'>('draft_label');
  const [previewUrl, setPreviewUrl] = useState<string>('/samples/apex_biscuits.svg');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [initialScan, setInitialScan] = useState<ScanResult | null>(null);
  const [correctedScan, setCorrectedScan] = useState<ScanResult | null>(null);
  const [activeTab, setActiveTab] = useState<'audit' | 'timeline'>('audit');

  const handleArtworkChange = (type: 'draft_label' | 'corrected_label') => {
    setSelectedArtwork(type);
    if (type === 'draft_label') {
      setPreviewUrl('/samples/apex_biscuits.svg');
    } else {
      setPreviewUrl('/samples/apex_biscuits_corrected.svg');
    }
  };

  const runPreLaunchAudit = async () => {
    setIsAnalyzing(true);

    try {
      const isCorrected = selectedArtwork === 'corrected_label';
      const mockOcrText = isCorrected
        ? `
Apex Delight Cream Biscuits Vanilla
Manufactured by: Apex Foods Pvt. Ltd., Plot 42, Industrial Area, Sector 5, Haridwar, Uttarakhand - 249403
Net Quantity: 200 g
MRP: Rs. 40.00 (inclusive of all taxes)
Date of Packing: 08/2026
Batch No: APX-9824-R
Consumer Care Cell: Toll-Free: 1800-200-8899, Email: care@apexfoods.in
Address: Same as above
Unit Sale Price: Rs. 0.20 per g
Made in India
`.trim()
        : `
Apex Delight Cream Biscuits Vanilla
Manufactured by: Apex Foods Pvt. Ltd., Plot 42, Industrial Area, Sector 5, Haridwar, Uttarakhand - 249403
Net Quantity: 200 g
MRP: Rs. 40.00
Date of Packing: 07/2026
Batch No: APX-9824
Unit Sale Price: Rs. 0.20 per g
Made in India
`.trim();

      // If running corrected scan after initial scan, set parentScanId!
      const parentScanId = isCorrected && initialScan ? initialScan.scanId : undefined;

      const res = await fetch('/api/scans/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: previewUrl,
          ocrText: mockOcrText,
          packageHeightMm: 160,
          packageWidthMm: 100,
          parentScanId,
        }),
      });

      if (res.ok) {
        const data: ScanResult = await res.json();
        if (isCorrected) {
          setCorrectedScan(data);
          setActiveTab('timeline');
          confetti({ particleCount: 70, spread: 70 });
        } else {
          setInitialScan(data);
        }
      }
    } catch (err) {
      console.error('Self-check error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-1.5">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider font-mono">
          Preventive Compliance Simulator
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 font-display">
          Pre-Market Packaging Self-Check &amp; Correction Timeline
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Audit label artwork designs for Legal Metrology compliance before printing and trace correction history.
        </p>
      </div>

      {/* Mode Navigation */}
      <div className="flex justify-center border-b border-slate-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Artwork Compliance Audit
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            Packaging Correction Rescan Timeline
          </button>
        </div>
      </div>

      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Variant Selector */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => handleArtworkChange('draft_label')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                selectedArtwork === 'draft_label'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Draft Artwork v1 (Has Issues)
            </button>
            <button
              onClick={() => handleArtworkChange('corrected_label')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                selectedArtwork === 'corrected_label'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Corrected Artwork v2 (Compliant)
            </button>
          </div>

          {/* Preview Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 max-w-lg mx-auto">
            <div className="rounded-2xl bg-slate-950 flex items-center justify-center p-3 max-h-[260px] overflow-hidden">
              <img src={previewUrl} alt="Preview" className="max-h-[240px] w-auto object-contain rounded-lg" />
            </div>

            <button
              onClick={runPreLaunchAudit}
              disabled={isAnalyzing}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isAnalyzing ? 'Auditing Artwork...' : 'Audit Artwork Compliance'}
            </button>
          </div>

          {/* Active Result View */}
          {((selectedArtwork === 'draft_label' && initialScan) ||
            (selectedArtwork === 'corrected_label' && correctedScan)) && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 max-w-lg mx-auto animate-fadeIn text-xs">
              {(() => {
                const current = selectedArtwork === 'draft_label' ? initialScan : correctedScan;
                if (!current) return null;
                return (
                  <>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-slate-400 font-mono block text-[11px]">Audit Result</span>
                        <span className="font-bold text-slate-900 text-base">
                          Compliance Index: {current.analysis.summary.score}%
                        </span>
                      </div>
                      <StatusBadge status={current.analysis.summary.overallStatus} size="md" />
                    </div>

                    <div className="space-y-2">
                      {current.analysis.ruleResults.map((r) => (
                        <div
                          key={r.ruleId}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                        >
                          <div className="truncate mr-2">
                            <span className="font-semibold text-slate-800 block truncate">{r.ruleName}</span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {r.detectedValue || 'Not detected'}
                            </span>
                          </div>
                          <StatusBadge status={r.status} size="sm" />
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-900 block"> packaging Correction Verification</span>
            <p>
              When a label fails initial screening, manufacturers submit a corrected packaging version. The platform automatically links the rescan via <code className="font-mono text-slate-800">parentScanId</code> to prove compliance remediation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Version 1 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="font-bold text-slate-900 block text-sm">Artwork Version 1 (Draft)</span>
                  <span className="text-[10px] text-slate-400 font-mono">Scan ID: {initialScan?.scanId || 'scan-apex-01'}</span>
                </div>
                <StatusBadge status={initialScan?.analysis.summary.overallStatus || 'NON_COMPLIANT'} size="sm" />
              </div>

              <div className="rounded-xl bg-slate-950 p-2 flex items-center justify-center max-h-[160px] overflow-hidden">
                <img src="/samples/apex_biscuits.svg" alt="Draft" className="max-h-[140px] w-auto" />
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">Initial Screening Findings:</span>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 space-y-1">
                  <span className="font-semibold block">Missing Statutory Declarations:</span>
                  <p className="text-[11px]">- Consumer Care Cell Contact Omitted</p>
                  <p className="text-[11px]">- Mandatory Net Qty Symbol Non-Compliant</p>
                </div>
              </div>
            </div>

            {/* Version 2 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="font-bold text-slate-900 block text-sm">Artwork Version 2 (Corrected)</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Rescan ID: {correctedScan?.scanId || 'scan-apex-02'} (Linked to Parent)
                  </span>
                </div>
                <StatusBadge status={correctedScan?.analysis.summary.overallStatus || 'COMPLIANT'} size="sm" />
              </div>

              <div className="rounded-xl bg-slate-950 p-2 flex items-center justify-center max-h-[160px] overflow-hidden">
                <img src="/samples/apex_biscuits_corrected.svg" alt="Corrected" className="max-h-[140px] w-auto" />
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-700 block">Rescan Verification:</span>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 space-y-1">
                  <span className="font-semibold block">Remediation Status: Fully Resolved</span>
                  <p className="text-[11px]">✓ Consumer Care Cell (Toll-Free &amp; Email) added</p>
                  <p className="text-[11px]">✓ Standard Net Qty &amp; Unit Sale Price validated</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
