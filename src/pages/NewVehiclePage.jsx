import { Link, useNavigate } from 'react-router-dom';
import VehicleForm from '../components/VehicleForm.jsx';
import { createVehicle } from '../api/vehiclesApi.js';

export default function NewVehiclePage() {
  const navigate = useNavigate();

  // Errors are re-thrown on purpose: VehicleForm catches them and shows them by the fields.
  async function handleCreate(values) {
    const created = await createVehicle(values);
    navigate(`/vehicles/${created.id}`);
  }

  return (
    <div className="page page--narrow">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">
          <span aria-hidden="true">← </span>Fleet overview
        </Link>
      </nav>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Add a vehicle</h1>
          <p className="page-header__subtitle">
            Register a car that has joined the Almaty fleet. All fields except notes are required.
          </p>
        </div>
      </header>
      <VehicleForm onSubmit={handleCreate} onCancel={() => navigate('/')} />
    </div>
  );
}
