import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScanLine, FileText, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, demoUsers, switchUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleRoleClick = (role: 'CONSUMER' | 'COMPANY' | 'GOVERNMENT_OFFICER') => {
    const targetUser = demoUsers.find((u: { role: string }) => u.role === role);
    if (targetUser) {
      switchUser(targetUser);
      if (role === 'CONSUMER') navigate('/consumer');
      else if (role === 'COMPANY') navigate('/company');
      else if (role === 'GOVERNMENT_OFFICER') navigate('/government');
    }
  };

  const navLinkClass = (path: string) => {
    const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
    return `text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
      isActive ? 'text-slate-900 bg-slate-100 font-bold' : 'text-slate-500 hover:text-slate-900'
    }`;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-sm">
            <ScanLine className="w-4 h-4" />
          </div>
          <span className="font-display font-extrabold text-base tracking-tight text-slate-900">
            Metrologix
          </span>
          <span className="text-[10px] font-bold text-slate-400 font-mono">SIH26034</span>
        </Link>

        {/* Minimal Role Switcher Segmented Control */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-semibold">
          <button
            onClick={() => handleRoleClick('CONSUMER')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              user?.role === 'CONSUMER'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Consumer</span>
          </button>
          <button
            onClick={() => handleRoleClick('COMPANY')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              user?.role === 'COMPANY'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Manufacturer</span>
          </button>
          <button
            onClick={() => handleRoleClick('GOVERNMENT_OFFICER')}
            className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              user?.role === 'GOVERNMENT_OFFICER'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Officer</span>
          </button>
        </div>

        {/* Minimal Context Nav */}
        <div className="hidden sm:flex items-center gap-1 text-xs">
          {user?.role === 'CONSUMER' && (
            <>
              <Link to="/consumer" className={navLinkClass('/consumer')}>
                Scanner
              </Link>
              <Link to="/consumer/complaints" className={navLinkClass('/consumer/complaints')}>
                My Reports
              </Link>
            </>
          )}
          {user?.role === 'COMPANY' && (
            <>
              <Link to="/company" className={navLinkClass('/company')}>
                Overview
              </Link>
              <Link to="/company/self-check" className={navLinkClass('/company/self-check')}>
                Self-Check
              </Link>
              <Link to="/company/complaints" className={navLinkClass('/company/complaints')}>
                Customer Reports
              </Link>
            </>
          )}
          {user?.role === 'GOVERNMENT_OFFICER' && (
            <>
              <Link to="/government" className={navLinkClass('/government')}>
                Analytics
              </Link>
              <Link to="/government/complaints" className={navLinkClass('/government/complaints')}>
                Review Queue
              </Link>
              <Link to="/government/inspections" className={navLinkClass('/government/inspections')}>
                Inspections
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
