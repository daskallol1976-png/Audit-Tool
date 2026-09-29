import React, { useState } from 'react';
import { NetworkDevice } from '../types/inventory';
import { X, Check, Laptop, Monitor, Keyboard, Network } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (device: NetworkDevice) => void;
  currentDevicesCount: number;
}

export const AddDeviceModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onAdd,
  currentDevicesCount,
}) => {
  if (!isOpen) return null;

  const nextIpNum = 100 + currentDevicesCount + 1;
  const [formData, setFormData] = useState<Partial<NetworkDevice>>({
    ip: `192.168.1.${nextIpNum}`,
    mac: '00:50:56:88:AA:11',
    hostname: `WS-NODE-${nextIpNum}`,
    deviceType: 'workstation',
    status: 'online',
    latencyMs: 3.5,
    openPorts: [135, 445],
    vendor: 'Dell Inc.',
    lastSeen: 'Just now',
    cpuOrLaptopSerial: `DEL-OPT-2024-${nextIpNum}`,
    monitorSerial: `MON-DEL-24-${nextIpNum}0`,
    yearOfPurchase: '2024',
    sizeOfMonitor: '24 Inch',
    monitorYearOfPurchase: '2024',
    keyboardSerial: `KB-DEL-KB216-${nextIpNum}0`,
    coreSwitchInfo: '00:1B:54:19:B2:44 / Cisco Catalyst 9500-24Q & FOC2441L0B2',
    coreSwitchType: 'Managed',
    edgeSwitchInfo: '00:2A:6A:41:99:12 / Cisco Catalyst 9200L-48P-4G & FOC2318N40A',
    edgeSwitchType: 'Managed',
    department: 'Exam Lab Hall',
    assignedUser: `Candidate Seat ${nextIpNum}`,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDevice: NetworkDevice = {
      ...(formData as NetworkDevice),
      id: `dev-${Date.now()}`,
    };
    onAdd(newDevice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Laptop className="w-4 h-4 text-emerald-400" />
            Add Network Device & Hardware Audit Record
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">IP Address *</label>
              <input
                type="text"
                required
                value={formData.ip}
                onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Hostname *</label>
              <input
                type="text"
                required
                value={formData.hostname}
                onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">MAC Address *</label>
              <input
                type="text"
                required
                value={formData.mac}
                onChange={(e) => setFormData({ ...formData, mac: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <h4 className="text-emerald-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5" /> Workstation / Laptop Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Laptop/CPU Sl. No. *</label>
                <input
                  type="text"
                  required
                  value={formData.cpuOrLaptopSerial}
                  onChange={(e) => setFormData({ ...formData, cpuOrLaptopSerial: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Year Of Purchase *</label>
                <input
                  type="text"
                  required
                  value={formData.yearOfPurchase}
                  onChange={(e) => setFormData({ ...formData, yearOfPurchase: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Device Type</label>
                <select
                  value={formData.deviceType}
                  onChange={(e) => setFormData({ ...formData, deviceType: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                >
                  <option value="workstation">Desktop Workstation</option>
                  <option value="laptop">Laptop</option>
                  <option value="server">Server</option>
                  <option value="core_switch">Core Switch</option>
                  <option value="switch_l2">L2 Switch</option>
                  <option value="switch_l3">L3 Switch</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <h4 className="text-teal-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5" /> Monitor & Keyboard Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Monitor Sl. No.</label>
                <input
                  type="text"
                  value={formData.monitorSerial}
                  onChange={(e) => setFormData({ ...formData, monitorSerial: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Size Of Monitor</label>
                <input
                  type="text"
                  placeholder="24 Inch"
                  value={formData.sizeOfMonitor}
                  onChange={(e) => setFormData({ ...formData, sizeOfMonitor: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Year Of Purchase (Mon)</label>
                <input
                  type="text"
                  value={formData.monitorYearOfPurchase}
                  onChange={(e) => setFormData({ ...formData, monitorYearOfPurchase: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Keyboard Sl No.</label>
                <input
                  type="text"
                  value={formData.keyboardSerial}
                  onChange={(e) => setFormData({ ...formData, keyboardSerial: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <h4 className="text-cyan-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5" /> Network Switch Association
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Core Switch Mac/ Model & Sl No.</label>
                <input
                  type="text"
                  value={formData.coreSwitchInfo}
                  onChange={(e) => setFormData({ ...formData, coreSwitchInfo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono text-[11px]"
                />
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Switch Type:</span>
                  <select
                    value={formData.coreSwitchType}
                    onChange={(e) => setFormData({ ...formData, coreSwitchType: e.target.value as any })}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200"
                  >
                    <option value="Managed">Managed</option>
                    <option value="Unmanaged">Unmanaged</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">L1,L2,L3 Switch Mac/ Model & Sl No.</label>
                <input
                  type="text"
                  value={formData.edgeSwitchInfo}
                  onChange={(e) => setFormData({ ...formData, edgeSwitchInfo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 font-mono text-[11px]"
                />
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Switch Type:</span>
                  <select
                    value={formData.edgeSwitchType}
                    onChange={(e) => setFormData({ ...formData, edgeSwitchType: e.target.value as any })}
                    className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200"
                  >
                    <option value="Managed">Managed</option>
                    <option value="Unmanaged">Unmanaged</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Add Device
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
