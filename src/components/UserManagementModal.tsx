import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  UserCheck,
  Key,
  Copy,
  Check,
  Trash2,
  X,
  RefreshCw,
  Search,
  Building2,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Share2,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { UserAccount, UserRole } from '../types/auth';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  generateStrongPassword,
  formatCredentialsShareText,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_TYPO_EMAIL
} from '../services/authService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
}

export const UserManagementModal: React.FC<Props> = ({ isOpen, onClose, currentUser }) => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // New User Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [assignedVenue, setAssignedVenue] = useState('');
  const [assignedCity, setAssignedCity] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(true);

  // Feedback State
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<{ id: string; email: string } | null>(null);

  const reloadUsers = () => {
    setUsers(getAllUsers());
  };

  useEffect(() => {
    if (isOpen) {
      reloadUsers();
      setFormError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const generated = generateStrongPassword();
    setPassword(generated);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const res = createUser({
      name,
      email,
      password,
      role,
      assignedVenue: assignedVenue || undefined,
      assignedCity: assignedCity || undefined,
    });

    if (!res.success) {
      setFormError(res.error || 'Failed to create user credentials.');
      return;
    }

    // Success
    reloadUsers();
    setName('');
    setEmail('');
    setPassword('');
    setAssignedVenue('');
    setAssignedCity('');
    setShowCreateForm(false);
  };

  const handleDelete = (id: string, userEmail: string) => {
    if (
      userEmail.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() ||
      userEmail.toLowerCase() === DEFAULT_ADMIN_TYPO_EMAIL.toLowerCase()
    ) {
      setFormError('The default Super Admin account cannot be deleted.');
      return;
    }
    setConfirmDeleteUser({ id, email: userEmail });
  };

  const handleConfirmDelete = () => {
    if (!confirmDeleteUser) return;
    const res = deleteUser(confirmDeleteUser.id);
    if (res.success) {
      reloadUsers();
      setConfirmDeleteUser(null);
    } else {
      setFormError(res.error || 'Failed to delete user.');
      setConfirmDeleteUser(null);
    }
  };

  const handleToggleStatus = (u: UserAccount) => {
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    updateUser(u.id, { status: newStatus });
    reloadUsers();
  };

  const handleCopyCredentials = (u: UserAccount) => {
    const shareText = formatCredentialsShareText(u);
    navigator.clipboard.writeText(shareText);
    setCopiedId(u.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.assignedVenue && u.assignedVenue.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Admin User Credentials Management</h3>
                <span className="text-[10px] bg-white/20 text-white font-mono px-2 py-0.5 rounded-full">
                  {users.length} Registered Accounts
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Create user accounts, generate passwords, and copy login details for field auditors
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or venue..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              if (!showCreateForm) handleGeneratePassword();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-emerald-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4 text-slate-950" />
            <span>{showCreateForm ? 'Cancel Creation' : 'Create User Credentials'}</span>
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Create User Form Section */}
          {showCreateForm && (
            <div className="bg-slate-950/80 border border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                  <UserPlus className="w-4 h-4" />
                  <span>New User Credentials Form</span>
                </div>
                <span className="text-[11px] text-slate-400">Admin can assign role & initial password</span>
              </div>

              {formError && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Arun Kumar"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">User Email / Username</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. auditor2@venue.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 text-xs font-semibold">User Password</label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate Random</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="e.g. Venue@2026"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Role Permission</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="user">Field Auditor / Venue User (Full Audit & Scan Access)</option>
                    <option value="admin">Administrator (Audit + User Credentials Management)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Assigned Venue (Optional)</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={assignedVenue}
                      onChange={(e) => setAssignedVenue(e.target.value)}
                      placeholder="e.g. DPS International Exam Center"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Assigned City (Optional)</label>
                  <input
                    type="text"
                    value={assignedCity}
                    onChange={(e) => setAssignedCity(e.target.value)}
                    placeholder="e.g. New Delhi"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    Save & Create User
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* User List Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
              <span>Current User Credentials Matrix ({filteredUsers.length})</span>
              <span className="text-[11px] text-slate-500">
                Click "Copy Login Details" to quickly WhatsApp or Email credentials
              </span>
            </div>

            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 text-[11px] font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">User & Email</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Password</th>
                    <th className="py-3 px-3">Assigned Venue</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No user credentials found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isDefaultAdmin =
                        u.email.toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() ||
                        u.email.toLowerCase() === DEFAULT_ADMIN_TYPO_EMAIL.toLowerCase();
                      const isPassVisible = visiblePasswords[u.id];

                      return (
                        <tr key={u.id} className="hover:bg-slate-900/60 transition-colors">
                          {/* User & Email */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  u.role === 'admin'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                }`}
                              >
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {isDefaultAdmin && (
                                    <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-full font-mono">
                                      Default Admin
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono select-all">
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                u.role === 'admin'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                              }`}
                            >
                              {u.role === 'admin' ? (
                                <>
                                  <Shield className="w-3 h-3" />
                                  <span>Admin</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3 h-3" />
                                  <span>Auditor</span>
                                </>
                              )}
                            </span>
                          </td>

                          {/* Password */}
                          <td className="py-3 px-3 font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-300 text-[11px] select-all">
                                {isPassVisible ? u.password : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(u.id)}
                                className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                                title={isPassVisible ? 'Hide' : 'Show password'}
                              >
                                {isPassVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>

                          {/* Venue */}
                          <td className="py-3 px-3 text-slate-300 text-[11px]">
                            {u.assignedVenue ? (
                              <div>
                                <div className="truncate max-w-[150px]" title={u.assignedVenue}>
                                  {u.assignedVenue}
                                </div>
                                {u.assignedCity && (
                                  <div className="text-[10px] text-slate-500">{u.assignedCity}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">All Venues</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3">
                            <button
                              onClick={() => !isDefaultAdmin && handleToggleStatus(u)}
                              disabled={isDefaultAdmin}
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border cursor-pointer ${
                                u.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              } ${isDefaultAdmin ? 'cursor-default' : 'hover:opacity-80'}`}
                              title={isDefaultAdmin ? 'Cannot deactivate Master Admin' : 'Click to toggle Active/Inactive'}
                            >
                              {u.status === 'active' ? 'Active' : 'Inactive'}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleCopyCredentials(u)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 rounded-lg transition-colors cursor-pointer"
                                title="Copy login credentials to share via WhatsApp/Email"
                              >
                                {copiedId === u.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {!isDefaultAdmin && (
                                <button
                                  onClick={() => handleDelete(u.id, u.email)}
                                  className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                                  title="Delete user credentials"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Logged in as: <strong className="text-slate-200">{currentUser.name}</strong> (Administrator)</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Delete Confirmation In-Modal */}
        {confirmDeleteUser && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Delete User Account</h3>
                  <p className="text-xs text-slate-400">Are you sure you want to remove this user?</p>
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl text-xs font-mono text-slate-300 break-all border border-slate-800">
                {confirmDeleteUser.email}
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteUser(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl border border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
