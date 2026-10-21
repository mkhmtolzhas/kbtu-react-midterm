import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from './EmptyState.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import FuelGauge from './FuelGauge.jsx';
import LicensePlate from './LicensePlate.jsx';
import SimilarVehicles from './SimilarVehicles.jsx';
import Spinner from './Spinner.jsx';
import StatusBadge from './StatusBadge.jsx';
import StatusControl from './StatusControl.jsx';
import StatusHistory from './StatusHistory.jsx';
import TripEstimator from './TripEstimator.jsx';
import { getVehicle } from '../api/vehiclesApi.js';
import { isAbortError } from '../api/network.js';
import { CLASS_LABELS, SERVICE_INTERVAL_DAYS } from '../utils/constants.js';
import { formatDate, formatDaysAgo, formatKm, formatTenge } from '../utils/format.js';
import { daysSince, energyLabel, isLowFuel } from '../utils/vehicle.js';

// Rendered as <VehicleDetails key={id} />: a different id means a brand-new
// instance, so no state from the previously opened vehicle can leak in.
export default function VehicleDetails({ id, tripMinutes, onTripMinutesChange }) {
  const [vehicle, setVehicle] = useState(null);
  const [loadState, setLoadState] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoadState('loading');

    getVehicle(id, { signal: controller.signal })
      .then((data) => {
        setVehicle(data);
        setLoadState('success');
      })
      .catch((requestError) => {
        if (isAbortError(requestError)) return;
        setError(requestError);
        setLoadState('error');
      });

    return () => controller.abort();
  }, [id, reloadKey]);

  function handleStatusChange(updated) {
    // New object with only the fields the status change touched.
    setVehicle((prev) => ({
      ...prev,
      status: updated.status,
      statusHistory: updated.statusHistory,
    }));
  }

  if (loadState === 'loading') {
    return <Spinner label="Loading vehicle…" />;
  }

  if (loadState === 'error' && error.status === 404) {
    return (
      <EmptyState title="Vehicle not found" message={`There is no vehicle with id “${id}” in the fleet.`}>
        <Link className="button button--primary" to="/">Back to fleet</Link>
      </EmptyState>
    );
  }

  if (loadState === 'error') {
    return (
      <ErrorMessage
        title="Could not load this vehicle"
        message={error.message}
        onRetry={() => setReloadKey((key) => key + 1)}
      />
    );
  }

  const serviceDays = daysSince(vehicle.lastServiceDate);
  const serviceOverdue = serviceDays > SERVICE_INTERVAL_DAYS;

  return (
    <article className="details">
      <header className="details__header">
        <LicensePlate plate={vehicle.plate} size="lg" />
        <div className="details__heading">
          <h1 className="details__title">{vehicle.brand} {vehicle.model}</h1>
          <p className="details__meta">
            {vehicle.year} · {CLASS_LABELS[vehicle.class]} · {vehicle.district}
          </p>
        </div>
        <StatusBadge status={vehicle.status} />
      </header>

      <div className="details__layout">
        <div className="details__main">
          <section className="panel" aria-labelledby="specs-title">
            <h2 id="specs-title" className="panel__title">Vehicle details</h2>
            <FuelGauge level={vehicle.fuelLevel} vehicleClass={vehicle.class} />
            {isLowFuel(vehicle.fuelLevel) && (
              <p className="inline-message inline-message--warning">
                {energyLabel(vehicle.class)} is low — send the car to {vehicle.class === 'electric' ? 'a charger' : 'refuel'} before the next rental.
              </p>
            )}
            <dl className="spec-list">
              <div>
                <dt>Class</dt>
                <dd>{CLASS_LABELS[vehicle.class]}</dd>
              </div>
              <div>
                <dt>District</dt>
                <dd>{vehicle.district}</dd>
              </div>
              <div>
                <dt>Price per minute</dt>
                <dd>{formatTenge(vehicle.pricePerMinute)}</dd>
              </div>
              <div>
                <dt>Mileage</dt>
                <dd>{formatKm(vehicle.mileageKm)}</dd>
              </div>
              <div>
                <dt>Model year</dt>
                <dd>{vehicle.year}</dd>
              </div>
              <div>
                <dt>Last service</dt>
                <dd>
                  {formatDate(vehicle.lastServiceDate)}
                  <span className="spec-list__sub">{formatDaysAgo(serviceDays)}</span>
                  {serviceOverdue && <span className="flag flag--danger">Overdue</span>}
                </dd>
              </div>
              <div>
                <dt>Fleet ID</dt>
                <dd className="mono">{vehicle.id}</dd>
              </div>
            </dl>
            <div className="details__notes">
              <h3 className="details__notes-title">Dispatcher notes</h3>
              <p>{vehicle.notes || 'No notes for this vehicle.'}</p>
            </div>
          </section>

          <StatusHistory entries={vehicle.statusHistory} />
        </div>

        <aside className="details__side" aria-label="Actions">
          <StatusControl
            vehicleId={vehicle.id}
            vehicleClass={vehicle.class}
            currentStatus={vehicle.status}
            onStatusChange={handleStatusChange}
          />
          <TripEstimator
            pricePerMinute={vehicle.pricePerMinute}
            minutes={tripMinutes}
            onMinutesChange={onTripMinutesChange}
          />
        </aside>
      </div>

      <SimilarVehicles vehicleId={vehicle.id} vehicleClass={vehicle.class} district={vehicle.district} />
    </article>
  );
}
