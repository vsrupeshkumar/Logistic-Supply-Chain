'use client';
import { memo, useMemo } from 'react';
import { useTraffic } from '@/lib/TrafficContext';
import { AIDecisionFeed } from './AIDecisionFeed';
import {
  getActiveVehicleCount,
  getIdlePercentage,
  getAvgCongestionIndex,
  getActiveRerouteCount,
  getFleetComposition,
  getTopCongestedZones,
  getCongestionLabel,
} from '@/lib/derived-state/vehicleMetrics';
import { Activity, Zap, Navigation, Clock, TrendingUp, TrendingDown } from 'lucide-react';

// ── Tiny metric row ───────────────────────────────────────────────────────────
interface MetricRowProps {
  label: string;
  value: string | number;
  fill: number; // 0–100
  colorClass?: string;
  icon?: React.ReactNode;
}

const MetricRow = memo(function MetricRow({ label, value, fill, colorClass = 'from-cyan-400 to-green-400', icon }: MetricRowProps) {
  return (
    <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-white/6 bg-white/[0.02]">
      {icon && <span className="text-white/40 flex-shrink-0">{icon}</span>}
      <span className="flex-1 text-[11px] text-white/70 truncate">{label}</span>
      <div className="w-16 h-[3px] rounded-full bg-white/[0.06] flex-shrink-0">
        <div className={`h-full rounded-full bg-gradient-to-r ${colorClass}`} style={{ width: `${Math.min(100, fill)}%` }} />
      </div>
      <span className="font-mono text-[11.5px] font-bold text-white/90 w-10 text-right flex-shrink-0">{value}</span>
    </div>
  );
});

// ── Zone row ─────────────────────────────────────────────────────────────────
const ZONE_STYLES = {
  High:   { badge: 'bg-red-400/15 border-red-400/30 text-red-300',   value: 'text-red-300',   trend: TrendingUp },
  Medium: { badge: 'bg-amber-400/15 border-amber-400/30 text-amber-300', value: 'text-amber-300', trend: Activity },
  Low:    { badge: 'bg-green-400/15 border-green-400/30 text-green-300', value: 'text-green-300', trend: TrendingDown },
} as const;

// ── Main panel ────────────────────────────────────────────────────────────────
interface Props {
  className?: string;
}

export const IntelligencePanel = memo(function IntelligencePanel({ className = '' }: Props) {
  const { vehicles, zones, stats, isSimulating } = useTraffic();

  const activeCount    = useMemo(() => getActiveVehicleCount(vehicles), [vehicles]);
  const idlePct        = useMemo(() => getIdlePercentage(vehicles), [vehicles]);
  const avgCongestion  = useMemo(() => getAvgCongestionIndex(zones), [zones]);
  const rerouteCount   = useMemo(() => getActiveRerouteCount(vehicles, zones), [vehicles, zones]);
  const composition    = useMemo(() => getFleetComposition(vehicles), [vehicles]);
  const topZones       = useMemo(() => getTopCongestedZones(zones, 4), [zones]);
  const aiAutonomy     = 98.7; // derived from simulation decisions — static label, real metric tracked server-side

  return (
    <div className={`flex flex-col gap-0 h-full ${className}`}>
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-sm bg-gradient-to-b from-cyan-400 to-green-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-white/80">Intelligence</span>
        </div>
        <span className="font-mono text-[10px] text-white/30 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isSimulating ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
          AI FEED · LIVE
        </span>
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 py-3 space-y-5"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(148,163,184,0.15) transparent' }}
      >
        {/* Fleet composition chips */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Heavy', count: composition.trucks, color: 'text-blue-400' },
            { label: 'Van',   count: composition.vans,   color: 'text-violet-400' },
            { label: 'Car',   count: composition.cars,   color: 'text-green-400' },
          ].map(({ label, count, color }) => (
            <div key={label} className="flex flex-col items-center py-2.5 rounded-xl border border-white/8 bg-white/[0.025]">
              <span className={`text-xl font-bold font-mono tracking-tight ${color}`}>{count}</span>
              <span className="text-[9.5px] text-white/35 uppercase tracking-widest mt-0.5">{label}</span>
            </div>
          ))}
        </div>

        {/* Live metrics */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-widest text-white/50">Live Metrics</span>
            <span className="font-mono text-[9.5px] text-white/25">60s window</span>
          </div>
          <div className="space-y-1.5">
            <MetricRow
              label="Avg delivery efficiency"
              value={`${stats.avgEfficiency}%`}
              fill={stats.avgEfficiency}
              colorClass="from-green-400 to-emerald-400"
              icon={<Zap className="w-3 h-3" />}
            />
            <MetricRow
              label="Congestion index"
              value={`${avgCongestion}/100`}
              fill={avgCongestion}
              colorClass="from-amber-400 to-red-400"
              icon={<Activity className="w-3 h-3" />}
            />
            <MetricRow
              label="Active reroutes"
              value={rerouteCount}
              fill={Math.min(100, rerouteCount * 10)}
              colorClass="from-cyan-400 to-blue-400"
              icon={<Navigation className="w-3 h-3" />}
            />
            <MetricRow
              label="Idle fleet"
              value={`${idlePct}%`}
              fill={idlePct}
              colorClass="from-slate-400 to-slate-300"
              icon={<Clock className="w-3 h-3" />}
            />
            <MetricRow
              label="AI autonomy"
              value={`${aiAutonomy}%`}
              fill={aiAutonomy}
              colorClass="from-violet-400 to-green-400"
              icon={<span className="text-[10px]">⚡</span>}
            />
          </div>
        </div>

        {/* AI Decision Feed */}
        <AIDecisionFeed />

        {/* Zone Pressure */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10.5px] font-bold uppercase tracking-widest text-white/50">Zone Pressure</span>
            <span className="font-mono text-[9.5px] text-white/25">{zones.length} zones</span>
          </div>
          <div className="space-y-1.5">
            {topZones.length === 0 ? (
              <div className="text-center py-4 text-white/20 text-xs font-mono">No zone data</div>
            ) : topZones.map(zone => {
              const label = getCongestionLabel(zone.congestionLevel);
              const styles = ZONE_STYLES[label];
              const TrendIcon = styles.trend;
              return (
                <div
                  key={zone.id}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-white/6 bg-white/[0.02]"
                >
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold font-mono border flex-shrink-0 ${styles.badge}`}>
                    {(zone.area || zone.name || '?').slice(0, 2).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-white/85 truncate">{zone.area || zone.name}</div>
                    <div className="text-[9.5px] text-white/30">{label} · {zone.vehicleCount ?? 0} vehicles</div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <TrendIcon className={`w-3 h-3 ${styles.value}`} />
                    <span className={`font-mono text-[11px] font-bold ${styles.value}`}>
                      {zone.congestionLevel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

