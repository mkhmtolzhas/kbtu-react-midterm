import FormField from './FormField.jsx';
import { describedBy } from '../utils/a11y.js';
import { formatTenge } from '../utils/format.js';

const PRESETS = [15, 30, 60, 120];
const MAX_MINUTES = 24 * 60;
const HINT = 'Kept when you open another vehicle, so you can compare prices.';

function presetLabel(minutes) {
  return minutes < 60 ? `${minutes} min` : `${minutes / 60} h`;
}

// Stateless: `minutes` lives in the parent page so it survives switching vehicles.
export default function TripEstimator({ pricePerMinute, minutes, onMinutesChange }) {
  const value = Number(minutes);
  const isValid = minutes !== '' && Number.isInteger(value) && value >= 1 && value <= MAX_MINUTES;
  const error = isValid ? null : `Enter a whole number of minutes from 1 to ${MAX_MINUTES}.`;

  return (
    <section className="panel" aria-labelledby="trip-estimator-title">
      <h2 id="trip-estimator-title" className="panel__title">Trip cost estimate</h2>
      <FormField id="trip-minutes" label="Trip length, minutes" hint={HINT} error={error}>
        <input
          id="trip-minutes"
          className="input"
          type="number"
          inputMode="numeric"
          min="1"
          max={MAX_MINUTES}
          step="1"
          value={minutes}
          onChange={(event) => onMinutesChange(event.target.value)}
          aria-invalid={!isValid}
          aria-describedby={describedBy('trip-minutes', { hint: HINT, error })}
        />
      </FormField>
      <div className="chip-group" role="group" aria-label="Quick durations">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            className="chip"
            aria-pressed={value === preset}
            onClick={() => onMinutesChange(String(preset))}
          >
            {presetLabel(preset)}
          </button>
        ))}
      </div>
      {isValid && (
        <p className="trip-total">
          <span>{value} min × {formatTenge(pricePerMinute)}</span>
          <output className="trip-total__value" htmlFor="trip-minutes">
            {formatTenge(value * pricePerMinute)}
          </output>
        </p>
      )}
    </section>
  );
}
