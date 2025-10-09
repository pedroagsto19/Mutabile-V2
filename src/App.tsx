// src/App.tsx
import React, { useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { MainMenu } from "./components/MainMenu/MainMenu";
import { NotificationSystemProvider } from "./context/NotificationSystemContext";

// Ajuste estes caminhos conforme seus arquivos
import { WorksApp } from "./components/Works/WorksApp";
import { SupplierApp } from "./components/Suppliers/SupplierApp";
import { ClientApp } from "./components/Clients/ClientApp";
import { MyActivitiesView } from "./components/Projects/MyActivitiesView";
import { WorksHeader } from "./components/Layout/WorksHeader";
import { NotificationProvider } from "./context/NotificationContext";
import { ProjectProvider } from "./context/ProjectContext";
import { ClientProvider } from "./context/ClientContext";

function AppContent() {
  const [currentModule, setCurrentModule] = React.useState<string | null>(null);

  const handleModuleSelect = (module: string) => setCurrentModule(module);
  const handleBackToMenu = () => setCurrentModule(null);

  const renderContent = () => {
    switch (currentModule) {
      case "projetos":
        return (
          <div className="min-h-screen bg-gray-50">
            <WorksHeader onBackToMenu={handleBackToMenu} title="Meus Projetos" />
            <main className="max-w-7xl mx-auto px-6 py-8">
              <MyActivitiesView />
            </main>
          </div>
        );
      case "obras":
        return <WorksApp onBackToMenu={handleBackToMenu} />;
      case "fornecedores":
        return <SupplierApp onBackToMenu={handleBackToMenu} />;
      case "clientes":
        return <ClientApp onBackToMenu={handleBackToMenu} />;
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
          <ClientProvider>
            <ProjectProvider>
              <AppContent />
            </ProjectProvider>
          </ClientProvider>
        </NotificationProvider>
      </NotificationSystemProvider>
    </AuthProvider>
  );
}
