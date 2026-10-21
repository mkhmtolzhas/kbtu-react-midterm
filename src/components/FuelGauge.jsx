import { energyLabel, isLowFuel } from '../utils/vehicle.js';

export default function FuelGauge({ level, vehicleClass }) {
  const label = energyLabel(vehicleClass);
  const low = isLowFuel(level);

  return (
    <div className={`fuel-gauge${low ? ' fuel-gauge--low' : ''}`}>
      <div className="fuel-gauge__header">
        <span>{label}</span>
        <span className="fuel-gauge__value">{level} %</span>
      </div>
      <div
        className="fuel-gauge__track"
        role="meter"
        aria-label={`${label} level`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={level}
      >
        <span className="fuel-gauge__fill" style={{ width: `${level}%` }} />
      </div>
    </div>
  );
}
