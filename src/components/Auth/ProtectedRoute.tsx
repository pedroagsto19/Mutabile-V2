import React, { useState, useEffect } from 'react';
import { LoginForm } from './LoginForm';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  fallbackMessage?: string;
  fallbackTitle?: string;
}

export function ProtectedRoute({
  children,
  requiredPermission,
  fallbackMessage,
  fallbackTitle
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, error, hasPermission } = useAuth();
  const [showFallback, setShowFallback] = useState(false);

  // Show fallback after 10 seconds if still loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setShowFallback(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [isLoading]);

  // Loading state
  if (isLoading && !showFallback) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação com Supabase...</p>
          <p className="text-sm text-gray-500 mt-2">
            Conectando com o sistema de autenticação
          </p>
        </div>
      </div>
    );
  }

  // Loading fallback with retry option
  if (isLoading && showFallback) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">A verificação está demorando mais que o esperado...</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800 mb-3">
              Isso pode indicar problemas de conectividade com o Supabase Authentication.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show error if there's a connection issue or inactive account
  if (error && !isAuthenticated) {
    const isInactiveAccount = error.includes('desativada');

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className={`border rounded-lg p-6 ${isInactiveAccount ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'}`}>
            <h3 className={`text-lg font-medium mb-2 ${isInactiveAccount ? 'text-orange-900' : 'text-red-900'}`}>
              {isInactiveAccount ? 'Conta Desativada' : 'Erro de Conexão'}
            </h3>
            <p className={`text-sm mb-4 ${isInactiveAccount ? 'text-orange-700' : 'text-red-700'}`}>{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className={`w-full px-4 py-2 text-white rounded-lg transition-colors ${isInactiveAccount ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {isInactiveAccount ? 'Voltar ao Login' : 'Tentar Novamente'}
              </button>
              {!isInactiveAccount && (
                <p className="text-xs text-red-600">
                  Se o problema persistir, verifique se o Supabase está configurado corretamente.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={() => window.location.reload()} />;
  }

  // Check permissions if required - if no permission, don't render anything
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return null;
  }

  // Show children if authenticated and has permission
  return <>{children}</>;
}