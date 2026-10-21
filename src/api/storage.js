import { generateVehicles } from './seed.js';

const STORAGE_KEY = 'fleetdesk.db';

// Bump this whenever the shape of a stored vehicle changes:
// every browser then drops its old copy and re-seeds.
export const SCHEMA_VERSION = 1;

// Used only when localStorage is unavailable (private mode, quota exceeded).
let memoryDb = null;

function createSeedDb() {
  const vehicles = generateVehicles();
  return { version: SCHEMA_VERSION, nextId: vehicles.length + 1, vehicles };
}

function readStoredDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isValidDb(db) {
  return db?.version === SCHEMA_VERSION && Array.isArray(db.vehicles) && Number.isInteger(db.nextId);
}

export function saveDb(db) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    memoryDb = null;
  } catch {
    memoryDb = db;
  }
}

export function loadDb() {
  if (memoryDb) return memoryDb;
  const stored = readStoredDb();
  if (isValidDb(stored)) return stored;
  const fresh = createSeedDb();
  saveDb(fresh);
  return fresh;
}
