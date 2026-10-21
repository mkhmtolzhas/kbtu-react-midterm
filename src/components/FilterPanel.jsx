import FormField from './FormField.jsx';
import {
  CLASS_LABELS,
  DISTRICTS,
  STATUS_LABELS,
  VEHICLE_CLASSES,
  VEHICLE_STATUSES,
} from '../utils/constants.js';

// Each entry renders one <select>; `name` is the key in the list query and the API param.
const FILTERS = [
  {
    name: 'status',
    label: 'Status',
    allLabel: 'All statuses',
    options: VEHICLE_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] })),
  },
  {
    name: 'vehicleClass',
    label: 'Class',
    allLabel: 'All classes',
    options: VEHICLE_CLASSES.map((value) => ({ value, label: CLASS_LABELS[value] })),
  },
  {
    name: 'district',
    label: 'District',
    allLabel: 'All districts',
    options: DISTRICTS.map((value) => ({ value, label: value })),
  },
];

export default function FilterPanel({ filters, onFilterChange }) {
  return FILTERS.map((filter) => {
    const id = `filter-${filter.name}`;
    return (
      <FormField key={filter.name} id={id} label={filter.label}>
        <select
          id={id}
          className="input"
          value={filters[filter.name]}
          onChange={(event) => onFilterChange(filter.name, event.target.value)}
        >
          <option value="all">{filter.allLabel}</option>
          {filter.options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormField>
    );
  });
}
