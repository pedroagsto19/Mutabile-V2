import React from 'react';
import { useAuth } from '../../context/AuthContext';
import type { Permission } from '../../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: keyof Permission;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  fallback = <div className="text-center py-8 text-gray-500">Acesso negado</div> 
}: ProtectedRouteProps) {
  const { hasPermission } = useAuth();

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}