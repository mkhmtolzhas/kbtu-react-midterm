import { useState } from 'react';
import FormField from './FormField.jsx';
import { updateVehicleStatus } from '../api/vehiclesApi.js';
import { describedBy } from '../utils/a11y.js';
import { MIN_FUEL_TO_RENT, STATUS_LABELS } from '../utils/constants.js';
import { statusesForClass } from '../utils/vehicle.js';

const HINT = `Renting out needs at least ${MIN_FUEL_TO_RENT} % fuel or charge.`;

export default function StatusControl({ vehicleId, vehicleClass, currentStatus, onStatusChange }) {
  // The select starts at the current status; this state is local to one vehicle
  // because the whole details subtree is keyed by the vehicle id.
  const [draftStatus, setDraftStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedStatus, setSavedStatus] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSavedStatus(null);
    try {
      const updated = await updateVehicleStatus(vehicleId, draftStatus);
      onStatusChange(updated);
      setSavedStatus(updated.status);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  function handleDraftChange(event) {
    setDraftStatus(event.target.value);
    setError(null);
    setSavedStatus(null);
  }

  return (
    <section className="panel" aria-labelledby="status-control-title">
      <h2 id="status-control-title" className="panel__title">Change status</h2>
      <form className="status-control" onSubmit={handleSubmit}>
        <FormField id="status-select" label="New status" hint={HINT}>
          <select
            id="status-select"
            className="input"
            value={draftStatus}
            onChange={handleDraftChange}
            disabled={saving}
            aria-describedby={describedBy('status-select', { hint: HINT })}
          >
            {statusesForClass(vehicleClass).map((status) => (
              <option key={status} value={status}>{STATUS_LABELS[status]}</option>
            ))}
          </select>
        </FormField>
        <button
          type="submit"
          className="button button--primary"
          disabled={saving || draftStatus === currentStatus}
        >
          {saving ? 'Saving…' : 'Update status'}
        </button>
      </form>
      <div aria-live="polite">
        {error && <p className="inline-message inline-message--error">{error}</p>}
        {savedStatus && (
          <p className="inline-message inline-message--success">
            Status changed to {STATUS_LABELS[savedStatus].toLowerCase()}.
          </p>
        )}
      </div>
    </section>
  );
}
