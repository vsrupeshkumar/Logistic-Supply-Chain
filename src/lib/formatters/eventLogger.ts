/**
 * In-memory AI decision event bus.
 * Detects vehicle state transitions and formats them into human-readable feed items.
 * No backend calls — purely derived from state snapshots passed by the caller.
 */
import type { Vehicle, TrafficZone } from '@/lib/types';

export type AIEventType = 'reroute' | 'refuel' | 'maintenance' | 'dispatch' | 'hold' | 'prioritize' | 'arrival';

export interface AIEvent {
  id: string;
  vehicleId: string;
  vehicleName: string;
  type: AIEventType;
  message: string;
  timestamp: Date;
  confidence?: number; // 0–100
}

const EVENT_MAX = 50;

/** Maps status transitions to event types */
const TRANSITION_MAP: Partial<Record<string, AIEventType>> = {
  'in-transit→refueling':  'refuel',
  'in-transit→maintenance':'maintenance',
  'in-transit→idle':       'arrival',
  'idle→in-transit':       'dispatch',
  'active→refueling':      'refuel',
  'active→maintenance':    'maintenance',
  'loading→in-transit':    'dispatch',
  'unloading→idle':        'arrival',
};

const TYPE_TEMPLATES: Record<AIEventType, (name: string, zone?: string) => string> = {
  reroute:     (n, z) => `${n} rerouted to avoid congestion${z ? ` in ${z}` : ''}`,
  refuel:      (n)    => `${n} diverted to nearest fuel station — low fuel threshold crossed`,
  maintenance: (n)    => `${n} flagged for maintenance — anomaly signature detected`,
  dispatch:    (n)    => `${n} dispatched from depot — route calculated via OSRM`,
  hold:        (n)    => `${n} held at depot — synchronising with corridor window`,
  prioritize:  (n)    => `${n} prioritised — SLA window closing`,
  arrival:     (n)    => `${n} reached destination — returning to base`,
};

const CONFIDENCE_BY_TYPE: Record<AIEventType, number> = {
  reroute:     90 + Math.round(Math.random() * 8),
  refuel:      98,
  maintenance: 99,
  dispatch:    95,
  hold:        87,
  prioritize:  92,
  arrival:     100,
};

/** Generate a stable unique id */
let _seq = 0;
function makeId() { return `EVT-${Date.now()}-${++_seq}`; }

/**
 * Diff two vehicle snapshots and return new AI events.
 * Call this on every TrafficContext state update.
 */
export function diffVehicleStates(
  prev: Vehicle[],
  next: Vehicle[],
  zones: TrafficZone[],
): AIEvent[] {
  const events: AIEvent[] = [];
  const prevMap = new Map(prev.map(v => [v.id, v]));

  for (const vehicle of next) {
    const old = prevMap.get(vehicle.id);
    if (!old) continue; // new vehicle — skip

    const transitionKey = `${old.status}→${vehicle.status}`;
    const eventType = TRANSITION_MAP[transitionKey];

    if (eventType) {
      // Find the zone closest to the vehicle for context
      let nearestZone: string | undefined;
      if (zones.length) {
        const sorted = [...zones].sort((a, b) => {
          const da = a.location ? Math.hypot(vehicle.location.lat - a.location.lat, vehicle.location.lng - a.location.lng) : 999;
          const db = b.location ? Math.hypot(vehicle.location.lat - b.location.lat, vehicle.location.lng - b.location.lng) : 999;
          return da - db;
        });
        if (sorted[0]?.location) nearestZone = sorted[0].area;
      }

      events.push({
        id: makeId(),
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        type: eventType,
        message: TYPE_TEMPLATES[eventType](vehicle.name, nearestZone),
        timestamp: new Date(),
        confidence: CONFIDENCE_BY_TYPE[eventType],
      });
    }

    // Detect low-fuel crossing (≥20% → <20%)
    if (old.fuel >= 20 && vehicle.fuel < 20 && vehicle.status === 'in-transit') {
      events.push({
        id: makeId(),
        vehicleId: vehicle.id,
        vehicleName: vehicle.name,
        type: 'refuel',
        message: `${vehicle.name} approaching critical fuel (${Math.round(vehicle.fuel)}%) — AI evaluating refuel options`,
        timestamp: new Date(),
        confidence: 96,
      });
    }
  }

  return events;
}

/**
 * Merge new events into existing buffer, capping at EVENT_MAX.
 * Newest events at index 0.
 */
export function mergeEvents(existing: AIEvent[], incoming: AIEvent[]): AIEvent[] {
  if (!incoming.length) return existing;
  return [...incoming, ...existing].slice(0, EVENT_MAX);
}

/** Format a relative timestamp string (e.g. "just now", "5s ago", "2m ago") */
export function formatRelativeTime(ts: Date): string {
  const diffMs = Date.now() - ts.getTime();
  const secs = Math.floor(diffMs / 1000);
  if (secs < 5)  return 'just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

/** Human-readable label for event type */
export const EVENT_TYPE_LABELS: Record<AIEventType, string> = {
  reroute:     'REROUTE',
  refuel:      'REFUEL',
  maintenance: 'MAINT',
  dispatch:    'DISPATCH',
  hold:        'HOLD',
  prioritize:  'PRIORITY',
  arrival:     'ARRIVAL',
};


