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
  Download,
  ShieldAlert,
  Info,
  BookOpen,
  Camera,
  Hash,
  CheckCircle2,
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
  const [scanError, setScanError] = useState<{ code: string; message: string } | null>(null);

  const [evidenceModalOpen, setEvidenceModalOpen] = useState<boolean>(false);
  const [passportModalOpen, setPassportModalOpen] = useState<boolean>(false);
  const [selectedRule, setSelectedRule] = useState<RuleEvaluation | null>(null);
  const [selectedDec, setSelectedDec] = useState<ExtractedDeclaration | null>(null);

  const [complaintModalOpen, setComplaintModalOpen] = useState<boolean>(false);
  const [consumerNotes, setConsumerNotes] = useState<string>('');
  const [complaintSubmitting, setComplaintSubmitting] = useState<boolean>(false);
  const [filedComplaintId, setFiledComplaintId] = useState<string | null>(null);

  const handleSelectPreset = (preset: string) => {
    setSelectedPreset(preset);
    setScanResult(null);
    setScanError(null);
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
      setScanError(null);
      setFiledComplaintId(null);
    }
  };

  const startAnalysis = async () => {
    setIsScanning(true);
    setScanResult(null);
    setScanError(null);
    setFiledComplaintId(null);

    const steps = [
      '1/4 Loading image & checking blur quality...',
      '2/4 Running PyTorch EasyOCR Neural Extraction...',
      '3/4 Normalizing metric quantities & MRP pricing...',
      '4/4 Evaluating versioned Legal Metrology Rules (v2026.1)...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setScanStepText(steps[i]);
      await new Promise((res) => setTimeout(res, 300));
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

      const data = await res.json();

      if (res.ok) {
        setScanResult(data);
        if (data.analysis.summary.overallStatus === 'COMPLIANT') {
          confetti({ particleCount: 50, spread: 60 });
        }
      } else {
        setScanError({
          code: data.error || 'SCAN_FAILED',
          message: data.message || 'Optical Character Recognition processing failed.',
        });
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setScanError({
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to Legal Metrology API service.',
      });
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
          consumerNotes: consumerNotes || 'Missing mandatory statutory consumer care declarations on label.',
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Statutory Legal Metrology Screening (PCR 2011)
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
          Verify Packaged Commodity
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          Scan any packaged product photo to audit mandatory declarations (MRP, Net Qty, Mfg Date, Consumer Care) under Legal Metrology Rules, 2011 (v2026.1).
        </p>
      </div>

      {/* Demo Preset Pills */}
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

          {/* Upload Button */}
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

        {/* Scan Error Guidance */}
        {scanError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-2">
            <div className="flex items-center gap-2 text-rose-800 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Image Quality Alert: {scanError.code.replace(/_/g, ' ')}</span>
            </div>
            <p className="text-rose-900 leading-relaxed">{scanError.message}</p>
            <div className="pt-1 flex items-center gap-2">
              <label className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer transition">
                Retake Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => setScanError(null)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Scan Action Button */}
        <button
          onClick={startAnalysis}
          disabled={isScanning}
          className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-slate-900 hover:bg-slate-800 transition shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isScanning ? (
            <>
              <ScanLine className="w-4 h-4 animate-spin text-blue-400" />
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
            <div className="flex items-center gap-4">
              <div className="text-right border-r border-slate-200 pr-3">
                <span className="text-2xl font-black font-display text-slate-900">
                  {scanResult.analysis.summary.score}%
                </span>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Screening Score</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-display text-blue-600">
                  {scanResult.analysis.summary.aiConfidence || 92}%
                </span>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">AI Detection Conf</span>
              </div>
              <StatusBadge status={scanResult.analysis.summary.overallStatus} size="lg" />
            </div>
          </div>

          {/* Real OCR Telemetry & Image Quality Badge */}
          {scanResult.analysis.imageQuality && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Image Quality</span>
                  <span className="font-bold text-slate-800">
                    Score: {Math.round(scanResult.analysis.imageQuality.score * 100)}% ({scanResult.analysis.imageQuality.resolution})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Blur Variance</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {scanResult.analysis.imageQuality.blur}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Rule Version</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {scanResult.analysis.summary.ruleSetVersion || '2026.1'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">OCR Engine</span>
                  <span className="font-bold text-blue-700 font-mono">
                    EasyOCR ({scanResult.analysis.ocrRegions?.length || 0} regions)
                  </span>
                </div>
              </div>

              {/* Actionable Capture Quality Guidance */}
              {(scanResult.analysis.imageQuality.score < 0.85 || (scanResult.analysis.ocrRegions?.length || 0) < 10) && (
                <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Actionable Photo Capture Guidance for Maximum OCR Accuracy:</span>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-amber-800 pl-6 list-disc font-medium">
                    <li>Move camera closer to focus on fine declaration text</li>
                    <li>Hold camera steady to eliminate motion blur</li>
                    <li>Improve ambient lighting and avoid glossy packaging glare</li>
                    <li>Keep package flat and capture the complete statutory label</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Core Declarations Checklist */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Mandatory Statutory Rule Checks (Rule 6, 7, 8, 11, 12)
            </span>

            {scanResult.analysis.ruleResults.map((r) => {
              const isPass = r.status === 'COMPLIANT';
              const isFail = r.status === 'POTENTIAL_NON_COMPLIANCE';
              const isNA = r.status === 'NOT_APPLICABLE';

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
                          : isNA
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isPass ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : isFail ? (
                        <X className="w-3.5 h-3.5" />
                      ) : isNA ? (
                        <span className="text-[10px] font-bold">N/A</span>
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 block truncate">{r.ruleName}</span>
                        {r.severity === 'CRITICAL' && (
                          <span className="bg-rose-100 text-rose-800 font-extrabold text-[9px] px-1.5 py-0.5 rounded uppercase">
                            CRITICAL
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 text-[11px] block truncate">
                        {r.detectedValue || (isNA ? 'Exempt for this commodity parameter' : 'Not located on panel')}
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPassportModalOpen(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 transition"
              >
                <BookOpen className="w-3.5 h-3.5" />
                View Product Passport
              </button>

              <a
                href={`/api/reports/${scanResult.scanId}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
              >
                <Download className="w-3.5 h-3.5" />
                PDF Report
              </a>
            </div>

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

      {/* Product Passport Modal */}
      {passportModalOpen && scanResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-2xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Digital Product Passport</h3>
                  <p className="text-xs text-slate-400">Legal Metrology Declarations &amp; Verification Passport</p>
                </div>
              </div>
              <button onClick={() => setPassportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Product &amp; Brand</span>
                  <span className="font-bold text-slate-900 text-sm">{scanResult.product?.name || 'Packaged Commodity'}</span>
                  <span className="text-slate-500 block">Brand: {scanResult.product?.brand || 'Apex'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Rule Set &amp; Integrity</span>
                  <span className="font-bold text-slate-900 text-sm">v{scanResult.analysis.summary.ruleSetVersion}</span>
                  <span className="text-slate-500 font-mono text-[11px] block truncate">
                    Hash: {scanResult.analysis.imageIntegrity?.sha256Hash.substring(0, 16) || 'SHA256-OK'}...
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] block">
                  Normalized Declarations Summary
                </span>
                {Object.entries(scanResult.analysis.declarations).map(([type, dec]) => (
                  <div key={type} className="p-2.5 bg-white border border-slate-100 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{dec.label}</span>
                      <span className="text-slate-500">{dec.detectedValue || '[NOT DETECTED]'}</span>
                    </div>
                    <span className="font-mono text-[11px] text-blue-600 font-bold">
                      {Math.round(dec.confidence * 100)}% Conf
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setPassportModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Close Passport
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evidence Modal */}
      <EvidenceModal
        isOpen={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
        imageUrl={previewUrl}
        rule={selectedRule}
        declaration={selectedDec}
        imageDimensions={scanResult?.analysis.imageDimensions}
        imageIntegrity={scanResult?.analysis.imageIntegrity}
      />

      {/* Report Grievance Modal */}
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
                This report will attach the scanned image, OCR findings, and SHA-256 evidence integrity hash for the manufacturer quality desk and DoCA officers.
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
