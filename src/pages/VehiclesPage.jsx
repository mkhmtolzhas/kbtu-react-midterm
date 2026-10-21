import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import FilterPanel from '../components/FilterPanel.jsx';
import FleetSummary from '../components/FleetSummary.jsx';
import Pagination from '../components/Pagination.jsx';
import SearchBar from '../components/SearchBar.jsx';
import SortControl from '../components/SortControl.jsx';
import Spinner from '../components/Spinner.jsx';
import VehicleGrid from '../components/VehicleGrid.jsx';
import { listVehicles } from '../api/vehiclesApi.js';
import { isAbortError } from '../api/network.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { useSessionState } from '../hooks/useSessionState.js';
import { PAGE_SIZES } from '../utils/constants.js';
import { pluralize } from '../utils/format.js';

const SEARCH_DEBOUNCE_MS = 400;
const DEFAULT_FILTERS = { status: 'all', vehicleClass: 'all', district: 'all' };
const DEFAULT_QUERY = {
  ...DEFAULT_FILTERS,
  sortBy: 'plate',
  sortDir: 'asc',
  page: 1,
  pageSize: PAGE_SIZES[0],
};

export default function VehiclesPage() {
  // What the user types: updates on every keystroke (controlled input).
  const [searchInput, setSearchInput] = useSessionState('fleetdesk.list.search', '');
  // Everything else the API needs. Always replaced with a new object, never mutated.
  const [query, setQuery] = useSessionState('fleetdesk.list.query', DEFAULT_QUERY);

  const [result, setResult] = useState(null);
  const [loadState, setLoadState] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // What is actually sent to the API: the input after 400 ms of silence.
  const search = useDebouncedValue(searchInput.trim(), SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    const controller = new AbortController();
    setLoadState('loading');

    listVehicles({ ...query, search }, { signal: controller.signal })
      .then((data) => {
        // Both updates are batched into a single re-render.
        setResult(data);
        setLoadState('success');
      })
      .catch((requestError) => {
        // An aborted request belongs to outdated parameters: ignore it.
        if (isAbortError(requestError)) return;
        setError(requestError);
        setLoadState('error');
      });

    // Runs before the next request and on unmount: cancels the outdated request,
    // so a slow old response can never overwrite a newer one.
    return () => controller.abort();
  }, [query, search, reloadKey]);

  function handleSearchChange(value) {
    setSearchInput(value);
    // Returning `prev` unchanged lets React skip the update entirely.
    setQuery((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
  }

  function handleFilterChange(name, value) {
    setQuery((prev) => ({ ...prev, [name]: value, page: 1 }));
  }

  function handleStatusTileSelect(status) {
    // Clicking the active tile again turns the status filter off.
    setQuery((prev) => ({
      ...prev,
      status: prev.status === status ? 'all' : status,
      page: 1,
    }));
  }

  function handleSortByChange(sortBy) {
    setQuery((prev) => ({ ...prev, sortBy, page: 1 }));
  }

  function handleSortDirToggle() {
    setQuery((prev) => ({ ...prev, sortDir: prev.sortDir === 'asc' ? 'desc' : 'asc', page: 1 }));
  }

  function handlePageChange(page) {
    setQuery((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handlePageSizeChange(pageSize) {
    setQuery((prev) => ({ ...prev, pageSize, page: 1 }));
  }

  function handleResetFilters() {
    setSearchInput('');
    setQuery((prev) => ({ ...prev, ...DEFAULT_FILTERS, page: 1 }));
  }

  function handleRetry() {
    setReloadKey((key) => key + 1);
  }

  const hasActiveFilters = searchInput.trim() !== ''
    || Object.keys(DEFAULT_FILTERS).some((name) => query[name] !== DEFAULT_FILTERS[name]);
  const isSearchPending = searchInput.trim() !== search;
  const isBusy = loadState === 'loading' || isSearchPending;

  let content;
  if (loadState === 'error') {
    content = (
      <ErrorMessage title="Could not load vehicles" message={error.message} onRetry={handleRetry} />
    );
  } else if (result === null || (isBusy && result.items.length === 0)) {
    content = <Spinner label="Loading vehicles…" />;
  } else if (result.total === 0) {
    content = (
      <EmptyState
        title="No vehicles match"
        message="Nothing in the fleet fits this search and these filters. Try widening them."
      >
        <button type="button" className="button button--primary" onClick={handleResetFilters}>
          Reset filters
        </button>
      </EmptyState>
    );
  } else if (result.items.length === 0) {
    content = (
      <EmptyState title="This page is empty" message="The fleet has fewer pages than the one you opened.">
        <button type="button" className="button button--primary" onClick={() => handlePageChange(1)}>
          Go to first page
        </button>
      </EmptyState>
    );
  } else {
    content = (
      <>
        <VehicleGrid vehicles={result.items} busy={isBusy} />
        <Pagination
          page={result.page}
          pageSize={result.pageSize}
          total={result.total}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </>
    );
  }

  // While new data loads, the previous summary stays visible with an "Updating…" mark.
  let summary = '';
  if (result && loadState !== 'error' && result.items.length > 0) {
    const from = (result.page - 1) * result.pageSize + 1;
    const to = from + result.items.length - 1;
    summary = `Showing ${from}–${to} of ${pluralize(result.total, 'vehicle')}`;
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Fleet overview</h1>
          <p className="page-header__subtitle">
            Find a car, check its fuel and service state, and open it to change its status.
          </p>
        </div>
        <Link className="button button--primary" to="/vehicles/new">
          <span aria-hidden="true">+</span> Add vehicle
        </Link>
      </header>

      <FleetSummary activeStatus={query.status} onStatusSelect={handleStatusTileSelect} />

      <section className="toolbar" aria-label="Search, filter and sort">
        <SearchBar value={searchInput} onChange={handleSearchChange} />
        <div className="toolbar__controls">
          <FilterPanel filters={query} onFilterChange={handleFilterChange} />
          <SortControl
            sortBy={query.sortBy}
            sortDir={query.sortDir}
            onSortByChange={handleSortByChange}
            onSortDirToggle={handleSortDirToggle}
          />
          <button
            type="button"
            className="button button--ghost toolbar__reset"
            onClick={handleResetFilters}
            disabled={!hasActiveFilters}
          >
            Reset filters
          </button>
        </div>
      </section>

      <section className="results" aria-label="Vehicles">
        <p className="results__summary" aria-live="polite">
          {summary}
          {summary && isBusy && <span className="results__updating"> · Updating…</span>}
        </p>
        {content}
      </section>
    </div>
  );
}
