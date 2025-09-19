import React from 'react';
import { LoginForm } from './LoginForm';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, error } = useAuth();
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

  if (isLoading) {
    if (showFallback) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600 mb-4">Verificando autenticação...</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                A verificação está demorando mais que o esperado. 
                Isso pode indicar problemas de conectividade com o Supabase.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg max-w-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={() => {}} />;
  }

  // If a specific permission is required but we don't have permission system,
  // just show the children (for now)
  if (requiredPermission) {
    // In a real app, you'd check permissions here
    // For now, just allow access
  }

  return <>{children}</>;
}