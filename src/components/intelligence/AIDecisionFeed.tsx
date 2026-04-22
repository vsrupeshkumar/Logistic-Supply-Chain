'use client';
import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTraffic } from '@/lib/TrafficContext';
import {
  diffVehicleStates,
  mergeEvents,
  formatRelativeTime,
  EVENT_TYPE_LABELS,
  type AIEvent,
  type AIEventType,
} from '@/lib/formatters/eventLogger';

const TYPE_COLORS: Record<AIEventType, string> = {
  reroute:     'text-cyan-400 bg-cyan-400/10 border-cyan-400/25',
  refuel:      'text-amber-400 bg-amber-400/10 border-amber-400/25',
  maintenance: 'text-red-400 bg-red-400/10 border-red-400/25',
  dispatch:    'text-green-400 bg-green-400/10 border-green-400/25',
  hold:        'text-slate-400 bg-slate-400/10 border-slate-400/20',
  prioritize:  'text-violet-400 bg-violet-400/10 border-violet-400/25',
  arrival:     'text-green-400 bg-green-400/10 border-green-400/25',
};

const DOT_COLORS: Record<AIEventType, string> = {
  reroute:     'bg-cyan-400 shadow-cyan-400/30',
  refuel:      'bg-amber-400 shadow-amber-400/30',
  maintenance: 'bg-red-400 shadow-red-400/30',
  dispatch:    'bg-green-400 shadow-green-400/30',
  hold:        'bg-slate-400',
  prioritize:  'bg-violet-400 shadow-violet-400/30',
  arrival:     'bg-green-400 shadow-green-400/30',
};

interface FeedItemProps {
  event: AIEvent;
}

const FeedItem = memo(function FeedItem({ event }: FeedItemProps) {
  const [relTime, setRelTime] = useState(() => formatRelativeTime(event.timestamp));

  // Update relative timestamp every 5 s
  useEffect(() => {
    const id = setInterval(() => setRelTime(formatRelativeTime(event.timestamp)), 5000);
    return () => clearInterval(id);
  }, [event.timestamp]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="relative pl-7 pr-3 py-2.5 rounded-lg border border-white/8 bg-white/[0.025] hover:bg-white/[0.04] transition-colors"
    >
      {/* Left dot */}
      <span className={`absolute left-2.5 top-3.5 w-2 h-2 rounded-full shadow-[0_0_0_3px_rgba(0,0,0,0.3)] ${DOT_COLORS[event.type]}`} />

      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[11px] font-bold text-white/90">{event.vehicleName}</span>
          <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border ${TYPE_COLORS[event.type]}`}>
            {EVENT_TYPE_LABELS[event.type]}
          </span>
        </div>
        <span className="font-mono text-[10px] text-white/30">{relTime}</span>
      </div>
      <p className="text-[11.5px] text-white/70 leading-snug">{event.message}</p>
      {event.confidence !== undefined && (
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[9px] text-white/30 font-mono uppercase tracking-wide">Conf</span>
          <div className="flex-1 h-[3px] rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-green-400"
              style={{ width: `${event.confidence}%` }}
            />
          </div>
          <span className="text-[10px] text-white/60 font-mono font-bold">{event.confidence}%</span>
        </div>
      )}
    </motion.div>
  );
});

interface Props {
  className?: string;
}

export const AIDecisionFeed = memo(function AIDecisionFeed({ className = '' }: Props) {
  const { vehicles, zones } = useTraffic();
  const [events, setEvents] = useState<AIEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const prevVehiclesRef = useRef<typeof vehicles>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  // Detect transitions on every vehicle update
  useEffect(() => {
    if (isPausedRef.current) return;
    const prev = prevVehiclesRef.current;
    if (prev.length > 0) {
      const newEvents = diffVehicleStates(prev, vehicles, zones);
      if (newEvents.length) {
        setEvents(cur => mergeEvents(cur, newEvents));
        // Auto-scroll to top (newest)
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
    prevVehiclesRef.current = vehicles;
  }, [vehicles, zones]);

  const handleClear = useCallback(() => setEvents([]), []);
  const handlePause = useCallback(() => setIsPaused(p => !p), []);

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3.5 rounded-sm bg-gradient-to-b from-cyan-400 to-green-400" />
          <span className="text-[10.5px] font-bold uppercase tracking-widest text-white/70">AI Decision Feed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-white/30 px-1.5 py-0.5 rounded bg-white/5 border border-white/8">
            {events.length} events
          </span>
          <button
            onClick={handlePause}
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${isPaused ? 'text-amber-400 border-amber-400/30 bg-amber-400/10' : 'text-white/40 border-white/10 hover:text-white/60'}`}
          >
            {isPaused ? 'PAUSED' : 'PAUSE'}
          </button>
          <button
            onClick={handleClear}
            className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-white/10 text-white/40 hover:text-white/60 transition-colors"
          >
            CLEAR
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex flex-col gap-1.5 overflow-y-auto pr-0.5"
        style={{ maxHeight: '340px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(148,163,184,0.2) transparent' }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {events.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8 text-center text-white/20 text-xs font-mono"
            >
              Monitoring state transitions…
            </motion.div>
          ) : (
            events.map(ev => <FeedItem key={ev.id} event={ev} />)
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});


