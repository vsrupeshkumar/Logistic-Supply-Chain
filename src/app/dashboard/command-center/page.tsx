'use client';
/**
 * Command Center — Full-screen intelligence view.
 * Three-column layout: Fleet Command | Live Map | Intelligence Panel.
 * All data sourced from existing TrafficContext — no new API calls.
 * Map component (RealTrafficMap) is rendered untouched in the center column.
 */
import { useState } from 'react';
import { SystemStatusBar } from '@/components/dashboard/SystemStatusBar';
import { CongestionBanner } from '@/components/dashboard/CongestionBanner';
import { FleetCommandPanel } from '@/components/dashboard/FleetCommandPanel';
import { IntelligencePanel } from '@/components/intelligence/IntelligencePanel';
import { RealTrafficMap } from '@/components/visualization/RealTrafficMap';

type ViewMode = 'overview' | 'fleet' | 'live-map' | 'replay';

export default function CommandCenterPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('live-map');

  return (
    /*
     * -mx-8 -mt-8 -mb-32 escapes the p-8 / pb-32 of the parent motion.div
     * without modifying that shared layout. h-screen fills the viewport.
     */
    <div
      className="-mx-8 -mt-8 -mb-32 flex flex-col overflow-hidden"
      style={{
        height: '100vh',
        background:
          'radial-gradient(1200px 700px at 18% -5%, rgba(34,211,238,0.09), transparent 60%), ' +
          'radial-gradient(1000px 600px at 88% 0%, rgba(74,222,128,0.06), transparent 55%), ' +
          'radial-gradient(900px 500px at 55% 110%, rgba(167,139,250,0.07), transparent 60%), ' +
          'linear-gradient(180deg,#05070c 0%,#06080f 60%,#05070c 100%)',
      }}
    >
      {/* ── Top Status Bar ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-0">
        <SystemStatusBar
          activeView={viewMode}
          onViewChange={setViewMode}
        />
      </div>

      {/* ── Congestion Banner (conditional) ────────────────────────────── */}
      <div className="flex-shrink-0 px-4 pt-3">
        <CongestionBanner />
      </div>

      {/* ── Main 3-column grid ──────────────────────────────────────────── */}
      <div className="flex-1 grid px-4 pb-4 pt-3 gap-3 min-h-0" style={{ gridTemplateColumns: '320px 1fr 360px' }}>

        {/* Left: Fleet Command */}
        <div
          className="rounded-2xl border border-white/10 overflow-hidden flex flex-col"
          style={{
            background: 'rgba(14,19,33,0.72)',
            backdropFilter: 'blur(22px) saturate(135%)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 60px -30px rgba(0,0,0,0.9)',
          }}
        >
          <FleetCommandPanel className="h-full" />
        </div>

        {/* Center: Live Map (existing component, unmodified) */}
        <div className="rounded-2xl border border-white/10 overflow-hidden relative min-h-0 h-full [&>div]:h-full">
          <RealTrafficMap vehicleFilter="all" showIncidents={true} />
        </div>

        {/* Right: Intelligence */}
        <div
          className="rounded-2xl border border-white/10 overflow-hidden flex flex-col"
          style={{
            background: 'rgba(14,19,33,0.72)',
            backdropFilter: 'blur(22px) saturate(135%)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 60px -30px rgba(0,0,0,0.9)',
          }}
        >
          <IntelligencePanel className="h-full" />
        </div>
      </div>

      {/* CSS for the banner sweep animation — scoped here, additive only */}
      <style jsx global>{`
        @keyframes banner-sweep {
          0%   { background-position-x: -200px; }
          100% { background-position-x: calc(100% + 200px); }
        }
      `}</style>
    </div>
  );
}

