'use client';
import { memo, useMemo, useState, useEffect } from 'react';
import { useTraffic } from '@/lib/TrafficContext';
import { getActiveVehicleCount } from '@/lib/derived-state/vehicleMetrics';
import { Activity, Bell, Map as MapIcon, LayoutDashboard, PlaySquare, BarChart2 } from 'lucide-react';

type ViewMode = 'overview' | 'fleet' | 'live-map' | 'replay';

const VIEW_MODES: { key: ViewMode; label: string; icon: React.ElementType }[] = [
  { key: 'overview',  label: 'OVERVIEW',  icon: LayoutDashboard },
  { key: 'fleet',     label: 'FLEET',     icon: BarChart2 },
  { key: 'live-map',  label: 'LIVE MAP',  icon: MapIcon },
  { key: 'replay',    label: 'REPLAY',    icon: PlaySquare },
];

interface Props {
  activeView?: ViewMode;
  onViewChange?: (view: ViewMode) => void;
  className?: string;
}

export const SystemStatusBar = memo(function SystemStatusBar({
  activeView = 'live-map',
  onViewChange,
  className = '',
}: Props) {
  const { vehicles, zones, incidents, isSimulating, lastSyncTime, stats } = useTraffic();
  const [latency, setLatency] = useState(142);
  const [alertCount, setAlertCount] = useState(0);

  const activeCount = useMemo(() => getActiveVehicleCount(vehicles), [vehicles]);

  // Simulated latency fluctuation — derived from sync activity, no new API calls
  useEffect(() => {
    const id = setInterval(() => {
      setLatency(120 + Math.round(Math.random() * 60));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Alert count = high-congestion zones + incidents
  useEffect(() => {
    const highZones = zones.filter(z => z.congestionLevel >= 70).length;
    setAlertCount(highZones + incidents.length);
  }, [zones, incidents]);

  const healthColor = latency < 150 ? 'text-green-400' : latency < 250 ? 'text-amber-400' : 'text-red-400';
  const healthLabel = latency < 150 ? '●●●●● NOMINAL' : latency < 250 ? '●●●○○ DEGRADED' : '●●○○○ CRITICAL';

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-white/10 bg-[rgba(20,28,48,0.65)] backdrop-blur-xl ${className}`}
      style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 18px 60px -30px rgba(0,0,0,0.8)' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(74,222,128,0.55), transparent 60%), linear-gradient(135deg,#0b1220,#0a2a2f)',
            border: '1px solid rgba(74,222,128,0.3)',
            boxShadow: '0 0 0 1px rgba(74,222,128,0.12), 0 6px 20px -6px rgba(74,222,128,0.3)',
          }}
        >
          <Activity className="w-4 h-4 text-green-400" />
        </div>
        <div className="leading-none">
          <div className="text-[11px] font-black tracking-widest text-white">TRAFFICMAXXERS</div>
          <div className="font-mono text-[9px] text-white/30 tracking-wide mt-0.5">CEPHEUS · LOGISTICS ENGINE</div>
        </div>
      </div>

      {/* Status pills */}
      <div className="flex items-center gap-2 flex-1 flex-wrap">
        {/* Running status */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-mono text-[11px] ${
          isSimulating
            ? 'bg-green-400/[0.08] border-green-400/25 text-green-300'
            : 'bg-amber-400/[0.08] border-amber-400/25 text-amber-300'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isSimulating ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
          {isSimulating ? 'SIMULATION RUNNING' : 'PAUSED'}
        </div>

        {[
          { label: 'TICK', value: <><span className="text-cyan-400 font-bold">3.3</span><span className="text-white/30 text-[9px]"> Hz</span></> },
          { label: 'AGENTS', value: <><span className="font-bold">{vehicles.length}</span><span className="text-green-400 font-bold"> · {activeCount} live</span></> },
          { label: 'ZONES', value: <span className="font-bold">{zones.length} / {zones.length}</span> },
          { label: 'INGEST', value: <span className="font-bold text-green-400">98.7%</span> },
          { label: 'P95 LAT', value: <><span className="font-bold">{latency}</span><span className="text-white/30 text-[9px]">ms</span></> },
          { label: 'HEALTH', value: <span className={`font-bold ${healthColor}`}>{healthLabel}</span> },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/8 bg-white/[0.025] font-mono text-[11px] text-white/70">
            <span className="text-white/30 text-[9px] uppercase tracking-wider">{label}</span>
            {value}
          </div>
        ))}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* View mode segmented control */}
        <div className="flex p-0.5 gap-0.5 rounded-lg border border-white/8 bg-white/[0.02]">
          {VIEW_MODES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onViewChange?.(key)}
              className={`px-2.5 py-1 rounded-md text-[10.5px] font-mono font-bold transition-colors ${
                activeView === key
                  ? 'bg-cyan-400/15 text-cyan-300 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.22)]'
                  : 'text-white/35 hover:text-white/60'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Alert bell */}
        <button className="relative w-8 h-8 rounded-lg border border-white/8 bg-white/[0.02] flex items-center justify-center text-white/60 hover:border-white/15 hover:text-white/80 transition-colors">
          <Bell className="w-4 h-4" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-[#05070c]">
              {Math.min(alertCount, 9)}
            </span>
          )}
        </button>

        {/* Operator chip */}
        <div className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-white/8 bg-white/[0.02]">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-green-400 flex items-center justify-center text-[10px] font-black text-[#05131a]">
            RK
          </div>
          <div className="leading-none">
            <div className="text-[11px] font-bold text-white/85">Rupesh K.</div>
            <div className="font-mono text-[9px] text-white/30">OPERATOR · BLR-01</div>
          </div>
        </div>
      </div>
    </div>
  );
});

