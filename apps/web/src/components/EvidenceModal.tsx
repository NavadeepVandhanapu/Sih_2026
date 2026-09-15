import React from 'react';
import { X, ShieldAlert, CheckCircle, ExternalLink, Info } from 'lucide-react';
import { RuleEvaluation, ExtractedDeclaration, BoundingBox } from '../types';

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  rule?: RuleEvaluation | null;
  declaration?: ExtractedDeclaration | null;
  imageDimensions?: { width: number; height: number };
}

export const EvidenceModal: React.FC<EvidenceModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  rule,
  declaration,
  imageDimensions,
}) => {
  if (!isOpen) return null;

  const box: BoundingBox | undefined = rule?.evidenceBox || declaration?.evidenceBox;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-slate-900 text-white rounded-t-2xl border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">AI Inspection Evidence &amp; Visual Audit</h3>
              <p className="text-xs text-slate-400">
                Legal Metrology (Packaged Commodities) Rules, 2011 Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Scanned Image Column */}
            <div className="flex flex-col items-center justify-center bg-slate-950 rounded-xl p-3 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                Scanned Package Panel {box ? '(Bounding Box Highlighted)' : ''}
              </span>
              <div className="relative w-full max-h-[420px] overflow-hidden rounded-lg flex items-center justify-center bg-slate-900 p-2">
                <div className="relative inline-block max-h-[400px]">
                  <img
                    src={imageUrl || '/samples/apex_biscuits.svg'}
                    alt="Scanned Package"
                    className="max-h-[380px] w-auto object-contain rounded"
                  />
                  {box && imageDimensions && imageDimensions.width > 0 && imageDimensions.height > 0 && (
                    <div
                      className="absolute border-2 border-amber-400 bg-amber-400/25 rounded pointer-events-none shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse"
                      style={{
                        left: `${(box.x / imageDimensions.width) * 100}%`,
                        top: `${(box.y / imageDimensions.height) * 100}%`,
                        width: `${(box.width / imageDimensions.width) * 100}%`,
                        height: `${(box.height / imageDimensions.height) * 100}%`,
                      }}
                    >
                      <span className="absolute -top-5 left-0 bg-amber-400 text-slate-950 font-bold text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap">
                        OCR Detection Region
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Evidence & Findings Column */}
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Target Declaration / Rule
                </span>
                <h4 className="text-lg font-bold text-slate-900 mt-0.5">
                  {rule?.ruleName || declaration?.label || 'Statutory Requirement'}
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Reference: {rule?.sectionReference || 'Rule 6 Legal Metrology PC Rules, 2011'}
                </p>
              </div>

              {/* Status and Confidence */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block">AI Screening Status</span>
                  <span
                    className={`text-sm font-bold ${
                      rule?.status === 'COMPLIANT'
                        ? 'text-emerald-700'
                        : rule?.status === 'POTENTIAL_NON_COMPLIANCE'
                        ? 'text-amber-700'
                        : 'text-blue-700'
                    }`}
                  >
                    {rule?.status ? rule.status.replace(/_/g, ' ') : 'Review Required'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block">Model Confidence</span>
                  <span className="text-sm font-bold text-slate-900">
                    {rule ? `${Math.round(rule.confidence * 100)}%` : declaration ? `${Math.round(declaration.confidence * 100)}%` : '92%'}
                  </span>
                </div>
              </div>

              {/* Extracted / Expected Value */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div>
                  <span className="text-xs text-slate-500 font-semibold block">Detected Value:</span>
                  <p className="text-sm font-mono bg-white p-2 rounded border border-slate-200 text-slate-800 break-words">
                    {rule?.detectedValue || declaration?.detectedValue || '[NOT CONFIDENTLY DETECTED]'}
                  </p>
                </div>
                {rule?.expectedRequirement && (
                  <div>
                    <span className="text-xs text-slate-500 font-semibold block">Statutory Mandate:</span>
                    <p className="text-xs text-slate-700">{rule.expectedRequirement}</p>
                  </div>
                )}
              </div>

              {/* Explanation */}
              {(rule?.explanation || declaration?.notes) && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-900 leading-relaxed">
                      {rule?.explanation || declaration?.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Raw Snippet */}
              {(rule?.evidenceSnippet || declaration?.rawSnippet) && (
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                    Raw OCR Snippet
                  </span>
                  <pre className="text-xs bg-slate-900 text-emerald-400 p-2.5 rounded-lg overflow-x-auto font-mono">
                    {rule?.evidenceSnippet || declaration?.rawSnippet}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Legal Non-Final Determination Notice */}
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900">
              <strong className="font-semibold">Statutory Advisory:</strong> This AI screening assessment is generated for preliminary risk-screening and grievance assistance. It does not constitute a final judicial determination under the Legal Metrology Act, 2009. Official enforcement or compounding notice requires physical verification by an authorized Legal Metrology Officer.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 bg-slate-50 rounded-b-2xl border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
