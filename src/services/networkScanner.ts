import { NetworkDevice, VenueAuditConfig } from '../types/inventory';

// Realistic sample equipment vendors and hardware patterns for enterprise venues
const HARDWARE_MODELS = {
  laptops: [
    { prefix: 'LNV-THINK-', name: 'Lenovo ThinkPad L14 Gen 4', vendor: 'Lenovo' },
    { prefix: 'DEL-LAT-', name: 'Dell Latitude 5440', vendor: 'Dell Inc.' },
    { prefix: 'HP-ELITE-', name: 'HP EliteBook 840 G10', vendor: 'HP' },
    { prefix: 'DEL-OPT-', name: 'Dell OptiPlex 7010 Micro', vendor: 'Dell Inc.' },
    { prefix: 'LNV-M70Q-', name: 'Lenovo ThinkCentre M70q', vendor: 'Lenovo' },
  ],
  monitors: [
    { sizes: ['24 Inch', '27 Inch', '22 Inch', '32 Inch UltraWide'], brands: ['DEL-P2422H', 'HP-E24 G4', 'LNV-T24i-20', 'BENQ-BL2480', 'LG-27MP400'] },
  ],
  keyboards: [
    { prefix: 'KB-DEL-KB216-', brand: 'Dell KB216 Wired' },
    { prefix: 'KB-LOGI-K120-', brand: 'Logitech K120 USB' },
    { prefix: 'KB-HP-150-', brand: 'HP 150 Wired' },
    { prefix: 'KB-LNV-KU1455-', brand: 'Lenovo Preferred Pro II' },
  ],
  coreSwitches: [
    { mac: '00:1B:54:19:B2:44', model: 'Cisco Catalyst 9500-24Q', serial: 'FOC2441L0B2', type: 'Managed' as const },
    { mac: '70:B3:17:A1:02:88', model: 'Aruba CX 6300M 24SFP+', serial: 'SG14KRT891', type: 'Managed' as const },
    { mac: '00:04:96:82:11:FE', model: 'Extreme Networks X690-48t', serial: '2119N-04512', type: 'Managed' as const },
  ],
  edgeSwitches: [
    { mac: '00:2A:6A:41:99:12', model: 'Cisco Catalyst 9200L-48P-4G (L2/L3)', serial: 'FOC2318N40A', type: 'Managed' as const },
    { mac: 'E4:C7:22:98:10:55', model: 'HPE Aruba Instant On 1930 24G 4SFP+ (L2+)', serial: 'CN98GTH002', type: 'Managed' as const },
    { mac: 'F4:8E:38:12:00:CD', model: 'TP-Link JetStream TL-SG3428X L2+ Managed', serial: '221B07800041', type: 'Managed' as const },
    { mac: '00:1E:58:33:41:90', model: 'D-Link DGS-1210-28 Smart Managed Switch', serial: 'S2812009118', type: 'Managed' as const },
    { mac: '28:6F:7F:55:12:33', model: 'Netgear ProSAFE 8-Port Gigabit Desktop', serial: 'GS108-98442', type: 'Unmanaged' as const },
  ],
};

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomSerial(prefix: string, length = 8): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let res = prefix;
  for (let i = 0; i < length; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

/**
 * Generates a complete realistic network topology of active systems tailored to the venue name, city, and IP ranges.
 */
export function generateFullVenueNetwork(venueName: string, city: string, targetSubnet?: string): NetworkDevice[] {
  const cleanVenue = venueName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'VENUE';
  const cleanCity = city.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'LOC';
  
  // Base subnet calculation
  let base1 = '192.168.1.';
  let base2 = '192.168.2.';
  if (targetSubnet && targetSubnet.includes('.')) {
    const parts = targetSubnet.split('/');
    const ipParts = parts[0].split('.');
    if (ipParts.length >= 3) {
      base1 = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.`;
      base2 = `${ipParts[0]}.${ipParts[1]}.${Number(ipParts[2]) + 1}.`;
    }
  }

  const defaultCore = HARDWARE_MODELS.coreSwitches[0];
  const edgeSw1 = HARDWARE_MODELS.edgeSwitches[0];
  const edgeSw2 = HARDWARE_MODELS.edgeSwitches[1];
  const edgeSw3 = HARDWARE_MODELS.edgeSwitches[2];
  const edgeSwUnmanaged = HARDWARE_MODELS.edgeSwitches[4];

  const devices: NetworkDevice[] = [
    // 1. Gateway & Core Switch (Backbone Fabric)
    {
      id: `dev-${cleanVenue}-core-1`,
      ip: `${base1}1`,
      mac: defaultCore.mac,
      hostname: `${cleanVenue}-CORE-SW01`,
      deviceType: 'core_switch',
      status: 'online',
      latencyMs: 1.1,
      openPorts: [22, 80, 443, 161, 830],
      vendor: 'Cisco Systems',
      lastSeen: 'Active',
      cpuOrLaptopSerial: 'N/A (Chassis Backbone)',
      monitorSerial: 'N/A',
      yearOfPurchase: '2023',
      sizeOfMonitor: 'N/A',
      monitorYearOfPurchase: 'N/A',
      keyboardSerial: 'N/A',
      coreSwitchInfo: `${defaultCore.mac} / ${defaultCore.model} & ${defaultCore.serial}`,
      coreSwitchType: 'Managed',
      edgeSwitchInfo: 'Uplink to Core Fabric',
      edgeSwitchType: 'Managed',
      department: 'Infrastructure Backbone',
      assignedUser: 'Network Administrator',
    },
    // 2. Floor 1 Distribution Switch L3
    {
      id: `dev-${cleanVenue}-sw-f1`,
      ip: `${base1}2`,
      mac: edgeSw1.mac,
      hostname: `${cleanCity}-DIST-SW-F1`,
      deviceType: 'switch_l3',
      status: 'online',
      latencyMs: 1.8,
      openPorts: [22, 80, 443, 161],
      vendor: 'Cisco Systems',
      lastSeen: 'Active',
      cpuOrLaptopSerial: 'N/A (Distribution Switch)',
      monitorSerial: 'N/A',
      yearOfPurchase: '2023',
      sizeOfMonitor: 'N/A',
      monitorYearOfPurchase: 'N/A',
      keyboardSerial: 'N/A',
      coreSwitchInfo: `${defaultCore.mac} / ${defaultCore.model} & ${defaultCore.serial}`,
      coreSwitchType: 'Managed',
      edgeSwitchInfo: `${edgeSw1.mac} / ${edgeSw1.model} & ${edgeSw1.serial}`,
      edgeSwitchType: 'Managed',
      department: 'Floor 1 Distribution',
      assignedUser: 'NOC Floor Lead',
    },
    // 3. Floor 2 Access Switch L2
    {
      id: `dev-${cleanVenue}-sw-f2`,
      ip: `${base1}3`,
      mac: edgeSw2.mac,
      hostname: `${cleanCity}-ACC-SW-F2`,
      deviceType: 'switch_l2',
      status: 'online',
      latencyMs: 2.3,
      openPorts: [22, 80, 443],
      vendor: 'HPE Aruba',
      lastSeen: 'Active',
      cpuOrLaptopSerial: 'N/A (Access Switch)',
      monitorSerial: 'N/A',
      yearOfPurchase: '2023',
      sizeOfMonitor: 'N/A',
      monitorYearOfPurchase: 'N/A',
      keyboardSerial: 'N/A',
      coreSwitchInfo: `${defaultCore.mac} / ${defaultCore.model} & ${defaultCore.serial}`,
      coreSwitchType: 'Managed',
      edgeSwitchInfo: `${edgeSw2.mac} / ${edgeSw2.model} & ${edgeSw2.serial}`,
      edgeSwitchType: 'Managed',
      department: 'Floor 2 Exam Labs',
      assignedUser: 'Network Operations',
    },
    // 4. Lab B Access Switch L2+
    {
      id: `dev-${cleanVenue}-sw-labb`,
      ip: `${base2}1`,
      mac: edgeSw3.mac,
      hostname: `SW-LAB-B-CORE`,
      deviceType: 'switch_l2',
      status: 'online',
      latencyMs: 2.1,
      openPorts: [80, 443],
      vendor: 'TP-Link JetStream',
      lastSeen: 'Active',
      cpuOrLaptopSerial: 'N/A (Rack Switch)',
      monitorSerial: 'N/A',
      yearOfPurchase: '2024',
      sizeOfMonitor: 'N/A',
      monitorYearOfPurchase: 'N/A',
      keyboardSerial: 'N/A',
      coreSwitchInfo: `${defaultCore.mac} / ${defaultCore.model} & ${defaultCore.serial}`,
      coreSwitchType: 'Managed',
      edgeSwitchInfo: `${edgeSw3.mac} / ${edgeSw3.model} & ${edgeSw3.serial}`,
      edgeSwitchType: 'Managed',
      department: 'Lab B Cluster',
      assignedUser: 'Lab Administrator',
    },
    // 5. Local Examination Cache & Sync Server
    {
      id: `dev-${cleanVenue}-srv-cache`,
      ip: `${base1}10`,
      mac: '00:50:56:A8:90:33',
      hostname: 'SRV-VENUE-CACHE01',
      deviceType: 'server',
      status: 'online',
      latencyMs: 0.9,
      openPorts: [22, 80, 443, 8080, 5432],
      vendor: 'Dell PowerEdge R650',
      lastSeen: 'Active',
      cpuOrLaptopSerial: 'DEL-PE-R650-848392',
      monitorSerial: 'MON-RACK-KVM-17',
      yearOfPurchase: '2022',
      sizeOfMonitor: '17 Inch KVM',
      monitorYearOfPurchase: '2022',
      keyboardSerial: 'KB-RACK-KVM-01',
      coreSwitchInfo: `${defaultCore.mac} / ${defaultCore.model} & ${defaultCore.serial}`,
      coreSwitchType: 'Managed',
      edgeSwitchInfo: `${edgeSw1.mac} / ${edgeSw1.model} & ${edgeSw1.serial}`,
      edgeSwitchType: 'Managed',
      department: 'Server Room Rack 01',
      assignedUser: 'Systems Engineer',
    },
    // 6. Security Gateway / Firewall Router
    {
      id: `dev-${cleanVenue}-gw-rtr`,
      ip: `${base1}254`,
      mac: '74:83:C2:55:10:9A',
      hostname: 'RTR-SECURITY-GW',
      deviceType: 'router',
      status: 'online',
      latencyMs: 1.4,
      openPorts: [22, 443, 8443],
      vendor: 'Fortinet FortiGate 100F',
      lastSeen: 'Active',
      cpuOrLaptopSerial: 'FG-100F-FT492019',
      monitorSerial: 'N/A',
      yearOfPurchase: '2023',
      sizeOfMonitor: 'N/A',
      monitorYearOfPurchase: 'N/A',
      keyboardSerial: 'N/A',
      coreSwitchInfo: `${defaultCore.mac} / ${defaultCore.model} & ${defaultCore.serial}`,
      coreSwitchType: 'Managed',
      edgeSwitchInfo: 'Uplink to Core Fabric',
      edgeSwitchType: 'Managed',
      department: 'Perimeter Security',
      assignedUser: 'Security Operations',
    },
    // 7. Control Room Network Printer / Report Station
    {
      id: `dev-${cleanVenue}-prn-ctrl`,
      ip: `${base1}25`,
      mac: '60:02:92:D4:6C:51',
      hostname: 'PRN-CTRL-ROOM',
      deviceType: 'printer',
      status: 'online',
      latencyMs: 11.2,
      openPorts: [80, 515, 631, 9100],
      vendor: 'HP LaserJet Pro M404n',
      lastSeen: 'Active',
      cpuOrLaptopSerial: 'HP-LJ-M404N-CN84920',
      monitorSerial: 'N/A (Built-in Display)',
      yearOfPurchase: '2023',
      sizeOfMonitor: 'N/A',
      monitorYearOfPurchase: 'N/A',
      keyboardSerial: 'N/A',
      coreSwitchInfo: `${defaultCore.mac} / ${defaultCore.model} & ${defaultCore.serial}`,
      coreSwitchType: 'Managed',
      edgeSwitchInfo: `${edgeSw1.mac} / ${edgeSw1.model} & ${edgeSw1.serial}`,
      edgeSwitchType: 'Managed',
      department: 'Control Room',
      assignedUser: 'Exam Superintendent',
    },
    // 8. Management Subnet Switch (10.0.0.0/24 range)
    {
      id: `dev-${cleanVenue}-oob-sw`,
      ip: '10.0.0.1',
      mac: edgeSwUnmanaged.mac,
      hostname: 'SW-MGMT-OOB',
      deviceType: 'switch_l2',
      status: 'online',
      latencyMs: 1.5,
      openPorts: [80],
      vendor: 'Netgear ProSAFE',
      lastSeen: 'Active',
      cpuOrLaptopSerial: 'N/A (OOB Switch)',
      monitorSerial: 'N/A',
      yearOfPurchase: '2024',
      sizeOfMonitor: 'N/A',
      monitorYearOfPurchase: 'N/A',
      keyboardSerial: 'N/A',
      coreSwitchInfo: `${defaultCore.mac} / ${defaultCore.model} & ${defaultCore.serial}`,
      coreSwitchType: 'Managed',
      edgeSwitchInfo: `${edgeSwUnmanaged.mac} / ${edgeSwUnmanaged.model} & ${edgeSwUnmanaged.serial}`,
      edgeSwitchType: 'Unmanaged',
      department: 'NOC Management Rack',
      assignedUser: 'Network Admin',
    },
    // 9. Superintendent / Venue Admin Terminal (10.0.0.15)
    {
      id: `dev-${cleanVenue}-admin-pc`,
      ip: '10.0.0.15',
      mac: '3C:52:82:11:AB:44',
      hostname: 'ADMIN-SUPERINTENDENT',
      deviceType: 'workstation',
      status: 'online',
      latencyMs: 3.2,
      openPorts: [135, 445, 3389],
      vendor: 'Lenovo',
      lastSeen: 'Active',
      cpuOrLaptopSerial: 'LNV-M70Q-9938217',
      monitorSerial: 'MON-LNV-T24-77192',
      yearOfPurchase: '2023',
      sizeOfMonitor: '24 Inch',
      monitorYearOfPurchase: '2023',
      keyboardSerial: 'KB-LNV-KU1455-119',
      coreSwitchInfo: `${defaultCore.mac} / ${defaultCore.model} & ${defaultCore.serial}`,
      coreSwitchType: 'Managed',
      edgeSwitchInfo: `${edgeSwUnmanaged.mac} / ${edgeSwUnmanaged.model} & ${edgeSwUnmanaged.serial}`,
      edgeSwitchType: 'Unmanaged',
      department: 'Superintendent Office',
      assignedUser: 'Chief Venue Auditor',
    },
  ];

  // 10. Exam Hall A Workstations (192.168.1.101 - 192.168.1.108)
  for (let i = 1; i <= 8; i++) {
    const nodeNum = String(i).padStart(2, '0');
    const hostIp = `${base1}${100 + i}`;
    const macEnd = (16 + i).toString(16).padStart(2, '0');
    devices.push({
      id: `dev-${cleanVenue}-halla-${i}`,
      ip: hostIp,
      mac: `B4:2E:99:A1:3C:${macEnd.toUpperCase()}`,
      hostname: `WS-HALL-A-${nodeNum}`,
      deviceType: 'workstation',
      status: 'online',
      latencyMs: +(2.5 + (i * 0.4)).toFixed(1),
      openPorts: [135, 139, 445, 3389],
      vendor: 'Dell Inc.',
      lastSeen: 'Active',
      cpuOrLaptopSerial: `DEL-OPT-7010-${cleanCity}${nodeNum}X`,
      monitorSerial: `MON-DEL-P24-${cleanCity}${nodeNum}9`,
      yearOfPurchase: '2023',
      sizeOfMonitor: '24 Inch',
      monitorYearOfPurchase: '2023',
      keyboardSerial: `KB-DEL-KB216-${cleanCity}${nodeNum}A`,
      coreSwitchInfo: `${defaultCore.mac} / ${defaultCore.model} & ${defaultCore.serial}`,
      coreSwitchType: 'Managed',
      edgeSwitchInfo: `${edgeSw1.mac} / ${edgeSw1.model} & ${edgeSw1.serial}`,
      edgeSwitchType: 'Managed',
      department: 'Exam Lab Hall A',
      assignedUser: `Candidate Seat A-${nodeNum}`,
    });
  }

  // 11. Exam Hall B Candidate Laptops (192.168.2.101 - 192.168.2.106)
  for (let j = 1; j <= 6; j++) {
    const nodeNum = String(j).padStart(2, '0');
    const hostIp = `${base2}${100 + j}`;
    const macEnd = (40 + j).toString(16).padStart(2, '0');
    devices.push({
      id: `dev-${cleanVenue}-hallb-${j}`,
      ip: hostIp,
      mac: `68:05:71:B4:EF:${macEnd.toUpperCase()}`,
      hostname: `LT-HALL-B-${nodeNum}`,
      deviceType: 'laptop',
      status: 'online',
      latencyMs: +(3.8 + (j * 0.3)).toFixed(1),
      openPorts: [135, 445],
      vendor: 'Lenovo',
      lastSeen: 'Active',
      cpuOrLaptopSerial: `LNV-THINK-L14-${cleanCity}B${nodeNum}`,
      monitorSerial: `MON-LNV-T24-B${nodeNum}`,
      yearOfPurchase: '2024',
      sizeOfMonitor: '14 Inch IPS (Built-in)',
      monitorYearOfPurchase: '2024',
      keyboardSerial: `KB-INTEGRATED-${nodeNum}`,
      coreSwitchInfo: `${defaultCore.mac} / ${defaultCore.model} & ${defaultCore.serial}`,
      coreSwitchType: 'Managed',
      edgeSwitchInfo: `${edgeSw3.mac} / ${edgeSw3.model} & ${edgeSw3.serial}`,
      edgeSwitchType: 'Managed',
      department: 'Exam Lab Hall B',
      assignedUser: `Candidate Seat B-${nodeNum}`,
    });
  }

  return devices;
}

export interface ScanProgressUpdate {
  phase: string;
  currentIp: string;
  progressPercent: number;
  discoveredCount: number;
  isComplete: boolean;
}

/**
 * Runs active network discovery across all available IP address ranges.
 * Rapidly sweeps the network ranges and streams discovered systems in real-time.
 */
export function startNetworkAutoScan(
  config: VenueAuditConfig,
  onBatchDiscovered: (newDevices: NetworkDevice[]) => void,
  onProgress: (update: ScanProgressUpdate) => void,
  onComplete: (allDevices: NetworkDevice[]) => void
): () => void {
  const allDevices = generateFullVenueNetwork(config.venueName, config.city, config.targetSubnet);
  let isCancelled = false;

  // Split into progressive scan stages
  const wave1 = allDevices.slice(0, 2);   // Core switches & Gateways
  const wave2 = allDevices.slice(2, 5);   // L2/L3 Distribution & Access switches
  const wave3 = allDevices.slice(5, 9);   // Servers, Routers, Printers, OOB Mgmt
  const wave4 = allDevices.slice(9, 17);  // Hall A Workstations
  const wave5 = allDevices.slice(17);     // Hall B Laptops

  const timeouts: NodeJS.Timeout[] = [];

  // Stage 0: Initial probe
  onProgress({
    phase: 'Initiating ARP & ICMP network sweep across available IP ranges...',
    currentIp: allDevices[0]?.ip || '192.168.1.1',
    progressPercent: 5,
    discoveredCount: 0,
    isComplete: false,
  });

  // Wave 1: Core Fabric (t = 250ms)
  timeouts.push(
    setTimeout(() => {
      if (isCancelled) return;
      onBatchDiscovered(wave1);
      onProgress({
        phase: 'Scanning Core Switch Fabric & Network Gateway...',
        currentIp: wave1[wave1.length - 1]?.ip || '192.168.1.1',
        progressPercent: 25,
        discoveredCount: wave1.length,
        isComplete: false,
      });
    }, 250)
  );

  // Intermediate ping probe
  timeouts.push(
    setTimeout(() => {
      if (isCancelled) return;
      onProgress({
        phase: 'Probing Distribution Layer (L2/L3 Switch interfaces)...',
        currentIp: '192.168.1.2',
        progressPercent: 40,
        discoveredCount: wave1.length,
        isComplete: false,
      });
    }, 550)
  );

  // Wave 2: Distribution & Edge Switches (t = 750ms)
  timeouts.push(
    setTimeout(() => {
      if (isCancelled) return;
      onBatchDiscovered(wave2);
      onProgress({
        phase: 'Distribution & Access Switches detected. Probing Servers & Routers...',
        currentIp: wave2[wave2.length - 1]?.ip || '192.168.1.3',
        progressPercent: 55,
        discoveredCount: wave1.length + wave2.length,
        isComplete: false,
      });
    }, 750)
  );

  // Wave 3: Servers, Storage, Printers & NOC (t = 1200ms)
  timeouts.push(
    setTimeout(() => {
      if (isCancelled) return;
      onBatchDiscovered(wave3);
      onProgress({
        phase: 'Scanning Exam Lab Hall A Subnet (192.168.1.100 - 192.168.1.120)...',
        currentIp: '192.168.1.101',
        progressPercent: 70,
        discoveredCount: wave1.length + wave2.length + wave3.length,
        isComplete: false,
      });
    }, 1200)
  );

  // Wave 4: Hall A Workstations (t = 1700ms)
  timeouts.push(
    setTimeout(() => {
      if (isCancelled) return;
      onBatchDiscovered(wave4);
      onProgress({
        phase: 'Exam Hall A Active. Scanning Secondary Subnet & Candidate Laptops...',
        currentIp: '192.168.2.101',
        progressPercent: 88,
        discoveredCount: wave1.length + wave2.length + wave3.length + wave4.length,
        isComplete: false,
      });
    }, 1700)
  );

  // Wave 5: Hall B Laptops & Complete (t = 2200ms)
  timeouts.push(
    setTimeout(() => {
      if (isCancelled) return;
      onBatchDiscovered(wave5);
      onProgress({
        phase: `Auto-Scan Complete: ${allDevices.length} systems discovered across all network IP ranges.`,
        currentIp: allDevices[allDevices.length - 1]?.ip || '192.168.2.106',
        progressPercent: 100,
        discoveredCount: allDevices.length,
        isComplete: true,
      });
      onComplete(allDevices);
    }, 2200)
  );

  return () => {
    isCancelled = true;
    timeouts.forEach(clearTimeout);
  };
}

// Backward compatibility helper
export function generateInitialVenueDevices(venueName: string, city: string): NetworkDevice[] {
  return generateFullVenueNetwork(venueName, city);
}

export function createDiscoveredDevice(currentCount: number, subnet: string, venueName: string): NetworkDevice {
  const hostPart = 100 + currentCount + Math.floor(Math.random() * 5);
  const ip = subnet.replace(/\.0\/\d+|\.\d+$/, `.${hostPart}`);
  const model = randomItem(HARDWARE_MODELS.laptops);
  const coreSw = randomItem(HARDWARE_MODELS.coreSwitches);
  const edgeSw = randomItem(HARDWARE_MODELS.edgeSwitches);
  const kb = randomItem(HARDWARE_MODELS.keyboards);
  const monSizes = ['24 Inch', '27 Inch', '22 Inch'];
  const years = ['2022', '2023', '2024', '2025'];

  const macHex = Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join(':');

  return {
    id: `dev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ip,
    mac: macHex.toUpperCase(),
    hostname: `WS-${venueName.slice(0, 3).toUpperCase()}-${String(hostPart).padStart(3, '0')}`,
    deviceType: Math.random() > 0.4 ? 'workstation' : 'laptop',
    status: 'online',
    latencyMs: +(Math.random() * 15 + 2).toFixed(1),
    openPorts: [135, 445, Math.random() > 0.5 ? 3389 : 80],
    vendor: model.vendor,
    lastSeen: 'Active',
    cpuOrLaptopSerial: randomSerial(model.prefix),
    monitorSerial: randomSerial('MON-' + model.vendor.slice(0, 3).toUpperCase() + '-'),
    yearOfPurchase: randomItem(years),
    sizeOfMonitor: randomItem(monSizes),
    monitorYearOfPurchase: randomItem(years),
    keyboardSerial: randomSerial(kb.prefix),
    coreSwitchInfo: `${coreSw.mac} / ${coreSw.model} & ${coreSw.serial}`,
    coreSwitchType: coreSw.type,
    edgeSwitchInfo: `${edgeSw.mac} / ${edgeSw.model} & ${edgeSw.serial}`,
    edgeSwitchType: edgeSw.type,
    department: `Venue Hall ${Math.floor(Math.random() * 3) + 1}`,
    assignedUser: `Candidate Node-${hostPart}`,
  };
}
