/**
 * Pure computed accessors over existing simulation state.
 * No side effects, no API calls — only derives from what TrafficContext already provides.
 */
import type { Vehicle, TrafficZone } from '@/lib/types';

export function getActiveVehicleCount(vehicles: Vehicle[]): number {
  return vehicles.filter(v => v.status === 'in-transit' || v.status === 'active').length;
}

export function getIdlePercentage(vehicles: Vehicle[]): number {
  if (!vehicles.length) return 0;
  const idle = vehicles.filter(v => v.status === 'idle').length;
  return Math.round((idle / vehicles.length) * 100);
}

export function getRefuelingCount(vehicles: Vehicle[]): number {
  return vehicles.filter(v => v.status === 'refueling').length;
}

export function getMaintenanceCount(vehicles: Vehicle[]): number {
  return vehicles.filter(v => v.status === 'maintenance').length;
}

export function getTransitCount(vehicles: Vehicle[]): number {
  return vehicles.filter(v => v.status === 'in-transit').length;
}

/** Derived speed — uses the speed field if available, otherwise 0 */
export function getVehicleSpeed(vehicle: Vehicle): number {
  return Math.round(vehicle.speed ?? 0);
}

/**
 * Risk score 0–1 based on:
 *   - low fuel (≤20%) adds 0.3
 *   - low efficiency adds up to 0.3
 *   - vehicle is in maintenance adds 0.4
 */
export function getVehicleRiskScore(vehicle: Vehicle): number {
  let score = 0;
  if (vehicle.fuel <= 20) score += 0.3;
  if (vehicle.efficiency < 70) score += (70 - vehicle.efficiency) / 70 * 0.3;
  if (vehicle.status === 'maintenance') score += 0.4;
  return Math.min(1, score);
}

export type CongestionLabel = 'Low' | 'Medium' | 'High';

export function getCongestionLabel(level: number): CongestionLabel {
  if (level >= 70) return 'High';
  if (level >= 40) return 'Medium';
  return 'Low';
}

export function getAvgCongestionIndex(zones: TrafficZone[]): number {
  if (!zones.length) return 0;
  return Math.round(zones.reduce((sum, z) => sum + z.congestionLevel, 0) / zones.length);
}

/** Rough active-reroutes count: in-transit vehicles inside a High-congestion zone */
export function getActiveRerouteCount(vehicles: Vehicle[], zones: TrafficZone[]): number {
  const highZones = zones.filter(z => z.congestionLevel >= 70);
  if (!highZones.length) return 0;
  return vehicles.filter(v => {
    if (v.status !== 'in-transit') return false;
    return highZones.some(z => {
      if (!z.location) return false;
      const dx = v.location.lng - z.location!.lng;
      const dy = v.location.lat - z.location!.lat;
      return Math.sqrt(dx * dx + dy * dy) < 0.02; // ~2 km radius
    });
  }).length;
}

/** Vehicle fleet composition counts */
export function getFleetComposition(vehicles: Vehicle[]) {
  return {
    trucks: vehicles.filter(v => v.type === 'truck').length,
    vans: vehicles.filter(v => v.type === 'van').length,
    cars: vehicles.filter(v => v.type === 'car').length,
  };
}

/** Top N most congested zones */
export function getTopCongestedZones(zones: TrafficZone[], n = 4): TrafficZone[] {
  return [...zones].sort((a, b) => b.congestionLevel - a.congestionLevel).slice(0, n);
}


