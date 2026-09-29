import React from 'react';
import { NetworkDevice } from '../types/inventory';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Laptop,
  Server,
  Network,
  Printer,
  Monitor,
  Activity,
  BarChart3,
  PieChart as PieIcon,
  ShieldCheck
} from 'lucide-react';

interface Props {
  devices: NetworkDevice[];
  onFilterByType?: (type: string) => void;
}

const COLORS = [
  '#10b981', // emerald-500
  '#06b6d4', // cyan-500
  '#6366f1', // indigo-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#8b5cf6', // purple-500
  '#3b82f6', // blue-500
  '#14b8a6', // teal-500
];

export const DeviceBreakdownCharts: React.FC<Props> = ({ devices, onFilterByType }) => {
  // Aggregate devices by friendly category
  const typeMap: Record<string, { count: number; label: string; icon: string }> = {
    workstation: { count: 0, label: 'Desktop Workstations', icon: 'desktop' },
    laptop: { count: 0, label: 'Laptops', icon: 'laptop' },
    core_switch: { count: 0, label: 'Core Switches', icon: 'switch' },
    switch_l3: { count: 0, label: 'L3 Switches', icon: 'switch' },
    switch_l2: { count: 0, label: 'L2 Switches', icon: 'switch' },
    switch_l1: { count: 0, label: 'L1 Switches', icon: 'switch' },
    server: { count: 0, label: 'Servers', icon: 'server' },
    printer: { count: 0, label: 'Printers & Peripherals', icon: 'printer' },
  };

  devices.forEach((d) => {
    if (typeMap[d.deviceType]) {
      typeMap[d.deviceType].count++;
    } else {
      typeMap[d.deviceType] = { count: 1, label: d.deviceType, icon: 'device' };
    }
  });

  const pieData = Object.entries(typeMap)
    .filter(([_, item]) => item.count > 0)
    .map(([key, item]) => ({
      name: item.label,
      rawType: key,
      value: item.count,
    }));

  // Grouped category data for bar chart
  const categoryData = [
    {
      category: 'Workstations & Laptops',
      count: devices.filter((d) => d.deviceType === 'workstation' || d.deviceType === 'laptop').length,
      fill: '#10b981',
    },
    {
      category: 'Switches (Core & L1-L3)',
      count: devices.filter((d) => d.deviceType.includes('switch')).length,
      fill: '#06b6d4',
    },
    {
      category: 'Servers',
      count: devices.filter((d) => d.deviceType === 'server').length,
      fill: '#8b5cf6',
    },
    {
      category: 'Printers / Others',
      count: devices.filter((d) => d.deviceType === 'printer' || d.deviceType === 'router').length,
      fill: '#f59e0b',
    },
  ];

  // Managed vs Unmanaged Switch Breakdown
  const switches = devices.filter((d) => d.deviceType.includes('switch'));
  const managedCore = devices.filter((d) => d.coreSwitchType === 'Managed').length;
  const unmanagedCore = devices.filter((d) => d.coreSwitchType === 'Unmanaged').length;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-900 border border-slate-700/80 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-bold text-slate-200">{data.name || data.payload?.category}</p>
          <p className="text-emerald-400 font-mono">
            Count: <span className="font-bold">{data.value}</span>
            {devices.length > 0 && (
              <span className="text-slate-400 text-[10px] ml-1.5">
                ({((data.value / devices.length) * 100).toFixed(1)}%)
              </span>
            )}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Hardware Asset & Device Breakdown
              <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                Recharts Analytics
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Live inventory distribution across PCs, Laptops, Core Fabric, L1/L2/L3 Switches, and Servers
            </p>
          </div>
        </div>

        {/* Quick Summary Pill Counters */}
        <div className="flex items-center gap-2 text-xs flex-wrap font-mono">
          <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
            Total Nodes: <strong className="text-emerald-400">{devices.length}</strong>
          </span>
          <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
            Switches: <strong className="text-cyan-400">{switches.length}</strong>
          </span>
          <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-300">
            PCs/Laptops:{' '}
            <strong className="text-teal-400">
              {devices.filter((d) => d.deviceType === 'workstation' || d.deviceType === 'laptop').length}
            </strong>
          </span>
        </div>
      </div>

      {/* Grid of Visualizations or Clean Empty State */}
      {devices.length === 0 ? (
        <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/60">
            <BarChart3 className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="text-sm font-bold text-slate-200">No Asset Data to Chart</div>
          <div className="text-xs text-slate-400 max-w-sm">
            All testing data has been cleared. Add hardware devices in the inventory table to see breakdown analytics and switch distribution.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Chart 1: Donut Distribution of Specific Device Types */}
        <div className="lg:col-span-6 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <PieIcon className="w-3.5 h-3.5 text-emerald-400" />
              Device Type Distribution
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{pieData.length} Types</span>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="#0f172a"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Breakdown Bar Chart */}
        <div className="lg:col-span-6 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              Equipment Volume by Category
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Live Count</span>
          </div>

          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 15, right: 15, left: -20, bottom: 25 }}>
                <XAxis
                  dataKey="category"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  interval={0}
                  angle={-12}
                  textAnchor="end"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={{ stroke: '#334155' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
