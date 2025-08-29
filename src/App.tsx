import React, { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { AppHeader } from './components/Layout/AppHeader';
import { MainMenu } from './components/MainMenu/MainMenu';
import { initializeDemoData } from './lib/initializeDemoData';
import { hasValidSession } from './lib/supabase';

function AppContent() {
  const [currentModule, setCurrentModule] = React.useState<string | null>(null);

  // Initialize demo data only after authentication
  useEffect(() => {
    const initData = async () => {
      try {
        const hasSession = await hasValidSession();
        if (hasSession) {
          console.log('Usuário autenticado, inicializando dados demo...');
          await initializeDemoData();
        }
      } catch (error) {
        console.error('Erro ao inicializar dados demo:', error);
        // Don't throw - app should still work without demo data
      }
    };

    initData();
  }, []);

  const handleModuleSelect = (module: string) => {
    setCurrentModule(module);
  };

  const handleBackToMenu = () => {
    setCurrentModule(null);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <MainMenu 
            onModuleSelect={handleModuleSelect}
            currentUser={{
              name: 'Usuário',
              authLevel: 'admin',
              role: 'Administrador'
            }}
          />
        </main>
      </div>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;