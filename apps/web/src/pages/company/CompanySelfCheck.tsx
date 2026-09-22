import React, { useState } from 'react';
import { StatusBadge } from '../../components/StatusBadge';
import { ScanResult } from '../../types';
import { Sparkles, Check, AlertTriangle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CompanySelfCheck: React.FC = () => {
  const [selectedArtwork, setSelectedArtwork] = useState<string>('draft_label');
  const [previewUrl, setPreviewUrl] = useState<string>('/samples/Defect_Image.jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const handleArtworkChange = (type: 'draft_label' | 'corrected_label') => {
    setSelectedArtwork(type);
    setResult(null);
    if (type === 'draft_label') {
      setPreviewUrl('/samples/Defect_Image.jpeg');
    } else {
      setPreviewUrl('/samples/Original_Image.jpeg');
    }
  };

  const runPreLaunchAudit = async () => {
    setIsAnalyzing(true);
    setResult(null);

    try {
      const isCorrected = selectedArtwork === 'corrected_label';
      const mockOcrText = isCorrected
        ? `
BISCUITS NET WEIGHT 250 g
MRP ₹ (INCL. OF ALL TAXES) 70.00
Rs. 0.28 Per g
PKD. 02/11/23
USE BY. 01/05/24
LOT No. A11239D
Marketed By: BRITANNIA INDUSTRIES LTD., 5/1A HUNGERFORD STREET, KOLKATA-700017
Consumer Care Cell: Ph: (Toll Free) 1-800-4254449 / feedback@britindia.com
Made in India
`.trim()
        : `
BISCUITS NET WEIGHT 250 g
Marketed By: BRITANNIA INDUSTRIES LTD., 5/1A HUNGERFORD STREET, KOLKATA-700017
Consumer Care Cell: Ph: (Toll Free) 1-800-4254449 / feedback@britindia.com
[ALERT: MRP and Date declaration area is obscured / blacked out]
Made in India
`.trim();

      const res = await fetch('/api/scans/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: previewUrl,
          ocrText: mockOcrText,
          packageHeightMm: 160,
          packageWidthMm: 100,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        if (data.analysis.summary.overallStatus === 'COMPLIANT') {
          confetti({ particleCount: 60, spread: 70 });
        }
      }
    } catch (err) {
      console.error('Self-check error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-1.5">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider font-mono">
          Preventive Compliance Simulator
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 font-display">
          Pre-Market Packaging Self-Check
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Audit packaging designs for Legal Metrology compliance before printing and commercial distribution.
        </p>
      </div>

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
          Draft Artwork (Has Issues)
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

      {/* Result Card */}
      {result && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 max-w-lg mx-auto animate-fadeIn text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-slate-400 font-mono block text-[11px]">Audit Result</span>
              <span className="font-bold text-slate-900 text-base">
                Compliance Index: {result.analysis.summary.score}%
              </span>
            </div>
            <StatusBadge status={result.analysis.summary.overallStatus} size="md" />
          </div>

          <div className="space-y-2">
            {result.analysis.ruleResults.map((r) => (
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
        </div>
      )}
    </div>
  );
};
