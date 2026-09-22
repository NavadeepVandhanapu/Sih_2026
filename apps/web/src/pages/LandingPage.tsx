import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ScanLine,
  ShieldCheck,
  Building2,
  Scale,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Eye,
  Camera,
  Layers,
  FileCheck,
  ChevronRight,
  HelpCircle,
  ChevronDown,
  FileText,
  TrendingUp,
  Cpu,
  BadgePercent,
  Sliders,
  Sparkle,
  PhoneCall,
  Lock,
  Compass,
  Check,
  ExternalLink
} from 'lucide-react';

interface SampleProduct {
  id: string;
  name: string;
  category: string;
  badge: string;
  badgeColor: string;
  complianceScore: number;
  isCompliant: boolean;
  image: string;
  dimensions: string;
  findings: {
    rule: string;
    title: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    detected: string;
    statutoryNote: string;
  }[];
  metryAdvice: string;
}

const SAMPLE_PRODUCTS: SampleProduct[] = [
  {
    id: 'defect_image',
    name: 'Packaged Biscuits (Obscured MRP / Date)',
    category: 'Packaged Food & Confectionery',
    badge: 'MRP & Dates Obscured / Omitted',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-200',
    complianceScore: 48,
    isCompliant: false,
    image: '/samples/Defect_Image.jpeg',
    dimensions: '190mm × 120mm (Area: 228 cm²)',
    findings: [
      {
        rule: 'Rule 6(1)(a)',
        title: 'Common / Generic Commodity Name',
        status: 'PASS',
        detected: '"BISCUITS NET WEIGHT 250 g"',
        statutoryNote: 'Prominent commodity classification on label.',
      },
      {
        rule: 'Rule 6(1)(b)',
        title: 'Standard Net Quantity',
        status: 'PASS',
        detected: '250 g (Prominent declaration)',
        statutoryNote: 'Standard SI metric unit declared in accordance with Schedule II.',
      },
      {
        rule: 'Rule 6(1)(c)',
        title: 'Maximum Retail Price (MRP)',
        status: 'FAIL',
        detected: 'OBLITERATED / OBSCURED (Blacked-out patch)',
        statutoryNote: 'Statutory violation: Retail price is unreadable and obscured.',
      },
      {
        rule: 'Rule 6(1)(d)',
        title: 'Date of Packaging & Batch',
        status: 'FAIL',
        detected: 'MISSING (PKD and USE BY obscured)',
        statutoryNote: 'Mandatory month/year of packing and expiry dates are omitted.',
      },
      {
        rule: 'Rule 6(1)(e)',
        title: 'Consumer Care Contact Details',
        status: 'PASS',
        detected: 'Ph: 1-800-4254449 / feedback@britindia.com',
        statutoryNote: 'Toll-free customer helpline and corporate address present.',
      },
      {
        rule: 'Rule 7 & 8',
        title: 'Physical Character Height Calibration',
        status: 'WARN',
        detected: 'Key declarations obscured from principal display area',
        statutoryNote: 'Cannot evaluate character heights of obscured pricing clauses.',
      },
    ],
    metryAdvice:
      'Look closely at the black patch in the red panel! The MRP, packing date (PKD), and expiry date have been completely obscured. Under Section 18 of the Legal Metrology Act, 2009 and Rule 6, selling packaged goods with obscured mandatory declarations is an actionable offense!',
  },
  {
    id: 'original_image',
    name: 'Packaged Biscuits (Original Compliant Pack)',
    category: 'Packaged Food & Confectionery',
    badge: '100% Statutory Compliant',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    complianceScore: 98,
    isCompliant: true,
    image: '/samples/Original_Image.jpeg',
    dimensions: '190mm × 120mm (Area: 228 cm²)',
    findings: [
      {
        rule: 'Rule 6(1)(a)',
        title: 'Common / Generic Commodity Name',
        status: 'PASS',
        detected: '"BISCUITS NET WEIGHT 250 g"',
        statutoryNote: 'Fully compliant display prominence.',
      },
      {
        rule: 'Rule 6(1)(b)',
        title: 'Standard Net Quantity & USP',
        status: 'PASS',
        detected: '250 g | Rs. 0.28 Per g',
        statutoryNote: 'Net quantity and unit sale price prominently specified.',
      },
      {
        rule: 'Rule 6(1)(c)',
        title: 'Maximum Retail Price (MRP)',
        status: 'PASS',
        detected: 'Rs. 70.00 (INCL. OF ALL TAXES)',
        statutoryNote: 'Includes full statutory taxation clause without abbreviation.',
      },
      {
        rule: 'Rule 6(1)(d)',
        title: 'Date of Packaging & Expiry',
        status: 'PASS',
        detected: 'PKD. 02/11/23 | USE BY. 01/05/24 | LOT: A11239D',
        statutoryNote: 'High contrast, clearly legible packaging date and expiry.',
      },
      {
        rule: 'Rule 6(1)(e)',
        title: 'Consumer Care Contact Details',
        status: 'PASS',
        detected: 'feedback@britindia.com | 1-800-4254449',
        statutoryNote: 'Dedicated helpline, toll-free number and corporate postal address.',
      },
      {
        rule: 'Rule 7 & 8',
        title: 'Character Height Calibration',
        status: 'PASS',
        detected: 'All declarations satisfy minimum height calibration',
        statutoryNote: 'Passes physical millimeter height requirement on calibrated canvas.',
      },
    ],
    metryAdvice:
      'Notice how cleanly the original packaging displays the ₹70.00 MRP inclusive of all taxes, exact packaging date (02/11/23), use by date (01/05/24), unit price (₹0.28/g), and customer helpline. Everything satisfies DoCA rules!',
  },
  {
    id: 'nova_dishwash',
    name: 'Nova Sparkle Dishwash Liquid',
    category: 'Household Care & Cleansers',
    badge: 'Font Height Defect Detected',
    badgeColor: 'bg-amber-500/10 text-amber-700 border-amber-200',
    complianceScore: 78,
    isCompliant: false,
    image: '/samples/nova_dishwash.svg',
    dimensions: '180mm × 120mm (Area: 216 cm²)',
    findings: [
      {
        rule: 'Rule 6(1)(a)',
        title: 'Common / Generic Commodity Name',
        status: 'PASS',
        detected: '"Nova Sparkle Concentrated Dishwash Gel"',
        statutoryNote: 'Accurately classified.',
      },
      {
        rule: 'Rule 6(1)(b)',
        title: 'Standard Net Volume',
        status: 'WARN',
        detected: '500 mL (Calibrated font height: 1.6mm)',
        statutoryNote: 'Display area 216 cm² requires font height ≥ 2.0mm. Detected 1.6mm.',
      },
      {
        rule: 'Rule 6(1)(c)',
        title: 'Maximum Retail Price (MRP)',
        status: 'PASS',
        detected: '₹125.00 (incl. of all taxes)',
        statutoryNote: 'Complies with tax clause requirement.',
      },
      {
        rule: 'Rule 6(1)(d)',
        title: 'Date of Manufacture',
        status: 'PASS',
        detected: 'MFD: 08/2026 | EXP: 08/2028',
        statutoryNote: 'Clear manufacturing and expiry calendar markers.',
      },
      {
        rule: 'Rule 6(1)(e)',
        title: 'Consumer Care Contact Details',
        status: 'PASS',
        detected: 'customercare@novasparkle.in | 1800-456-7890',
        statutoryNote: 'Complete and verified.',
      },
      {
        rule: 'Rule 7 & 8',
        title: 'Character Height Minimum Calibration',
        status: 'FAIL',
        detected: '1.6mm character height is non-compliant',
        statutoryNote: 'Potential non-compliance flagged for Government Inspector review.',
      },
    ],
    metryAdvice:
      'Notice that the text looks okay to the naked eye, but because the bottle area is 216 cm², the law mandates at least 2.0mm height! Our millimeter calibration caught this 1.6mm violation.',
  },
];

export const LandingPage: React.FC = () => {
  const { demoUsers, switchUser } = useAuth();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<SampleProduct>(SAMPLE_PRODUCTS[0]);
  const [isScanningAnimation, setIsScanningAnimation] = useState<boolean>(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleSelectSample = (sample: SampleProduct) => {
    setIsScanningAnimation(true);
    setSelectedProduct(sample);
    setTimeout(() => {
      setIsScanningAnimation(false);
    }, 900);
  };

  const handleLaunchRole = (role: 'CONSUMER' | 'COMPANY' | 'GOVERNMENT_OFFICER' | 'ADMIN', targetPath: string) => {
    const targetUser = demoUsers.find((u) => u.role === role);
    if (targetUser) {
      switchUser(targetUser);
    }
    navigate(targetPath);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white overflow-hidden">
      {/* BACKGROUND DECORATIONS */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-blue-400/20 via-indigo-300/20 to-purple-300/10 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -left-40 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-amber-300/20 via-emerald-300/15 to-blue-200/10 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-indigo-200/20 to-pink-200/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#1e293b 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* HERO SECTION */}
      <section className="relative pt-8 pb-16 sm:pt-14 sm:pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Hackathon & Ministry Badge */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Smart India Hackathon 2026 • SIH26034</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ministry of Consumer Affairs (DoCA)</span>
          </div>
        </div>

        {/* Hero Title & Pitch */}
        <div className="text-center max-w-4xl mx-auto space-y-5">
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight text-slate-900 leading-[1.12]">
            Fair Packaging for 1.4 Billion Citizens,{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-600 bg-clip-text text-transparent">
              Powered by AI Metrology
            </span>
          </h1>

          {/* Hinglish tagline badge */}
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-200 bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 text-sm font-bold tracking-wide shadow-xs">
              <span className="text-base">🇮🇳</span>
              VidhiTrace: <span className="text-blue-600">Scan Karo</span>, <span className="text-emerald-600">Rules Check Karo</span>
            </span>
          </div>

          <p className="text-base sm:text-xl text-slate-600 font-normal leading-relaxed max-w-3xl mx-auto">
            Instantly detect missing MRP tax clauses, undersized font heights, obscured manufacturing dates, and misleading labels. Connecting <strong>Citizens</strong>, <strong>Brand Manufacturers</strong>, and <strong>Legal Metrology Officers</strong> in one unified statutory ecosystem.
          </p>

          {/* Quick Launch Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={() => handleLaunchRole('CONSUMER', '/consumer')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Camera className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span>Launch Citizen Scanner</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => handleLaunchRole('COMPANY', '/company/self-check')}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-200/90 shadow-sm hover:border-slate-300 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Pre-Launch Label Simulator</span>
            </button>

            <button
              onClick={() => handleLaunchRole('GOVERNMENT_OFFICER', '/government')}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Officer Command Center</span>
            </button>
          </div>

          {/* Adorable Metry Mascot Floating Badge */}
          <div className="pt-4 flex items-center justify-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-indigo-100 shadow-sm text-left max-w-md">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-xl shrink-0 shadow-md">
                🤖
              </div>
              <div className="text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Inspector Metry</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-100 text-indigo-700 font-mono">
                    AI Guardian
                  </span>
                </div>
                <p className="text-slate-500 line-clamp-1">
                  "Try our interactive scanner below to see statutory rules in action!"
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* INTERACTIVE SCANNER SANDBOX SHOWCASE */}
        <div id="interactive-demo" className="mt-14 lg:mt-18 scroll-mt-20">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-5 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold mb-1.5">
                  <Sparkle className="w-3.5 h-3.5" />
                  <span>Interactive Live Sandbox</span>
                </div>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900">
                  Try the Legal Metrology AI Engine Live
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Select a test packaged commodity to trigger real-time Rule 6 extraction &amp; millimeter font calibration:
                </p>
              </div>

              {/* Sample Product Switcher Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {SAMPLE_PRODUCTS.map((prod) => {
                  const isSelected = selectedProduct.id === prod.id;
                  return (
                    <button
                      key={prod.id}
                      onClick={() => handleSelectSample(prod)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.02]'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <span>{prod.id === 'defect_image' ? '🍪' : prod.id === 'original_image' ? '✨' : '🧴'}</span>
                      <span>{prod.id === 'defect_image' ? 'Defect Pack' : prod.id === 'original_image' ? 'Original Pack' : 'Dishwash'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sandbox Main Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
              {/* Product Visual & Scanning Beam */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200/80 p-3 border border-slate-200 shadow-inner overflow-hidden group">
                  {/* Laser scan animation line */}
                  <div className={`animate-scan-line ${isScanningAnimation ? 'opacity-100' : 'opacity-70'}`} />

                  {/* Pack SVG Preview */}
                  <div className="relative rounded-xl overflow-hidden bg-white shadow-sm aspect-[3/4] flex items-center justify-center">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                    />

                    {/* Hotspot overlays for defective zones */}
                    {!selectedProduct.isCompliant && selectedProduct.id === 'defect_image' && (
                      <div className="absolute top-[44%] left-[45%] right-[22%] py-2 px-2.5 rounded-xl bg-white/95 border border-rose-500 shadow-lg text-[10px] font-bold text-rose-700 flex items-center justify-between">
                        <span>⚠️ Obscured MRP &amp; Dates</span>
                        <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-bold">Defect</span>
                      </div>
                    )}

                    {selectedProduct.isCompliant && (
                      <div className="absolute top-4 right-4 py-1 px-2.5 rounded-full bg-emerald-500 text-white font-bold text-[10px] shadow-md flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>All Declarations Verified</span>
                      </div>
                    )}
                  </div>

                  {/* Calibration Metric Bar */}
                  <div className="mt-3 px-3 py-2 rounded-xl bg-white/90 border border-slate-200/80 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Physical Size Ratio:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedProduct.dimensions}</span>
                  </div>
                </div>

                {/* Metry Speech Bubble */}
                <div className="mt-4 w-full max-w-sm p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-950">
                  <div className="text-xl shrink-0">💡</div>
                  <div>
                    <span className="font-bold text-indigo-900 block mb-0.5">Inspector Metry's Note:</span>
                    <p className="text-indigo-800/90 leading-relaxed">{selectedProduct.metryAdvice}</p>
                  </div>
                </div>
              </div>

              {/* Real-Time Rule 6 Statutory Breakdown */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div>
                  {/* Status Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 mb-5">
                    <div>
                      <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                        Evaluated Commodity
                      </div>
                      <div className="font-bold text-slate-900 text-base">{selectedProduct.name}</div>
                      <div className="text-xs text-slate-500">{selectedProduct.category}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-medium">Compliance Score</div>
                        <div
                          className={`font-display font-extrabold text-2xl ${
                            selectedProduct.complianceScore >= 90
                              ? 'text-emerald-600'
                              : selectedProduct.complianceScore >= 75
                              ? 'text-amber-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {selectedProduct.complianceScore}%
                        </div>
                      </div>

                      <div
                        className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${selectedProduct.badgeColor}`}
                      >
                        {selectedProduct.isCompliant ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <AlertTriangle className="w-4 h-4" />
                        )}
                        <span>{selectedProduct.badge}</span>
                      </div>
                    </div>
                  </div>

                  {/* Finding Items Grid */}
                  <div className="space-y-2.5">
                    {selectedProduct.findings.map((finding, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 transition flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {finding.rule}
                            </span>
                            <span className="font-bold text-slate-800">{finding.title}</span>
                          </div>
                          <div className="text-slate-600 font-mono text-[11px]">
                            Detected: <span className="font-semibold text-slate-900">{finding.detected}</span>
                          </div>
                          <p className="text-[11px] text-slate-400">{finding.statutoryNote}</p>
                        </div>

                        <div className="shrink-0">
                          {finding.status === 'PASS' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                              <Check className="w-3.5 h-3.5" />
                              PASS
                            </span>
                          )}
                          {finding.status === 'FAIL' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold text-[11px] border border-rose-200">
                              <XCircle className="w-3.5 h-3.5" />
                              DEFECT
                            </span>
                          )}
                          {finding.status === 'WARN' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold text-[11px] border border-amber-200">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              WARNING
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Call to action for full app scan */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 text-center sm:text-left">
                    Want to test your own packaged product photo or PDF artwork?
                  </div>
                  <button
                    onClick={() => handleLaunchRole('CONSUMER', '/consumer')}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Run Full Scan in Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS & IMPACT BAR */}
      <section className="border-y border-slate-200/80 bg-white/70 backdrop-blur-md py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">
              100<span className="text-blue-600">%</span>
            </div>
            <div className="text-xs font-semibold text-slate-600">Rule 6 Statutory Coverage</div>
            <div className="text-[11px] text-slate-400">All mandatory 2011 clauses</div>
          </div>

          <div className="space-y-1">
            <div className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">
              0.1<span className="text-indigo-600">mm</span>
            </div>
            <div className="text-xs font-semibold text-slate-600">Calibration Precision</div>
            <div className="text-[11px] text-slate-400">Physical character height rules</div>
          </div>

          <div className="space-y-1">
            <div className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">
              &lt; 1.2<span className="text-amber-500">s</span>
            </div>
            <div className="text-xs font-semibold text-slate-600">Label OCR &amp; Inference</div>
            <div className="text-[11px] text-slate-400">Instant progressive scanning</div>
          </div>

          <div className="space-y-1">
            <div className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">
              1915
            </div>
            <div className="text-xs font-semibold text-slate-600">National Helpline Sync</div>
            <div className="text-[11px] text-slate-400">DoCA Grievance Integration</div>
          </div>
        </div>
      </section>

      {/* 3 CORE STAKEHOLDER PORTALS */}
      <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Unified Tripartite Architecture</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">
            Tailored Experiences for Every Stakeholder
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            From the consumer checking biscuit packets in a grocery store to government inspectors enforcing compliance nationwide.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {/* Consumer Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all p-7 flex flex-col justify-between group">
            <div className="space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform">
                🛍️
              </div>
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Citizen Consumer</span>
                <h3 className="font-display font-bold text-xl text-slate-900 mt-1">
                  Point, Scan &amp; Protect
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Snap any grocery, medicine or electronic commodity. Get immediate red/green feedback on pricing, taxes, and net quantity.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>1-Tap Grievance (`LM-2026-XXXXXX`)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Auto-attached image proof &amp; OCR bounding boxes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Track company response &amp; escalation timeline</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100">
              <button
                onClick={() => handleLaunchRole('CONSUMER', '/consumer')}
                className="w-full py-3 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold text-xs transition flex items-center justify-center gap-2 group/btn cursor-pointer"
              >
                <span>Enter Consumer Portal</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Manufacturer Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all p-7 flex flex-col justify-between group">
            <div className="space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform">
                🏭
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Brand Manufacturer
                </span>
                <h3 className="font-display font-bold text-xl text-slate-900 mt-1">
                  Pre-Launch Artwork Simulator
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Prevent costly recalls and statutory fines up to ₹1,00,000 by verifying label designs before mass print runs.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pre-print artwork compliance score (0-100%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Customer grievance inbox with 15-day SLA</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Submit packaging revisions &amp; corrective actions</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100">
              <button
                onClick={() => handleLaunchRole('COMPANY', '/company')}
                className="w-full py-3 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs transition flex items-center justify-center gap-2 group/btn cursor-pointer"
              >
                <span>Enter Manufacturer Portal</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Legal Metrology Officer Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all p-7 flex flex-col justify-between group">
            <div className="space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center text-xl shadow-xs group-hover:scale-110 transition-transform">
                ⚖️
              </div>
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                  Enforcement Officer
                </span>
                <h3 className="font-display font-bold text-xl text-slate-900 mt-1">
                  National Command Center
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Data-backed enforcement. Review AI-flagged violations, order on-site inspections, and issue official statutory dossiers.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Human-in-the-loop statutory adjudication</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>High-risk company matrix &amp; heatmaps</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Instant official inspection PDF generation</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100">
              <button
                onClick={() => handleLaunchRole('GOVERNMENT_OFFICER', '/government')}
                className="w-full py-3 rounded-xl bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white font-bold text-xs transition flex items-center justify-center gap-2 group/btn cursor-pointer"
              >
                <span>Enter Officer Portal</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS: 4-STEP PIPELINE */}
      <section className="py-20 bg-gradient-to-b from-slate-100/70 to-slate-50 border-t border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              <Compass className="w-3.5 h-3.5" />
              <span>Statutory Execution Pipeline</span>
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">
              From Camera Click to Legal Resolution in 4 Steps
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Built strictly in accordance with the Legal Metrology Act, 2009 and Packaged Commodities Rules, 2011.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative space-y-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-mono font-bold text-sm flex items-center justify-center shadow-sm">
                01
              </div>
              <h4 className="font-bold text-slate-900 text-base">Capture &amp; Calibrate</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Citizen or company uploads product photo. Dimensions (height × width) calibrate the pixel-to-millimeter ratio.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-mono font-bold text-sm flex items-center justify-center shadow-sm">
                02
              </div>
              <h4 className="font-bold text-slate-900 text-base">Neural OCR &amp; Layout</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Computer vision locates mandatory declaration clusters, bounding text boxes, and measures actual physical character height.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white font-mono font-bold text-sm flex items-center justify-center shadow-sm">
                03
              </div>
              <h4 className="font-bold text-slate-900 text-base">Statutory Rule Engine</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Evaluates Rule 6(1)(a)-(f) checklist, USP accuracy, and Table 1/2 font thresholds. Flags potential defects.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-mono font-bold text-sm flex items-center justify-center shadow-sm">
                04
              </div>
              <h4 className="font-bold text-slate-900 text-base">Adjudication &amp; Notice</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Officer reviews AI evidence dossier, schedules inspection if needed, or issues formal notice under the 2009 Act.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STATUTORY RULES REFERENCE SHOWCASE */}
      <section className="py-20 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
            <FileCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Regulatory Standards</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900">
            Rule 6 &amp; Rule 7/8 Compliance Matrix
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Our automated validator enforces all required declarations under the Legal Metrology (Packaged Commodities) Rules, 2011.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Rule 6(1)(a)
              </span>
              <span className="text-[11px] text-emerald-600 font-bold">Mandatory</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Manufacturer / Packer Identity</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Complete legal name, physical plant address, and packer registration details must be clearly specified.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Rule 6(1)(b)
              </span>
              <span className="text-[11px] text-emerald-600 font-bold">Mandatory</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Net Quantity &amp; Unit Sale Price (USP)</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Expressed in standard SI units (g, kg, ml, L, m, N) along with per-gram/per-ml unit sale pricing.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Rule 6(1)(c)
              </span>
              <span className="text-[11px] text-emerald-600 font-bold">Mandatory</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Maximum Retail Price (MRP)</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Must explicitly include the statutory clause: "(inclusive of all taxes)". Abbreviating or omitting is a defect.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Rule 6(1)(d)
              </span>
              <span className="text-[11px] text-emerald-600 font-bold">Mandatory</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Month &amp; Year of Packaging / Mfg</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Standard MM/YYYY or DD/MM/YYYY date formatting, batch numbers, and 'Best Before' where applicable.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Rule 6(1)(e)
              </span>
              <span className="text-[11px] text-emerald-600 font-bold">Mandatory</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Consumer Care Grievance Details</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Name of grievance officer, telephone/toll-free number, email ID, and complete physical postal address.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Rule 7 &amp; 8
              </span>
              <span className="text-[11px] text-amber-600 font-bold">Calibration Table</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Minimum Font Character Height</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Calibrated by package principal display area (e.g. Area ≤ 50 cm²: 1.0mm; &gt; 100 cm²: 2.0mm; &gt; 500 cm²: 4.0mm).
            </p>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section className="py-16 bg-slate-100/60 border-t border-slate-200/80 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 space-y-2">
            <h3 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-900">
              Frequently Asked Questions
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Everything you need to know about the VidhiTrace SIH26034 Prototype.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'How does the AI engine calculate character height in physical millimeters?',
                a: 'When an image is captured, our system cross-references the user-entered physical dimensions (e.g., 160mm × 100mm) against the detected pixel bounding box of the package. This yields an exact millimeter-per-pixel ratio, enabling accurate calibration of character x-height as specified in Rule 7 & 8 tables.',
              },
              {
                q: 'Does the AI replace the official Government Legal Metrology Inspector?',
                a: 'No, by design! In adherence to the Legal Metrology Act, 2009, the AI operates as an evidence-driven screening assistant. Findings are categorized as "Potential Non-Compliance". Only an authorized Legal Metrology Officer can formally verify and issue statutory violation notices.',
              },
              {
                q: 'How can brands and manufacturers benefit from the platform?',
                a: 'Manufacturers can use the Pre-Launch Packaging Simulator (/company/self-check) to upload packaging artwork before spending lakhs on printing cylinders. If a consumer raises a grievance, the company has a 15-day window to provide corrective responses and avoid unnecessary litigation.',
              },
              {
                q: 'How does this integrate with the National Consumer Helpline (NCH 1915)?',
                a: 'Every complaint registered through the citizen portal automatically receives a standardized docket number (LM-2026-XXXXXX) with timestamped image proof, extracted OCR snippets, and geo-tagged retailer metadata ready for direct NCH or INGRAM integration.',
              },
            ].map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-xs transition"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-800 hover:text-blue-600 transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 border-t border-slate-100 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION BANNER */}
      <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="relative rounded-3xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900 text-white p-8 sm:p-12 shadow-2xl overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Experience the Future of Legal Metrology</span>
            </div>

            <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white tracking-tight leading-tight">
              Ready to verify packaging compliance with AI precision?
            </h2>

            <p className="text-xs sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
              Explore the live demo portals right now. Switch between Consumer, Brand Manufacturer, and Government Officer roles seamlessly.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleLaunchRole('CONSUMER', '/consumer')}
                className="px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs shadow-lg shadow-blue-500/30 transition flex items-center gap-2 cursor-pointer"
              >
                <span>Launch Consumer Scanner</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleLaunchRole('COMPANY', '/company/self-check')}
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition flex items-center gap-2 cursor-pointer"
              >
                <span>Try Brand Simulator</span>
              </button>
              <button
                onClick={() => handleLaunchRole('GOVERNMENT_OFFICER', '/government')}
                className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <span>Officer Command Center</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
