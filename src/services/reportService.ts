import { CompletedVenueAuditReport, VenueAuditConfig, NetworkDevice, DriveUploadResult } from '../types/inventory';
import { getAdminDriveFolderId } from './driveService';
import { db } from './firebaseAuth';
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

const REPORTS_STORAGE_KEY = 'audit_all_completed_reports_v1';

/**
 * Gets all completed reports. Returns cached reports or fetches from Firestore.
 */
export function getAllCompletedReports(): CompletedVenueAuditReport[] {
  try {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: CompletedVenueAuditReport[] = JSON.parse(raw);
    
    // Filter out any legacy sample demo reports from earlier versions
    const cleaned = parsed.filter(
      (r) => !r.id.startsWith('report-demo') && !r.venueName.includes('Delhi Public School')
    );

    if (cleaned.length !== parsed.length) {
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(cleaned));
    }

    return cleaned;
  } catch (e) {
    return [];
  }
}

/**
 * Asynchronously syncs reports from Firestore into local cache
 */
export async function syncReportsFromCloud(): Promise<CompletedVenueAuditReport[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'venueAudits'));
    const cloudReports: CompletedVenueAuditReport[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as CompletedVenueAuditReport;
      if (data && data.id) {
        cloudReports.push(data);
      }
    });

    if (cloudReports.length > 0) {
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(cloudReports));
      return cloudReports;
    }
  } catch (e) {
    // Cloud sync optional fallback
  }
  return getAllCompletedReports();
}

/**
 * Saves a newly completed venue audit report both locally and to Cloud Firestore
 */
export function saveCompletedAuditReport(
  venueConfig: VenueAuditConfig,
  devices: NetworkDevice[],
  uploadResult?: DriveUploadResult | null
): CompletedVenueAuditReport {
  const existing = getAllCompletedReports();

  const coreSwitchesCount = devices.filter((d) => d.deviceType.includes('core')).length;
  const edgeSwitchesCount = devices.filter((d) => d.deviceType.includes('switch_l')).length;
  const workstationsCount = devices.filter((d) => d.deviceType === 'workstation' || d.deviceType === 'laptop').length;

  const newReport: CompletedVenueAuditReport = {
    id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    auditDate: venueConfig.auditDate || new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
    venueName: venueConfig.venueName,
    city: venueConfig.city,
    hubInChargeName: venueConfig.hubInChargeName || 'Venue Hub In-Charge',
    hubInChargeEmail: venueConfig.hubInChargeEmail || 'hub.incharge@gmail.com',
    targetSubnet: venueConfig.targetSubnet,
    targetDriveFolderId: venueConfig.targetDriveFolderId || getAdminDriveFolderId(),
    devicesCount: devices.length,
    coreSwitchesCount,
    edgeSwitchesCount,
    workstationsCount,
    devices: [...devices],
    driveUploadResult: uploadResult || null,
  };

  existing.unshift(newReport);
  try {
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.error('Failed to save completed audit report locally:', e);
  }

  // Persist to Cloud Firestore asynchronously
  try {
    setDoc(doc(db, 'venueAudits', newReport.id), newReport).catch((err) => {
      console.warn('Asynchronous Cloud Firestore backup notice:', err);
    });
  } catch (e) {
    // Ignore offline errors
  }

  return newReport;
}

/**
 * Deletes a single report by ID locally and in Cloud Firestore
 */
export function deleteCompletedReport(reportId: string): boolean {
  try {
    const reports = getAllCompletedReports();
    const updated = reports.filter((r) => r.id !== reportId);
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(updated));

    // Delete in Cloud Firestore
    deleteDoc(doc(db, 'venueAudits', reportId)).catch(() => {});
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Completely clears all saved audit reports
 */
export function clearAllCompletedReports(): void {
  try {
    localStorage.removeItem(REPORTS_STORAGE_KEY);
    localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify([]));
  } catch (e) {
    console.error('Failed to clear reports:', e);
  }
}

/**
 * Groups reports by date (sorted newest date first)
 */
export function groupReportsByDate(reports: CompletedVenueAuditReport[]): Record<string, CompletedVenueAuditReport[]> {
  const groups: Record<string, CompletedVenueAuditReport[]> = {};

  const sorted = [...reports].sort((a, b) => new Date(b.auditDate).getTime() - new Date(a.auditDate).getTime());

  for (const report of sorted) {
    const dateKey = report.auditDate || 'Unspecified Date';
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(report);
  }

  return groups;
}

export interface HubAuditedGroup {
  hubEmail: string;
  hubName: string;
  totalVenuesAudited: number;
  totalDevicesAudited: number;
  reports: CompletedVenueAuditReport[];
}

/**
 * Groups reports by Hub In-Charge (Hub-Wise View)
 */
export function groupReportsByHub(reports: CompletedVenueAuditReport[]): HubAuditedGroup[] {
  const map: Record<string, HubAuditedGroup> = {};

  for (const report of reports) {
    const key = (report.hubInChargeEmail || 'unassigned@gmail.com').toLowerCase().trim();
    if (!map[key]) {
      map[key] = {
        hubEmail: report.hubInChargeEmail || key,
        hubName: report.hubInChargeName || 'Hub In-Charge',
        totalVenuesAudited: 0,
        totalDevicesAudited: 0,
        reports: [],
      };
    }
    map[key].totalVenuesAudited += 1;
    map[key].totalDevicesAudited += report.devicesCount || 0;
    map[key].reports.push(report);
  }

  return Object.values(map).sort((a, b) => b.totalVenuesAudited - a.totalVenuesAudited);
}
