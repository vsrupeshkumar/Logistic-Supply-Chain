'use client';
import { memo, useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTraffic } from '@/lib/TrafficContext';
import { AlertTriangle, X, ChevronRight } from 'lucide-react';

interface Props {
  className?: string;
}

export const CongestionBanner = memo(function CongestionBanner({ className = '' }: Props) {
  const { zones, vehicles } = useTraffic();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Find the worst active zone that hasn't been dismissed
  const alertZone = useMemo(() => {
    return zones
      .filter(z => z.congestionLevel >= 70 && !dismissed.has(z.id))
      .sort((a, b) => b.congestionLevel - a.congestionLevel)[0] ?? null;
  }, [zones, dismissed]);

  // Vehicles affected (in-transit near the zone)
  const affectedVehicles = useMemo(() => {
    if (!alertZone?.location) return [];
    return vehicles.filter(v => {
      if (v.status !== 'in-transit') return false;
      const dx = v.location.lng - alertZone.location!.lng;
      const dy = v.location.lat - alertZone.location!.lat;
      return Math.sqrt(dx * dx + dy * dy) < 0.05;
    });
  }, [alertZone, vehicles]);

  const handleDismiss = useCallback(() => {
    if (alertZone) setDismissed(prev => new Set([...prev, alertZone.id]));
  }, [alertZone]);

  return (
    <AnimatePresence mode="wait">
      {alertZone && (
        <motion.div
          key={alertZone.id}
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: 0 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className={`relative overflow-hidden rounded-xl border border-amber-400/28 ${className}`}
          style={{
            background: 'linear-gradient(90deg, rgba(251,191,36,0.14), rgba(251,191,36,0.04) 40%, rgba(247,112,112,0.05))',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Sweep shimmer */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(400px 60px at 30% 50%, rgba(251,191,36,0.18), transparent 70%)',
              animation: 'banner-sweep 6s linear infinite',
            }}
          />

          <div className="relative flex items-center gap-3 px-4 py-3">
            {/* Icon with ring pulse */}
            <div className="relative flex-shrink-0">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center border border-amber-400/40"
                style={{ background: 'radial-gradient(circle at 40% 40%, rgba(251,191,36,0.55), rgba(251,191,36,0.08))' }}
              >
                <AlertTriangle className="w-5 h-5 text-amber-200" />
              </div>
              <div className="absolute inset-0 rounded-lg border border-amber-400/30 animate-ping opacity-50" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-amber-200 truncate">
                Peak congestion detected · {alertZone.area}
              </div>
              <div className="text-[11.5px] text-amber-300/80 mt-0.5">
                {affectedVehicles.length > 0
                  ? `AI rerouting ${affectedVehicles.length} vehicle${affectedVehicles.length > 1 ? 's' : ''} · congestion level ${alertZone.congestionLevel}%`
                  : `Congestion level ${alertZone.congestionLevel}% · monitoring…`
                }
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleDismiss}
                className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20 transition-colors"
              >
                Dismiss
              </button>
              <button className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-amber-400 text-[#1b1300] hover:bg-amber-300 transition-colors">
                View fleet <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Close */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-amber-400/60 hover:text-amber-300 hover:bg-amber-400/10 transition-colors ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

