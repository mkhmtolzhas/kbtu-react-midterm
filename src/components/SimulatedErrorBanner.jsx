import { useLocation } from 'react-router-dom';
import { simulatedErrorRate } from '../api/network.js';

// Makes the ?simulateError testing mode visible, so failures are not mistaken for bugs.
export default function SimulatedErrorBanner() {
  const { search } = useLocation();
  const rate = simulatedErrorRate(search);

  if (rate === 0) return null;

  return (
    <p className="dev-banner" role="note">
      Simulated error mode: {Math.round(rate * 100)} % of API requests fail.
      Remove <code>simulateError</code> from the URL to turn it off.
    </p>
  );
}
