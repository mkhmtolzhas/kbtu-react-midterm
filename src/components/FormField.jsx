// Label + control + hint + error, wired together for screen readers.
// The control itself is passed as `children`, so any input/select/textarea works.
export default function FormField({ id, label, hint, error, children, className = '' }) {
  return (
    <div className={`field${error ? ' field--invalid' : ''} ${className}`.trim()}>
      <label className="field__label" htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <p className="field__hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="field__error" id={`${id}-error`}>{error}</p>}
    </div>
  );
}

