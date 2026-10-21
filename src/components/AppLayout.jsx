import { NavLink, Outlet, ScrollRestoration } from 'react-router-dom';
import SimulatedErrorBanner from './SimulatedErrorBanner.jsx';

export default function AppLayout() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__inner">
          <NavLink to="/" className="brand" end>
            <svg className="brand__logo" viewBox="0 0 32 32" aria-hidden="true">
              <rect width="32" height="32" rx="8" />
              <path d="M7 19.5 9.3 13a2 2 0 0 1 1.9-1.4h9.6a2 2 0 0 1 1.9 1.4l2.3 6.5V23a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1h-11v1a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z" />
            </svg>
            <span className="brand__name">FleetDesk</span>
            <span className="brand__city">Almaty</span>
          </NavLink>
          <nav className="app-nav" aria-label="Main">
            <NavLink to="/" end className="app-nav__link">Fleet</NavLink>
            <NavLink to="/vehicles/new" className="app-nav__link">Add vehicle</NavLink>
          </nav>
        </div>
      </header>
      <SimulatedErrorBanner />
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        FleetDesk · car-sharing dispatch for Almaty · demo data is stored in this browser
      </footer>
      <ScrollRestoration />
    </div>
  );
}
