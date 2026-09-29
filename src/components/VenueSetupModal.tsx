import React, { useState } from 'react';
import { VenueAuditConfig } from '../types/inventory';
import { DEFAULT_DRIVE_FOLDER_ID, getAdminDriveFolderId } from '../services/driveService';
import { Building2, MapPin, Calendar, HardDrive, ArrowRight, ShieldCheck, X, User, Mail } from 'lucide-react';

interface Props {
  onStartAudit: (config: VenueAuditConfig) => void;
  defaultConfig?: Partial<VenueAuditConfig>;
  onClose?: () => void;
}

export const VenueSetupModal: React.FC<Props> = ({ onStartAudit, defaultConfig, onClose }) => {
  const today = new Date().toISOString().split('T')[0];
  const activeAdminDriveFolderId = getAdminDriveFolderId();
  const [venueName, setVenueName] = useState(defaultConfig?.venueName || '');
  const [city, setCity] = useState(defaultConfig?.city || '');
  const [auditDate, setAuditDate] = useState(defaultConfig?.auditDate || today);
  const [targetSubnet, setTargetSubnet] = useState(defaultConfig?.targetSubnet || '192.168.1.0/24');
  const [targetDriveFolderId, setTargetDriveFolderId] = useState(
    defaultConfig?.targetDriveFolderId || activeAdminDriveFolderId
  );
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!venueName.trim()) {
      setError('Please enter the Venue Name.');
      return;
    }
    if (!city.trim()) {
      setError('Please enter the City.');
      return;
    }
    setError('');
    onStartAudit({
      venueName: venueName.trim(),
      city: city.trim(),
      auditDate,
      targetSubnet: targetSubnet.trim() || '192.168.1.0/24',
      targetDriveFolderId: targetDriveFolderId.trim() || activeAdminDriveFolderId,
      hubInChargeName: defaultConfig?.hubInChargeName,
      hubInChargeEmail: defaultConfig?.hubInChargeEmail,
    });
  };

  const folderPreview = `${venueName.trim() || 'VenueName'}_${city.trim() || 'City'}_${auditDate}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Banner - Fixed at top */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-4 sm:p-5 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                <Building2 className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight">Venue Audit & Network Scan Setup</h2>
                <p className="text-[11px] text-emerald-100 font-medium">Automatic Google Drive Sync & Hardware Inventory</p>
              </div>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Form Body - Adjusts comfortably within screen */}
        <form id="venue-setup-form" onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-medium">
              {error}
            </div>
          )}

          {/* Hub In-Charge Badge */}
          {defaultConfig?.hubInChargeName && (
            <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/30 rounded-xl flex items-center justify-between text-xs flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-400">Hub In-Charge:</span>
                <strong className="text-slate-200">{defaultConfig.hubInChargeName}</strong>
              </div>
              <div className="font-mono text-[11px] text-cyan-300 flex items-center gap-1">
                <Mail className="w-3 h-3 text-cyan-400" />
                <span>{defaultConfig.hubInChargeEmail}</span>
              </div>
            </div>
          )}

          {/* Venue Name & City - Primary fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Venue Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Apex Examination Center"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" /> City <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mumbai, Bengaluru, Delhi"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Audit Date & Target Subnet */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> Audit Date
              </label>
              <input
                type="date"
                value={auditDate}
                onChange={(e) => setAuditDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Target Network Subnet
              </label>
              <input
                type="text"
                value={targetSubnet}
                onChange={(e) => setTargetSubnet(e.target.value)}
                placeholder="192.168.1.0/24"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Drive target folder information */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-400" /> Google Drive Target Folder
              </span>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Connected & Ready
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Drive Destination Folder:</span>
              <span className="font-mono text-emerald-300 font-medium truncate max-w-[240px]">
                📁 {folderPreview}
              </span>
            </div>
          </div>
        </form>

        {/* Action Buttons - Fixed at bottom so they are ALWAYS visible within screen */}
        <div className="p-3.5 sm:p-4 bg-slate-950/95 border-t border-slate-800 shrink-0 space-y-2">
          {/* Primary Start Scan Button */}
          <button
            type="submit"
            form="venue-setup-form"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.99] transition-all cursor-pointer text-xs sm:text-sm"
          >
            <span>Start Real-Time Network Scan & Audit</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Close Button immediately after start scan button if anyone doesn't want to start scan */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-medium rounded-xl border border-slate-700/80 transition-all cursor-pointer text-xs"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
              <span>Close (Do Not Start Scan)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
