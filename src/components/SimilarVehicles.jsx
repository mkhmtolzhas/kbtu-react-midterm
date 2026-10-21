import { useEffect, useState } from 'react';
import EmptyState from './EmptyState.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import Spinner from './Spinner.jsx';
import VehicleGrid from './VehicleGrid.jsx';
import { listVehicles } from '../api/vehiclesApi.js';
import { isAbortError } from '../api/network.js';
import { CLASS_LABELS } from '../utils/constants.js';

const LIMIT = 4;

// Replacement candidates for the dispatcher: available cars of the same class nearby.
export default function SimilarVehicles({ vehicleId, vehicleClass, district }) {
  const [vehicles, setVehicles] = useState([]);
  const [loadState, setLoadState] = useState('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoadState('loading');

    listVehicles(
      { vehicleClass, district, status: 'available', sortBy: 'fuelLevel', sortDir: 'desc', pageSize: LIMIT + 1 },
      { signal: controller.signal },
    )
      .then((data) => {
        setVehicles(data.items.filter((item) => item.id !== vehicleId).slice(0, LIMIT));
        setLoadState('success');
      })
      .catch((error) => {
        if (!isAbortError(error)) setLoadState('error');
      });

    return () => controller.abort();
  }, [vehicleId, vehicleClass, district, reloadKey]);

  let content;
  if (loadState === 'loading') {
    content = <Spinner label="Looking for alternatives…" />;
  } else if (loadState === 'error') {
    content = (
      <ErrorMessage
        title="Could not load alternatives"
        onRetry={() => setReloadKey((key) => key + 1)}
      />
    );
  } else if (vehicles.length === 0) {
    content = (
      <EmptyState
        title="No alternatives nearby"
        message={`No other ${CLASS_LABELS[vehicleClass].toLowerCase()} vehicle is available in ${district} right now.`}
      />
    );
  } else {
    content = <VehicleGrid vehicles={vehicles} />;
  }

  return (
    <section className="similar" aria-labelledby="similar-title">
      <h2 id="similar-title" className="section-title">
        Available {CLASS_LABELS[vehicleClass].toLowerCase()} cars in {district}
      </h2>
      {content}
    </section>
  );
}
