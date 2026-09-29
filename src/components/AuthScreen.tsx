import React, { useState } from 'react';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  Network,
  User,
  CheckCircle2,
  LockKeyhole,
  ArrowLeft
} from 'lucide-react';
import {
  authenticate,
  authenticateHubInChargeUser,
} from '../services/authService';
import { UserAccount } from '../types/auth';

interface Props {
  onLoginSuccess: (user: UserAccount) => void;
}

export const AuthScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  // By default, regular user view (no admin tab shown on user link)
  const [isAdminView, setIsAdminView] = useState(false);

  // User Login State (Only Gmail ID needed, optional Hub Name, no password)
  const [hubGmail, setHubGmail] = useState('');
  const [hubName, setHubName] = useState('');

  // Admin Login State
  const [adminUserId, setAdminUserId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // User Login Submit: No password required, only Gmail ID
  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = authenticateHubInChargeUser(hubGmail, hubName);
      setIsLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Please enter a valid Gmail ID.');
      }
    }, 250);
  };

  // Admin Login Submit: Requires Admin User ID & Polystudio@2026
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = authenticate(adminUserId, adminPassword, 'admin');
      setIsLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Invalid Admin User ID or Password.');
      }
    }, 250);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 flex flex-col gap-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-2xl border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <Network className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center justify-center gap-2">
            <span>NetScan Audit Master</span>
          </h1>
          <p className="text-xs text-slate-400">
            Venue Hardware Inventory, Live Auto-Scanner & Switch Topology
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
          {!isAdminView ? (
            /* =========================================================================
               USER LOGIN VIEW: Clean User Form - NO ADMIN TAB DISPLAYED
               For user no need password, only user will put their Gmail ID
               ========================================================================= */
            <div className="space-y-5">
              <div className="space-y-1 text-center">
                <h2 className="text-base font-bold text-slate-100">
                  Venue Hub In-Charge Login
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Put your Gmail ID to access the venue audit portal.
                  <br />
                  <span className="text-emerald-400 font-medium">No password required for field users.</span>
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-2xl text-xs text-rose-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              <form onSubmit={handleUserSubmit} className="space-y-4">
                {/* Gmail ID Field (Required) */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                    Gmail ID <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={hubGmail}
                      onChange={(e) => setHubGmail(e.target.value)}
                      placeholder="e.g. auditor.kolkata@gmail.com"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-200 focus:outline-none transition-colors font-mono"
                    />
                  </div>
                </div>

                {/* Hub In-Charge Name (Optional) */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5 uppercase tracking-wider flex items-center justify-between">
                    <span>Hub In-Charge Name</span>
                    <span className="text-[10px] text-slate-500 font-normal font-sans">(Optional)</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={hubName}
                      onChange={(e) => setHubName(e.target.value)}
                      placeholder="e.g. Rajesh Sharma"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20"
                >
                  {isLoading ? (
                    <span>Opening Audit Portal...</span>
                  ) : (
                    <>
                      <span>Start Venue Network Audit</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Discrete Admin Link at Bottom (No admin tab shown on home page) */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Concurrent Multi-Venue Audit</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminView(true);
                    setError(null);
                  }}
                  className="text-slate-500 hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Administrator Login Portal"
                >
                  <LockKeyhole className="w-3 h-3" />
                  <span>Admin Login</span>
                </button>
              </div>
            </div>
          ) : (
            /* =========================================================================
               ADMIN LOGIN VIEW: User ID & Password (Polystudio@2026)
               No display of Super Admin User ID on screen!
               ========================================================================= */
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminView(false);
                    setError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to User Login</span>
                </button>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full uppercase">
                  Admin Portal
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Master Administrator Login</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Please enter your Admin credentials to manage reports and drive settings.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-2xl text-xs text-rose-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                    Admin User ID / Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      autoFocus
                      value={adminUserId}
                      onChange={(e) => setAdminUserId(e.target.value)}
                      placeholder="Admin User ID"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5 uppercase tracking-wider">
                    Admin Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-200 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20"
                >
                  {isLoading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Login to Master Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Security badge footer */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Role-Restricted Security • Hub-Wise Audit Reporting</span>
        </div>
      </div>
    </div>
  );
};
