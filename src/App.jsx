import { createHashRouter, RouterProvider } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
import NewVehiclePage from './pages/NewVehiclePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import VehicleDetailsPage from './pages/VehicleDetailsPage.jsx';
import VehiclesPage from './pages/VehiclesPage.jsx';

// Hash URLs (#/vehicles/veh-0001) work on any static host without rewrite rules.
const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <VehiclesPage /> },
      { path: 'vehicles/new', element: <NewVehiclePage /> },
      { path: 'vehicles/:id', element: <VehicleDetailsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
