import { NetworkAlert, NetworkDevice } from '../types/inventory';

const ROGUE_MAC_PATTERNS = [
  { prefix: '00:13:E8', label: 'Unauthorized Raspberry Pi Sniffer / Kali Node' },
  { prefix: 'DC:A6:32', label: 'Unregistered Mini Wireless Gateway / Tap' },
  { prefix: 'B8:27:EB', label: 'Unknown Single-board Packet Interceptor' },
];

const ANOMALOUS_PORTS = [
  { port: 4444, service: 'Metasploit / Reverse Shell Listener' },
  { port: 6667, service: 'Unauthorized IRC / Botnet C2 Beacon' },
  { port: 31337, service: 'BackOrifice / Trojan Port' },
  { port: 23, service: 'Telnet Cleartext Protocol (Insecure)' },
];

export function createInitialAlerts(): NetworkAlert[] {
  return [];
}

export function generateDynamicAnomalyAlert(devices: NetworkDevice[]): NetworkAlert | null {
  const now = new Date().toTimeString().split(' ')[0];
  const roll = Math.random();

  if (roll < 0.35) {
    // Rogue device alert
    const target = devices[Math.floor(Math.random() * devices.length)] || { ip: '192.168.1.240', mac: '00:13:E8:4A:21:88' };
    return {
      id: `alert-${Date.now()}`,
      timestamp: now,
      type: 'rogue_device',
      title: 'Security Alert: Rogue MAC / Unregistered Hardware Detected',
      description: `Device with MAC ${target.mac} not in pre-authorized exam center hardware whitelist. High security priority.`,
      severity: 'security',
      ip: target.ip,
      mac: target.mac,
      acknowledged: false,
    };
  } else if (roll < 0.65) {
    // Port anomaly alert
    const anomaly = ANOMALOUS_PORTS[Math.floor(Math.random() * ANOMALOUS_PORTS.length)];
    const target = devices[Math.floor(Math.random() * devices.length)] || { ip: '192.168.1.103', mac: 'B8:85:84:62:31:0C' };
    return {
      id: `alert-${Date.now()}`,
      timestamp: now,
      type: 'port_anomaly',
      title: `Security Anomaly: Suspicious Port ${anomaly.port} Detected`,
      description: `Unusual active port open (${anomaly.service}) on host ${target.ip}. Inspect terminal immediately.`,
      severity: 'critical',
      ip: target.ip,
      mac: target.mac,
      acknowledged: false,
    };
  } else {
    // Disconnection or IP conflict
    const target = devices[Math.floor(Math.random() * devices.length)] || { ip: '192.168.1.101', mac: '44:AF:28:1A:3C:99' };
    return {
      id: `alert-${Date.now()}`,
      timestamp: now,
      type: 'ip_conflict',
      title: 'Network Warning: ARP Broadcast Anomaly / Latency Spike',
      description: `Repeated ARP requests from host ${target.ip}. Latency jitter exceeded baseline threshold.`,
      severity: 'warning',
      ip: target.ip,
      mac: target.mac,
      acknowledged: false,
    };
  }
}
