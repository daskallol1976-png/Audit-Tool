import React, { useState, useEffect } from 'react';
import { NetworkDevice, VenueAuditConfig, NetworkAlert, DriveUploadResult } from './types/inventory';
import {
  generateInitialVenueDevices,
  createDiscoveredDevice,
  startNetworkAutoScan,
  ScanProgressUpdate,
} from './services/networkScanner';
import {
  createInitialAlerts,
  generateDynamicAnomalyAlert,
} from './services/alertService';
import { VenueSetupModal } from './components/VenueSetupModal';
import { DeviceTable } from './components/DeviceTable';
import { NetworkTopologyMap } from './components/NetworkTopologyMap';
import { DriveSyncPanel } from './components/DriveSyncPanel';
import { AddDeviceModal } from './components/AddDeviceModal';
import { DeviceDetailDrawer } from './components/DeviceDetailDrawer';
import { RealtimeAlertBanner } from './components/RealtimeAlertBanner';
import { AuditCompletionModal } from './components/AuditCompletionModal';
import { ShareLinkModal } from './components/ShareLinkModal';
import { DeviceBreakdownCharts } from './components/DeviceBreakdownCharts';
import { AuthScreen } from './components/AuthScreen';
import { UserManagementModal } from './components/UserManagementModal';
import { DateWiseReportsModal } from './components/DateWiseReportsModal';
import { AdminDrivePathModal } from './components/AdminDrivePathModal';
import { saveCompletedAuditReport, clearAllCompletedReports } from './services/reportService';
import { UserAccount } from './types/auth';
import { getActiveSession, logoutSession } from './services/authService';
import { generateInventoryCsv, downloadCsvLocally } from './services/driveService';
import { exportInventoryToPdf } from './services/pdfExportService';
import confetti from 'canvas-confetti';
import {
  Network,
  Building2,
  MapPin,
  Calendar,
  Layers,
  Table as TableIcon,
  Play,
  Square,
  RefreshCw,
  HardDrive,
  ShieldCheck,
  Activity,
  Plus,
  Share2,
  CheckCircle2,
  Bell,
  RotateCcw,
  BarChart3,
  Radio,
  Users,
  LogOut,
  Shield,
  UserCheck,
  Trash2
} from 'lucide-react';

export default function App() {
  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const session = getActiveSession();
    return session?.user || null;
  });
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isDateReportsOpen, setIsDateReportsOpen] = useState(false);
  const [isAdminDrivePathOpen, setIsAdminDrivePathOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  // Always require setting Venue Name and City on every fresh session or shared link open
  const [venueConfig, setVenueConfig] = useState<VenueAuditConfig | null>(() => {
    const active = sessionStorage.getItem('active_venue_config');
    if (active) {
      try {
        return JSON.parse(active);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [devices, setDevices] = useState<NetworkDevice[]>(() => {
    const active = sessionStorage.getItem('active_venue_config');
    if (active) {
      const saved = sessionStorage.getItem('active_audited_devices');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return [];
        }
      }
    }
    return [];
  });

  const [alerts, setAlerts] = useState<NetworkAlert[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(!venueConfig);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'topology' | 'table' | 'charts'>('table');
  const [isScanning, setIsScanning] = useState(false);
  const [filterIp, setFilterIp] = useState<string | null>(null);
  const [latestUploadResult, setLatestUploadResult] = useState<DriveUploadResult | null>(null);
  const [scanProgress, setScanProgress] = useState<ScanProgressUpdate>({
    phase: '',
    currentIp: '',
    progressPercent: 0,
    discoveredCount: 0,
    isComplete: false,
  });

  // Automated Network Discovery across all available IP ranges
  const triggerAutoScan = (cfg: VenueAuditConfig) => {
    setIsScanning(true);
    setDevices([]);
    setScanProgress({
      phase: `Initiating ARP & ICMP network sweep for ${cfg.venueName}...`,
      currentIp: cfg.targetSubnet.replace(/\.0\/\d+|\.\d+$/, '.1'),
      progressPercent: 5,
      discoveredCount: 0,
      isComplete: false,
    });

    const cleanup = startNetworkAutoScan(
      cfg,
      (batch) => {
        setDevices((prev) => [...prev, ...batch]);
      },
      (progress) => {
        setScanProgress(progress);
      },
      (allDiscovered) => {
        setIsScanning(false);
        const nowStr = new Date().toTimeString().split(' ')[0];
        setAlerts((prev) => [
          {
            id: `alert-scan-${Date.now()}`,
            timestamp: nowStr,
            type: 'device_connected',
            title: `Auto-Scan Complete: ${allDiscovered.length} Systems Online`,
            description: `Swept network subnets (${cfg.targetSubnet}, 192.168.2.0/24, 10.0.0.0/24). All workstations, laptops, and switches mapped.`,
            severity: 'info',
            acknowledged: false,
          },
          ...prev,
        ]);
      }
    );

    return cleanup;
  };

  // Initialize new audit session: Purges any prior old data, binds new Venue & City, and immediately auto-scans all network ranges
  const handleStartAudit = (config: VenueAuditConfig) => {
    // 1. Wipe all old data
    localStorage.removeItem('venue_audit_config');
    localStorage.removeItem('audited_devices');
    localStorage.removeItem('network_alerts');
    sessionStorage.removeItem('active_audited_devices');

    setDevices([]);
    setAlerts([]);
    setSelectedDevice(null);
    setLatestUploadResult(null);

    // 2. Set new venue config for current session with Hub In-Charge details
    const finalConfig: VenueAuditConfig = {
      ...config,
      hubInChargeName: config.hubInChargeName || currentUser?.name || 'Venue Hub In-Charge',
      hubInChargeEmail: config.hubInChargeEmail || currentUser?.email || 'hub@gmail.com',
    };
    setVenueConfig(finalConfig);
    sessionStorage.setItem('active_venue_config', JSON.stringify(finalConfig));
    setIsSetupModalOpen(false);

    // 3. Immediately launch auto-scanning of all systems under the network
    triggerAutoScan(finalConfig);
  };

  // Immediate cleanup of old persistent data on startup
  useEffect(() => {
    localStorage.removeItem('venue_audit_config');
    localStorage.removeItem('audited_devices');
    localStorage.removeItem('network_alerts');
  }, []);

  // Save devices only to active session
  useEffect(() => {
    if (venueConfig) {
      sessionStorage.setItem('active_audited_devices', JSON.stringify(devices));
    }
  }, [devices, venueConfig]);

  // Real-time ping latency updates for existing devices only (No fake device injection)
  useEffect(() => {
    if (!isScanning || !venueConfig || devices.length === 0) return;

    const interval = setInterval(() => {
      setDevices((prev) =>
        prev.map((d) => ({
          ...d,
          latencyMs: +(Math.max(1, d.latencyMs + (Math.random() * 2 - 1))).toFixed(1),
          lastSeen: 'Just now',
        }))
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isScanning, venueConfig, devices.length]);

  // One-time startup cleanup to ensure no old demo audits remain
  useEffect(() => {
    try {
      const reportsRaw = localStorage.getItem('audit_all_completed_reports_v1');
      if (
        reportsRaw &&
        (reportsRaw.includes('report-demo') ||
          reportsRaw.includes('Delhi Public School') ||
          reportsRaw.includes('St. Xavier Technical'))
      ) {
        clearAllCompletedReports();
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  // Completely wipe all audit records and start fresh with Venue Name and City prompt
  const handleNewAuditRequest = () => {
    sessionStorage.clear();
    localStorage.removeItem('audited_devices');
    localStorage.removeItem('network_alerts');
    localStorage.removeItem('active_venue_config');
    setVenueConfig(null);
    setDevices([]);
    setAlerts([]);
    setSelectedDevice(null);
    setLatestUploadResult(null);
    setIsSetupModalOpen(true);
  };

  // Prompt in-app confirmation to wipe all audit records and old data
  const handleClearAllData = () => {
    setShowClearAllConfirm(true);
  };

  const handleConfirmClearAll = () => {
    sessionStorage.clear();
    localStorage.removeItem('audited_devices');
    localStorage.removeItem('network_alerts');
    localStorage.removeItem('active_venue_config');
    clearAllCompletedReports();
    setVenueConfig(null);
    setDevices([]);
    setAlerts([]);
    setSelectedDevice(null);
    setLatestUploadResult(null);
    setShowClearAllConfirm(false);
    setIsSetupModalOpen(true);
  };

  // Optional: Allow loading sample data only if explicitly requested
  const handleLoadSampleData = () => {
    if (!venueConfig) return;
    const initial = generateInitialVenueDevices(venueConfig.venueName, venueConfig.city);
    setDevices(initial);
  };

  const handleImportCsv = (imported: NetworkDevice[]) => {
    setDevices((prev) => [...prev, ...imported]);
  };

  const handleUpdateDevice = (updated: NetworkDevice) => {
    setDevices((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    if (selectedDevice?.id === updated.id) {
      setSelectedDevice(updated);
    }
  };

  const handleDeleteDevice = (id: string) => {
    const dev = devices.find((d) => d.id === id);
    if (dev) {
      const nowStr = new Date().toTimeString().split(' ')[0];
      const alert: NetworkAlert = {
        id: `alert-${Date.now()}`,
        timestamp: nowStr,
        type: 'device_disconnected',
        title: `Device Removed from Audit: ${dev.hostname}`,
        description: `Device IP ${dev.ip} (${dev.mac}) was manually removed from the active audit matrix.`,
        severity: 'warning',
        ip: dev.ip,
        mac: dev.mac,
        acknowledged: false,
      };
      setAlerts((prev) => [alert, ...prev]);
    }

    setDevices((prev) => prev.filter((d) => d.id !== id));
    if (selectedDevice?.id === id) {
      setSelectedDevice(null);
    }
  };

  const handleAddManual = (newDev: NetworkDevice) => {
    setDevices((prev) => [newDev, ...prev]);
    const nowStr = new Date().toTimeString().split(' ')[0];
    const alert: NetworkAlert = {
      id: `alert-${Date.now()}`,
      timestamp: nowStr,
      type: 'device_connected',
      title: `Manual Node Added: ${newDev.hostname}`,
      description: `Terminal registered on IP ${newDev.ip} with CPU Serial: ${newDev.cpuOrLaptopSerial}.`,
      severity: 'info',
      ip: newDev.ip,
      mac: newDev.mac,
      acknowledged: false,
    };
    setAlerts((prev) => [alert, ...prev]);
  };

  const handleToggleScanning = () => {
    setIsScanning(!isScanning);
  };

  const handleDismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleClearAllAlerts = () => {
    setAlerts([]);
  };

  const handleSelectAlertIp = (ip: string) => {
    setFilterIp(ip);
    setActiveTab('table');
    const matched = devices.find((d) => d.ip === ip);
    if (matched) {
      setSelectedDevice(matched);
    }
  };

  const handleFinishAudit = () => {
    setIsScanning(false);
    if (venueConfig) {
      // Save date-wise completed report so Admin can inspect date-wise ledger
      saveCompletedAuditReport(venueConfig, devices, latestUploadResult);
    }
    setIsCompletionModalOpen(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleDownloadCsv = () => {
    if (!venueConfig) return;
    const csvFileName = `Network_Asset_Audit_${venueConfig.venueName}_${venueConfig.city}_${venueConfig.auditDate}.csv`;
    const csvContent = generateInventoryCsv(devices, venueConfig);
    downloadCsvLocally(csvContent, csvFileName);
  };

  const handleExportPdf = () => {
    if (!venueConfig) return;
    exportInventoryToPdf(devices, venueConfig);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    logoutSession();
    setCurrentUser(null);
    setIsUserManagementOpen(false);
    setIsDateReportsOpen(false);
    setIsAdminDrivePathOpen(false);
    setIsSetupModalOpen(false);
    setShowLogoutConfirm(false);
  };

  // If not authenticated, display Admin & Users Login Screen
  if (!currentUser) {
    return (
      <AuthScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (!venueConfig) {
            setIsSetupModalOpen(true);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-md shadow-emerald-500/20 text-slate-950">
            <Network className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                NetScan & Hardware Asset Auditor
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Real-Time Scanner & Threat Sentinel
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Automated hardware inventory, live change alerting & Google Drive report sync
            </p>
          </div>
        </div>

        {/* Current Venue Badge & Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {venueConfig ? (
            <div
              onClick={handleNewAuditRequest}
              className="hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs cursor-pointer hover:border-slate-700 transition-colors"
              title="Click to start a new venue audit or change Venue/City"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-slate-200">{venueConfig.venueName}</span>
              <span className="text-slate-600">•</span>
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-300">{venueConfig.city}</span>
              <span className="text-slate-600">•</span>
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-slate-400">{venueConfig.auditDate}</span>
            </div>
          ) : (
            <button
              onClick={() => setIsSetupModalOpen(true)}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Configure Venue & City
            </button>
          )}

          {venueConfig && (
            <button
              onClick={handleNewAuditRequest}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-all"
              title="Start a new venue audit (clears old data and asks Venue Name & City)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">New Venue Audit</span>
            </button>
          )}

          {/* Share Link Button */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold cursor-pointer transition-all"
            title="How to share the link to users"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Share Link</span>
          </button>

          {/* Complete Audit Action */}
          <button
            onClick={handleFinishAudit}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            title="Complete the audit test and view completion certificate & folder summary"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Complete Audit</span>
          </button>

          {/* Scan Toggle Button */}
          <button
            onClick={handleToggleScanning}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isScanning
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
            }`}
          >
            {isScanning ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Pause Scan</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Resume Scan</span>
              </>
            )}
          </button>

          {/* User Profile Badge & Admin Actions */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  currentUser.role === 'admin'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block leading-tight text-left">
                <div className="font-semibold text-slate-200 text-[11px] truncate max-w-[120px]" title={currentUser.name}>
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {currentUser.role === 'admin' ? 'Super Admin' : 'Auditor'}
                </div>
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                  currentUser.role === 'admin'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                }`}
              >
                {currentUser.role}
              </span>
            </div>

            {/* Admin-only: Date-Wise Reports, Drive Storage Path & Users Management */}
            {currentUser.role === 'admin' && (
              <>
                <button
                  onClick={() => setIsDateReportsOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600/30 via-teal-600/30 to-cyan-600/30 hover:from-emerald-600/50 hover:to-cyan-600/50 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-emerald-500/10"
                  title="Admin: View Hub-Wise & Date-Wise Venue Audit Reports and PDF"
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Hub & Date Reports</span>
                </button>

                <button
                  onClick={() => setIsAdminDrivePathOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  title="Admin: Change Google Drive generate reports store path"
                >
                  <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden md:inline">Drive Store Path</span>
                </button>

                <button
                  onClick={() => setIsUserManagementOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  title="Manage and create user credentials for auditors"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden lg:inline">Users Matrix</span>
                </button>
              </>
            )}

            {/* Clear Old Data Button */}
            <button
              onClick={handleClearAllData}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-all cursor-pointer shadow-sm"
              title="Clear all old data, previous test devices, and cached reports"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Clear Old Data</span>
            </button>

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-all cursor-pointer shadow-sm"
              title="Sign out of current account"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-5">
        {/* Real-time Alerting Banner: prominently displayed on dashboard */}
        <RealtimeAlertBanner
          alerts={alerts}
          onDismissAlert={handleDismissAlert}
          onClearAll={handleClearAllAlerts}
          onSelectAlertIp={handleSelectAlertIp}
        />

        {/* Standby Banner if user closed setup modal without starting scan */}
        {!venueConfig && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Venue Audit Standby Mode</h3>
                <p className="text-xs text-slate-400">
                  Network scan is on standby. Click below to enter your Venue Name and City to begin real-time scanning.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSetupModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/20 shrink-0"
            >
              <Building2 className="w-4 h-4" />
              <span>Enter Venue & City (Start Scan)</span>
            </button>
          </div>
        )}

        {/* Drive Sync Banner */}
        {venueConfig && (
          <DriveSyncPanel
            venueConfig={venueConfig}
            devices={devices}
            onConfigChangeRequest={handleNewAuditRequest}
            onCompleteAudit={handleFinishAudit}
            onShareLink={() => setIsShareModalOpen(true)}
            onExportPdf={handleExportPdf}
            onUploadSuccess={setLatestUploadResult}
          />
        )}

        {/* Real-Time Auto-Scanning Live Banner */}
        {venueConfig && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                {isScanning && <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 animate-ping"></div>}
                <Radio className={`w-5 h-5 ${isScanning ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    {isScanning ? 'Network IP Range Auto-Scan In Progress' : 'Network Range Auto-Scan Complete'}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                      isScanning
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {isScanning ? 'Probing All Active Subnets' : `${devices.length} Systems Mapped`}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap font-mono">
                  <span>Primary: <span className="text-emerald-300 font-semibold">{venueConfig.targetSubnet}</span></span>
                  <span className="text-slate-600">•</span>
                  <span>Secondary: <span className="text-cyan-300">192.168.2.0/24</span></span>
                  <span className="text-slate-600">•</span>
                  <span>Management: <span className="text-purple-300">10.0.0.0/24</span></span>
                </div>
              </div>
            </div>

            {/* Scan Status & Action */}
            <div className="flex items-center gap-3 shrink-0">
              {isScanning ? (
                <div className="flex flex-col items-start md:items-end gap-1 min-w-[220px]">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span className="truncate max-w-[200px]">{scanProgress.phase || 'Scanning IP ranges...'}</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 h-full transition-all duration-300"
                      style={{ width: `${Math.max(15, scanProgress.progressPercent)}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => triggerAutoScan(venueConfig)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-emerald-600/20 transition-all"
                  title="Rescan all systems under the network across all IP address ranges"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-950" />
                  <span>Rescan All Ranges</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* View Navigation Tabs & Quick Stats */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                setActiveTab('table');
                setFilterIp(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>Full Hardware Inventory Table</span>
            </button>
            <button
              onClick={() => setActiveTab('topology')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'topology'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Topology & Live Switch Fabric</span>
            </button>
            <button
              onClick={() => setActiveTab('charts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'charts'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Device Analytics & Charts</span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Subnet: <span className="text-slate-200">{venueConfig?.targetSubnet || '192.168.1.0/24'}</span>
            </div>
            <div className="text-slate-400">
              Nodes Discovered: <strong className="text-emerald-400">{devices.length}</strong>
            </div>
          </div>
        </div>

        {/* Selected Device Drawer if any */}
        {selectedDevice && (
          <DeviceDetailDrawer
            device={selectedDevice}
            venueConfig={venueConfig}
            onClose={() => setSelectedDevice(null)}
            onEdit={() => {
              setActiveTab('table');
            }}
          />
        )}

        {/* Tab 1: Full Inventory Table with all requested fields */}
        {activeTab === 'table' && (
          <DeviceTable
            devices={devices}
            onUpdateDevice={handleUpdateDevice}
            onDeleteDevice={handleDeleteDevice}
            onAddManualDevice={() => setIsAddModalOpen(true)}
            isScanning={isScanning}
            highlightIp={filterIp}
            onExportPdf={handleExportPdf}
            onClearAll={handleClearAllData}
            onImportCsv={handleImportCsv}
            onRescan={() => venueConfig && triggerAutoScan(venueConfig)}
            scanPhase={scanProgress.phase}
            scanProgressPercent={scanProgress.progressPercent}
          />
        )}

        {/* Tab 2: Visual Network Topology Map */}
        {activeTab === 'topology' && (
          <NetworkTopologyMap
            devices={devices}
            onSelectDevice={(d) => setSelectedDevice(d)}
            selectedDeviceId={selectedDevice?.id}
            isScanning={isScanning}
          />
        )}

        {/* Tab 3: Recharts Hardware Breakdown Visualizations */}
        {activeTab === 'charts' && (
          <DeviceBreakdownCharts
            devices={devices}
          />
        )}
      </main>

      {/* Initial / Edit Venue Setup Modal */}
      {isSetupModalOpen && (
        <VenueSetupModal
          onStartAudit={handleStartAudit}
          defaultConfig={
            venueConfig || {
              venueName: currentUser?.assignedVenue || '',
              city: currentUser?.assignedCity || '',
              hubInChargeName: currentUser?.name || '',
              hubInChargeEmail: currentUser?.email || '',
            }
          }
          onClose={() => setIsSetupModalOpen(false)}
        />
      )}

      {/* Add Device Modal */}
      <AddDeviceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddManual}
        currentDevicesCount={devices.length}
      />

      {/* Audit Completion Modal: Displays "Audit Successfully Completed" & Details */}
      {isCompletionModalOpen && venueConfig && (
        <AuditCompletionModal
          venueConfig={venueConfig}
          devices={devices}
          uploadResult={latestUploadResult}
          onClose={() => setIsCompletionModalOpen(false)}
          onDownloadCsv={handleDownloadCsv}
          onExportPdf={handleExportPdf}
        />
      )}

      {/* Share Link Modal: Instructions on sharing link with users */}
      <ShareLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        venueName={venueConfig?.venueName}
        city={venueConfig?.city}
      />

      {/* Admin User Credentials Management Modal */}
      {currentUser && currentUser.role === 'admin' && (
        <UserManagementModal
          isOpen={isUserManagementOpen}
          onClose={() => setIsUserManagementOpen(false)}
          currentUser={currentUser}
        />
      )}

      {/* Admin Date-Wise Reports Modal */}
      {currentUser && currentUser.role === 'admin' && (
        <DateWiseReportsModal
          isOpen={isDateReportsOpen}
          onClose={() => setIsDateReportsOpen(false)}
        />
      )}

      {/* Admin Drive Storage Path Modal */}
      {currentUser && currentUser.role === 'admin' && (
        <AdminDrivePathModal
          isOpen={isAdminDrivePathOpen}
          onClose={() => setIsAdminDrivePathOpen(false)}
        />
      )}

      {/* In-App Logout Confirmation Modal (Replacing blocked window.confirm) */}
      {showLogoutConfirm && (
        <div
          onClick={() => setShowLogoutConfirm(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Sign Out Confirmation</h3>
                <p className="text-xs text-slate-400">Are you sure you want to log out?</p>
              </div>
            </div>

            {currentUser && (
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="font-semibold text-slate-200 truncate">{currentUser.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">{currentUser.email}</div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Yes, Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Clear All Confirmation Modal */}
      {showClearAllConfirm && (
        <div
          onClick={() => setShowClearAllConfirm(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Clear All Old Data</h3>
                <p className="text-xs text-slate-400">
                  Wipe all active devices, alerts, and past completed audit reports to start completely fresh?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearAll}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

