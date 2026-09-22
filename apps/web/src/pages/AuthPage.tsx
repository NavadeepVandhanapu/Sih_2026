import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import {
  ScanLine,
  Mail,
  Lock,
  User as UserIcon,
  Building2,
  Scale,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Phone,
  Briefcase
} from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login' }) => {
  const { login, signup, demoUsers } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine mode from prop or path
  const [mode, setMode] = useState<'login' | 'signup'>(
    location.pathname === '/signup' || initialMode === 'signup' ? 'signup' : 'login'
  );

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<Role>('CONSUMER');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectUserByRole = (userRole: Role) => {
    switch (userRole) {
      case 'COMPANY':
        navigate('/company');
        break;
      case 'GOVERNMENT_OFFICER':
        navigate('/government');
        break;
      case 'ADMIN':
        navigate('/admin');
        break;
      case 'CONSUMER':
      default:
        navigate('/consumer');
        break;
    }
  };

  const handleQuickDemo = async (demoUserEmail: string) => {
    setError(null);
    setLoading(true);
    const res = await login(demoUserEmail, 'demo123');
    setLoading(false);
    if (res.success) {
      const u = demoUsers.find((d) => d.email.toLowerCase() === demoUserEmail.toLowerCase());
      redirectUserByRole(u?.role || 'CONSUMER');
    } else {
      setError(res.error || 'Demo login failed');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    const res = await login(email.trim(), password || 'demo123');
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Signed in successfully! Redirecting...');
      setTimeout(() => {
        const u = demoUsers.find((d) => d.email.toLowerCase() === email.trim().toLowerCase());
        redirectUserByRole(u?.role || 'CONSUMER');
      }, 500);
    } else {
      setError(res.error || 'Invalid credentials');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setError('Full name is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (password && password.length < 6) {
      setError('Password should be at least 6 characters long');
      return;
    }
    if (password && confirmPassword && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (role === 'COMPANY' && !companyName.trim()) {
      setError('Company / Brand Name is required for manufacturer accounts');
      return;
    }

    setLoading(true);
    const res = await signup({
      name: name.trim(),
      email: email.trim(),
      password: password || 'demo123',
      role,
      phone: phone.trim() || '+91 98000 00000',
      companyName: role === 'COMPANY' ? companyName.trim() : undefined,
    });
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Account created successfully! Welcome to VidhiTrace.');
      setTimeout(() => {
        redirectUserByRole(role);
      }, 700);
    } else {
      setError(res.error || 'Account creation failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 relative overflow-hidden">
      {/* BACKGROUND GLOW */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 -right-20 w-[500px] h-[500px] rounded-full bg-blue-300/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] rounded-full bg-indigo-300/20 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#1e293b 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>

          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold">
            <ShieldCheck className="w-3 h-3 text-blue-600" />
            <span>DoCA Statutory Portal</span>
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/60 p-6 sm:p-8 space-y-6">
          {/* Header Brand & Mascot */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                <ScanLine className="w-5 h-5" />
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white text-xl flex items-center justify-center shadow-md">
                🤖
              </div>
            </div>

            <h1 className="font-display font-extrabold text-2xl text-slate-900 tracking-tight">
              {mode === 'login' ? 'Welcome to VidhiTrace' : 'Create Your Account'}
            </h1>

            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              {mode === 'login'
                ? 'Sign in to access AI compliance scanner, manufacturer simulator, and enforcement docket.'
                : 'Join the national Legal Metrology compliance and citizen protection network.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2 rounded-lg transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2 rounded-lg transition cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {/* Quick 1-Click Demo Accounts (Prominent for Judges & Hackathon Reviewers) */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100/90">
            <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Quick 1-Click Demo Login</span>
              </span>
              <span className="text-indigo-500 font-normal">Pre-seeded accounts</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleQuickDemo('consumer@demo.com')}
                disabled={loading}
                className="px-2.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-indigo-200/70 text-left text-xs transition hover:border-blue-300 shadow-xs cursor-pointer group"
              >
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>🛍️ Aarav</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-600 transition" />
                </div>
                <div className="text-[10px] text-slate-500">Citizen Consumer</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('company@demo.com')}
                disabled={loading}
                className="px-2.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-indigo-200/70 text-left text-xs transition hover:border-indigo-300 shadow-xs cursor-pointer group"
              >
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>🏭 Rajesh</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-indigo-600 transition" />
                </div>
                <div className="text-[10px] text-slate-500">Apex Foods (Brand)</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('officer@demo.com')}
                disabled={loading}
                className="px-2.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-indigo-200/70 text-left text-xs transition hover:border-amber-300 shadow-xs cursor-pointer group"
              >
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>⚖️ Sunita</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-amber-600 transition" />
                </div>
                <div className="text-[10px] text-slate-500">Legal Metrology IO</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin@demo.com')}
                disabled={loading}
                className="px-2.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-indigo-200/70 text-left text-xs transition hover:border-purple-300 shadow-xs cursor-pointer group"
              >
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>🏛️ Dr. Nambiar</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-purple-600 transition" />
                </div>
                <div className="text-[10px] text-slate-500">Director / Admin</div>
              </button>
            </div>
          </div>

          {/* FORM: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="consumer@demo.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">Password</label>
                  <span className="text-[10px] text-slate-400">Default demo: demo123</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* FORM: SIGNUP */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Select Account Role</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('CONSUMER')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      role === 'CONSUMER'
                        ? 'bg-blue-50/80 border-blue-500 text-blue-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-base mb-1">🛍️</div>
                    <div className="font-bold text-[11px]">Consumer</div>
                    <div className="text-[9px] text-slate-400">Citizen</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('COMPANY')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      role === 'COMPANY'
                        ? 'bg-indigo-50/80 border-indigo-500 text-indigo-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-base mb-1">🏭</div>
                    <div className="font-bold text-[11px]">Brand / Mfr</div>
                    <div className="text-[9px] text-slate-400">Packer</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('GOVERNMENT_OFFICER')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      role === 'GOVERNMENT_OFFICER'
                        ? 'bg-amber-50/80 border-amber-500 text-amber-900 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-base mb-1">⚖️</div>
                    <div className="font-bold text-[11px]">LM Officer</div>
                    <div className="text-[9px] text-slate-400">Inspector</div>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="priya@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Conditional Company Name */}
              {role === 'COMPANY' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-bold text-slate-700 block">Company / Brand Name</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. PureHealth Organics Pvt Ltd"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                    />
                  </div>
                </div>
              )}

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Mobile Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Confirm</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-slate-500 text-[11px]">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  defaultChecked
                  required
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="agreeTerms">
                  I agree to statutory terms under Legal Metrology Act, 2009.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {loading ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Switch Prompt */}
          <div className="text-center pt-2 text-xs text-slate-500">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                    setSuccessMsg(null);
                  }}
                  className="font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-[11px] text-slate-400">
          Department of Consumer Affairs (DoCA) • SIH 2026 Prototype
        </div>
      </div>
    </div>
  );
};
