import { DISTRICTS, MODELS_BY_CLASS } from '../utils/constants.js';
import { statusesForClass } from '../utils/vehicle.js';

const SEED_COUNT = 180;

// Fixed "generation date" + fixed PRNG seed => every visitor gets the same fleet.
const SEED_DATE = new Date('2026-10-15T09:00:00+05:00');
const PRNG_SEED = 20261015;
const DAY_MS = 24 * 60 * 60 * 1000;
const PLATE_LETTERS = 'ABCDEFHKLMNOPRSTUXYZ';

const CLASS_WEIGHTS = { economy: 35, comfort: 30, business: 15, electric: 20 };

const PRICE_RANGES = {
  economy: [45, 65],
  comfort: [70, 95],
  business: [120, 190],
  electric: [80, 130],
};

const MIN_YEAR_BY_CLASS = { economy: 2017, comfort: 2018, business: 2020, electric: 2020 };

const STATUS_WEIGHTS = {
  combustion: { available: 50, rented: 35, maintenance: 15 },
  electric: { available: 40, rented: 25, charging: 25, maintenance: 10 },
};

const NOTES = [
  'Child seat installed in the rear.',
  'Winter tyres fitted.',
  'Minor scratch on the rear bumper, documented.',
  'Dashcam installed and recording.',
  'Tyre pressure sensor alerts intermittently.',
  'Interior deep-cleaned after the last rental.',
  'Windscreen chip on the passenger side.',
  'Roof box available on request.',
  'Customer reported a squeaky front-left brake.',
  'Parking sensors recalibrated.',
  'Phone holder missing, replacement ordered.',
  'Air conditioning recharged.',
];

// mulberry32: tiny deterministic PRNG returning floats in [0, 1).
function createRandom(seed) {
  let state = seed;
  return function random() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createPicker(random) {
  const int = (min, max) => min + Math.floor(random() * (max - min + 1));
  const pick = (list) => list[Math.floor(random() * list.length)];
  const weighted = (weights) => {
    const entries = Object.entries(weights);
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = random() * total;
    for (const [value, weight] of entries) {
      roll -= weight;
      if (roll < 0) return value;
    }
    return entries[entries.length - 1][0];
  };
  return { int, pick, weighted };
}

function isoDateDaysBefore(date, days) {
  return new Date(date.getTime() - days * DAY_MS).toISOString().slice(0, 10);
}

function fuelFor(status, { int }) {
  if (status === 'charging') return int(5, 55);
  if (status === 'rented') return int(15, 100);
  return int(8, 100);
}

// Newest entry first; the first entry always matches the current status.
function historyFor(status, vehicleClass, { int, pick }) {
  const allowed = statusesForClass(vehicleClass);
  const history = [];
  let current = status;
  let hoursAgo = int(1, 36);
  const length = int(2, 4);
  for (let i = 0; i < length; i += 1) {
    history.push({
      status: current,
      changedAt: new Date(SEED_DATE.getTime() - hoursAgo * 60 * 60 * 1000).toISOString(),
    });
    current = pick(allowed.filter((candidate) => candidate !== current));
    hoursAgo += int(6, 96);
  }
  return history;
}

export function generateVehicles(count = SEED_COUNT) {
  const random = createRandom(PRNG_SEED);
  const picker = createPicker(random);
  const { int, pick, weighted } = picker;
  const usedPlates = new Set();
  const vehicles = [];

  while (vehicles.length < count) {
    const plate = `${String(int(1, 999)).padStart(3, '0')} ${pick(PLATE_LETTERS)}${pick(PLATE_LETTERS)}${pick(PLATE_LETTERS)} 02`;
    if (usedPlates.has(plate)) continue;
    usedPlates.add(plate);

    const vehicleClass = weighted(CLASS_WEIGHTS);
    const { brand, model } = pick(MODELS_BY_CLASS[vehicleClass]);
    const year = int(MIN_YEAR_BY_CLASS[vehicleClass], 2025);
    const status = weighted(STATUS_WEIGHTS[vehicleClass === 'electric' ? 'electric' : 'combustion']);
    const [minPrice, maxPrice] = PRICE_RANGES[vehicleClass];
    const id = vehicles.length + 1;

    vehicles.push({
      id: `veh-${String(id).padStart(4, '0')}`,
      plate,
      brand,
      model,
      class: vehicleClass,
      status,
      district: pick(DISTRICTS),
      fuelLevel: fuelFor(status, picker),
      mileageKm: (2026 - year) * int(14_000, 28_000) + int(500, 6_000),
      pricePerMinute: Math.round(int(minPrice, maxPrice) / 5) * 5,
      year,
      lastServiceDate: isoDateDaysBefore(SEED_DATE, int(3, 260)),
      notes: random() < 0.45 ? pick(NOTES) : '',
      statusHistory: historyFor(status, vehicleClass, picker),
    });
  }

  return vehicles;
}
