export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="spinner" role="status" aria-live="polite">
      <span className="spinner__circle" aria-hidden="true" />
      <span className="spinner__label">{label}</span>
    </div>
  );
}
