import React from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './configureRoutes';

const Root: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default Root;
