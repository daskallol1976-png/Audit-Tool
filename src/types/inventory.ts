export interface NetworkDevice {
  id: string;
  ip: string;
  mac: string;
  hostname: string;
  deviceType: 'workstation' | 'laptop' | 'core_switch' | 'switch_l1' | 'switch_l2' | 'switch_l3' | 'server' | 'printer' | 'router' | 'access_point';
  status: 'online' | 'offline' | 'scanning' | 'warning';
  latencyMs: number;
  openPorts: number[];
  vendor: string;
  lastSeen: string;

  // Specific required audit fields:
  // Laptop/CPU Sl. No.
  cpuOrLaptopSerial: string;
  // Monitor Sl. No.
  monitorSerial: string;
  // Year Of Purchase (Device)
  yearOfPurchase: string;
  // Size Of Monitor
  sizeOfMonitor: string;
  // Year Of Purchase (Monitor)
  monitorYearOfPurchase: string;
  // Keyboard Sl No.
  keyboardSerial: string;
  // Core Switch Mac/ Model & Sl No.
  coreSwitchInfo: string;
  // Types of Switch (Managed/Unmanaged)
  coreSwitchType: 'Managed' | 'Unmanaged' | 'N/A';
  // L1,L2,L3 Switch Mac/ Model & Sl No.
  edgeSwitchInfo: string;
  // Types of Switch (Managed/Unmanaged)
  edgeSwitchType: 'Managed' | 'Unmanaged' | 'N/A';

  notes?: string;
  assignedUser?: string;
  department?: string;
}

export interface VenueAuditConfig {
  venueName: string;
  city: string;
  auditDate: string; // YYYY-MM-DD
  targetDriveFolderId: string;
  targetSubnet: string;
  hubInChargeName?: string;
  hubInChargeEmail?: string;
}

export interface CompletedVenueAuditReport {
  id: string;
  auditDate: string; // YYYY-MM-DD
  timestamp: string; // ISO string
  venueName: string;
  city: string;
  hubInChargeName: string;
  hubInChargeEmail: string;
  targetSubnet: string;
  targetDriveFolderId: string;
  devicesCount: number;
  coreSwitchesCount: number;
  edgeSwitchesCount: number;
  workstationsCount: number;
  devices: NetworkDevice[];
  driveUploadResult?: DriveUploadResult | null;
}

export type AlertSeverity = 'info' | 'warning' | 'critical' | 'security';

export interface NetworkAlert {
  id: string;
  timestamp: string; // HH:mm:ss or ISO
  type: 'device_connected' | 'device_disconnected' | 'rogue_device' | 'port_anomaly' | 'ip_conflict' | 'unauthorized_dhcp';
  title: string;
  description: string;
  severity: AlertSeverity;
  deviceId?: string;
  ip?: string;
  mac?: string;
  acknowledged?: boolean;
}

export interface DriveUploadResult {
  folderId: string;
  folderName: string;
  folderUrl: string;
  fileId: string;
  fileName: string;
  fileUrl: string;
  pdfFileId?: string;
  pdfFileName?: string;
  pdfFileUrl?: string;
}
