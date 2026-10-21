// Domain vocabulary shared by the simulated API and the UI.

export const VEHICLE_STATUSES = ['available', 'rented', 'maintenance', 'charging'];

export const STATUS_LABELS = {
  available: 'Available',
  rented: 'Rented',
  maintenance: 'Maintenance',
  charging: 'Charging',
};

export const VEHICLE_CLASSES = ['economy', 'comfort', 'business', 'electric'];

export const CLASS_LABELS = {
  economy: 'Economy',
  comfort: 'Comfort',
  business: 'Business',
  electric: 'Electric',
};

export const DISTRICTS = [
  'Alatau',
  'Almaly',
  'Auezov',
  'Bostandyk',
  'Medeu',
  'Nauryzbay',
  'Turksib',
  'Zhetysu',
];

export const MODELS_BY_CLASS = {
  economy: [
    { brand: 'Hyundai', model: 'Accent' },
    { brand: 'Kia', model: 'Rio' },
    { brand: 'Chevrolet', model: 'Cobalt' },
    { brand: 'Volkswagen', model: 'Polo' },
    { brand: 'Renault', model: 'Logan' },
    { brand: 'Lada', model: 'Vesta' },
  ],
  comfort: [
    { brand: 'Toyota', model: 'Camry' },
    { brand: 'Hyundai', model: 'Sonata' },
    { brand: 'Kia', model: 'K5' },
    { brand: 'Skoda', model: 'Octavia' },
    { brand: 'Hyundai', model: 'Elantra' },
    { brand: 'Chevrolet', model: 'Malibu' },
  ],
  business: [
    { brand: 'Mercedes-Benz', model: 'E-Class' },
    { brand: 'BMW', model: '5 Series' },
    { brand: 'Lexus', model: 'ES' },
    { brand: 'Audi', model: 'A6' },
    { brand: 'Genesis', model: 'G80' },
  ],
  electric: [
    { brand: 'Tesla', model: 'Model 3' },
    { brand: 'BYD', model: 'Han' },
    { brand: 'BYD', model: 'Seal' },
    { brand: 'Zeekr', model: '001' },
    { brand: 'Hyundai', model: 'Ioniq 5' },
    { brand: 'Kia', model: 'EV6' },
  ],
};

export const BRANDS = [
  ...new Set(Object.values(MODELS_BY_CLASS).flat().map((entry) => entry.brand)),
].sort((a, b) => a.localeCompare(b));

export const SORT_FIELDS = [
  { value: 'plate', label: 'Plate number' },
  { value: 'pricePerMinute', label: 'Price per minute' },
  { value: 'fuelLevel', label: 'Fuel / charge' },
  { value: 'mileageKm', label: 'Mileage' },
  { value: 'year', label: 'Year' },
  { value: 'lastServiceDate', label: 'Last service' },
];

export const PAGE_SIZES = [12, 24, 48];

export const LOW_FUEL_THRESHOLD = 20;
export const MIN_FUEL_TO_RENT = 15;
export const SERVICE_INTERVAL_DAYS = 180;

export const PRICE_MIN = 20;
export const PRICE_MAX = 500;
export const YEAR_MIN = 2010;
export const MILEAGE_MAX = 1_000_000;
export const NOTES_MAX_LENGTH = 300;
