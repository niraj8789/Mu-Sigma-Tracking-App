import React from 'react';
import { Route, Navigate } from 'react-router-dom';

const PrivateRoute = ({ element, loggedIn, ...rest }) => {
  return (
    <Route
      {...rest}
      element={loggedIn ? element : <Navigate to="/login" />}
    />
  );
};

export default PrivateRoute