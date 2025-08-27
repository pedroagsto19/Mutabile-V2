import React, { useState } from 'react';
import { MainMenu } from './components/MainMenu/MainMenu';
import { WorksApp } from './components/Works/WorksApp';
import { LoginForm } from './components/Auth/LoginForm';
import { ProjectProvider } from './context/ProjectContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SupplierApp } from './components/Suppliers/SupplierApp';
import { NotificationProvider } from './context/NotificationContext';

// Initialize demo data if needed
import { supabase } from './lib/supabase';

async function initializeDemoData() {
  try {
    // Check if users already exist
    const { data: existingUsers, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error checking existing users:', error);
      return;
    }
    
    // If no users exist, create demo users
    if (!existingUsers || existingUsers.length === 0) {
      const demoUsers = [
        {
          name: 'Marina Costa',
          email: 'marina@mutabile.com.br',
          role: 'Administradora',
          auth_level: 'admin',
          password_hash: '1804289383', // hash of 'admin123'
          team_id: 'team1'
        },
        {
          name: 'Ana Silva',
          email: 'ana@mutabile.com.br',
          role: 'Gerente de Projetos',
          auth_level: 'gestor',
          password_hash: '846930886', // hash of 'gestor123'
          team_id: 'team1'
        },
        {
          name: 'Carlos Santos',
          email: 'carlos@mutabile.com.br',
          role: 'Arquiteto',
          auth_level: 'equipe',
          password_hash: '1681692777', // hash of 'equipe123'
          team_id: 'team1'
        },
        {
          name: 'João Oliveira',
          email: 'joao@mutabile.com.br',
          role: 'Cliente',
          auth_level: 'leitor',
          password_hash: '1714636915', // hash of 'leitor123'
          team_id: 'team1'
        }
      ];
      
      const { error: insertError } = await supabase
        .from('users')
        .insert(demoUsers);
      
      if (insertError) {
        console.error('Error creating demo users:', insertError);
      } else {
        console.log('Demo users created successfully');
      }
    }
  } catch (error) {
    console.error('Error initializing demo data:', error);
  }
}

function AppContent() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  
  // Initialize demo data on first load
  React.useEffect(() => {
    initializeDemoData();
  }, []);

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
      return (
        <ProjectProvider>
          <SupplierApp onBackToMenu={handleBackToMenu} />
        </ProjectProvider>
      );
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
      <NotificationProvider>
        <ProjectProvider>
          <AppContent />
        </ProjectProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;