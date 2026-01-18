// configureRoutes.tsx
import React from 'react';
import {
  createBrowserRouter,
  redirect
} from 'react-router-dom';

// Layout raiz
import App from './components/App';

// Páginas
import WelcomePage from './components/WelcomePage';
import FindOwnersPage from './components/owners/FindOwnersPage';
import OwnersPage from './components/owners/OwnersPage';
import NewOwnerPage from './components/owners/NewOwnerPage';
import EditOwnerPage from './components/owners/EditOwnerPage';
import NewPetPage from './components/pets/NewPetPage';
import EditPetPage from './components/pets/EditPetPage';
import VisitsPage from './components/visits/VisitsPage';
import VetsPage from './components/vets/VetsPage';
import ErrorPage from './components/ErrorPage';
import NotFoundPage from './components/NotFoundPage';

// Nota: Em v7, usamos rotas como objetos; o "index" substitui IndexRoute.
export const router = createBrowserRouter([
  {
    element: <App />,
    // (Opcional) errorElement geral para tratar erros de rotas/carregamento
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <WelcomePage /> },               // '/' (index)
      { path: '/owners/list', element: <FindOwnersPage /> },
      { path: '/owners/new', element: <NewOwnerPage /> },
      { path: '/owners/:ownerId/edit', element: <EditOwnerPage /> },
      { path: '/owners/:ownerId/pets/:petId/edit', element: <EditPetPage /> },
      { path: '/owners/:ownerId/pets/new', element: <NewPetPage /> },
      { path: '/owners/:ownerId/pets/:petId/visits/new', element: <VisitsPage /> },
      { path: '/owners/:ownerId', element: <OwnersPage /> },
      { path: '/vets', element: <VetsPage /> },
      { path: '/error', element: <ErrorPage /> },
      { path: '*', element: <NotFoundPage /> }                  // fallback SPA
    ]
  }
]);

export default router;
