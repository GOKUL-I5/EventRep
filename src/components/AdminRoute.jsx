import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { currentUser, userData, loading } = useAuth();

  if (loading || !userData) {
    return <div>Loading...</div>; // Or a custom spinner
  }

  if (!currentUser || userData.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
