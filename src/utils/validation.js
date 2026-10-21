import {
  BRANDS,
  DISTRICTS,
  MILEAGE_MAX,
  NOTES_MAX_LENGTH,
  PRICE_MAX,
  PRICE_MIN,
  VEHICLE_CLASSES,
  YEAR_MIN,
} from './constants.js';
import { normalizePlate, statusesForClass, todayIso } from './vehicle.js';

// A brand-new vehicle cannot join the fleet already rented out.
export function initialStatusesForClass(vehicleClass) {
  return statusesForClass(vehicleClass).filter((status) => status !== 'rented');
}

function isBlank(value) {
  return String(value ?? '').trim() === '';
}

function checkInteger(value, { label, min, max }) {
  if (isBlank(value)) return `${label} is required.`;
  const number = Number(value);
  if (!Number.isInteger(number)) return `${label} must be a whole number.`;
  if (number < min || number > max) return `${label} must be between ${min} and ${max}.`;
  return null;
}

// Shared by the form (client-side) and by the simulated API (server-side).
// Accepts raw form values (strings) or numbers; returns { field: message }.
export function validateVehicle(values) {
  const errors = {};
  const maxYear = new Date().getFullYear() + 1;

  if (isBlank(values.plate)) errors.plate = 'Plate number is required.';
  else if (!normalizePlate(values.plate)) errors.plate = 'Use the Kazakh format, e.g. 123 ABC 02.';

  if (!BRANDS.includes(values.brand)) errors.brand = 'Choose a brand.';

  if (isBlank(values.model)) errors.model = 'Model is required.';
  else if (String(values.model).trim().length > 40) errors.model = 'Model must be 40 characters or fewer.';

  if (!VEHICLE_CLASSES.includes(values.class)) errors.class = 'Choose a class.';

  if (!initialStatusesForClass(values.class).includes(values.status)) {
    errors.status = values.status === 'charging'
      ? 'Only electric vehicles can be charging.'
      : 'Choose a starting status.';
  }

  if (!DISTRICTS.includes(values.district)) errors.district = 'Choose a district.';

  const fuelError = checkInteger(values.fuelLevel, { label: 'Fuel / charge level', min: 0, max: 100 });
  if (fuelError) errors.fuelLevel = fuelError;

  const mileageError = checkInteger(values.mileageKm, { label: 'Mileage', min: 0, max: MILEAGE_MAX });
  if (mileageError) errors.mileageKm = mileageError;

  if (isBlank(values.pricePerMinute)) errors.pricePerMinute = 'Price is required.';
  else {
    const price = Number(values.pricePerMinute);
    if (Number.isNaN(price) || price < PRICE_MIN || price > PRICE_MAX) {
      errors.pricePerMinute = `Price must be between ${PRICE_MIN} and ${PRICE_MAX} ₸.`;
    }
  }

  const yearError = checkInteger(values.year, { label: 'Year', min: YEAR_MIN, max: maxYear });
  if (yearError) errors.year = yearError;

  if (isBlank(values.lastServiceDate)) errors.lastServiceDate = 'Last service date is required.';
  else if (Number.isNaN(Date.parse(values.lastServiceDate))) errors.lastServiceDate = 'Enter a valid date.';
  else if (values.lastServiceDate > todayIso()) errors.lastServiceDate = 'Service date cannot be in the future.';
  else if (!yearError && Number(values.lastServiceDate.slice(0, 4)) < Number(values.year)) {
    errors.lastServiceDate = 'Service date cannot be earlier than the model year.';
  }

  if (String(values.notes ?? '').length > NOTES_MAX_LENGTH) {
    errors.notes = `Notes must be ${NOTES_MAX_LENGTH} characters or fewer.`;
  }

  return errors;
}
