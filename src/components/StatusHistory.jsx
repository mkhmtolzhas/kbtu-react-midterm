import StatusBadge from './StatusBadge.jsx';
import { formatDateTime } from '../utils/format.js';

export default function StatusHistory({ entries }) {
  return (
    <section className="panel" aria-labelledby="status-history-title">
      <h2 id="status-history-title" className="panel__title">Status history</h2>
      <ol className="timeline">
        {entries.map((entry, position) => (
          // Two changes can never share a timestamp, so it identifies the entry.
          <li key={entry.changedAt} className="timeline__item">
            <StatusBadge status={entry.status} />
            <time dateTime={entry.changedAt}>{formatDateTime(entry.changedAt)}</time>
            {position === 0 && <span className="timeline__current">current</span>}
          </li>
        ))}
      </ol>
    </section>
  );
}
