import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Building2,
  MapPin,
  User,
  Mail,
  FileText,
  FileSpreadsheet,
  ExternalLink,
  Search,
  Trash2,
  X,
  Filter,
  HardDrive,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Laptop,
  Eye,
  Users,
  Layers,
  Sparkles
} from 'lucide-react';
import { CompletedVenueAuditReport, VenueAuditConfig } from '../types/inventory';
import {
  getAllCompletedReports,
  groupReportsByDate,
  groupReportsByHub,
  deleteCompletedReport,
  clearAllCompletedReports,
  HubAuditedGroup
} from '../services/reportService';
import { generateInventoryCsv, downloadCsvLocally } from '../services/driveService';
import { exportInventoryToPdf } from '../services/pdfExportService';
import { PdfPreviewModal } from './PdfPreviewModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DateWiseReportsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [reports, setReports] = useState<CompletedVenueAuditReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'hub' | 'date'>('hub');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // PDF Preview State
  const [pdfPreviewReport, setPdfPreviewReport] = useState<CompletedVenueAuditReport | null>(null);
  const [reportToDelete, setReportToDelete] = useState<{ id: string; venueName: string } | null>(null);
  const [showClearAllReportsConfirm, setShowClearAllReportsConfirm] = useState(false);

  const loadReports = () => {
    setReports(getAllCompletedReports());
  };

  const handleConfirmClearAllReports = () => {
    clearAllCompletedReports();
    setReports([]);
    setShowClearAllReportsConfirm(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadReports();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter reports by search & date
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.venueName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.hubInChargeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.hubInChargeEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate = selectedDateFilter === 'all' || r.auditDate === selectedDateFilter;
    return matchesSearch && matchesDate;
  });

  const dateGrouped = groupReportsByDate(filteredReports);
  const hubGrouped = groupReportsByHub(filteredReports);
  const allAvailableDates = Array.from(new Set(reports.map((r) => r.auditDate))).sort().reverse();

  // Metrics
  const totalAudits = reports.length;
  const totalDevicesAudited = reports.reduce((acc, r) => acc + (r.devicesCount || 0), 0);
  const uniqueHubs = new Set(reports.map((r) => r.hubInChargeEmail.toLowerCase())).size;
  const uniqueVenues = new Set(reports.map((r) => `${r.venueName}-${r.city}`)).size;

  const handleDelete = (id: string, venueName: string) => {
    setReportToDelete({ id, venueName });
  };

  const handleConfirmDeleteReport = () => {
    if (!reportToDelete) return;
    deleteCompletedReport(reportToDelete.id);
    loadReports();
    setReportToDelete(null);
  };

  const handleDownloadReportCsv = (report: CompletedVenueAuditReport) => {
    const fakeConfig: VenueAuditConfig = {
      venueName: report.venueName,
      city: report.city,
      auditDate: report.auditDate,
      targetSubnet: report.targetSubnet,
      targetDriveFolderId: report.targetDriveFolderId,
      hubInChargeName: report.hubInChargeName,
      hubInChargeEmail: report.hubInChargeEmail,
    };
    const csvContent = generateInventoryCsv(report.devices, fakeConfig);
    const fileName = `Venue_Audit_${report.venueName}_${report.city}_${report.auditDate}.csv`;
    downloadCsvLocally(csvContent, fileName);
  };

  const handleDownloadReportPdf = (report: CompletedVenueAuditReport) => {
    const fakeConfig: VenueAuditConfig = {
      venueName: report.venueName,
      city: report.city,
      auditDate: report.auditDate,
      targetSubnet: report.targetSubnet,
      targetDriveFolderId: report.targetDriveFolderId,
      hubInChargeName: report.hubInChargeName,
      hubInChargeEmail: report.hubInChargeEmail,
    };
    exportInventoryToPdf(report.devices, fakeConfig);
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 animate-in fade-in"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">Venue Audit Master Reports</h3>
                  <span className="text-[10px] bg-white/20 text-white font-mono px-2 py-0.5 rounded-full">
                    Admin Ledger
                  </span>
                </div>
                <p className="text-xs text-emerald-100">
                  Inspect Hub-Wise venue audits and Date-Wise completed reports with instant PDF viewing
                </p>
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

          {/* View Mode Tabs (Hub-Wise vs Date-Wise) */}
          <div className="p-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap shrink-0">
            <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('hub')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'hub'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-slate-950 shadow-md shadow-cyan-600/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Hub-Wise Venue Audited ({hubGrouped.length} Hubs)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('date')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'date'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-slate-950 shadow-md shadow-emerald-600/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Date-Wise Reports ({Object.keys(dateGrouped).length} Dates)</span>
              </button>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Total Audits: <strong className="text-white">{totalAudits}</strong></span>
              </span>
              <span>•</span>
              <span>Audited Systems: <strong className="text-cyan-400">{totalDevicesAudited}</strong></span>
              {reports.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowClearAllReportsConfirm(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-semibold cursor-pointer transition-all ml-2"
                  title="Purge all completed venue audit reports"
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>Clear All Reports</span>
                </button>
              )}
            </div>
          </div>

          {/* Search & Date Filter Bar */}
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap shrink-0">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Hub In-Charge, Venue Name, City, or Gmail..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400">Date:</span>
              <select
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Dates ({reports.length})</option>
                {allAvailableDates.map((d) => (
                  <option key={d} value={d}>
                    📅 {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
            {filteredReports.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <Building2 className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
                <div className="text-sm font-semibold text-slate-400">No venue audit reports found.</div>
                <p className="text-xs text-slate-500">
                  Completed audits by field Hub In-Charges will automatically appear here.
                </p>
              </div>
            ) : activeTab === 'hub' ? (
              /* =========================================================================
                 TAB 1: HUB-WISE VENUE AUDITED VIEW
                 ========================================================================= */
              <div className="space-y-6">
                {hubGrouped.map((hub) => (
                  <div
                    key={hub.hubEmail}
                    className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl"
                  >
                    {/* Hub In-Charge Header */}
                    <div className="flex items-center justify-between gap-3 flex-wrap pb-3 border-b border-slate-800/80">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                          {hub.hubName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-100 text-sm">{hub.hubName}</span>
                            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                              Hub In-Charge
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            <span>{hub.hubEmail}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-cyan-300 font-bold text-xs">
                          {hub.totalVenuesAudited} {hub.totalVenuesAudited === 1 ? 'Venue Audited' : 'Venues Audited'}
                        </span>
                        <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 font-bold font-mono text-xs">
                          {hub.totalDevicesAudited} Total Systems
                        </span>
                      </div>
                    </div>

                    {/* List of Venues Audited by this Hub */}
                    <div className="space-y-3">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Audited Venues Under this Hub:
                      </span>

                      <div className="grid grid-cols-1 gap-3">
                        {hub.reports.map((report) => (
                          <div
                            key={report.id}
                            className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                                  {report.venueName}
                                </span>
                                <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                                  <MapPin className="w-3 h-3 text-cyan-400" />
                                  {report.city}
                                </span>
                                <span className="text-slate-600">•</span>
                                <span className="font-mono text-amber-300 text-[11px] flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {report.auditDate}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-3 flex-wrap">
                                <span className="font-mono text-emerald-400">
                                  {report.devicesCount} Systems Mapped
                                </span>
                                <span>•</span>
                                <span className="text-slate-500 font-mono">Subnet: {report.targetSubnet}</span>
                              </div>
                            </div>

                            {/* Actions: View Report in PDF, Download PDF, Download CSV */}
                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                              {/* VIEW REPORT IN PDF BUTTON */}
                              <button
                                onClick={() => setPdfPreviewReport(report)}
                                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                                title="View full venue audit report in PDF"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Report in PDF</span>
                              </button>

                              <button
                                onClick={() => handleDownloadReportPdf(report)}
                                className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Download PDF to computer"
                              >
                                <FileText className="w-3.5 h-3.5 text-rose-400" />
                                <span>PDF</span>
                              </button>

                              <button
                                onClick={() => handleDownloadReportCsv(report)}
                                className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Download CSV spreadsheet"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                                <span>CSV</span>
                              </button>

                              <button
                                onClick={() => handleDelete(report.id, report.venueName)}
                                className="p-1.5 bg-slate-950 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
                                title="Delete report"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* =========================================================================
                 TAB 2: DATE-WISE REPORTS VIEW
                 ========================================================================= */
              <div className="space-y-6">
                {Object.entries(dateGrouped).map(([dateKey, dateReports]) => (
                  <div key={dateKey} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-bold font-mono text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Audit Date: {dateKey}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {dateReports.length} {dateReports.length === 1 ? 'Venue Audit' : 'Venue Audits'} Conducted
                      </span>
                      <div className="flex-1 h-px bg-slate-800"></div>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5">
                      {dateReports.map((report) => {
                        const isExpanded = expandedReportId === report.id;

                        return (
                          <div
                            key={report.id}
                            className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all shadow-lg space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4 text-emerald-400" />
                                    {report.venueName}
                                  </span>
                                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                    <MapPin className="w-3 h-3 text-cyan-400" />
                                    {report.city}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                                  <span className="flex items-center gap-1 text-slate-300">
                                    <User className="w-3 h-3 text-cyan-400" />
                                    Hub In-Charge: <strong>{report.hubInChargeName}</strong>
                                  </span>
                                  <span className="text-slate-600">•</span>
                                  <span className="font-mono text-slate-400">{report.hubInChargeEmail}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-xs font-bold rounded-xl">
                                  {report.devicesCount} Systems Audited
                                </span>

                                {/* VIEW REPORT IN PDF BUTTON */}
                                <button
                                  onClick={() => setPdfPreviewReport(report)}
                                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                                  title="View full report in PDF"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Report in PDF</span>
                                </button>

                                <button
                                  onClick={() => handleDownloadReportPdf(report)}
                                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Download PDF"
                                >
                                  <FileText className="w-3.5 h-3.5 text-rose-400" />
                                  <span>PDF</span>
                                </button>

                                <button
                                  onClick={() => handleDownloadReportCsv(report)}
                                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Download CSV"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>CSV</span>
                                </button>

                                <button
                                  onClick={() => handleDelete(report.id, report.venueName)}
                                  className="p-1.5 bg-slate-900 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
                                  title="Delete Report"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                                  className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
                                  title="Inspect system list"
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            {/* Drive Sync Link / Info */}
                            <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                                <span>Storage Folder: </span>
                                <span className="font-mono text-emerald-300">
                                  {report.venueName}_{report.city}_{report.auditDate}
                                </span>
                              </div>
                              {report.driveUploadResult && (
                                <a
                                  href={report.driveUploadResult.folderUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-400 hover:underline flex items-center gap-1 font-mono"
                                >
                                  <span>Open in Google Drive</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>

                            {/* Collapsible Device Breakdown Table */}
                            {isExpanded && (
                              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                                <div className="font-bold text-slate-300 text-[11px] flex items-center gap-1.5">
                                  <Laptop className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>Audited Systems Matrix ({report.devices.length} Nodes)</span>
                                </div>
                                <div className="border border-slate-800 rounded-xl overflow-x-auto max-h-56">
                                  <table className="w-full text-left text-[11px] font-mono border-collapse">
                                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                                      <tr>
                                        <th className="py-2 px-3">IP Address</th>
                                        <th className="py-2 px-3">Hostname</th>
                                        <th className="py-2 px-3">CPU / Laptop Serial</th>
                                        <th className="py-2 px-3">Monitor Serial</th>
                                        <th className="py-2 px-3">Core Switch</th>
                                        <th className="py-2 px-3">Edge Switch</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                      {report.devices.map((d) => (
                                        <tr key={d.id} className="hover:bg-slate-900/50">
                                          <td className="py-1.5 px-3 text-emerald-400">{d.ip}</td>
                                          <td className="py-1.5 px-3 text-slate-200">{d.hostname}</td>
                                          <td className="py-1.5 px-3 text-cyan-300">{d.cpuOrLaptopSerial}</td>
                                          <td className="py-1.5 px-3 text-slate-300">{d.monitorSerial}</td>
                                          <td className="py-1.5 px-3 text-slate-400 truncate max-w-[120px]">{d.coreSwitchInfo}</td>
                                          <td className="py-1.5 px-3 text-slate-400 truncate max-w-[120px]">{d.edgeSwitchInfo}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Multi-User Concurrent Audit Management Enabled</span>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>

          {/* Delete Report Confirmation In-Modal */}
          {reportToDelete && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Delete Audit Report</h3>
                    <p className="text-xs text-slate-400">Are you sure you want to remove this report?</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl text-xs text-slate-300 border border-slate-800 font-semibold">
                  {reportToDelete.venueName}
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setReportToDelete(null)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl border border-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteReport}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Clear ALL Reports Confirmation In-Modal */}
          {showClearAllReportsConfirm && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Purge All Completed Reports</h3>
                    <p className="text-xs text-slate-400">Are you sure you want to remove ALL past venue audit reports?</p>
                  </div>
                </div>
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl">
                  This will permanently clear all {reports.length} stored audit reports.
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowClearAllReportsConfirm(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-xl border border-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmClearAllReports}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Clear All Reports</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Embedded PDF Preview Modal */}
      {pdfPreviewReport && (
        <PdfPreviewModal
          isOpen={!!pdfPreviewReport}
          onClose={() => setPdfPreviewReport(null)}
          report={pdfPreviewReport}
        />
      )}
    </>
  );
};
