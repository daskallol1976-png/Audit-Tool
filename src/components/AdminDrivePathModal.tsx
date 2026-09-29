import React, { useState } from 'react';
import { HardDrive, X, Check, Save, ExternalLink, AlertCircle, Info, Sparkles } from 'lucide-react';
import { getAdminDriveFolderId, setAdminDriveFolderId, extractDriveFolderId, DEFAULT_DRIVE_FOLDER_ID } from '../services/driveService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (newFolderId: string) => void;
}

export const AdminDrivePathModal: React.FC<Props> = ({ isOpen, onClose, onUpdated }) => {
  const currentId = getAdminDriveFolderId();
  const [folderInput, setFolderInput] = useState(currentId);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = setAdminDriveFolderId(folderInput);
    setFolderInput(cleanId);
    setSavedSuccess(true);
    if (onUpdated) onUpdated(cleanId);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleResetDefault = () => {
    setFolderInput(DEFAULT_DRIVE_FOLDER_ID);
    setAdminDriveFolderId(DEFAULT_DRIVE_FOLDER_ID);
    setSavedSuccess(true);
    if (onUpdated) onUpdated(DEFAULT_DRIVE_FOLDER_ID);
    setTimeout(() => setSavedSuccess(false), 1200);
  };

  const previewFolderUrl = `https://drive.google.com/drive/folders/${extractDriveFolderId(folderInput)}`;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
              <HardDrive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Google Drive Storage Path</h3>
              <p className="text-xs text-emerald-100">Admin Configuration • Where all generated audit reports are saved</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-5 text-xs">
          {savedSuccess && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Google Drive store path updated successfully! All future audits will sync here.</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
              Target Google Drive Folder ID or Share Link
            </label>
            <input
              type="text"
              required
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              placeholder="e.g. 10PxZPTSzdZ5n83HTEGikSqUAbD8w31ob or https://drive.google.com/drive/folders/..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-emerald-300 font-mono focus:outline-none"
            />
            <p className="text-[11px] text-slate-400">
              You can paste the entire Google Drive folder URL or just the Folder ID.
            </p>
          </div>

          {/* Active Preview */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Extracted Folder ID:</span>
              <a
                href={previewFolderUrl}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
              >
                <span>Open Folder in Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono text-[11px] break-all select-all">
              {extractDriveFolderId(folderInput)}
            </div>
          </div>

          <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl text-[11px] text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
              <Info className="w-3.5 h-3.5" />
              <span>Multi-User Sync Workflow</span>
            </div>
            <p>
              When any field auditor completes their audit, the system automatically creates a subfolder formatted as:
            </p>
            <div className="font-mono text-emerald-300 text-[10px] bg-slate-950 p-2 rounded-lg border border-slate-800">
              📁 [VenueName]_[City]_[AuditDate]/
              <br />
              &nbsp;&nbsp;📄 Network_Asset_Audit_[VenueName].csv
              <br />
              &nbsp;&nbsp;📑 Network_Asset_Audit_[VenueName].pdf
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleResetDefault}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
            >
              Reset to Default Folder
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Drive Path</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
