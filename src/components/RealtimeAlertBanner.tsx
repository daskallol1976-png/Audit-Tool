import React, { useState } from 'react';
import { NetworkAlert, AlertSeverity } from '../types/inventory';
import {
  AlertTriangle,
  ShieldAlert,
  Wifi,
  WifiOff,
  Bell,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Filter,
  Trash2,
  Radio,
  Flame
} from 'lucide-react';

interface Props {
  alerts: NetworkAlert[];
  onDismissAlert: (id: string) => void;
  onClearAll: () => void;
  onSelectAlertIp?: (ip: string) => void;
}

export const RealtimeAlertBanner: React.FC<Props> = ({
  alerts,
  onDismissAlert,
  onClearAll,
  onSelectAlertIp,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [soundEnabled, setSoundEnabled] = useState(false);

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;
  const criticalCount = alerts.filter((a) => a.severity === 'critical' || a.severity === 'security').length;

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'all') return true;
    if (filterSeverity === 'critical') return a.severity === 'critical' || a.severity === 'security';
    return a.severity === filterSeverity;
  });

  const getAlertIcon = (type: NetworkAlert['type'], severity: AlertSeverity) => {
    switch (type) {
      case 'device_connected':
        return <Wifi className="w-4 h-4 text-emerald-400" />;
      case 'device_disconnected':
        return <WifiOff className="w-4 h-4 text-rose-400" />;
      case 'rogue_device':
      case 'unauthorized_dhcp':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'port_anomaly':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'ip_conflict':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'security':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
            Security Anomaly
          </span>
        );
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40">
            Critical
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Warning
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Info
          </span>
        );
    }
  };

  // If no alerts at all
  if (alerts.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-200">Real-Time Threat & State Monitor: </span>
            <span>All systems nominal. No rogue devices or connection anomalies detected.</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono text-emerald-400">Live Sniffer Active</span>
        </div>
      </div>
    );
  }

  // Latest critical or first alert for banner highlight
  const latestAlert = alerts[0];

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 shadow-xl overflow-hidden ${
        criticalCount > 0
          ? 'bg-rose-950/20 border-rose-500/40 ring-1 ring-rose-500/20'
          : 'bg-slate-900 border-slate-800'
      }`}
    >
      {/* Primary Alert Header Bar */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              criticalCount > 0
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            <Bell className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Real-Time Network Alert System
              </h3>
              {getSeverityBadge(latestAlert.severity)}
              <span className="text-xs font-mono text-slate-400">
                ({alerts.length} total event{alerts.length > 1 ? 's' : ''}
                {criticalCount > 0 ? `, ${criticalCount} security anomaly` : ''})
              </span>
            </div>

            {/* Teaser of the most recent alert */}
            <div className="text-xs text-slate-300 mt-1 flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white">{latestAlert.title}:</span>
              <span className="text-slate-300 truncate max-w-xl">{latestAlert.description}</span>
              {latestAlert.ip && (
                <button
                  onClick={() => onSelectAlertIp?.(latestAlert.ip!)}
                  className="font-mono text-cyan-400 hover:underline bg-slate-950 px-1.5 py-0.5 rounded text-[11px]"
                >
                  {latestAlert.ip}
                </button>
              )}
              <span className="text-[10px] text-slate-500 font-mono">[{latestAlert.timestamp}]</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium cursor-pointer transition-colors"
          >
            <span>{isExpanded ? 'Collapse' : `View All (${alerts.length})`}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {alerts.length > 0 && (
            <button
              onClick={onClearAll}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Clear all alerts"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Alert Drawer List */}
      {isExpanded && (
        <div className="border-t border-slate-800 bg-slate-950/70 p-4 space-y-3">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 text-[11px]">Filter:</span>
              <button
                onClick={() => setFilterSeverity('all')}
                className={`px-2 py-0.5 rounded-lg text-[11px] ${
                  filterSeverity === 'all'
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({alerts.length})
              </button>
              <button
                onClick={() => setFilterSeverity('critical')}
                className={`px-2 py-0.5 rounded-lg text-[11px] ${
                  filterSeverity === 'critical'
                    ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Security / Critical ({criticalCount})
              </button>
            </div>

            <span className="text-[11px] text-slate-500">
              Live anomaly sniffing triggers on ARP changes, port deviations, and rogue MAC addresses
            </span>
          </div>

          {/* Alert Cards */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs transition-colors ${
                  alert.severity === 'security' || alert.severity === 'critical'
                    ? 'bg-rose-950/30 border-rose-500/30 hover:bg-rose-950/40'
                    : alert.severity === 'warning'
                    ? 'bg-amber-950/20 border-amber-500/30 hover:bg-amber-950/30'
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-start gap-2.5 flex-1">
                  <div className="p-1.5 bg-slate-950 rounded-lg shrink-0 mt-0.5">
                    {getAlertIcon(alert.type, alert.severity)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-200">{alert.title}</span>
                      {getSeverityBadge(alert.severity)}
                      <span className="text-[10px] font-mono text-slate-400">[{alert.timestamp}]</span>
                    </div>
                    <p className="text-slate-300 mt-0.5 text-xs leading-relaxed">{alert.description}</p>
                    {(alert.ip || alert.mac) && (
                      <div className="mt-1 flex items-center gap-3 text-[11px] font-mono text-slate-400">
                        {alert.ip && (
                          <span>
                            Target IP:{' '}
                            <button
                              onClick={() => onSelectAlertIp?.(alert.ip!)}
                              className="text-cyan-400 hover:underline cursor-pointer"
                            >
                              {alert.ip}
                            </button>
                          </span>
                        )}
                        {alert.mac && <span>MAC: <span className="text-slate-300">{alert.mac}</span></span>}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onDismissAlert(alert.id)}
                  className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg cursor-pointer"
                  title="Dismiss alert"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
