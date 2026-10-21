import FormField from './FormField.jsx';
import { PAGE_SIZES } from '../utils/constants.js';

// [1, 'gap-start', 7, 8, 9, 'gap-end', 16] — at most 7 slots.
// Gaps get string ids so every slot has a stable, unique key.
function getPageItems(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const start = Math.max(2, Math.min(page - 1, totalPages - 4));
  const end = Math.min(totalPages - 1, Math.max(page + 1, 5));
  const items = [1];
  if (start > 2) items.push('gap-start');
  for (let current = start; current <= end; current += 1) items.push(current);
  if (end < totalPages - 1) items.push('gap-end');
  items.push(totalPages);
  return items;
}

export default function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <nav className="pagination" aria-label="Pagination">
      <FormField id="page-size" label="Per page" className="pagination__size">
        <select
          id="page-size"
          className="input"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </FormField>

      {totalPages > 1 && (
        <div className="pagination__pages">
          <button
            type="button"
            className="pagination__button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            <span aria-hidden="true">‹</span> Prev
          </button>
          <p className="pagination__status">Page {page} of {totalPages}</p>
          <ul className="pagination__list">
            {getPageItems(page, totalPages).map((item) =>
              typeof item === 'number' ? (
                <li key={item}>
                  <button
                    type="button"
                    className="pagination__button pagination__number"
                    onClick={() => onPageChange(item)}
                    aria-current={item === page ? 'page' : undefined}
                    aria-label={`Page ${item}`}
                  >
                    {item}
                  </button>
                </li>
              ) : (
                <li key={item} className="pagination__gap" aria-hidden="true">…</li>
              ),
            )}
          </ul>
          <button
            type="button"
            className="pagination__button"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
          >
            Next <span aria-hidden="true">›</span>
          </button>
        </div>
      )}
    </nav>
  );
}
