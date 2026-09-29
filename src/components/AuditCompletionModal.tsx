import React, { useState } from 'react';
import { VenueAuditConfig, NetworkDevice, DriveUploadResult } from '../types/inventory';
import {
  CheckCircle2,
  Share2,
  Copy,
  Check,
  ExternalLink,
  HardDrive,
  FileSpreadsheet,
  Building2,
  Calendar,
  ShieldCheck,
  Send,
  Download,
  RotateCcw,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Props {
  venueConfig: VenueAuditConfig;
  devices: NetworkDevice[];
  uploadResult?: DriveUploadResult | null;
  onClose: () => void;
  onDownloadCsv: () => void;
  onExportPdf?: () => void;
  onRestartAudit?: () => void;
}

export const AuditCompletionModal: React.FC<Props> = ({
  venueConfig,
  devices,
  uploadResult,
  onClose,
  onDownloadCsv,
  onExportPdf,
  onRestartAudit,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedReportText, setCopiedReportText] = useState(false);

  // App URLs from window.location
  const currentAppUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentAppUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopySummary = () => {
    const summary = `VENUE AUDIT COMPLETED SUCCESSFULLY:
Venue: ${venueConfig.venueName}
City: ${venueConfig.city}
Audit Date: ${venueConfig.auditDate}
Total Hardware Nodes Audited: ${devices.length}
Target Google Drive Folder: ${venueConfig.venueName}_${venueConfig.city}_${venueConfig.auditDate}
App Link: ${currentAppUrl}`;

    navigator.clipboard.writeText(summary);
    setCopiedReportText(true);
    setTimeout(() => setCopiedReportText(false), 2500);
  };

  const coreSwitchesCount = devices.filter((d) => d.deviceType.includes('core')).length;
  const edgeSwitchesCount = devices.filter((d) => d.deviceType.includes('switch_l')).length;
  const workstationCount = devices.filter((d) => d.deviceType === 'workstation' || d.deviceType === 'laptop').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-emerald-500/20 max-h-[95vh] flex flex-col">
        {/* Banner with Celebration Visual */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="mx-auto w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 shadow-lg border border-white/30">
            <CheckCircle2 className="w-8 h-8 text-emerald-100" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Audit Successfully Completed!</h2>
          <p className="text-xs text-emerald-100 mt-1 max-w-md mx-auto">
            All network nodes, CPU/Laptop serial numbers, monitor dimensions, keyboards, and switch hierarchy have been verified.
          </p>
        </div>

        {/* Audit Report Summary */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Audited Devices</span>
              <span className="text-xl font-black text-emerald-400">{devices.length}</span>
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Core Switches</span>
              <span className="text-xl font-black text-cyan-400">{coreSwitchesCount}</span>
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">L1/L2/L3 Switches</span>
              <span className="text-xl font-black text-sky-400">{edgeSwitchesCount}</span>
            </div>
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Workstations/Laptops</span>
              <span className="text-xl font-black text-teal-400">{workstationCount}</span>
            </div>
          </div>

          {/* Venue & Drive Output */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Venue & Audit Information
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                100% Complete
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">Venue: </span>
                <strong className="text-slate-200">{venueConfig.venueName}</strong>
              </div>
              <div>
                <span className="text-slate-500">City: </span>
                <strong className="text-slate-200">{venueConfig.city}</strong>
              </div>
              <div>
                <span className="text-slate-500">Audit Date: </span>
                <strong className="text-slate-200">{venueConfig.auditDate}</strong>
              </div>
              <div>
                <span className="text-slate-500">Subnet: </span>
                <span className="font-mono text-cyan-300">{venueConfig.targetSubnet}</span>
              </div>
            </div>

            {/* Hub In-Charge Details */}
            {(venueConfig.hubInChargeName || venueConfig.hubInChargeEmail) && (
              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Hub In-Charge Name: </span>
                  <strong className="text-slate-200">{venueConfig.hubInChargeName}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Hub In-Charge Gmail ID: </span>
                  <span className="font-mono text-cyan-300">{venueConfig.hubInChargeEmail}</span>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-blue-400" /> Generated Drive Folder:
              </span>
              <span className="font-mono text-emerald-300 font-medium select-all">
                📁 {venueConfig.venueName}_{venueConfig.city}_{venueConfig.auditDate}
              </span>
            </div>

            {uploadResult && (
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="text-emerald-400 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Synced to Google Drive (.CSV & .PDF copies uploaded)
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={uploadResult.folderUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                  >
                    Open Folder <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href={uploadResult.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                  >
                    View .CSV <ExternalLink className="w-3 h-3" />
                  </a>
                  {uploadResult.pdfFileUrl && (
                    <a
                      href={uploadResult.pdfFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-rose-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                    >
                      View .PDF <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* How to share the link to users section */}
          <div className="p-4 bg-gradient-to-br from-indigo-950/30 to-purple-950/30 border border-indigo-500/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-indigo-300 flex items-center gap-2 text-xs uppercase tracking-wider">
                <Share2 className="w-4 h-4 text-indigo-400" />
                How to Share the Link to Users
              </h4>
              <span className="text-[10px] text-indigo-400 font-medium">Instant Browser Access</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Anyone with this web link can open it in any standard browser (Chrome, Edge, Firefox, Safari) on laptops or mobile devices to inspect connected devices, view live topology, or run the hardware audit:
            </p>

            <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-700/80">
              <span className="font-mono text-emerald-400 text-xs truncate flex-1 select-all">
                {currentAppUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Web Link</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2.5 rounded-xl space-y-1">
              <div className="font-semibold text-slate-300">Quick Instructions to Send Users:</div>
              <div>1. Paste the link above into your team chat (WhatsApp, Slack, Teams) or email.</div>
              <div>2. The recipient simply pastes the link into any browser and hits Enter.</div>
              <div>3. The app will immediately ask for their Venue Name & City and begin scanning.</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleCopySummary}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedReportText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedReportText ? 'Summary Copied' : 'Copy Audit Summary'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onDownloadCsv}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download .CSV</span>
            </button>

            {onExportPdf && (
              <button
                onClick={onExportPdf}
                className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <FileText className="w-4 h-4 text-rose-400" />
                <span>Export PDF Report</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              Done & Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
