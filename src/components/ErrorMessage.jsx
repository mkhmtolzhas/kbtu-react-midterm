export default function ErrorMessage({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="notice notice--error" role="alert">
      <div className="notice__body">
        <p className="notice__title">{title}</p>
        {message && <p className="notice__text">{message}</p>}
      </div>
      {onRetry && (
        <button type="button" className="button button--secondary" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
