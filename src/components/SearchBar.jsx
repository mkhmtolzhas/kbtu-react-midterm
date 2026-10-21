export default function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar">
      <label className="field__label" htmlFor="vehicle-search">Search</label>
      <div className="search-bar__control">
        <svg className="search-bar__icon" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="9" cy="9" r="6" />
          <path d="m13.5 13.5 4 4" />
        </svg>
        <input
          id="vehicle-search"
          className="input search-bar__input"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Plate, brand or model — e.g. 123 ABC, Camry"
          autoComplete="off"
          spellCheck="false"
        />
        {value && (
          <button
            type="button"
            className="search-bar__clear"
            onClick={() => onChange('')}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
