import React, { useState, useRef } from 'react';
import { NetworkDevice } from '../types/inventory';
import {
  Laptop,
  Monitor,
  Server,
  Network,
  Printer,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  FileText,
  Upload,
  Radio,
  Activity
} from 'lucide-react';

interface Props {
  devices: NetworkDevice[];
  onUpdateDevice: (updated: NetworkDevice) => void;
  onDeleteDevice: (id: string) => void;
  onAddManualDevice: () => void;
  isScanning: boolean;
  highlightIp?: string | null;
  onExportPdf?: () => void;
  onClearAll?: () => void;
  onImportCsv?: (imported: NetworkDevice[]) => void;
  onRescan?: () => void;
  scanPhase?: string;
  scanProgressPercent?: number;
}

export const DeviceTable: React.FC<Props> = ({
  devices,
  onUpdateDevice,
  onDeleteDevice,
  onAddManualDevice,
  isScanning,
  highlightIp,
  onExportPdf,
  onClearAll,
  onImportCsv,
  onRescan,
  scanPhase,
  scanProgressPercent = 0,
}) => {
  const [searchTerm, setSearchTerm] = useState(highlightIp || '');
  const [filterType, setFilterType] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<NetworkDevice | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (highlightIp) {
      setSearchTerm(highlightIp);
    }
  }, [highlightIp]);

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return;

      const parseCsvLine = (line: string): string[] => {
        const result: string[] = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              cur += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
          } else {
            cur += char;
          }
        }
        result.push(cur.trim());
        return result;
      };

      const headerCols = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
      const newDevices: NetworkDevice[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length < 2) continue;

        const getCol = (nameSub: string, fallbackIndex = -1) => {
          const idx = headerCols.findIndex((h) => h.includes(nameSub));
          if (idx !== -1 && cols[idx] !== undefined) return cols[idx];
          if (fallbackIndex !== -1 && cols[fallbackIndex] !== undefined) return cols[fallbackIndex];
          return '';
        };

        const ip = getCol('ip', 1) || `192.168.1.${10 + i}`;
        const mac = getCol('mac', 2) || '00:00:00:00:00:00';
        const hostname = getCol('hostname', 4) || getCol('host', 3) || `HOST-${10 + i}`;

        newDevices.push({
          id: `dev-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          ip,
          mac,
          hostname,
          deviceType: 'workstation',
          status: 'online',
          latencyMs: +(Math.random() * 8 + 2).toFixed(1),
          openPorts: [80, 443],
          vendor: getCol('vendor') || 'Standard Hardware',
          lastSeen: 'Imported',
          cpuOrLaptopSerial: getCol('cpu') || getCol('laptop') || cols[7] || '',
          monitorSerial: getCol('monitor sl') || cols[8] || '',
          yearOfPurchase: getCol('year of purchase') || cols[9] || new Date().getFullYear().toString(),
          sizeOfMonitor: getCol('size of monitor') || cols[10] || '24 Inch',
          monitorYearOfPurchase: cols[11] || cols[9] || new Date().getFullYear().toString(),
          keyboardSerial: getCol('keyboard') || cols[12] || '',
          coreSwitchInfo: getCol('core switch') || cols[13] || '',
          coreSwitchType: (cols[14]?.includes('Unmanaged') ? 'Unmanaged' : 'Managed') as any,
          edgeSwitchInfo: getCol('l1,l2,l3') || getCol('edge') || cols[15] || '',
          edgeSwitchType: (cols[16]?.includes('Unmanaged') ? 'Unmanaged' : 'Managed') as any,
        });
      }

      if (newDevices.length > 0 && onImportCsv) {
        onImportCsv(newDevices);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const startEdit = (device: NetworkDevice) => {
    setEditingId(device.id);
    setEditFormData({ ...device });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData(null);
  };

  const saveEdit = () => {
    if (editFormData) {
      onUpdateDevice(editFormData);
      setEditingId(null);
      setEditFormData(null);
    }
  };

  const filteredDevices = devices.filter((d) => {
    const matchSearch =
      d.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.mac.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.cpuOrLaptopSerial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.monitorSerial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.keyboardSerial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.coreSwitchInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.edgeSwitchInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.vendor.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;
    if (filterType === 'all') return true;
    if (filterType === 'workstations') return d.deviceType === 'workstation' || d.deviceType === 'laptop';
    if (filterType === 'switches') return d.deviceType.includes('switch');
    if (filterType === 'servers') return d.deviceType === 'server';
    return true;
  });

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'laptop':
      case 'workstation':
        return <Laptop className="w-4 h-4 text-emerald-400" />;
      case 'core_switch':
      case 'switch_l1':
      case 'switch_l2':
      case 'switch_l3':
        return <Network className="w-4 h-4 text-cyan-400" />;
      case 'server':
        return <Server className="w-4 h-4 text-purple-400" />;
      case 'printer':
        return <Printer className="w-4 h-4 text-amber-400" />;
      default:
        return <Monitor className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      {/* Table Toolbar */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search IP, Serial, MAC, Monitor, Switch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700/80 p-1 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterType === 'all'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({devices.length})
            </button>
            <button
              onClick={() => setFilterType('workstations')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterType === 'workstations'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PC / Laptops
            </button>
            <button
              onClick={() => setFilterType('switches')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                filterType === 'switches'
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Switches
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            className="hidden"
            onChange={handleCsvFileChange}
          />

          {/* Auto-Scan Network Button */}
          {onRescan && (
            <button
              onClick={onRescan}
              disabled={isScanning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                isScanning
                  ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 animate-pulse'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 shadow-md shadow-emerald-600/20'
              }`}
              title="Automatically scan all systems under the network across all IP address ranges"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-emerald-400' : 'text-slate-950'}`} />
              <span>{isScanning ? 'Scanning All Ranges...' : 'Auto-Scan All IP Ranges'}</span>
            </button>
          )}

          {/* Import CSV */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition-all"
            title="Import an existing hardware asset CSV file"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import CSV</span>
          </button>

          {onExportPdf && devices.length > 0 && (
            <button
              onClick={onExportPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-semibold cursor-pointer transition-all"
              title="Export formatted PDF report with inventory summary & metadata"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>Export PDF</span>
            </button>
          )}

          <button
            onClick={onAddManualDevice}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl text-xs cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Device</span>
          </button>

          {devices.length > 0 && onClearAll && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-medium cursor-pointer transition-all"
              title="Remove all devices and reset audit"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto overflow-y-auto max-h-[580px] scrollbar-thin scrollbar-thumb-slate-700">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-950/90 sticky top-0 z-10 border-b border-slate-800 text-[11px] font-semibold text-slate-300 tracking-wider">
            <tr>
              <th className="py-3 px-3 w-10 text-center">#</th>
              <th className="py-3 px-3 min-w-[130px]">Device & Network</th>
              <th className="py-3 px-3 min-w-[150px] text-emerald-300 bg-emerald-950/20">Laptop/CPU Sl. No.</th>
              <th className="py-3 px-3 min-w-[140px] text-teal-300 bg-teal-950/20">Monitor Sl. No.</th>
              <th className="py-3 px-3 min-w-[100px] text-teal-300 bg-teal-950/20">Year of Purchase</th>
              <th className="py-3 px-3 min-w-[110px] text-teal-300 bg-teal-950/20">Size of Monitor</th>
              <th className="py-3 px-3 min-w-[100px] text-teal-300 bg-teal-950/20">Year of Purchase (Mon)</th>
              <th className="py-3 px-3 min-w-[140px] text-indigo-300 bg-indigo-950/20">Keyboard Sl No.</th>
              <th className="py-3 px-3 min-w-[190px] text-cyan-300 bg-cyan-950/20">Core Switch Mac/Model & Sl No.</th>
              <th className="py-3 px-3 min-w-[120px] text-cyan-300 bg-cyan-950/20">Type of Switch</th>
              <th className="py-3 px-3 min-w-[190px] text-sky-300 bg-sky-950/20">L1,L2,L3 Switch Mac/Model & Sl No.</th>
              <th className="py-3 px-3 min-w-[120px] text-sky-300 bg-sky-950/20">Type of Switch</th>
              <th className="py-3 px-3 min-w-[90px] text-right sticky right-0 bg-slate-950/95">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {filteredDevices.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-16 text-center text-slate-400 font-sans">
                  {isScanning ? (
                    <div className="flex flex-col items-center justify-center gap-3.5 max-w-lg mx-auto py-6">
                      <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                        <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping"></div>
                        <Radio className="w-8 h-8 text-emerald-400 animate-pulse" />
                      </div>
                      <div className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <span>Auto-Scanning All Systems Under The Network...</span>
                        <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed text-center">
                        {scanPhase || 'Actively scanning network IP ranges (192.168.1.0/24, 192.168.2.0/24, 10.0.0.0/24)... Detecting active workstations, laptops, switches, and hardware serials.'}
                      </p>
                      <div className="w-full max-w-sm bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800 mt-2">
                        <div
                          className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 h-full transition-all duration-300 ease-out"
                          style={{ width: `${Math.max(15, scanProgressPercent)}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 space-y-3">
                      <div className="text-sm font-semibold text-slate-300">
                        {searchTerm ? `No devices found matching "${searchTerm}".` : 'No devices detected.'}
                      </div>
                      {onRescan && (
                        <button
                          onClick={onRescan}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-500/20"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Start Auto-Scan Now</span>
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredDevices.map((device, idx) => {
                const isEditing = editingId === device.id;
                const row = isEditing && editFormData ? editFormData : device;

                return (
                  <tr
                    key={device.id}
                    className={`transition-colors ${
                      isEditing
                        ? 'bg-slate-800/80 ring-1 ring-inset ring-emerald-500/50'
                        : 'hover:bg-slate-800/40 odd:bg-slate-900/30'
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2.5 px-3 text-center text-slate-500 font-sans">{idx + 1}</td>

                    {/* Device & Network Details */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-slate-800 rounded-lg shrink-0">
                          {getDeviceIcon(device.deviceType)}
                        </div>
                        <div className="font-sans leading-tight">
                          <div className="font-semibold text-slate-200 font-mono">{device.ip}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[120px]" title={device.hostname}>
                            {device.hostname}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">{device.mac}</div>
                        </div>
                      </div>
                    </td>

                    {/* Laptop/CPU Sl. No. */}
                    <td className="py-2.5 px-3 bg-emerald-950/5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={row.cpuOrLaptopSerial}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData!, cpuOrLaptopSerial: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-emerald-500/50 rounded px-2 py-1 text-emerald-300 focus:outline-none"
                        />
                      ) : (
                        <span className="font-semibold text-emerald-300 select-all">{device.cpuOrLaptopSerial}</span>
                      )}
                    </td>

                    {/* Monitor Sl. No. */}
                    <td className="py-2.5 px-3 bg-teal-950/5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={row.monitorSerial}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData!, monitorSerial: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-teal-500/50 rounded px-2 py-1 text-teal-300 focus:outline-none"
                        />
                      ) : (
                        <span className="text-teal-300 select-all">{device.monitorSerial}</span>
                      )}
                    </td>

                    {/* Year of Purchase (Device) */}
                    <td className="py-2.5 px-3 bg-teal-950/5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={row.yearOfPurchase}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData!, yearOfPurchase: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-teal-500/50 rounded px-2 py-1 text-teal-200 focus:outline-none"
                        />
                      ) : (
                        <span className="text-slate-300">{device.yearOfPurchase}</span>
                      )}
                    </td>

                    {/* Size of Monitor */}
                    <td className="py-2.5 px-3 bg-teal-950/5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={row.sizeOfMonitor}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData!, sizeOfMonitor: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-teal-500/50 rounded px-2 py-1 text-teal-200 focus:outline-none"
                        />
                      ) : (
                        <span className="text-slate-300">{device.sizeOfMonitor}</span>
                      )}
                    </td>

                    {/* Year of Purchase (Monitor) */}
                    <td className="py-2.5 px-3 bg-teal-950/5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={row.monitorYearOfPurchase}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData!, monitorYearOfPurchase: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-teal-500/50 rounded px-2 py-1 text-teal-200 focus:outline-none"
                        />
                      ) : (
                        <span className="text-slate-300">{device.monitorYearOfPurchase}</span>
                      )}
                    </td>

                    {/* Keyboard Sl No. */}
                    <td className="py-2.5 px-3 bg-indigo-950/5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={row.keyboardSerial}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData!, keyboardSerial: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-indigo-500/50 rounded px-2 py-1 text-indigo-300 focus:outline-none"
                        />
                      ) : (
                        <span className="text-indigo-300 select-all">{device.keyboardSerial}</span>
                      )}
                    </td>

                    {/* Core Switch Mac/ Model & Sl No. */}
                    <td className="py-2.5 px-3 bg-cyan-950/5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={row.coreSwitchInfo}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData!, coreSwitchInfo: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-cyan-500/50 rounded px-2 py-1 text-cyan-300 focus:outline-none"
                        />
                      ) : (
                        <span className="text-cyan-300 truncate block max-w-[240px]" title={device.coreSwitchInfo}>
                          {device.coreSwitchInfo}
                        </span>
                      )}
                    </td>

                    {/* Types of Switch (Managed/Unmanaged) */}
                    <td className="py-2.5 px-3 bg-cyan-950/5">
                      {isEditing ? (
                        <select
                          value={row.coreSwitchType}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData!,
                              coreSwitchType: e.target.value as any,
                            })
                          }
                          className="w-full bg-slate-950 border border-cyan-500/50 rounded px-2 py-1 text-cyan-200 focus:outline-none"
                        >
                          <option value="Managed">Managed</option>
                          <option value="Unmanaged">Unmanaged</option>
                          <option value="N/A">N/A</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-medium border ${
                            device.coreSwitchType === 'Managed'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {device.coreSwitchType}
                        </span>
                      )}
                    </td>

                    {/* L1,L2,L3 Switch Mac/ Model & Sl No. */}
                    <td className="py-2.5 px-3 bg-sky-950/5">
                      {isEditing ? (
                        <input
                          type="text"
                          value={row.edgeSwitchInfo}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData!, edgeSwitchInfo: e.target.value })
                          }
                          className="w-full bg-slate-950 border border-sky-500/50 rounded px-2 py-1 text-sky-300 focus:outline-none"
                        />
                      ) : (
                        <span className="text-sky-300 truncate block max-w-[240px]" title={device.edgeSwitchInfo}>
                          {device.edgeSwitchInfo}
                        </span>
                      )}
                    </td>

                    {/* Types of Switch (Managed/Unmanaged) */}
                    <td className="py-2.5 px-3 bg-sky-950/5">
                      {isEditing ? (
                        <select
                          value={row.edgeSwitchType}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData!,
                              edgeSwitchType: e.target.value as any,
                            })
                          }
                          className="w-full bg-slate-950 border border-sky-500/50 rounded px-2 py-1 text-sky-200 focus:outline-none"
                        >
                          <option value="Managed">Managed</option>
                          <option value="Unmanaged">Unmanaged</option>
                          <option value="N/A">N/A</option>
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-medium border ${
                            device.edgeSwitchType === 'Managed'
                              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {device.edgeSwitchType}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right sticky right-0 bg-slate-900/90 font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        {isEditing ? (
                          <>
                            <button
                              onClick={saveEdit}
                              title="Save"
                              className="p-1 bg-emerald-500 text-slate-950 rounded hover:bg-emerald-400 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              title="Cancel"
                              className="p-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(device)}
                              title="Edit Hardware Serial / Details"
                              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded cursor-pointer transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteDevice(device.id)}
                              title="Delete Device"
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Status */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span>
            Total Devices: <strong className="text-slate-200">{devices.length}</strong>
          </span>
          <span>
            Showing: <strong className="text-emerald-400">{filteredDevices.length}</strong>
          </span>
          <span className="hidden sm:inline">
            Active Core/L2/L3 Switches:{' '}
            <strong className="text-cyan-400">
              {devices.filter((d) => d.deviceType.includes('switch')).length}
            </strong>
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          Click any row's edit icon to modify Serial Numbers, Monitor Specs, or Switch Bindings.
        </div>
      </div>
    </div>
  );
};
