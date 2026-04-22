'use client';
import { memo, useMemo, useState, useCallback } from 'react';
import { useTraffic } from '@/lib/TrafficContext';
import {
  getVehicleSpeed,
  getVehicleRiskScore,
  getTransitCount,
  getIdlePercentage,
  getRefuelingCount,
  getMaintenanceCount,
} from '@/lib/derived-state/vehicleMetrics';
import type { Vehicle } from '@/lib/types';
import { Search, Truck, Car, Package, AlertTriangle, Fuel, Zap } from 'lucide-react';

type TabFilter = 'all' | 'truck' | 'car' | 'van';

const STATUS_STYLE: Record<string, string> = {
  'in-transit': 'text-cyan-400',
  'active':     'text-cyan-400',
  'idle':       'text-white/50',
  'refueling':  'text-amber-400',
  'maintenance':'text-red-400',
  'loading':    'text-blue-400',
  'unloading':  'text-blue-400',
};

const STATUS_LABEL: Record<string, string> = {
  'in-transit': 'TRANSIT',
  'active':     'ACTIVE',
  'idle':       'IDLE',
  'refueling':  'REFUEL',
  'maintenance':'MAINT',
  'loading':    'LOADING',
  'unloading':  'UNLOAD',
};

const TYPE_ICON_CLASS: Record<string, string> = {
  truck: 'bg-blue-400/15 border-blue-400/30 text-blue-300',
  van:   'bg-violet-400/15 border-violet-400/30 text-violet-300',
  car:   'bg-green-400/15 border-green-400/30 text-green-300',
};

function VehicleTypeIcon({ type }: { type: string }) {
  const cls = TYPE_ICON_CLASS[type] ?? 'bg-white/10 border-white/20 text-white/60';
  const Icon = type === 'truck' ? Truck : type === 'van' ? Package : Car;
  return (
    <span className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${cls}`}>
      <Icon className="w-4 h-4" />
    </span>
  );
}

// ── Detail drawer shown for the selected vehicle ──────────────────────────────
const VehicleDetailDrawer = memo(function VehicleDetailDrawer({ vehicle }: { vehicle: Vehicle }) {
  const speed = getVehicleSpeed(vehicle);
  const risk  = getVehicleRiskScore(vehicle);

  return (
    <div className="mt-2 rounded-xl border border-cyan-400/25 bg-cyan-400/[0.06] px-3 py-3 text-[11px]">
      <div className="flex items-center gap-2 mb-2.5 text-cyan-300 font-bold uppercase tracking-wider text-[10px]">
        <Zap className="w-3 h-3" /> Live Telemetry
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 font-mono">
        {[
          ['Speed',   `${speed} km/h`],
          ['Status',  STATUS_LABEL[vehicle.status] ?? vehicle.status],
          ['Fuel',    `${Math.round(vehicle.fuel)}%`],
          ['Load',    vehicle.cargoWeight ? `${vehicle.cargoWeight} t` : '—'],
          ['Type',    vehicle.type.toUpperCase()],
          ['Eff.',    `${vehicle.efficiency}%`],
        ].map(([k, v]) => (
          <>
            <dt key={`k-${k}`} className="text-white/30 text-[9.5px] uppercase tracking-wider self-center">{k}</dt>
            <dd key={`v-${k}`} className="text-white/85 m-0">{v}</dd>
          </>
        ))}
        <dt className="text-white/30 text-[9.5px] uppercase tracking-wider self-center">Risk</dt>
        <dd className="m-0">
          <div className="flex items-center gap-2">
            <span className={`font-bold ${risk > 0.6 ? 'text-red-400' : risk > 0.3 ? 'text-amber-400' : 'text-green-400'}`}>
              {risk.toFixed(2)}
            </span>
            <div className="flex-1 h-[3px] bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${risk > 0.6 ? 'bg-red-400' : risk > 0.3 ? 'bg-amber-400' : 'bg-green-400'}`}
                style={{ width: `${risk * 100}%` }}
              />
            </div>
          </div>
        </dd>
      </dl>
    </div>
  );
});

// ── Single vehicle row ────────────────────────────────────────────────────────
interface VehicleRowProps {
  vehicle: Vehicle;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const VehicleRow = memo(function VehicleRow({ vehicle, isSelected, onSelect }: VehicleRowProps) {
  const speed = getVehicleSpeed(vehicle);

  return (
    <div>
      <button
        onClick={() => onSelect(vehicle.id)}
        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border transition-all text-left ${
          isSelected
            ? 'border-cyan-400/40 bg-cyan-400/[0.08] shadow-[inset_0_0_0_1px_rgba(34,211,238,0.12)]'
            : 'border-white/6 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/12'
        }`}
      >
        <VehicleTypeIcon type={vehicle.type} />
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[12px] font-bold text-white/90 truncate">{vehicle.name}</div>
          <div className="text-[10px] text-white/35 truncate">{vehicle.number}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`font-mono text-[10px] font-bold uppercase ${STATUS_STYLE[vehicle.status] ?? 'text-white/50'}`}>
            {STATUS_LABEL[vehicle.status] ?? vehicle.status}
          </div>
          <div className="font-mono text-[10px] text-white/30">{speed} km/h</div>
        </div>
      </button>
      {isSelected && <VehicleDetailDrawer vehicle={vehicle} />}
    </div>
  );
});

// ── Main panel ────────────────────────────────────────────────────────────────
interface Props {
  className?: string;
}

export const FleetCommandPanel = memo(function FleetCommandPanel({ className = '' }: Props) {
  const { vehicles } = useTraffic();
  const [tab, setTab] = useState<TabFilter>('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const transitCount = useMemo(() => getTransitCount(vehicles), [vehicles]);
  const idlePct      = useMemo(() => getIdlePercentage(vehicles), [vehicles]);
  const refuelCount  = useMemo(() => getRefuelingCount(vehicles), [vehicles]);
  const maintCount   = useMemo(() => getMaintenanceCount(vehicles), [vehicles]);

  const filtered = useMemo(() => {
    let list = vehicles;
    if (tab !== 'all') list = list.filter(v => v.type === tab);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.number.toLowerCase().includes(q) ||
        v.status.toLowerCase().includes(q)
      );
    }
    return list;
  }, [vehicles, tab, query]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(prev => (prev === id ? null : id));
  }, []);

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all',   label: `All · ${vehicles.length}` },
    { key: 'truck', label: 'Heavy' },
    { key: 'van',   label: 'Van' },
    { key: 'car',   label: 'Car' },
  ];

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-sm bg-gradient-to-b from-cyan-400 to-blue-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-white/80">Fleet Command</span>
        </div>
        <span className="font-mono text-[10px] text-white/30">{vehicles.length} UNITS</span>
      </div>

      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(148,163,184,0.15) transparent' }}
      >
        {/* Tab switcher */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/6">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`py-1.5 rounded-md text-[10.5px] font-bold transition-colors ${
                tab === t.key
                  ? 'bg-cyan-400/15 text-cyan-300 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.2)]'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Summary chips */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: 'Transit', value: transitCount,  color: 'text-cyan-400' },
            { label: 'Idle',    value: `${idlePct}%`, color: 'text-white/60' },
            { label: 'Refuel',  value: refuelCount,   color: 'text-amber-400' },
            { label: 'Maint',   value: maintCount,    color: 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="py-1.5 px-1 rounded-lg border border-white/6 bg-white/[0.02] text-center">
              <div className={`font-mono text-base font-bold ${color}`}>{value}</div>
              <div className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search vehicles, status…"
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/8 text-[11.5px] font-mono text-white/80 placeholder:text-white/20 outline-none focus:border-white/15 transition-colors"
          />
        </div>

        {/* Vehicle list */}
        <div className="space-y-1.5">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-white/20 text-xs font-mono">No vehicles match</div>
          ) : (
            filtered.map(v => (
              <VehicleRow
                key={v.id}
                vehicle={v}
                isSelected={selectedId === v.id}
                onSelect={handleSelect}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
});
