import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import { EvidenceModal } from '../../components/EvidenceModal';
import { ScanResult, RuleEvaluation, ExtractedDeclaration } from '../../types';
import {
  UploadCloud,
  ScanLine,
  Check,
  AlertTriangle,
  X,
  Sliders,
  Sparkles,
  Download,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const ConsumerScan: React.FC = () => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('/samples/apex_biscuits.svg');
  const [packageHeightMm, setPackageHeightMm] = useState<number>(160);
  const [packageWidthMm, setPackageWidthMm] = useState<number>(100);
  const [selectedPreset, setSelectedPreset] = useState<string>('apex_biscuits');

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStepText, setScanStepText] = useState<string>('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const [evidenceModalOpen, setEvidenceModalOpen] = useState<boolean>(false);
  const [selectedRule, setSelectedRule] = useState<RuleEvaluation | null>(null);
  const [selectedDec, setSelectedDec] = useState<ExtractedDeclaration | null>(null);

  const [complaintModalOpen, setComplaintModalOpen] = useState<boolean>(false);
  const [consumerNotes, setConsumerNotes] = useState<string>('');
  const [complaintSubmitting, setComplaintSubmitting] = useState<boolean>(false);
  const [filedComplaintId, setFiledComplaintId] = useState<string | null>(null);

  const handleSelectPreset = (preset: string) => {
    setSelectedPreset(preset);
    setScanResult(null);
    setFiledComplaintId(null);
    if (preset === 'apex_biscuits') {
      setPreviewUrl('/samples/apex_biscuits.svg');
      setPackageHeightMm(160);
      setPackageWidthMm(100);
    } else if (preset === 'greenbasket_oil') {
      setPreviewUrl('/samples/greenbasket_oil.svg');
      setPackageHeightMm(140);
      setPackageWidthMm(45);
    } else if (preset === 'nova_dishwash') {
      setPreviewUrl('/samples/nova_dishwash.svg');
      setPackageHeightMm(210);
      setPackageWidthMm(90);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setSelectedPreset('custom');
      setScanResult(null);
      setFiledComplaintId(null);
    }
  };

  const startAnalysis = async () => {
    setIsScanning(true);
    setScanResult(null);
    setFiledComplaintId(null);

    const steps = [
      'Detecting label panel...',
      'Running OCR extraction...',
      'Matching mandatory declarations...',
      'Calibrating font dimensions...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setScanStepText(steps[i]);
      await new Promise((res) => setTimeout(res, 350));
    }

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('image', selectedFile);
      } else {
        formData.append('imageUrl', previewUrl);
      }
      formData.append('userId', user?.id || 'usr-consumer');
      formData.append(
        'productId',
        selectedPreset === 'apex_biscuits'
          ? 'prod-apex-biscuits'
          : selectedPreset === 'greenbasket_oil'
          ? 'prod-greenbasket-oil'
          : selectedPreset === 'nova_dishwash'
          ? 'prod-nova-dishwash'
          : ''
      );
      formData.append('packageHeightMm', packageHeightMm.toString());
      formData.append('packageWidthMm', packageWidthMm.toString());

      const res = await fetch('/api/scans/analyze', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setScanResult(data);
        if (data.analysis.summary.overallStatus === 'COMPLIANT') {
          confetti({ particleCount: 50, spread: 60 });
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const submitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanResult) return;

    setComplaintSubmitting(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanId: scanResult.scanId,
          consumerId: user?.id || 'usr-consumer',
          companyId: scanResult.product?.companyId || 'comp-apex',
          productId: scanResult.product?.id,
          consumerNotes: consumerNotes || 'Missing mandatory consumer care declarations on label.',
          consumerLocation: 'Retail Market, India',
          purchaseStore: 'Supermarket',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setFiledComplaintId(data.complaintId);
        setComplaintModalOpen(false);
        confetti({ particleCount: 70, spread: 70 });
      }
    } catch (err) {
      console.error('Failed to submit complaint:', err);
    } finally {
      setComplaintSubmitting(false);
    }
  };

  const openEvidence = (rule?: RuleEvaluation, dec?: ExtractedDeclaration) => {
    setSelectedRule(rule || null);
    setSelectedDec(dec || null);
    setEvidenceModalOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Minimal Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
          Verify Packaged Commodity
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Scan any packaged product to instantly audit mandatory declarations and font sizes under Legal Metrology Rules, 2011.
        </p>
      </div>

      {/* Preset Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-slate-400 font-medium mr-1">Demo presets:</span>
        <button
          onClick={() => handleSelectPreset('apex_biscuits')}
          className={`px-3 py-1.5 rounded-full transition font-semibold flex items-center gap-1.5 ${
            selectedPreset === 'apex_biscuits'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>Apex Biscuits</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        </button>
        <button
          onClick={() => handleSelectPreset('greenbasket_oil')}
          className={`px-3 py-1.5 rounded-full transition font-semibold flex items-center gap-1.5 ${
            selectedPreset === 'greenbasket_oil'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>Almond Oil</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        </button>
        <button
          onClick={() => handleSelectPreset('nova_dishwash')}
          className={`px-3 py-1.5 rounded-full transition font-semibold flex items-center gap-1.5 ${
            selectedPreset === 'nova_dishwash'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>Dishwash</span>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
        </button>
      </div>

      {/* Centered Preview / Upload Box */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm max-w-xl mx-auto space-y-5">
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-[260px] p-4">
          <img
            src={previewUrl}
            alt="Product Label"
            className="max-h-[240px] w-auto object-contain rounded-lg"
          />
          {isScanning && <div className="animate-scan-line"></div>}

          {/* Minimal Upload Overlay Button */}
          <label className="absolute bottom-3 right-3 bg-white/90 hover:bg-white text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer shadow-md transition flex items-center gap-1.5 backdrop-blur-sm">
            <UploadCloud className="w-3.5 h-3.5" />
            Upload File
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Scan Button */}
        <button
          onClick={startAnalysis}
          disabled={isScanning}
          className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-slate-900 hover:bg-slate-800 transition shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isScanning ? (
            <>
              <ScanLine className="w-4 h-4 animate-spin" />
              {scanStepText}
            </>
          ) : (
            <>
              <ScanLine className="w-4 h-4" />
              Scan Packaging Label
            </>
          )}
        </button>
      </div>

      {/* Clean Scan Results */}
      {scanResult && !isScanning && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 max-w-2xl mx-auto animate-fadeIn">
          {/* Header Verdict Card */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs text-slate-400 font-mono block">Inspection Result</span>
              <h3 className="text-lg font-bold text-slate-900">
                {scanResult.product?.name || scanResult.analysis.fingerprint.productName || 'Packaged Commodity'}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-2xl font-black font-display text-slate-900">
                  {scanResult.analysis.summary.score}%
                </span>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Compliance</span>
              </div>
              <StatusBadge status={scanResult.analysis.summary.overallStatus} size="lg" />
            </div>
          </div>

          {/* Core Declarations Checklist */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Mandatory Rule 6 Checks
            </span>

            {scanResult.analysis.ruleResults.map((r) => {
              const isPass = r.status === 'COMPLIANT';
              const isFail = r.status === 'POTENTIAL_NON_COMPLIANCE';

              return (
                <div
                  key={r.ruleId}
                  onClick={() => openEvidence(r)}
                  className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition cursor-pointer flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        isPass
                          ? 'bg-emerald-100 text-emerald-700'
                          : isFail
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isPass ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : isFail ? (
                        <X className="w-3.5 h-3.5" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 block truncate">{r.ruleName}</span>
                      <span className="text-slate-500 text-[11px] block truncate">
                        {r.detectedValue || 'Not located on panel'}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <StatusBadge status={r.status} size="sm" />
                  </div>
                </div>
              );
            })}

            {/* Font Size Item */}
            <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    scanResult.analysis.fontAnalysis.status === 'COMPLIANT'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <Sliders className="w-3 h-3" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">Character Height (Rule 7/8)</span>
                  <span className="text-slate-500 text-[11px] block">
                    Estimated {scanResult.analysis.fontAnalysis.estimatedCharHeightMm} mm (Required min: {scanResult.analysis.fontAnalysis.requiredMinimumMm} mm)
                  </span>
                </div>
              </div>
              <StatusBadge status={scanResult.analysis.fontAnalysis.status} size="sm" />
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <a
              href={`/api/reports/${scanResult.scanId}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download Report
            </a>

            {filedComplaintId ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                Reported as {filedComplaintId}
              </span>
            ) : (
              <button
                onClick={() => setComplaintModalOpen(true)}
                className="text-xs font-bold px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm flex items-center gap-1.5"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Report Non-Compliance
              </button>
            )}
          </div>
        </div>
      )}

      {/* Minimal Evidence Modal */}
      <EvidenceModal
        isOpen={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
        imageUrl={previewUrl}
        rule={selectedRule}
        declaration={selectedDec}
      />

      {/* Minimal Report Modal */}
      {complaintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Report Non-Compliance</h3>
              <button onClick={() => setComplaintModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitComplaint} className="space-y-4 text-xs">
              <p className="text-slate-500">
                This report will attach the scanned image and OCR findings for the manufacturer quality desk.
              </p>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Issue remarks:</label>
                <textarea
                  rows={3}
                  value={consumerNotes}
                  onChange={(e) => setConsumerNotes(e.target.value)}
                  placeholder="e.g. Mandatory customer care email or phone number is missing from the package."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setComplaintModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={complaintSubmitting}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition disabled:opacity-60"
                >
                  {complaintSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
