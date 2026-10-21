import FormField from './FormField.jsx';
import { SORT_FIELDS } from '../utils/constants.js';

export default function SortControl({ sortBy, sortDir, onSortByChange, onSortDirToggle }) {
  const ascending = sortDir === 'asc';

  return (
    <div className="sort-control">
      <FormField id="sort-by" label="Sort by">
        <select
          id="sort-by"
          className="input"
          value={sortBy}
          onChange={(event) => onSortByChange(event.target.value)}
        >
          {SORT_FIELDS.map((field) => (
            <option key={field.value} value={field.value}>{field.label}</option>
          ))}
        </select>
      </FormField>
      <button
        type="button"
        className="button button--secondary sort-control__direction"
        onClick={onSortDirToggle}
      >
        <span className="visually-hidden">Sort direction: </span>
        <span aria-hidden="true">{ascending ? '↑' : '↓'}</span>
        {ascending ? 'Ascending' : 'Descending'}
      </button>
    </div>
  );
}
