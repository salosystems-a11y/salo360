import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';

const ProtectedRoute = ({ children, requiredPermission, requiredRoles, requiredFeature }) => {
  const { user, loading: authLoading } = useAuth();
  const { roles: allRoles, loading: dataLoading } = useData();
  const location = useLocation();

  const isLoading = authLoading || dataLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="text-center">
          <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4 mx-auto"></div>
          <h2 className="text-xl font-semibold text-foreground">A carregar...</h2>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.isTemporary) {
    if (location.pathname !== '/projects') {
      return <Navigate to="/projects" state={{ from: location, selectedProjectId: user.projectId }} replace />;
    }
  }

  const userRoleDetails = allRoles.find(r => r.id === user.role);

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  if (requiredPermission) {
    if (!userRoleDetails || !userRoleDetails.permissions || !userRoleDetails.permissions.includes(requiredPermission)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;