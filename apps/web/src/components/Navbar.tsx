import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScanLine, FileText, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, demoUsers, switchUser, logout } = useAuth();
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
        <Link to="/" className="flex items-center shrink-0">
          <img 
            src="/vidhitrace-logo-original.png" 
            alt="VidhiTrace" 
            className="h-10 sm:h-12 w-auto object-contain hover:scale-105 transition-transform" 
          />
        </Link>

        {/* Minimal Role Switcher Segmented Control (Hidden on Landing Page) */}
        {location.pathname !== '/' && (
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
        )}

        {/* Minimal Context Nav */}
        <div className="hidden sm:flex items-center gap-1 text-xs">
          <Link
            to="/"
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
              location.pathname === '/'
                ? 'text-blue-600 bg-blue-50 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Home
          </Link>

          {location.pathname === '/' && (
            <>
              <a href="#about" className="text-xs font-semibold px-3 py-1.5 rounded-lg transition text-slate-500 hover:text-slate-900">
                About
              </a>
              <a href="#team" className="text-xs font-semibold px-3 py-1.5 rounded-lg transition text-slate-500 hover:text-slate-900">
                Team
              </a>
              <a href="#contact" className="text-xs font-semibold px-3 py-1.5 rounded-lg transition text-slate-500 hover:text-slate-900">
                Contact Us
              </a>
            </>
          )}

          {user?.role === 'CONSUMER' && location.pathname !== '/' && (
            <>
              <Link to="/consumer" className={navLinkClass('/consumer')}>
                Scanner
              </Link>
              <Link to="/consumer/complaints" className={navLinkClass('/consumer/complaints')}>
                My Reports
              </Link>
            </>
          )}
          {user?.role === 'COMPANY' && location.pathname !== '/' && (
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
          {user?.role === 'GOVERNMENT_OFFICER' && location.pathname !== '/' && (
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
          {user?.role === 'ADMIN' && location.pathname !== '/' && (
            <>
              <Link to="/admin" className={navLinkClass('/admin')}>
                Rule Registry
              </Link>
              <Link to="/admin/audit-logs" className={navLinkClass('/admin/audit-logs')}>
                Audit Ledger
              </Link>
            </>
          )}
        </div>

        {/* Auth Action Buttons */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate max-w-[120px]">{user.name.split(' ')[0]}</span>
              </span>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="text-xs text-slate-500 hover:text-slate-900 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                title="Sign out of current account"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                to="/login"
                className="text-xs font-bold text-slate-700 hover:text-blue-600 px-3 py-1.5 rounded-lg transition"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow-xs transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
