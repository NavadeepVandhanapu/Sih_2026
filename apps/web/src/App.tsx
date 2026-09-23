import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sparkles } from 'lucide-react';

import { ConsumerScan } from './pages/consumer/ConsumerScan';
import { ConsumerComplaints } from './pages/consumer/ConsumerComplaints';
import { CompanyDashboard } from './pages/company/CompanyDashboard';
import { CompanyComplaints } from './pages/company/CompanyComplaints';
import { CompanySelfCheck } from './pages/company/CompanySelfCheck';
import { GovtOverview } from './pages/government/GovtOverview';
import { GovtComplaints } from './pages/government/GovtComplaints';
import { GovtCaseReview } from './pages/government/GovtCaseReview';
import { GovtInspections } from './pages/government/GovtInspections';
import { AdminRules } from './pages/admin/AdminRules';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';

import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Start exit animation after 4 seconds
    const timer = setTimeout(() => {
      setIsExiting(true);
      // Wait for exit animation to finish before removing splash screen
      setTimeout(onComplete, 1000); 
    }, 4000); 
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white overflow-hidden pointer-events-none transition-opacity duration-1000 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* Animation Keyframes */}
      <style>{`
        @keyframes cinematic-zoom {
          0% {
            transform: scale(4);
            opacity: 0;
            filter: blur(10px);
          }
          15% {
            transform: scale(1.05);
            opacity: 1;
            filter: brightness(1.2);
          }
          20% {
            transform: scale(1);
            opacity: 1;
            filter: brightness(1);
          }
          85% {
            transform: scale(0.95);
            opacity: 1;
          }
          100% {
            transform: scale(5);
            opacity: 0;
          }
        }
        .animate-cinematic {
          animation: cinematic-zoom 4s cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
        }

        @keyframes shimmer-sweep {
          0% { transform: translateX(-150%) skewX(-20deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(300%) skewX(-20deg); opacity: 0; }
        }
        .animate-shimmer {
          animation: shimmer-sweep 2.5s cubic-bezier(0.4, 0, 0.2, 1) 1.2s forwards;
        }
      `}</style>
      
      {/* The Animated Intro Logo */}
      <div className="relative flex items-center justify-center animate-cinematic w-full h-full z-10">
         <div className="relative overflow-hidden px-10 py-6">
           <img 
             src="/vidhitrace-logo-original.png" 
             alt="VidhiTrace Logo" 
             className="w-[280px] sm:w-[400px] md:w-[600px] h-auto object-contain drop-shadow-xl" 
           />
           {/* Shimmer sweep effect for slogan highlight */}
           <div className="absolute inset-y-0 w-[50%] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent -left-[100%] animate-shimmer blur-[4px]" style={{ mixBlendMode: 'plus-lighter' }} />
         </div>
      </div>
    </div>
  );
};

const RoleRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Initializing VidhiTrace Portal...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'COMPANY':
      return <Navigate to="/company" replace />;
    case 'GOVERNMENT_OFFICER':
      return <Navigate to="/government" replace />;
    case 'ADMIN':
      return <Navigate to="/admin" replace />;
    case 'CONSUMER':
    default:
      return <Navigate to="/consumer" replace />;
  }
};

export const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage initialMode="login" />} />
          <Route path="/signup" element={<AuthPage initialMode="signup" />} />

          {/* Consumer Routes */}
          <Route path="/consumer" element={<ConsumerScan />} />
          <Route path="/consumer/complaints" element={<ConsumerComplaints />} />

          {/* Company Routes */}
          <Route path="/company" element={<CompanyDashboard />} />
          <Route path="/company/complaints" element={<CompanyComplaints />} />
          <Route path="/company/self-check" element={<CompanySelfCheck />} />

          {/* Government Enforcement Routes */}
          <Route path="/government" element={<GovtOverview />} />
          <Route path="/government/complaints" element={<GovtComplaints />} />
          <Route path="/government/complaints/:id" element={<GovtCaseReview />} />
          <Route path="/government/inspections" element={<GovtInspections />} />

          {/* Administration Routes */}
          <Route path="/admin" element={<AdminRules />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />

          {/* Catch-all */}
          <Route path="*" element={<RoleRedirect />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <p className="font-bold text-white">
              Department of Consumer Affairs (DoCA) • Ministry of Consumer Affairs, Food &amp; Public Distribution
            </p>
            <p className="text-[11px] text-slate-500">
              Legal Metrology (Packaged Commodities) Rules, 2011 • Enforcement Platform (SIH26034 Prototype)
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="hover:text-white transition">National Consumer Helpline (NCH): 1915</span>
            <span>•</span>
            <span className="hover:text-white transition">DoCA Portal</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <Router>
      <AuthProvider>
        <AppContent />
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      </AuthProvider>
    </Router>
  );
};
