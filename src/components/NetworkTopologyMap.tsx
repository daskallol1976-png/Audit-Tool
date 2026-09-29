import React, { useState, useMemo } from 'react';
import { NetworkDevice } from '../types/inventory';
import {
  Laptop,
  Monitor,
  Server,
  Network,
  Printer,
  Shield,
  Activity,
  Zap,
  Globe,
  Radio,
  Layers,
  Cpu,
  Search,
  Download,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Maximize2,
  Table as TableIcon,
  Columns,
  HardDrive,
  Wifi,
  ExternalLink,
  SlidersHorizontal
} from 'lucide-react';

interface Props {
  devices: NetworkDevice[];
  onSelectDevice: (device: NetworkDevice) => void;
  selectedDeviceId?: string;
  isScanning: boolean;
}

type ViewMode = 'split' | 'topology' | 'switch_fabric' | 'data_table';

export const NetworkTopologyMap: React.FC<Props> = ({
  devices,
  onSelectDevice,
  selectedDeviceId,
  isScanning,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'core' | 'edge' | 'endpoints'>('all');
  const [selectedSwitchId, setSelectedSwitchId] = useState<string | null>(null);

  // Classify devices into architectural tiers
  const coreSwitches = useMemo(
    () => devices.filter((d) => d.deviceType === 'core_switch'),
    [devices]
  );

  const edgeSwitches = useMemo(
    () =>
      devices.filter(
        (d) =>
          d.deviceType === 'switch_l1' ||
          d.deviceType === 'switch_l2' ||
          d.deviceType === 'switch_l3'
      ),
    [devices]
  );

  const endpoints = useMemo(
    () => devices.filter((d) => !d.deviceType.includes('switch')),
    [devices]
  );

  // Group endpoints under switches or default
  const switchPortMapping = useMemo(() => {
    const map = new Map<string, NetworkDevice[]>();
    const allSwitches = [...coreSwitches, ...edgeSwitches];

    allSwitches.forEach((sw) => {
      map.set(sw.id, []);
    });

    endpoints.forEach((ep, index) => {
      if (allSwitches.length > 0) {
        // Distribute endpoints across available switches deterministically
        const targetSwitch = allSwitches[index % allSwitches.length];
        const currentList = map.get(targetSwitch.id) || [];
        currentList.push(ep);
        map.set(targetSwitch.id, currentList);
      }
    });

    return map;
  }, [coreSwitches, edgeSwitches, endpoints]);

  // Active switch selection for port fabric faceplate view
  const activeSwitch = useMemo(() => {
    const allSwitches = [...coreSwitches, ...edgeSwitches];
    if (selectedSwitchId) {
      const found = allSwitches.find((s) => s.id === selectedSwitchId);
      if (found) return found;
    }
    return allSwitches[0] || null;
  }, [coreSwitches, edgeSwitches, selectedSwitchId]);

  // Filtered devices for data table
  const filteredDevices = useMemo(() => {
    return devices.filter((dev) => {
      if (tierFilter === 'core' && dev.deviceType !== 'core_switch') return false;
      if (
        tierFilter === 'edge' &&
        !['switch_l1', 'switch_l2', 'switch_l3'].includes(dev.deviceType)
      )
        return false;
      if (tierFilter === 'endpoints' && dev.deviceType.includes('switch')) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        dev.hostname.toLowerCase().includes(q) ||
        dev.ip.toLowerCase().includes(q) ||
        dev.mac.toLowerCase().includes(q) ||
        (dev.cpuOrLaptopSerial && dev.cpuOrLaptopSerial.toLowerCase().includes(q)) ||
        (dev.coreSwitchInfo && dev.coreSwitchInfo.toLowerCase().includes(q)) ||
        (dev.edgeSwitchInfo && dev.edgeSwitchInfo.toLowerCase().includes(q))
      );
    });
  }, [devices, tierFilter, searchQuery]);

  const getDeviceIcon = (type: string, className = 'w-4 h-4') => {
    switch (type) {
      case 'core_switch':
        return <Network className={`${className} text-cyan-400`} />;
      case 'switch_l1':
      case 'switch_l2':
      case 'switch_l3':
        return <Layers className={`${className} text-sky-400`} />;
      case 'server':
        return <Server className={`${className} text-purple-400`} />;
      case 'printer':
        return <Printer className={`${className} text-amber-400`} />;
      case 'laptop':
        return <Laptop className={`${className} text-emerald-400`} />;
      case 'workstation':
        return <Monitor className={`${className} text-teal-400`} />;
      default:
        return <Cpu className={`${className} text-emerald-400`} />;
    }
  };

  const exportFabricCsv = () => {
    const headers = [
      'Device IP',
      'Hostname',
      'MAC Address',
      'Device Tier',
      'Assigned Core Switch Info',
      'Core Switch Type',
      'Assigned Edge Switch Info',
      'Edge Switch Type',
      'CPU / Laptop Serial',
      'Monitor Serial',
      'Monitor Size',
      'Keyboard Serial',
      'Latency (ms)',
      'Status',
    ];

    const rows = devices.map((d) => [
      `"${d.ip}"`,
      `"${d.hostname}"`,
      `"${d.mac}"`,
      `"${d.deviceType}"`,
      `"${d.coreSwitchInfo || 'N/A'}"`,
      `"${d.coreSwitchType || 'N/A'}"`,
      `"${d.edgeSwitchInfo || 'N/A'}"`,
      `"${d.edgeSwitchType || 'N/A'}"`,
      `"${d.cpuOrLaptopSerial || 'N/A'}"`,
      `"${d.monitorSerial || 'N/A'}"`,
      `"${d.sizeOfMonitor || 'N/A'}"`,
      `"${d.keyboardSerial || 'N/A'}"`,
      `"${d.latencyMs}"`,
      `"${d.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `network_topology_switch_fabric_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (devices.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center shadow-xl space-y-3">
        <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400 mx-auto">
          <Network className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-100">Topology & Switch Fabric is Empty</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          No hardware assets detected on the network yet. Start or configure a network scan to auto-discover
          Core switches, Distribution/Edge switches, and connected hardware endpoints.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Fabric Control & Status Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-100">
                  Network Topology & Live Switch Fabric Architecture
                </h2>
                {isScanning && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    Live Pulse
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                End-to-end visual network design: Gateway Uplink → Core Backbone Fabric → L1/L2/L3 Switches → Connected Endpoints
              </p>
            </div>
          </div>

          {/* View Mode Segmented Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
              <button
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="View interactive topology diagram side-by-side with complete hardware data format"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Split View (Topology + Data)</span>
              </button>

              <button
                onClick={() => setViewMode('topology')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  viewMode === 'topology'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="View full-width interactive topology diagram"
              >
                <Network className="w-3.5 h-3.5" />
                <span>Topology Design</span>
              </button>

              <button
                onClick={() => setViewMode('switch_fabric')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  viewMode === 'switch_fabric'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="View rack-mounted switch faceplate with live blinking port LEDs"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Switch Port Fabric</span>
              </button>

              <button
                onClick={() => setViewMode('data_table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  viewMode === 'data_table'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="View complete tabular data format"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Existing Data Format</span>
              </button>
            </div>

            <button
              onClick={exportFabricCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-all"
              title="Export complete topology and switch fabric interconnect matrix as CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Fabric CSV</span>
            </button>
          </div>
        </div>

        {/* Quick Fabric KPI Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-cyan-400" /> Core Backbone
            </span>
            <span className="font-bold font-mono text-cyan-300">{coreSwitches.length} Switches</span>
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" /> Distribution / Edge
            </span>
            <span className="font-bold font-mono text-sky-300">{edgeSwitches.length} Units</span>
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-emerald-400" /> Active Endpoints
            </span>
            <span className="font-bold font-mono text-emerald-300">{endpoints.length} Nodes</span>
          </div>

          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Fabric Capacity
            </span>
            <span className="font-bold font-mono text-amber-300">10GbE / 1Gbps PoE</span>
          </div>
        </div>
      </div>

      {/* VIEW SECTION 1: Interactive Topology Design Format */}
      {(viewMode === 'topology' || viewMode === 'split') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <h3 className="text-sm font-bold text-slate-100">
                Visual Topology Schematic & Interconnect Trunks
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-0.5 bg-cyan-400 inline-block"></span> 10G Fiber Uplink
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-0.5 bg-sky-400 inline-block"></span> 1G Trunk / PoE
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-0.5 bg-emerald-400 inline-block"></span> Access Port
              </span>
            </div>
          </div>

          {/* Level 0: Internet / WAN Gateway */}
          <div className="flex flex-col items-center">
            <div className="p-3 bg-slate-950 border border-slate-700/80 rounded-2xl flex items-center gap-3 shadow-lg shadow-cyan-950/20 max-w-sm w-full">
              <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
                <Globe className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Gateway / WAN Firewall</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    Online
                  </span>
                </div>
                <div className="text-[11px] font-mono text-cyan-400">192.168.1.1 (Uplink Gateway)</div>
              </div>
            </div>

            {/* Downward Trunk Cable Line */}
            <div className="h-6 w-0.5 bg-gradient-to-b from-cyan-500 to-teal-500 relative">
              <div className="absolute top-1/2 -left-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping opacity-60"></div>
            </div>
          </div>

          {/* Level 1: Core Switch Layer (Backbone Fabric) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Network className="w-4 h-4" /> Layer 1: Core Switch Backbone Fabric ({coreSwitches.length})
              </span>
              <span className="text-[11px] text-slate-500 font-mono">10Gbps Multi-Chassis Trunk</span>
            </div>

            {coreSwitches.length === 0 ? (
              <div className="p-4 bg-slate-950/50 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                No Core Switches designated yet. Designate a Core Switch via the Inventory Table.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {coreSwitches.map((dev) => {
                  const isSelected = selectedDeviceId === dev.id;
                  const connectedCount = switchPortMapping.get(dev.id)?.length || 0;
                  return (
                    <div
                      key={dev.id}
                      onClick={() => onSelectDevice(dev)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-950/50'
                          : 'bg-slate-950/80 border-slate-800 hover:border-cyan-500/60 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
                            {getDeviceIcon(dev.deviceType, 'w-5 h-5')}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                              <span>{dev.hostname}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-cyan-950 text-cyan-300 rounded border border-cyan-800">
                                {dev.coreSwitchType || 'Managed'}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-cyan-400">{dev.ip}</div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {dev.latencyMs} ms
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                        <div className="text-slate-300 truncate" title={dev.coreSwitchInfo}>
                          <span className="text-slate-500">Model/Serial:</span> {dev.coreSwitchInfo || 'Cisco Catalyst 9500 / S/N: CORE-9500'}
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span>MAC: {dev.mac}</span>
                          <span className="text-emerald-400 font-bold">{connectedCount} Links Active</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interconnect Cable Pulses */}
          <div className="flex justify-center items-center py-1">
            <div className="w-full border-t border-dashed border-slate-800 relative"></div>
            <span className="relative z-10 bg-slate-900 px-3 text-[10px] text-slate-500 font-mono flex items-center gap-1.5 border border-slate-800 rounded-full shrink-0">
              <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
              10Gbps LACP Trunks / Spanning-Tree Root
            </span>
          </div>

          {/* Level 2: Distribution & Edge Switches (L1, L2, L3) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> Layer 2: L1, L2, L3 Edge Distribution Switches ({edgeSwitches.length})
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Access Layer Aggregation</span>
            </div>

            {edgeSwitches.length === 0 ? (
              <div className="p-4 bg-slate-950/50 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                No Edge/Distribution Switches detected.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {edgeSwitches.map((dev) => {
                  const isSelected = selectedDeviceId === dev.id;
                  const connectedCount = switchPortMapping.get(dev.id)?.length || 0;
                  return (
                    <div
                      key={dev.id}
                      onClick={() => onSelectDevice(dev)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                        isSelected
                          ? 'bg-sky-950/40 border-sky-400 ring-2 ring-sky-400/40 shadow-lg shadow-sky-950/50'
                          : 'bg-slate-950/80 border-slate-800 hover:border-sky-500/60 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400 border border-sky-500/20">
                            {getDeviceIcon(dev.deviceType, 'w-5 h-5')}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-200 group-hover:text-sky-300 transition-colors flex items-center gap-1.5">
                              <span>{dev.hostname}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-sky-950 text-sky-300 rounded border border-sky-800">
                                {dev.edgeSwitchType || 'Managed'}
                              </span>
                            </div>
                            <div className="text-[11px] font-mono text-sky-400">{dev.ip}</div>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border bg-sky-500/10 text-sky-400 border-sky-500/20">
                          {dev.deviceType.toUpperCase()}
                        </span>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5 text-[11px]">
                        <div className="text-slate-300 truncate" title={dev.edgeSwitchInfo}>
                          <span className="text-slate-500">Switch Model:</span> {dev.edgeSwitchInfo || 'Aruba CX 6200F / S/N: EDGE-6200'}
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span>Dept: {dev.department || 'Floor Access'}</span>
                          <span className="text-sky-400 font-bold">{connectedCount} Endpoints Linked</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interconnect Cable Pulses */}
          <div className="flex justify-center items-center py-1">
            <div className="w-full border-t border-dashed border-slate-800 relative"></div>
            <span className="relative z-10 bg-slate-900 px-3 text-[10px] text-slate-500 font-mono flex items-center gap-1.5 border border-slate-800 rounded-full shrink-0">
              <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
              1Gbps Cat6 Ethernet / PoE Access Ports
            </span>
          </div>

          {/* Level 3: Connected Workstations, Laptops & Exam Nodes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Laptop className="w-4 h-4" /> Layer 3: Connected Workstations, Laptops & Exam Nodes ({endpoints.length})
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Audited Hardware & Peripherals</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[460px] overflow-y-auto pr-1">
              {endpoints.map((dev) => {
                const isSelected = selectedDeviceId === dev.id;
                return (
                  <div
                    key={dev.id}
                    onClick={() => onSelectDevice(dev)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-950/50'
                        : 'bg-slate-950/70 border-slate-800 hover:border-emerald-500/60 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-800 rounded-lg text-emerald-400">
                          {getDeviceIcon(dev.deviceType)}
                        </div>
                        <div className="font-mono text-xs font-bold text-slate-200 group-hover:text-emerald-300 truncate max-w-[120px]">
                          {dev.hostname}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        {dev.latencyMs}ms
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400">{dev.ip}</div>

                    {/* Hardware Specifications Badges */}
                    <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono space-y-1 text-slate-300">
                      <div className="truncate" title={`CPU/Laptop Serial: ${dev.cpuOrLaptopSerial}`}>
                        <span className="text-slate-500">CPU/Lpt:</span> {dev.cpuOrLaptopSerial || 'Pending'}
                      </div>
                      <div className="truncate" title={`Monitor: ${dev.monitorSerial} (${dev.sizeOfMonitor})`}>
                        <span className="text-slate-500">Mon:</span> {dev.monitorSerial || 'N/A'} {dev.sizeOfMonitor && `(${dev.sizeOfMonitor})`}
                      </div>
                      <div className="truncate" title={`Keyboard: ${dev.keyboardSerial}`}>
                        <span className="text-slate-500">KB:</span> {dev.keyboardSerial || 'Pending'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW SECTION 2: Live Switch Port Matrix & Faceplate */}
      {(viewMode === 'switch_fabric' || viewMode === 'split') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400 border border-sky-500/20">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Live Switch Port Fabric (Rack Faceplate Visualization)
                </h3>
                <p className="text-xs text-slate-400">
                  Interactive 24-port physical switch panel with live link lights, PoE status, and mapped connected hosts
                </p>
              </div>
            </div>

            {/* Switch Selector Dropdown if multiple switches exist */}
            {[...coreSwitches, ...edgeSwitches].length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Select Switch Faceplate:</span>
                <select
                  value={activeSwitch?.id || ''}
                  onChange={(e) => setSelectedSwitchId(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                >
                  {[...coreSwitches, ...edgeSwitches].map((sw) => (
                    <option key={sw.id} value={sw.id}>
                      {sw.hostname} ({sw.ip}) - {sw.deviceType === 'core_switch' ? 'Core Switch' : 'Edge Switch'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {activeSwitch ? (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-inner">
              {/* Rack Chassis Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="font-bold text-slate-100">{activeSwitch.hostname}</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-cyan-400">{activeSwitch.ip}</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-slate-400">MAC: {activeSwitch.mac}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded border border-slate-800">
                    Model: {activeSwitch.coreSwitchInfo || activeSwitch.edgeSwitchInfo || 'Managed L2/L3 GigE Switch'}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-800">
                    System State: Operational
                  </span>
                </div>
              </div>

              {/* 24-Port Physical Switch Faceplate Render */}
              <div className="bg-slate-900 border-2 border-slate-700/80 rounded-xl p-3 sm:p-4 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pb-1 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>10/100/1000Base-T PoE+ Ports</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px]">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-emerald-400 inline-block"></span> Active Link
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded bg-slate-700 inline-block"></span> Unassigned / Standby
                    </span>
                  </div>
                </div>

                {/* 24 Ports Grid (Dual-row physical switch layout: Odd top row, Even bottom row) */}
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-2">
                  {Array.from({ length: 24 }).map((_, portIdx) => {
                    const portNumber = portIdx + 1;
                    const mappedDevices = switchPortMapping.get(activeSwitch.id) || [];
                    const assignedDev = mappedDevices[portIdx % (mappedDevices.length || 1)] || null;
                    const isPortActive = portIdx < Math.min(mappedDevices.length, 24);

                    return (
                      <div
                        key={portNumber}
                        onClick={() => {
                          if (assignedDev) onSelectDevice(assignedDev);
                        }}
                        className={`p-2 rounded-lg border text-center transition-all cursor-pointer relative group ${
                          isPortActive
                            ? 'bg-slate-950 border-emerald-500/50 hover:border-emerald-400 hover:bg-emerald-950/20'
                            : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                        }`}
                        title={
                          assignedDev
                            ? `Port ${portNumber}: ${assignedDev.hostname} (${assignedDev.ip}) - CPU: ${assignedDev.cpuOrLaptopSerial || 'N/A'}`
                            : `Port ${portNumber}: Unassigned / Standby`
                        }
                      >
                        {/* Port Status LED */}
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isPortActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'
                            }`}
                          ></span>
                          <span className="text-[9px] font-mono text-slate-500">P{portNumber}</span>
                        </div>

                        {/* Physical RJ45 Jack Icon */}
                        <div className="w-6 h-4 mx-auto bg-slate-800 border border-slate-700 rounded-sm flex items-center justify-center">
                          <div className={`w-3 h-2 rounded-xs ${isPortActive ? 'bg-emerald-500/60' : 'bg-slate-900'}`}></div>
                        </div>

                        {/* Connected Device Info */}
                        <div className="mt-1 text-[9px] font-mono truncate text-slate-400">
                          {isPortActive && assignedDev ? assignedDev.ip.split('.').slice(-1)[0] : '-'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-500">
              No switch available for faceplate visualization.
            </div>
          )}
        </div>
      )}

      {/* VIEW SECTION 3: Existing Data Format (Complete Hardware Inventory Matrix) */}
      {(viewMode === 'data_table' || viewMode === 'split') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                <TableIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Complete Switch Fabric & Hardware Data Format
                </h3>
                <p className="text-xs text-slate-400">
                  Comprehensive audit specifications matching all requested inventory fields
                </p>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter IP, Serial, Hostname..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-48 sm:w-56"
                />
              </div>

              {/* Tier Filter Tabs */}
              <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
                {(['all', 'core', 'edge', 'endpoints'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTierFilter(t)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                      tierFilter === t
                        ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tabular Data Format View */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] font-mono border-b border-slate-800">
                  <th className="py-2.5 px-3">Device & Role</th>
                  <th className="py-2.5 px-3">IP & MAC Address</th>
                  <th className="py-2.5 px-3">Core Switch Specification</th>
                  <th className="py-2.5 px-3">Edge / Distribution Switch</th>
                  <th className="py-2.5 px-3">Laptop / CPU Sl. No.</th>
                  <th className="py-2.5 px-3">Monitor Sl. No. & Size</th>
                  <th className="py-2.5 px-3">Keyboard Sl. No.</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No matching devices found for filter "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map((dev) => {
                    const isSelected = selectedDeviceId === dev.id;
                    return (
                      <tr
                        key={dev.id}
                        onClick={() => onSelectDevice(dev)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/30 text-white'
                            : 'hover:bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        {/* Device & Role */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(dev.deviceType)}
                            <div>
                              <div className="font-semibold text-slate-200">{dev.hostname}</div>
                              <div className="text-[10px] text-slate-500 font-mono capitalize">
                                {dev.deviceType.replace('_', ' ')}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* IP & MAC */}
                        <td className="py-2.5 px-3 font-mono">
                          <div className="text-cyan-400">{dev.ip}</div>
                          <div className="text-[10px] text-slate-500">{dev.mac}</div>
                        </td>

                        {/* Core Switch Specification */}
                        <td className="py-2.5 px-3 text-[11px]">
                          <div className="text-slate-200 truncate max-w-[160px]" title={dev.coreSwitchInfo}>
                            {dev.coreSwitchInfo || 'Cisco Core 9500'}
                          </div>
                          <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/60">
                            {dev.coreSwitchType || 'Managed'}
                          </span>
                        </td>

                        {/* Edge Switch Specification */}
                        <td className="py-2.5 px-3 text-[11px]">
                          <div className="text-slate-200 truncate max-w-[160px]" title={dev.edgeSwitchInfo}>
                            {dev.edgeSwitchInfo || 'Aruba Edge 6200'}
                          </div>
                          <span className="text-[9px] font-mono text-sky-400 bg-sky-950/60 px-1.5 py-0.2 rounded border border-sky-800/60">
                            {dev.edgeSwitchType || 'Managed'}
                          </span>
                        </td>

                        {/* CPU / Laptop Sl. No. */}
                        <td className="py-2.5 px-3 font-mono text-slate-200">
                          {dev.cpuOrLaptopSerial || <span className="text-slate-500 italic">Not set</span>}
                        </td>

                        {/* Monitor Sl. No. & Size */}
                        <td className="py-2.5 px-3 text-slate-200 font-mono text-[11px]">
                          <div>{dev.monitorSerial || <span className="text-slate-500 italic">N/A</span>}</div>
                          {dev.sizeOfMonitor && (
                            <div className="text-[10px] text-slate-400">{dev.sizeOfMonitor}</div>
                          )}
                        </td>

                        {/* Keyboard Sl. No. */}
                        <td className="py-2.5 px-3 font-mono text-slate-200">
                          {dev.keyboardSerial || <span className="text-slate-500 italic">Not set</span>}
                        </td>

                        {/* Action */}
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectDevice(dev);
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="Inspect Device Audit Details"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
