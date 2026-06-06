import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#0a0f24',
        color: '#f8fafc'
      }}>
        <div className="bold">Loading Portal...</div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not logged in
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to home page/dashboard if unauthorized
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
