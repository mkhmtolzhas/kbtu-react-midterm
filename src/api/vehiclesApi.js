import {
  MIN_FUEL_TO_RENT,
  PAGE_SIZES,
  SORT_FIELDS,
  STATUS_LABELS,
  VEHICLE_STATUSES,
} from '../utils/constants.js';
import { validateVehicle } from '../utils/validation.js';
import { isLowFuel, normalizePlate, statusesForClass } from '../utils/vehicle.js';
import { ApiError, simulateNetwork } from './network.js';
import { loadDb, saveDb } from './storage.js';

const SORTABLE_FIELDS = SORT_FIELDS.map((field) => field.value);
const HISTORY_LIMIT = 10;
const MAX_PAGE_SIZE = Math.max(...PAGE_SIZES);

// The API hands out copies so the UI can never mutate the "database" by accident.
const clone = (value) => structuredClone(value);

function matchesSearch(vehicle, search) {
  const tokens = search.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = [
    vehicle.plate,
    vehicle.plate.replaceAll(' ', ''),
    vehicle.brand,
    vehicle.model,
  ].join(' ').toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}

function compareVehicles(sortBy, sortDir) {
  const direction = sortDir === 'desc' ? -1 : 1;
  return (a, b) => {
    const left = a[sortBy];
    const right = b[sortBy];
    const result = typeof left === 'string' ? left.localeCompare(right) : left - right;
    // Tie-break by id so pagination is stable for equal values.
    return result !== 0 ? result * direction : a.id.localeCompare(b.id);
  };
}

/**
 * Server-side search, filtering, sorting and pagination.
 * @returns {Promise<{ items: object[], total: number, page: number, pageSize: number }>}
 */
export async function listVehicles(params = {}, { signal } = {}) {
  await simulateNetwork(signal);

  const {
    search = '',
    status = 'all',
    vehicleClass = 'all',
    district = 'all',
    sortBy = 'plate',
    sortDir = 'asc',
  } = params;
  const page = Math.max(1, Math.trunc(Number(params.page) || 1));
  const pageSize = Math.min(Math.max(1, Math.trunc(Number(params.pageSize) || PAGE_SIZES[0])), MAX_PAGE_SIZE);
  const sortField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'plate';

  const filtered = loadDb().vehicles.filter((vehicle) =>
    (status === 'all' || vehicle.status === status)
    && (vehicleClass === 'all' || vehicle.class === vehicleClass)
    && (district === 'all' || vehicle.district === district)
    && matchesSearch(vehicle, search));

  const sorted = [...filtered].sort(compareVehicles(sortField, sortDir));
  const start = (page - 1) * pageSize;

  return {
    items: clone(sorted.slice(start, start + pageSize)),
    total: filtered.length,
    page,
    pageSize,
  };
}

export async function getVehicle(id, { signal } = {}) {
  await simulateNetwork(signal);
  const vehicle = loadDb().vehicles.find((item) => item.id === id);
  if (!vehicle) throw new ApiError(`Vehicle "${id}" was not found.`, { status: 404 });
  return clone(vehicle);
}

/** Counts per status for the whole fleet (feeds the summary tiles on the list page). */
export async function getFleetStats({ signal } = {}) {
  await simulateNetwork(signal);
  const { vehicles } = loadDb();
  const byStatus = Object.fromEntries(VEHICLE_STATUSES.map((status) => [status, 0]));
  let lowFuel = 0;
  for (const vehicle of vehicles) {
    byStatus[vehicle.status] += 1;
    if (isLowFuel(vehicle.fuelLevel)) lowFuel += 1;
  }
  return { total: vehicles.length, byStatus, lowFuel };
}

export async function createVehicle(data) {
  await simulateNetwork();
  const db = loadDb();

  const fieldErrors = validateVehicle(data);
  if (Object.keys(fieldErrors).length > 0) {
    throw new ApiError('Some fields are invalid.', { status: 422, fieldErrors });
  }

  const plate = normalizePlate(data.plate);
  if (db.vehicles.some((vehicle) => vehicle.plate === plate)) {
    throw new ApiError('A vehicle with this plate already exists.', {
      status: 409,
      fieldErrors: { plate: `${plate} is already registered in the fleet.` },
    });
  }

  const vehicle = {
    id: `veh-${String(db.nextId).padStart(4, '0')}`,
    plate,
    brand: data.brand,
    model: data.model.trim(),
    class: data.class,
    status: data.status,
    district: data.district,
    fuelLevel: Number(data.fuelLevel),
    mileageKm: Number(data.mileageKm),
    pricePerMinute: Number(data.pricePerMinute),
    year: Number(data.year),
    lastServiceDate: data.lastServiceDate,
    notes: String(data.notes ?? '').trim(),
    statusHistory: [{ status: data.status, changedAt: new Date().toISOString() }],
  };

  saveDb({ ...db, nextId: db.nextId + 1, vehicles: [...db.vehicles, vehicle] });
  return clone(vehicle);
}

export async function updateVehicleStatus(id, status) {
  await simulateNetwork();
  const db = loadDb();
  const vehicle = db.vehicles.find((item) => item.id === id);

  if (!vehicle) throw new ApiError(`Vehicle "${id}" was not found.`, { status: 404 });
  if (!statusesForClass(vehicle.class).includes(status)) {
    throw new ApiError(`A ${vehicle.class} vehicle cannot be set to "${status}".`, { status: 422 });
  }
  if (status === vehicle.status) {
    throw new ApiError(`The vehicle is already ${STATUS_LABELS[status].toLowerCase()}.`, { status: 409 });
  }
  if (status === 'rented' && vehicle.fuelLevel < MIN_FUEL_TO_RENT) {
    throw new ApiError(
      `Cannot rent out a vehicle below ${MIN_FUEL_TO_RENT} % fuel/charge. Refuel or charge it first.`,
      { status: 422 },
    );
  }

  const updated = {
    ...vehicle,
    status,
    statusHistory: [
      { status, changedAt: new Date().toISOString() },
      ...vehicle.statusHistory,
    ].slice(0, HISTORY_LIMIT),
  };

  saveDb({
    ...db,
    vehicles: db.vehicles.map((item) => (item.id === id ? updated : item)),
  });
  return clone(updated);
}
