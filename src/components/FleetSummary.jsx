import { useEffect, useState } from 'react';
import ErrorMessage from './ErrorMessage.jsx';
import { getFleetStats } from '../api/vehiclesApi.js';
import { isAbortError } from '../api/network.js';
import { LOW_FUEL_THRESHOLD, STATUS_LABELS, VEHICLE_STATUSES } from '../utils/constants.js';
import { pluralize } from '../utils/format.js';

// Status tiles that double as a quick status filter.
export default function FleetSummary({ activeStatus, onStatusSelect }) {
  const [stats, setStats] = useState(null);
  const [loadState, setLoadState] = useState('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoadState('loading');

    getFleetStats({ signal: controller.signal })
      .then((data) => {
        setStats(data);
        setLoadState('success');
      })
      .catch((error) => {
        if (!isAbortError(error)) setLoadState('error');
      });

    return () => controller.abort();
  }, [reloadKey]);

  if (loadState === 'error') {
    return (
      <ErrorMessage
        title="Fleet summary is unavailable"
        message="The status counters could not be loaded."
        onRetry={() => setReloadKey((key) => key + 1)}
      />
    );
  }

  const tiles = [
    { status: 'all', label: 'All vehicles', count: stats?.total },
    ...VEHICLE_STATUSES.map((status) => ({
      status,
      label: STATUS_LABELS[status],
      count: stats?.byStatus[status],
    })),
  ];

  return (
    <section className="fleet-summary" aria-labelledby="fleet-summary-title" aria-busy={loadState === 'loading'}>
      <h2 id="fleet-summary-title" className="visually-hidden">Fleet summary</h2>
      <ul className="fleet-summary__tiles">
        {tiles.map((tile) => (
          <li key={tile.status}>
            <button
              type="button"
              className={`summary-tile summary-tile--${tile.status}`}
              aria-pressed={activeStatus === tile.status}
              onClick={() => onStatusSelect(tile.status)}
            >
              <span className="summary-tile__label">{tile.label}</span>
              <span className="summary-tile__count">{tile.count ?? '…'}</span>
            </button>
          </li>
        ))}
      </ul>
      {stats && stats.lowFuel > 0 && (
        <p className="fleet-summary__note">
          {pluralize(stats.lowFuel, 'vehicle')} below {LOW_FUEL_THRESHOLD} % fuel or charge need attention.
        </p>
      )}
    </section>
  );
}
