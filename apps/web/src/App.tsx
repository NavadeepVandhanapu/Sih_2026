import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
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

const RoleRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <div className="p-12 text-center text-slate-400">Initializing Metrologix Portal...</div>;
  }
  if (!user) return <Navigate to="/consumer" replace />;

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
          <Route path="/" element={<RoleRedirect />} />

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
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};
