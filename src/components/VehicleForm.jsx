import { useState } from 'react';
import FormField from './FormField.jsx';
import { describedBy } from '../utils/a11y.js';
import {
  BRANDS,
  CLASS_LABELS,
  DISTRICTS,
  MODELS_BY_CLASS,
  NOTES_MAX_LENGTH,
  PRICE_MAX,
  PRICE_MIN,
  STATUS_LABELS,
  VEHICLE_CLASSES,
  YEAR_MIN,
} from '../utils/constants.js';
import { pluralize } from '../utils/format.js';
import { initialStatusesForClass, validateVehicle } from '../utils/validation.js';
import { energyLabel, todayIso } from '../utils/vehicle.js';

// Every value is a string: that is what inputs produce. The API converts numbers.
function createInitialValues() {
  return {
    plate: '',
    brand: '',
    model: '',
    class: '',
    status: 'available',
    district: '',
    fuelLevel: '100',
    mileageKm: '',
    pricePerMinute: '',
    year: String(new Date().getFullYear()),
    lastServiceDate: todayIso(),
    notes: '',
  };
}

const HINTS = {
  plate: 'Kazakh format: 3 digits, 2–3 letters, region code. Example: 123 ABC 02.',
  model: 'Pick a suggestion or type the model name.',
  pricePerMinute: `From ${PRICE_MIN} to ${PRICE_MAX} ₸.`,
  status: 'A new vehicle cannot start as rented.',
};

const MODEL_SUGGESTIONS = Object.values(MODELS_BY_CLASS).flat();

export default function VehicleForm({ onSubmit, onCancel }) {
  const [values, setValues] = useState(createInitialValues);
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Derived on every render from the current values — never stored in state.
  const clientErrors = validateVehicle(values);
  const errorCount = Object.keys(clientErrors).length;
  const energy = energyLabel(values.class);
  const hints = { ...HINTS, notes: `${values.notes.length} / ${NOTES_MAX_LENGTH} characters` };

  function errorFor(name) {
    if (serverErrors[name]) return serverErrors[name];
    return touched[name] || submitAttempted ? clientErrors[name] : undefined;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      // Switching away from "electric" must not leave an impossible "charging" status.
      if (name === 'class' && !initialStatusesForClass(value).includes(prev.status)) {
        next.status = 'available';
      }
      return next;
    });
    if (serverErrors[name]) {
      setServerErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  function handleBlur(event) {
    const { name } = event.target;
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitAttempted(true);
    setSubmitError(null);
    // `clientErrors` is the snapshot of this render, computed from the same `values`.
    if (errorCount > 0) return;

    setSubmitting(true);
    try {
      await onSubmit(values);
      // On success the parent navigates away and this form unmounts.
    } catch (requestError) {
      setServerErrors(requestError.fieldErrors ?? {});
      setSubmitError(requestError.message);
      setSubmitting(false);
    }
  }

  function handleReset() {
    // Five updates, one re-render: React batches updates made in one event handler.
    setValues(createInitialValues());
    setTouched({});
    setSubmitAttempted(false);
    setServerErrors({});
    setSubmitError(null);
  }

  // Shared props for every control: makes each input controlled and accessible.
  function fieldProps(name) {
    const id = `vehicle-${name}`;
    const error = errorFor(name);
    return {
      id,
      name,
      value: values[name],
      onChange: handleChange,
      onBlur: handleBlur,
      disabled: submitting,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': describedBy(id, { hint: hints[name], error }),
    };
  }

  const modelOptions = MODEL_SUGGESTIONS.filter((entry) =>
    (!values.brand || entry.brand === values.brand)
    && (!values.class || MODELS_BY_CLASS[values.class].includes(entry)));

  return (
    <form className="vehicle-form" onSubmit={handleSubmit} noValidate>
      <div aria-live="polite">
        {submitAttempted && errorCount > 0 && (
          <p className="inline-message inline-message--error">
            Please fix {pluralize(errorCount, 'highlighted field')} before saving.
          </p>
        )}
        {submitError && <p className="inline-message inline-message--error">{submitError}</p>}
      </div>

      <fieldset className="form-section">
        <legend className="form-section__title">Identification</legend>
        <div className="form-grid">
          <FormField id="vehicle-plate" label="Plate number" hint={HINTS.plate} error={errorFor('plate')}>
            <input {...fieldProps('plate')} className="input input--plate" type="text" autoComplete="off" spellCheck="false" />
          </FormField>
          <FormField id="vehicle-brand" label="Brand" error={errorFor('brand')}>
            <select {...fieldProps('brand')} className="input">
              <option value="" disabled>Choose a brand</option>
              {BRANDS.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </FormField>
          <FormField id="vehicle-model" label="Model" hint={HINTS.model} error={errorFor('model')}>
            <input {...fieldProps('model')} className="input" type="text" list="model-suggestions" autoComplete="off" />
          </FormField>
          <datalist id="model-suggestions">
            {modelOptions.map((entry) => (
              <option key={`${entry.brand}-${entry.model}`} value={entry.model}>{entry.brand}</option>
            ))}
          </datalist>
          <FormField id="vehicle-year" label="Model year" error={errorFor('year')}>
            <input {...fieldProps('year')} className="input" type="number" inputMode="numeric" min={YEAR_MIN} step="1" />
          </FormField>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend className="form-section__title">Operations</legend>
        <div className="form-grid">
          <FormField id="vehicle-class" label="Class" error={errorFor('class')}>
            <select {...fieldProps('class')} className="input">
              <option value="" disabled>Choose a class</option>
              {VEHICLE_CLASSES.map((vehicleClass) => (
                <option key={vehicleClass} value={vehicleClass}>{CLASS_LABELS[vehicleClass]}</option>
              ))}
            </select>
          </FormField>
          <FormField id="vehicle-status" label="Starting status" hint={HINTS.status} error={errorFor('status')}>
            <select {...fieldProps('status')} className="input">
              {initialStatusesForClass(values.class).map((status) => (
                <option key={status} value={status}>{STATUS_LABELS[status]}</option>
              ))}
            </select>
          </FormField>
          <FormField id="vehicle-district" label="District" error={errorFor('district')}>
            <select {...fieldProps('district')} className="input">
              <option value="" disabled>Choose a district</option>
              {DISTRICTS.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </FormField>
          <FormField id="vehicle-pricePerMinute" label="Price per minute, ₸" hint={HINTS.pricePerMinute} error={errorFor('pricePerMinute')}>
            <input {...fieldProps('pricePerMinute')} className="input" type="number" inputMode="decimal" min={PRICE_MIN} max={PRICE_MAX} step="5" />
          </FormField>
        </div>
      </fieldset>

      <fieldset className="form-section">
        <legend className="form-section__title">Condition</legend>
        <div className="form-grid">
          <FormField id="vehicle-fuelLevel" label={`${energy} level, %`} error={errorFor('fuelLevel')}>
            <input {...fieldProps('fuelLevel')} className="input" type="number" inputMode="numeric" min="0" max="100" step="1" />
          </FormField>
          <FormField id="vehicle-mileageKm" label="Mileage, km" error={errorFor('mileageKm')}>
            <input {...fieldProps('mileageKm')} className="input" type="number" inputMode="numeric" min="0" step="1" />
          </FormField>
          <FormField id="vehicle-lastServiceDate" label="Last service date" error={errorFor('lastServiceDate')}>
            <input {...fieldProps('lastServiceDate')} className="input" type="date" max={todayIso()} />
          </FormField>
          <FormField
            id="vehicle-notes"
            label="Dispatcher notes (optional)"
            hint={hints.notes}
            error={errorFor('notes')}
            className="form-grid__wide"
          >
            <textarea {...fieldProps('notes')} className="input input--textarea" rows={3} />
          </FormField>
        </div>
      </fieldset>

      <div className="form-actions">
        <button type="button" className="button button--ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="button" className="button button--secondary" onClick={handleReset} disabled={submitting}>
          Clear form
        </button>
        <button type="submit" className="button button--primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Add vehicle'}
        </button>
      </div>
    </form>
  );
}
