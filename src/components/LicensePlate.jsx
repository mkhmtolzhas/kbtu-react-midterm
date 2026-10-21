export default function LicensePlate({ plate, size = 'md' }) {
  return (
    <span className={`plate plate--${size}`} aria-label={`Plate number ${plate}`}>
      <span className="plate__country" aria-hidden="true">KZ</span>
      <span className="plate__number" aria-hidden="true">{plate}</span>
    </span>
  );
}
