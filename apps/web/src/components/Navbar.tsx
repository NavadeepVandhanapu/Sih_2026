import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ScanLine, FileText, Sparkles, ShieldCheck, Bell, Check, Package, Users, Sliders, History, X } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: number;
  createdAt: string;
}

export const Navbar: React.FC = () => {
  const { user, demoUsers, switchUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDrawer, setShowNotifDrawer] = useState<boolean>(false);

  const fetchNotifs = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter((n) => n.read === 0).length;

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: 1 } : n))
        );
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleRoleClick = (role: 'CONSUMER' | 'COMPANY' | 'GOVERNMENT_OFFICER' | 'ADMIN') => {
    const targetUser = demoUsers.find((u: { role: string }) => u.role === role);
    if (targetUser) {
      switchUser(targetUser);
      if (role === 'CONSUMER') navigate('/consumer');
      else if (role === 'COMPANY') navigate('/company');
      else if (role === 'GOVERNMENT_OFFICER') navigate('/government');
      else if (role === 'ADMIN') navigate('/admin');
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
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
        <div className="hidden md:flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-semibold">
          <button
            onClick={() => handleRoleClick('CONSUMER')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
              user?.role === 'CONSUMER'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Consumer</span>
          </button>
          <button
            onClick={() => handleRoleClick('COMPANY')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
              user?.role === 'COMPANY'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Manufacturer</span>
          </button>
          <button
            onClick={() => handleRoleClick('GOVERNMENT_OFFICER')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
              user?.role === 'GOVERNMENT_OFFICER'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Officer</span>
          </button>
          <button
            onClick={() => handleRoleClick('ADMIN')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
              user?.role === 'ADMIN'
                ? 'bg-white text-slate-900 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Admin</span>
          </button>
        </div>

        {/* Navigation & Notifications */}
        <div className="flex items-center gap-2 text-xs">
          <div className="hidden sm:flex items-center gap-1">
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
                <Link to="/company/products" className={navLinkClass('/company/products')}>
                  Products
                </Link>
                <Link to="/company/self-check" className={navLinkClass('/company/self-check')}>
                  Self-Check
                </Link>
                <Link to="/company/complaints" className={navLinkClass('/company/complaints')}>
                  Reports
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
            {user?.role === 'ADMIN' && (
              <>
                <Link to="/admin" className={navLinkClass('/admin')}>
                  Rules Engine
                </Link>
                <Link to="/admin/users" className={navLinkClass('/admin/users')}>
                  Users
                </Link>
                <Link to="/admin/audit-logs" className={navLinkClass('/admin/audit-logs')}>
                  Audit Logs
                </Link>
              </>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDrawer(!showNotifDrawer)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* Notifications Drawer Dropdown */}
            {showNotifDrawer && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 space-y-3 z-50 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-900 text-xs">Notifications</span>
                  <button
                    onClick={() => setShowNotifDrawer(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-slate-400 text-center py-4 text-[11px]">No notifications right now.</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer text-xs space-y-1 ${
                          n.read === 0
                            ? 'bg-blue-50/60 border-blue-100 text-slate-900'
                            : 'bg-slate-50 border-slate-100 text-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span className="truncate">{n.title}</span>
                          {n.read === 0 && (
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">{n.message}</p>
                        <span className="text-[9px] text-slate-400 font-mono block pt-0.5">
                          {new Date(n.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
