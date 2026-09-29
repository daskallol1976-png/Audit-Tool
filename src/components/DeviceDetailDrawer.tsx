import React from 'react';
import { NetworkDevice, VenueAuditConfig } from '../types/inventory';
import {
  Laptop,
  Monitor,
  Network,
  Cpu,
  ShieldCheck,
  Calendar,
  Building2,
  MapPin,
  ExternalLink,
  Edit2,
  Zap,
  Activity,
  CheckCircle2
} from 'lucide-react';

interface Props {
  device: NetworkDevice;
  venueConfig: VenueAuditConfig | null;
  onClose: () => void;
  onEdit: () => void;
}

export const DeviceDetailDrawer: React.FC<Props> = ({
  device,
  venueConfig,
  onClose,
  onEdit,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Laptop className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100">{device.hostname}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Online
              </span>
            </div>
            <div className="text-xs font-mono text-slate-400 mt-0.5">
              IP: <span className="text-emerald-300">{device.ip}</span> • MAC: <span className="text-slate-300">{device.mac}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-emerald-400" /> Edit
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-950 text-slate-400 hover:text-slate-200 rounded-xl text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Main Grid: Required Audit Attributes Highlighted */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Box 1: Computer / Laptop & Peripherals */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4" /> Workstation / Laptop & Purchase Spec
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Laptop/CPU Sl. No.:</span>
              <span className="font-mono font-semibold text-emerald-300 select-all">
                {device.cpuOrLaptopSerial}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Year Of Purchase:</span>
              <span className="text-slate-200 font-semibold">{device.yearOfPurchase}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Hardware Vendor:</span>
              <span className="text-slate-200">{device.vendor}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Keyboard Sl No.:</span>
              <span className="font-mono font-semibold text-indigo-300 select-all">
                {device.keyboardSerial}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Allocated User / Desk:</span>
              <span className="text-slate-300">{device.assignedUser || 'Seat / Lab Terminal'}</span>
            </div>
          </div>
        </div>

        {/* Box 2: Monitor Specifications */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
          <div className="text-xs font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
            <Monitor className="w-4 h-4" /> Monitor Audit Details
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Monitor Sl. No.:</span>
              <span className="font-mono font-semibold text-teal-300 select-all">
                {device.monitorSerial}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Size Of Monitor:</span>
              <span className="text-slate-200 font-semibold">{device.sizeOfMonitor}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Year Of Purchase (Monitor):</span>
              <span className="text-slate-200 font-semibold">{device.monitorYearOfPurchase}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Assigned Department:</span>
              <span className="text-slate-300">{device.department || 'Examination Floor'}</span>
            </div>
          </div>
        </div>

        {/* Box 3: Core Switch Connection */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Network className="w-4 h-4" /> Core Switch Architecture
          </div>

          <div className="space-y-2 text-xs">
            <div className="py-1 border-b border-slate-800/60">
              <div className="text-slate-400 text-[11px] mb-1">Core Switch Mac/ Model & Sl No.:</div>
              <div className="font-mono text-cyan-300 text-[11px] select-all bg-slate-900 p-1.5 rounded border border-slate-800">
                {device.coreSwitchInfo}
              </div>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Type of Switch:</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                {device.coreSwitchType}
              </span>
            </div>
          </div>
        </div>

        {/* Box 4: Distribution / Edge Switch */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
          <div className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
            <Network className="w-4 h-4" /> L1, L2, L3 Distribution Switch
          </div>

          <div className="space-y-2 text-xs">
            <div className="py-1 border-b border-slate-800/60">
              <div className="text-slate-400 text-[11px] mb-1">L1,L2,L3 Switch Mac/ Model & Sl No.:</div>
              <div className="font-mono text-sky-300 text-[11px] select-all bg-slate-900 p-1.5 rounded border border-slate-800">
                {device.edgeSwitchInfo}
              </div>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Type of Switch:</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                {device.edgeSwitchType}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Network Telemetry Summary */}
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400" /> Ping Latency: <strong className="text-slate-200">{device.latencyMs} ms</strong>
          </span>
          <span>
            Open Ports: <strong className="text-slate-200 font-mono">{device.openPorts.join(', ') || 'Standard Host'}</strong>
          </span>
        </div>
        {venueConfig && (
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-500">Audit Venue:</span>
            <span className="text-emerald-400 font-semibold">{venueConfig.venueName} ({venueConfig.city})</span>
          </div>
        )}
      </div>
    </div>
  );
};
