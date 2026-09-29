import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { NetworkDevice, VenueAuditConfig } from '../types/inventory';

export function generateInventoryPdfDoc(devices: NetworkDevice[], venueConfig: VenueAuditConfig): jsPDF {
  // Landscape orientation to comfortably fit all 10+ hardware audit columns
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Primary Header Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 68, 'F');

  // Accent Line
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 68, pageWidth, 4, 'F');

  // Title & Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('NETWORK SCANNING & HARDWARE ASSET AUDIT REPORT', 32, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Official Venue Hardware Inventory & Switch Architecture Verification', 32, 54);

  const rightText = `Generated: ${new Date().toLocaleString()}`;
  doc.text(rightText, pageWidth - 32 - doc.getTextWidth(rightText), 45);

  // Metadata Card Block
  const metaY = 86;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(32, metaY, pageWidth - 64, 58, 6, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59); // slate-800

  // 1st Row of Metadata
  doc.text('Venue Name:', 46, metaY + 20);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129);
  doc.text(`${venueConfig.venueName}`, 120, metaY + 20);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('City:', 300, metaY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(`${venueConfig.city}`, 335, metaY + 20);

  doc.setFont('helvetica', 'bold');
  doc.text('Audit Date:', 480, metaY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(`${venueConfig.auditDate}`, 545, metaY + 20);

  doc.setFont('helvetica', 'bold');
  doc.text('Target Subnet:', 660, metaY + 20);
  doc.setFont('helvetica', 'normal');
  doc.text(`${venueConfig.targetSubnet}`, 735, metaY + 20);

  // 2nd Row of Metadata / Device Counts
  const workstationsCount = devices.filter((d) => d.deviceType === 'workstation' || d.deviceType === 'laptop').length;
  const switchesCount = devices.filter((d) => d.deviceType.includes('switch')).length;
  const serversCount = devices.filter((d) => d.deviceType === 'server').length;

  doc.setFont('helvetica', 'bold');
  doc.text('Total Nodes:', 46, metaY + 42);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${devices.length} Devices Verified`, 120, metaY + 42);

  doc.setFont('helvetica', 'bold');
  doc.text('Switches:', 300, metaY + 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`${switchesCount} (Core & Distribution)`, 355, metaY + 42);

  doc.setFont('helvetica', 'bold');
  doc.text('Workstations / Laptops:', 480, metaY + 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`${workstationsCount}`, 605, metaY + 42);

  doc.setFont('helvetica', 'bold');
  doc.text('Servers:', 660, metaY + 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`${serversCount}`, 705, metaY + 42);

  // Table Columns matching the prompt's hardware fields
  const headers = [
    '#',
    'IP Address',
    'MAC Address',
    'Hostname',
    'Laptop/CPU Sl. No.',
    'Monitor Sl. No.',
    'Year (CPU)',
    'Size Mon.',
    'Year (Mon)',
    'Keyboard Sl No.',
    'Core Switch Mac/Model & Sl No.',
    'Core Sw. Type',
    'L1/L2/L3 Switch Mac/Model & Sl No.',
    'L1-L3 Type',
  ];

  const rows = devices.map((d, index) => [
    (index + 1).toString(),
    d.ip,
    d.mac,
    d.hostname,
    d.cpuOrLaptopSerial,
    d.monitorSerial,
    d.yearOfPurchase,
    d.sizeOfMonitor,
    d.monitorYearOfPurchase,
    d.keyboardSerial,
    d.coreSwitchInfo,
    d.coreSwitchType,
    d.edgeSwitchInfo,
    d.edgeSwitchType,
  ]);

  autoTable(doc, {
    startY: metaY + 70,
    head: [headers],
    body: rows,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 3.5,
      textColor: [30, 41, 59], // slate-800
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 6.8,
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center' }, // #
      1: { cellWidth: 50, fontStyle: 'bold' }, // IP
      2: { cellWidth: 58 }, // MAC
      3: { cellWidth: 48 }, // Hostname
      4: { cellWidth: 62 }, // CPU Serial
      5: { cellWidth: 60 }, // Mon Serial
      6: { cellWidth: 32, halign: 'center' }, // Year CPU
      7: { cellWidth: 38, halign: 'center' }, // Size Mon
      8: { cellWidth: 32, halign: 'center' }, // Year Mon
      9: { cellWidth: 58 }, // Keyboard Serial
      10: { cellWidth: 84 }, // Core Switch Info
      11: { cellWidth: 42, halign: 'center' }, // Core Switch Type
      12: { cellWidth: 84 }, // Edge Switch Info
      13: { cellWidth: 42, halign: 'center' }, // Edge Switch Type
    },
    margin: { left: 32, right: 32, bottom: 45 },
    didDrawPage: (data) => {
      // Footer page numbering & signature block
      const totalPages = doc.getNumberOfPages();
      const currentPage = data.pageNumber;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400

      const footerLeft = `Folder Target: ${venueConfig.venueName}_${venueConfig.city}_${venueConfig.auditDate} | Google Drive Synced`;
      doc.text(footerLeft, 32, pageHeight - 20);

      const footerRight = `Page ${currentPage} of ${totalPages}`;
      doc.text(footerRight, pageWidth - 32 - doc.getTextWidth(footerRight), pageHeight - 20);
    },
  });

  return doc;
}

export function exportInventoryToPdf(devices: NetworkDevice[], venueConfig: VenueAuditConfig) {
  const doc = generateInventoryPdfDoc(devices, venueConfig);
  const safeVenue = venueConfig.venueName.replace(/[/\\?%*:|"<>]/g, '-');
  const safeCity = venueConfig.city.replace(/[/\\?%*:|"<>]/g, '-');
  const fileName = `Hardware_Asset_Audit_${safeVenue}_${safeCity}_${venueConfig.auditDate}.pdf`;
  doc.save(fileName);
}

export function generateInventoryPdfBlob(
  devices: NetworkDevice[],
  venueConfig: VenueAuditConfig
): { blob: Blob; fileName: string } {
  const doc = generateInventoryPdfDoc(devices, venueConfig);
  const safeVenue = venueConfig.venueName.replace(/[/\\?%*:|"<>]/g, '-');
  const safeCity = venueConfig.city.replace(/[/\\?%*:|"<>]/g, '-');
  const fileName = `Hardware_Asset_Audit_${safeVenue}_${safeCity}_${venueConfig.auditDate}.pdf`;
  const blob = doc.output('blob');
  return { blob, fileName };
}
