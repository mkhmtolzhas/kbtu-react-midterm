import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import VehicleDetails from '../components/VehicleDetails.jsx';

export default function VehicleDetailsPage() {
  const { id } = useParams();
  // Lives above the keyed subtree on purpose: it is preserved when the dispatcher
  // jumps from one vehicle to another (this page component stays mounted).
  const [tripMinutes, setTripMinutes] = useState('60');

  return (
    <div className="page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">
          <span aria-hidden="true">← </span>Fleet overview
        </Link>
      </nav>
      {/* key={id}: another id => React unmounts the old details and mounts fresh ones. */}
      <VehicleDetails
        key={id}
        id={id}
        tripMinutes={tripMinutes}
        onTripMinutesChange={setTripMinutes}
      />
    </div>
  );
}
