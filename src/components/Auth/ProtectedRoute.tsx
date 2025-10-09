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

  // Show error if there's a connection issue
  if (error && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-red-900 mb-2">Erro de Conexão</h3>
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Tentar Novamente
              </button>
              <p className="text-xs text-red-600">
                Se o problema persistir, verifique se o Supabase está configurado corretamente.
              </p>
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

  // Check permissions if required
  if (requiredPermission && !hasPermission(requiredPermission)) {
    const title = fallbackTitle || 'Sem Projetos Disponíveis';
    const message = fallbackMessage || 'Não existem projetos atribuídos a você no momento.';

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-2">{title}</h3>
            <p className="text-sm text-blue-700">
              {message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show children if authenticated and has permission
  return <>{children}</>;
}