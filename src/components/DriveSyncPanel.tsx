import React, { useState, useEffect } from 'react';
import { VenueAuditConfig, DriveUploadResult, NetworkDevice } from '../types/inventory';
import { GoogleDriveService, DEFAULT_DRIVE_FOLDER_ID, generateInventoryCsv, downloadCsvLocally } from '../services/driveService';
import { exportInventoryToPdf } from '../services/pdfExportService';
import {
  signInWithGoogleDrive,
  signOutGoogle,
  subscribeToAuth,
  getCachedToken,
  setCachedToken,
} from '../services/firebaseAuth';
import {
  CloudUpload,
  HardDrive,
  FolderPlus,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  Download,
  AlertCircle,
  Loader2,
  Lock,
  RefreshCw,
  FolderCheck,
  FileText,
  LogIn,
  LogOut,
  UserCheck,
  Key
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { User } from 'firebase/auth';

interface Props {
  venueConfig: VenueAuditConfig;
  devices: NetworkDevice[];
  onConfigChangeRequest: () => void;
  onCompleteAudit?: () => void;
  onShareLink?: () => void;
  onExportPdf?: () => void;
  onUploadSuccess?: (result: DriveUploadResult) => void;
}

export const DriveSyncPanel: React.FC<Props> = ({
  venueConfig,
  devices,
  onConfigChangeRequest,
  onCompleteAudit,
  onShareLink,
  onExportPdf,
  onUploadSuccess,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<DriveUploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showManualTokenInput, setShowManualTokenInput] = useState(false);
  const [manualToken, setManualToken] = useState('');

  // Folder name format: VenueName_City_Date
  const folderName = `${venueConfig.venueName}_${venueConfig.city}_${venueConfig.auditDate}`;
  const csvFileName = `Network_Asset_Audit_${venueConfig.venueName}_${venueConfig.city}_${venueConfig.auditDate}.csv`;
  const pdfFileName = `Hardware_Asset_Audit_${venueConfig.venueName}_${venueConfig.city}_${venueConfig.auditDate}.pdf`;

  useEffect(() => {
    // Listen to Firebase authentication state
    const unsubscribe = subscribeToAuth((user, cachedToken) => {
      setCurrentUser(user);
      if (cachedToken) {
        setToken(cachedToken);
        GoogleDriveService.setToken(cachedToken);
      }
    });

    const existing = GoogleDriveService.getToken();
    if (existing) {
      setToken(existing);
    }

    return () => unsubscribe();
  }, []);

  // One-click Google Login with Drive Permission
  const handleGoogleSignIn = async () => {
    setIsAuthorizing(true);
    setUploadError(null);
    try {
      const res = await signInWithGoogleDrive();
      setCurrentUser(res.user);
      setToken(res.accessToken);
      GoogleDriveService.setToken(res.accessToken);
      setIsAuthorizing(false);
      return res.accessToken;
    } catch (err: any) {
      console.error('Google Drive sign-in error:', err);
      setUploadError(err.message || 'Failed to authenticate with Google. You can also paste an OAuth token below.');
      setIsAuthorizing(false);
      return null;
    }
  };

  const handleSignOut = async () => {
    await signOutGoogle();
    setCurrentUser(null);
    setToken(null);
    GoogleDriveService.clearToken();
    setUploadResult(null);
  };

  const handleManualTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualToken.trim()) {
      setCachedToken(manualToken.trim());
      setToken(manualToken.trim());
      GoogleDriveService.setToken(manualToken.trim());
      setShowManualTokenInput(false);
      setUploadError(null);
    }
  };

  const handleSyncToDrive = async () => {
    setIsUploading(true);
    setUploadError(null);

    let activeToken = token || GoogleDriveService.getToken();

    // 1. If not logged in or no token, attempt Google popup login
    if (!activeToken) {
      activeToken = await handleGoogleSignIn();
      if (!activeToken) {
        setIsUploading(false);
        return;
      }
    }

    try {
      const res = await GoogleDriveService.exportAndUploadReport(venueConfig, devices, activeToken);
      setUploadResult(res);
      if (onUploadSuccess) {
        onUploadSuccess(res);
      }
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (err: any) {
      console.error('Drive upload error:', err);
      // If token expired or invalid, clear and notify
      if (err.message?.includes('401') || err.message?.includes('Invalid Credentials') || err.message?.includes('token')) {
        setToken(null);
        setCachedToken(null);
        GoogleDriveService.clearToken();
        setUploadError('Your Google session has expired. Please click "Sign in with Google" again.');
      } else {
        setUploadError(err.message || 'Failed to upload report to Google Drive. Check permissions.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleLocalDownload = () => {
    const csvContent = generateInventoryCsv(devices, venueConfig);
    downloadCsvLocally(csvContent, csvFileName);
  };

  const handleDownloadBoth = () => {
    handleLocalDownload();
    exportInventoryToPdf(devices, venueConfig);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-5 flex flex-col gap-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">Google Drive Live Sync</h3>
              {currentUser ? (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  {currentUser.email || 'Connected'}
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" />
                  Drive Login Optional
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Destination Root Folder:{' '}
              <a
                href={`https://drive.google.com/drive/folders/${venueConfig.targetDriveFolderId || DEFAULT_DRIVE_FOLDER_ID}`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline font-mono inline-flex items-center gap-1"
              >
                drive.google.com/.../10PxZPTSzdZ5n83HTEGikSqUAbD8w31ob <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {onShareLink && (
            <button
              onClick={onShareLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-semibold cursor-pointer transition-all"
              title="How to share the link to users"
            >
              <span>Share Link to Users</span>
            </button>
          )}

          <button
            onClick={handleDownloadBoth}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-all"
            title="Download both .CSV and .PDF files directly to your device (No Google account needed)"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Save Both (.CSV + .PDF)</span>
          </button>

          <button
            onClick={handleLocalDownload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium cursor-pointer transition-all"
            title="Download CSV locally to your machine"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>.CSV</span>
          </button>

          {onExportPdf && (
            <button
              onClick={onExportPdf}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-medium cursor-pointer transition-all"
              title="Export formatted PDF report with inventory summary & metadata"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>.PDF</span>
            </button>
          )}

          {/* Sync Button */}
          <button
            onClick={handleSyncToDrive}
            disabled={isUploading || isAuthorizing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Creating Folder & Uploading .CSV + .PDF...</span>
              </>
            ) : isAuthorizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Authenticating with Google...</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4 text-slate-950" />
                <span>Sync Now (.CSV & .PDF)</span>
              </>
            )}
          </button>

          {currentUser ? (
            <button
              onClick={handleSignOut}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl text-xs transition-colors"
              title={`Sign out (${currentUser.email})`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              disabled={isAuthorizing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-all"
              title="Sign in with your Google account to grant Drive permission"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-400" />
              <span>Google Sign-In</span>
            </button>
          )}

          {onCompleteAudit && (
            <button
              onClick={onCompleteAudit}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
              title="Finish network test & show audit completion report"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Complete Audit</span>
            </button>
          )}
        </div>
      </div>

      {/* Target Specs Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
          <span className="text-slate-500 block text-[11px]">Venue & Location:</span>
          <span className="font-semibold text-slate-200">
            {venueConfig.venueName}, {venueConfig.city}
          </span>
          <button
            onClick={onConfigChangeRequest}
            className="block text-[11px] text-emerald-400 hover:underline mt-1 cursor-pointer"
          >
            Change Venue or City
          </button>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
          <span className="text-slate-500 block text-[11px]">Auto-Generated Folder Name:</span>
          <span className="font-mono font-medium text-emerald-300 truncate block select-all">
            📁 {folderName}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Created automatically on sync</span>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
          <span className="text-slate-500 block text-[11px]">CSV File Inside Folder:</span>
          <span className="font-mono font-medium text-teal-300 truncate block select-all">
            📄 {csvFileName}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Full 10 hardware audit fields</span>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
          <span className="text-slate-500 block text-[11px]">PDF Copy Inside Folder:</span>
          <span className="font-mono font-medium text-rose-300 truncate block select-all">
            📑 {pdfFileName}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">Formatted official report document</span>
        </div>
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex flex-col gap-2 text-xs text-rose-300">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-rose-200">Drive Sync Notice: </span>
              {uploadError}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1 border-t border-rose-500/20 text-[11px]">
            <button
              onClick={handleGoogleSignIn}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg font-semibold transition-colors flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in with Google</span>
            </button>
            <button
              onClick={() => setShowManualTokenInput(!showManualTokenInput)}
              className="text-slate-400 hover:text-slate-200 underline"
            >
              {showManualTokenInput ? 'Hide Token Input' : 'Enter OAuth Bearer Token Manually'}
            </button>
          </div>
        </div>
      )}

      {/* Manual Token Input Box for environments where popup is blocked */}
      {showManualTokenInput && (
        <form onSubmit={handleManualTokenSubmit} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Manual Google OAuth Bearer Token (Alternative)
            </span>
            <span className="text-[10px] text-slate-500">From Google OAuth Playground or Cloud Console</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="password"
              placeholder="Paste ya29... token here"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs"
            >
              Apply Token
            </button>
          </div>
        </form>
      )}

      {/* Upload Success Banner */}
      {uploadResult && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <FolderCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Folder Created & Both .CSV and .PDF Uploaded to Google Drive!
              </div>
              <div className="text-slate-300 text-[11px] mt-1 space-y-0.5">
                <div>
                  📁 Folder: <span className="font-mono text-emerald-400">{uploadResult.folderName}</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span>📄 CSV: <span className="font-mono text-teal-300">{uploadResult.fileName}</span></span>
                  {uploadResult.pdfFileName && (
                    <span>📑 PDF: <span className="font-mono text-rose-300">{uploadResult.pdfFileName}</span></span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={uploadResult.folderUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Open Drive Folder</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={uploadResult.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-teal-950/70 hover:bg-teal-900 border border-teal-500/40 text-teal-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
              <span>View .CSV</span>
            </a>
            {uploadResult.pdfFileUrl && (
              <a
                href={uploadResult.pdfFileUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-rose-400" />
                <span>View .PDF</span>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
