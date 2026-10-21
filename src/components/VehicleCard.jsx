import { Link } from 'react-router-dom';
import FuelGauge from './FuelGauge.jsx';
import LicensePlate from './LicensePlate.jsx';
import StatusBadge from './StatusBadge.jsx';
import { CLASS_LABELS } from '../utils/constants.js';
import { formatKm, formatTenge } from '../utils/format.js';
import { energyLabel, isLowFuel, isServiceOverdue } from '../utils/vehicle.js';

export default function VehicleCard({ vehicle }) {
  const lowFuel = isLowFuel(vehicle.fuelLevel);
  const serviceOverdue = isServiceOverdue(vehicle.lastServiceDate);

  return (
    <article className="vehicle-card">
      <div className="vehicle-card__top">
        <LicensePlate plate={vehicle.plate} />
        <StatusBadge status={vehicle.status} />
      </div>

      <h3 className="vehicle-card__title">
        {/* The ::after of this link stretches over the whole card. */}
        <Link className="vehicle-card__link" to={`/vehicles/${vehicle.id}`}>
          {vehicle.brand} {vehicle.model}
        </Link>
      </h3>
      <p className="vehicle-card__meta">
        {vehicle.year} · {CLASS_LABELS[vehicle.class]} · {vehicle.district}
      </p>

      <FuelGauge level={vehicle.fuelLevel} vehicleClass={vehicle.class} />

      <dl className="vehicle-card__stats">
        <div>
          <dt>Price</dt>
          <dd>{formatTenge(vehicle.pricePerMinute)}/min</dd>
        </div>
        <div>
          <dt>Mileage</dt>
          <dd>{formatKm(vehicle.mileageKm)}</dd>
        </div>
      </dl>

      {(lowFuel || serviceOverdue) && (
        <ul className="flags">
          {lowFuel && <li className="flag flag--warning">Low {energyLabel(vehicle.class).toLowerCase()}</li>}
          {serviceOverdue && <li className="flag flag--danger">Service overdue</li>}
        </ul>
      )}
    </article>
  );
}
