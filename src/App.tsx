import React, { useState } from 'react';
import { MainMenu } from './components/MainMenu/MainMenu';
import { WorksApp } from './components/Works/WorksApp';
import { LoginForm } from './components/Auth/LoginForm';
import { ProjectProvider } from './context/ProjectContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SupplierApp } from './components/Suppliers/SupplierApp';

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentModule, setCurrentModule] = useState<string | null>(null);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated || !user) {
    return <LoginForm />;
  }

  const handleModuleSelect = (module: string) => {
    setCurrentModule(module);
  };

  const handleBackToMenu = () => {
    setCurrentModule(null);
  };

  // If no module is selected, show main menu
  if (!currentModule) {
    return (
      <MainMenu 
        onModuleSelect={handleModuleSelect}
        currentUser={{
          name: user.name,
          authLevel: user.authLevel,
          role: user.role
        }}
      />
    );
  }

  // Render the selected module
  switch (currentModule) {
    case 'obras':
      return (
        <ProjectProvider>
          <WorksApp onBackToMenu={handleBackToMenu} />
        </ProjectProvider>
      );
    case 'fornecedores':
      return <SupplierApp onBackToMenu={handleBackToMenu} />;
    default:
      return (
        <MainMenu 
          onModuleSelect={handleModuleSelect}
          currentUser={user}
        />
      );
  }
}

function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <AppContent />
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;