import {
  LOW_FUEL_THRESHOLD,
  SERVICE_INTERVAL_DAYS,
  VEHICLE_STATUSES,
} from './constants.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const PLATE_PATTERN = /^(\d{3})\s*([A-Z]{2,3})\s*(\d{2})$/;

export function isElectric(vehicleClass) {
  return vehicleClass === 'electric';
}

// Only electric vehicles can be put on charge.
export function statusesForClass(vehicleClass) {
  return isElectric(vehicleClass)
    ? VEHICLE_STATUSES
    : VEHICLE_STATUSES.filter((status) => status !== 'charging');
}

export function energyLabel(vehicleClass) {
  return isElectric(vehicleClass) ? 'Battery' : 'Fuel';
}

export function isLowFuel(fuelLevel) {
  return fuelLevel < LOW_FUEL_THRESHOLD;
}

export function daysSince(isoDate, now = new Date()) {
  const start = new Date(`${isoDate}T00:00:00`);
  return Math.floor((now - start) / DAY_MS);
}

export function isServiceOverdue(lastServiceDate) {
  return daysSince(lastServiceDate) > SERVICE_INTERVAL_DAYS;
}

// Accepts "123abc02", "123 abc 02" etc. Returns "123 ABC 02" or null.
export function normalizePlate(input) {
  const match = String(input).trim().toUpperCase().match(PLATE_PATTERN);
  return match ? `${match[1]} ${match[2]} ${match[3]}` : null;
}

export function todayIso(now = new Date()) {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}
