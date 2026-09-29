import React, { useEffect, useState } from 'react';
import { X, Download, Printer, ExternalLink, FileText, CheckCircle2 } from 'lucide-react';
import { CompletedVenueAuditReport, VenueAuditConfig } from '../types/inventory';
import { generateInventoryPdfBlob } from '../services/pdfExportService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  report: CompletedVenueAuditReport | null;
}

export const PdfPreviewModal: React.FC<Props> = ({ isOpen, onClose, report }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('report.pdf');

  useEffect(() => {
    if (isOpen && report) {
      const config: VenueAuditConfig = {
        venueName: report.venueName,
        city: report.city,
        auditDate: report.auditDate,
        targetSubnet: report.targetSubnet,
        targetDriveFolderId: report.targetDriveFolderId,
        hubInChargeName: report.hubInChargeName,
        hubInChargeEmail: report.hubInChargeEmail,
      };

      try {
        const { blob, fileName: generatedFileName } = generateInventoryPdfBlob(report.devices, config);
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setFileName(generatedFileName);

        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (err) {
        console.error('Failed to generate PDF preview:', err);
      }
    } else {
      setPdfUrl(null);
    }
  }, [isOpen, report]);

  if (!isOpen || !report) return null;

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenNewWindow = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl h-[92vh] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-2xl border border-white/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold truncate max-w-md">
                  {report.venueName} — PDF Audit Report
                </h3>
                <span className="text-[10px] bg-white/20 text-white font-mono px-2 py-0.5 rounded-full">
                  {report.auditDate}
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 flex items-center gap-2">
                <span>Hub In-Charge: <strong>{report.hubInChargeName}</strong></span>
                <span>•</span>
                <span className="font-mono">{report.hubInChargeEmail}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={handleOpenNewWindow}
              className="p-1.5 bg-white/15 hover:bg-white/25 text-white rounded-xl transition-colors cursor-pointer"
              title="Open in new window / Print"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-xl transition-colors cursor-pointer"
              title="Close viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Frame Viewer */}
        <div className="flex-1 bg-slate-950 p-2 sm:p-3 overflow-hidden">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              title="PDF Report Viewer"
              className="w-full h-full rounded-2xl border border-slate-800 bg-white"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
              Generating PDF Report preview...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
