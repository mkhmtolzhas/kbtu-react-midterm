import VehicleCard from './VehicleCard.jsx';

export default function VehicleGrid({ vehicles, busy = false }) {
  return (
    <ul className={`vehicle-grid${busy ? ' vehicle-grid--busy' : ''}`} aria-busy={busy}>
      {vehicles.map((vehicle) => (
        <li key={vehicle.id}>
          <VehicleCard vehicle={vehicle} />
        </li>
      ))}
    </ul>
  );
}
