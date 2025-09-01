// App.tsx
import React, { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { AppHeader } from './components/Layout/AppHeader';
import { MainMenu } from './components/MainMenu/MainMenu';
import { initializeDemoData } from './lib/initializeDemoData';
import { hasValidSession } from './lib/supabase';

// importe a página do módulo
import { AcompanhamentoObrasPage } from './components/projects/ProjectsTable.tsx'; 
// ajuste o caminho conforme seu projeto

function AppContent() {
  const [currentModule, setCurrentModule] = React.useState<string | null>(null);

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

  const renderContent = () => {
    switch (currentModule) {
      case 'obras':
        return <AcompanhamentoObrasPage onBack={handleBackToMenu} />;
      // case 'fornecedores':
      //   return <FornecedoresPage onBack={handleBackToMenu} />;
      default:
        return (
          <MainMenu
            onModuleSelect={handleModuleSelect}
            currentUser={{ name: 'Usuário', authLevel: 'admin', role: 'Administrador' }}
          />
        );
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <AppHeader onBack={currentModule ? handleBackToMenu : undefined} />
        <main className="max-w-7xl mx-auto px-6 py-8">
          {renderContent()}
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
