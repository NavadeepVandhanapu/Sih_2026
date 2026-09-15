import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, UserRole } from '../../types';
import { Shield, Plus, Search, UserCheck, ShieldAlert, Key, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const AdminUsers: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('GOVERNMENT_OFFICER');
  const [newCompanyId, setNewCompanyId] = useState('comp-apex');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setError('Failed to load user directory from server.');
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Network error connecting to Legal Metrology API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          role: newRole,
          companyId: newRole === 'COMPANY' ? newCompanyId : undefined,
        }),
      });

      if (res.ok) {
        confetti({ particleCount: 50, spread: 60 });
        setNewName('');
        setNewEmail('');
        setShowAddModal(false);
        await loadUsers();
      }
    } catch (err) {
      console.error('Failed to create user:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, targetRole: UserRole) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      });
      if (res.ok) {
        await loadUsers();
      }
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            System Security &amp; Access Control
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 font-display">
            User RBAC &amp; Identity Manager
          </h1>
          <p className="text-xs text-slate-500">
            Manage administrative credentials, inspector role assignments, and enterprise access scopes.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Provision New User
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {filteredUsers.length} Active System Users
        </span>
      </div>

      {/* User Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {error ? (
          <div className="p-8 text-center text-xs text-rose-800 bg-rose-50 space-y-3">
            <p className="font-bold">{error}</p>
            <button
              onClick={loadUsers}
              className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition"
            >
              Retry Loading Users
            </button>
          </div>
        ) : loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading user registry...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition text-xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0 font-mono">
                    {u.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">{u.name}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{u.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  <div className="text-right">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono uppercase ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-900'
                          : u.role === 'GOVERNMENT_OFFICER'
                          ? 'bg-blue-100 text-blue-900'
                          : u.role === 'COMPANY'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>

                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
                  >
                    <option value="CONSUMER">CONSUMER</option>
                    <option value="COMPANY">COMPANY</option>
                    <option value="GOVERNMENT_OFFICER">GOVERNMENT_OFFICER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Add User */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4 animate-fadeIn">
            <h2 className="text-base font-extrabold text-slate-900 font-display">Provision System User</h2>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inspector Ramesh Kumar"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="ramesh.kumar@doca.gov.in"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned RBAC Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold focus:outline-none"
                >
                  <option value="CONSUMER">CONSUMER — General Shopper</option>
                  <option value="COMPANY">COMPANY — Enterprise Representative</option>
                  <option value="GOVERNMENT_OFFICER">GOVERNMENT_OFFICER — Legal Metrology Inspector</option>
                  <option value="ADMIN">ADMIN — System Administrator</option>
                </select>
              </div>

              {newRole === 'COMPANY' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Company Scope ID</label>
                  <input
                    type="text"
                    value={newCompanyId}
                    onChange={(e) => setNewCompanyId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Provisioning...' : 'Provision Credential'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
