import { NetworkDevice, VenueAuditConfig, DriveUploadResult } from '../types/inventory';
import { getCachedToken } from './firebaseAuth';
import { generateInventoryPdfBlob } from './pdfExportService';

// Default target Google Drive folder requested by user:
// Link: https://drive.google.com/drive/folders/10PxZPTSzdZ5n83HTEGikSqUAbD8w31ob?usp=sharing
export const DEFAULT_DRIVE_FOLDER_ID = '10PxZPTSzdZ5n83HTEGikSqUAbD8w31ob';
const ADMIN_DRIVE_STORAGE_KEY = 'admin_configured_drive_folder_id';

/**
 * Extracts clean Google Drive folder ID from either full Drive URL or direct ID
 */
export function extractDriveFolderId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return DEFAULT_DRIVE_FOLDER_ID;

  // Pattern for /folders/([a-zA-Z0-9_-]+)
  const urlMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  // Pattern for id=([a-zA-Z0-9_-]+)
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1];
  }

  return trimmed;
}

/**
 * Gets the admin-configured Google Drive folder storage path ID
 */
export function getAdminDriveFolderId(): string {
  try {
    const saved = localStorage.getItem(ADMIN_DRIVE_STORAGE_KEY);
    if (saved && saved.trim()) {
      return extractDriveFolderId(saved);
    }
  } catch (e) {
    // Ignore
  }
  return DEFAULT_DRIVE_FOLDER_ID;
}

/**
 * Sets the admin-configured Google Drive folder storage path ID
 */
export function setAdminDriveFolderId(newIdOrUrl: string): string {
  const cleanId = extractDriveFolderId(newIdOrUrl);
  try {
    localStorage.setItem(ADMIN_DRIVE_STORAGE_KEY, cleanId);
  } catch (e) {
    console.error('Failed to save drive folder ID:', e);
  }
  return cleanId;
}

export class GoogleDriveService {
  private static accessToken: string | null = null;

  static setToken(token: string) {
    this.accessToken = token;
  }

  static getToken(): string | null {
    return this.accessToken || getCachedToken();
  }

  static clearToken() {
    this.accessToken = null;
  }

  /**
   * Creates a subfolder in Google Drive inside the parent folder.
   * If parentFolderId is not writable or inaccessible to the logged-in user,
   * it gracefully creates the folder in the user's root My Drive or Shared Drive.
   */
  static async createVenueFolder(
    parentFolderId: string,
    folderName: string,
    token: string
  ): Promise<{ id: string; name: string; webViewLink?: string }> {
    // Attempt 1: Create in specified parentFolderId
    if (parentFolderId && parentFolderId.trim().length > 0) {
      try {
        const metadata = {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentFolderId.trim()],
        };

        const res = await fetch(
          'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink&supportsAllDrives=true',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(metadata),
          }
        );

        if (res.ok) {
          return await res.json();
        }

        const errData = await res.json().catch(() => ({}));
        console.warn('Could not write into shared folder directly:', errData);
      } catch (e) {
        console.warn('Network or permission issue writing to parent folder, trying root My Drive fallback:', e);
      }
    }

    // Fallback: Create folder in user's root Google Drive
    const fallbackMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const fallbackRes = await fetch(
      'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink&supportsAllDrives=true',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fallbackMetadata),
      }
    );

    if (!fallbackRes.ok) {
      const err = await fallbackRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to create folder in Google Drive (${fallbackRes.status})`);
    }

    return await fallbackRes.json();
  }

  /**
   * Uploads a CSV file into the designated folder using multipart upload.
   */
  static async uploadCsvFile(
    folderId: string,
    fileName: string,
    csvContent: string,
    token: string
  ): Promise<{ id: string; name: string; webViewLink?: string }> {
    const metadata = {
      name: fileName,
      mimeType: 'text/csv',
      parents: [folderId],
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: text/csv; charset=UTF-8\r\n\r\n' +
      csvContent +
      closeDelimiter;

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink&supportsAllDrives=true',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to upload CSV report to Google Drive (${res.status})`);
    }

    return await res.json();
  }

  /**
   * Uploads a PDF binary blob directly into the folder using standard multipart/related request
   */
  static async uploadPdfFile(
    folderId: string,
    fileName: string,
    pdfBlob: Blob,
    token: string
  ): Promise<{ id: string; name: string; webViewLink?: string }> {
    const metadata = {
      name: fileName,
      mimeType: 'application/pdf',
      parents: [folderId],
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/pdf\r\n\r\n';

    const multipartRequestBody = new Blob([metadataPart, pdfBlob, closeDelimiter], {
      type: `multipart/related; boundary=${boundary}`,
    });

    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink&supportsAllDrives=true',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Failed to upload PDF report to Google Drive (${res.status})`);
    }

    return await res.json();
  }

  /**
   * Full pipeline: Takes venue config and device list, constructs CSV & PDF,
   * creates "Venue Name_City_Date" folder in Drive, and uploads both .csv and .pdf copies.
   */
  static async exportAndUploadReport(
    venueConfig: VenueAuditConfig,
    devices: NetworkDevice[],
    token: string
  ): Promise<DriveUploadResult> {
    const safeVenue = venueConfig.venueName.trim().replace(/[/\\?%*:|"<>]/g, '-');
    const safeCity = venueConfig.city.trim().replace(/[/\\?%*:|"<>]/g, '-');
    const folderName = `${safeVenue}_${safeCity}_${venueConfig.auditDate}`;
    const csvFileName = `Network_Asset_Audit_${safeVenue}_${safeCity}_${venueConfig.auditDate}.csv`;

    const csvContent = generateInventoryCsv(devices, venueConfig);

    // 1. Create target folder inside the parent Drive folder (or root if shared permission doesn't allow subfolder creation)
    const createdFolder = await this.createVenueFolder(
      venueConfig.targetDriveFolderId || DEFAULT_DRIVE_FOLDER_ID,
      folderName,
      token
    );

    // 2. Upload CSV file inside the newly created folder
    const uploadedCsv = await this.uploadCsvFile(
      createdFolder.id,
      csvFileName,
      csvContent,
      token
    );

    // 3. Generate and upload formatted PDF report copy inside the same folder
    const { blob: pdfBlob, fileName: pdfFileName } = generateInventoryPdfBlob(devices, venueConfig);
    const uploadedPdf = await this.uploadPdfFile(
      createdFolder.id,
      pdfFileName,
      pdfBlob,
      token
    );

    return {
      folderId: createdFolder.id,
      folderName: createdFolder.name,
      folderUrl: createdFolder.webViewLink || `https://drive.google.com/drive/folders/${createdFolder.id}`,
      fileId: uploadedCsv.id,
      fileName: uploadedCsv.name,
      fileUrl: uploadedCsv.webViewLink || `https://drive.google.com/file/d/${uploadedCsv.id}/view`,
      pdfFileId: uploadedPdf.id,
      pdfFileName: uploadedPdf.name,
      pdfFileUrl: uploadedPdf.webViewLink || `https://drive.google.com/file/d/${uploadedPdf.id}/view`,
    };
  }
}

/**
 * Generates CSV string matching the required columns verbatim:
 * Laptop/CPU Sl. No.
 * Monitor Sl. No.
 * Year Of Purchase
 * Size Of Monitor
 * Year Of Purchase
 * Keyboard Sl No.
 * Core Switch Mac/ Model & Sl No.
 * Types of Switch (Managed/Unmanaged
 * L1,L2,L3 Switch Mac/ Model & Sl No.
 * Types of Switch (Managed/Unmanaged
 */
export function generateInventoryCsv(devices: NetworkDevice[], venueConfig?: VenueAuditConfig): string {
  const headers = [
    'S.No.',
    'IP Address',
    'MAC Address',
    'Device Type',
    'Hostname',
    'Latency (ms)',
    'Status',
    'Laptop/CPU Sl. No.',
    'Monitor Sl. No.',
    'Year Of Purchase',
    'Size Of Monitor',
    'Year Of Purchase (Monitor)',
    'Keyboard Sl No.',
    'Core Switch Mac/ Model & Sl No.',
    'Types of Switch (Managed/Unmanaged',
    'L1,L2,L3 Switch Mac/ Model & Sl No.',
    'Types of Switch (Managed/Unmanaged',
    'Venue Name',
    'City',
    'Audit Date',
    'Open Ports',
    'Vendor'
  ];

  const escapeCsv = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = devices.map((d, index) => [
    escapeCsv(index + 1),
    escapeCsv(d.ip),
    escapeCsv(d.mac),
    escapeCsv(d.deviceType),
    escapeCsv(d.hostname),
    escapeCsv(d.latencyMs),
    escapeCsv(d.status),
    escapeCsv(d.cpuOrLaptopSerial),
    escapeCsv(d.monitorSerial),
    escapeCsv(d.yearOfPurchase),
    escapeCsv(d.sizeOfMonitor),
    escapeCsv(d.monitorYearOfPurchase),
    escapeCsv(d.keyboardSerial),
    escapeCsv(d.coreSwitchInfo),
    escapeCsv(d.coreSwitchType),
    escapeCsv(d.edgeSwitchInfo),
    escapeCsv(d.edgeSwitchType),
    escapeCsv(venueConfig?.venueName || ''),
    escapeCsv(venueConfig?.city || ''),
    escapeCsv(venueConfig?.auditDate || ''),
    escapeCsv(d.openPorts.join(', ')),
    escapeCsv(d.vendor)
  ]);

  const csvString = [headers.map(h => `"${h}"`).join(','), ...rows.map(r => r.join(','))].join('\r\n');
  return csvString;
}

export function downloadCsvLocally(csvContent: string, fileName: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
