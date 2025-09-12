// src/App.tsx
import React, { useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { MainMenu } from "./components/MainMenu/MainMenu";
import { initializeDemoData } from "./lib/initializeDemoData";
import { hasValidSession } from "./lib/supabase";
import { NotificationSystemProvider } from "./context/NotificationSystemContext";

// Ajuste estes caminhos conforme seus arquivos
import { WorksApp } from "./components/Works/WorksApp";
import { SupplierApp } from "./components/Suppliers/SupplierApp";
import { NotificationProvider } from "./context/NotificationContext";
import { ProjectProvider } from "./context/ProjectContext";

function AppContent() {
  const [currentModule, setCurrentModule] = React.useState<string | null>(null);

  useEffect(() => {
    const initData = async () => {
      try {
        // Sempre inicializar dados demo, independente da sessão
        console.log("Inicializando dados demo...");
        await initializeDemoData();
      } catch (error) {
        console.error("Erro ao inicializar dados demo:", error);
      }
    };
    initData();
  }, []);

  const handleModuleSelect = (module: string) => setCurrentModule(module);
  const handleBackToMenu = () => setCurrentModule(null);

  const renderContent = () => {
    switch (currentModule) {
      case "obras":
        return <WorksApp onBackToMenu={handleBackToMenu} />;
      case "fornecedores":
        return <SupplierApp onBackToMenu={handleBackToMenu} />;
      default:
        return (
          <MainMenu
            onModuleSelect={handleModuleSelect}
            currentUser={{ name: "Usuário", authLevel: "admin", role: "Administrador" }}
          />
        );
    }
  };

  return (
    <ProtectedRoute>
      {renderContent()}
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationSystemProvider>
        <NotificationProvider>
          <ProjectProvider>
            <AppContent />
          </ProjectProvider>
        </NotificationProvider>
      </NotificationSystemProvider>
    </AuthProvider>
  );
}
