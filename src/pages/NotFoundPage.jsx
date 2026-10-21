import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';

export default function NotFoundPage() {
  return (
    <div className="page">
      <EmptyState title="Page not found" message="This address does not lead anywhere in FleetDesk.">
        <Link className="button button--primary" to="/">Go to fleet overview</Link>
      </EmptyState>
    </div>
  );
}
