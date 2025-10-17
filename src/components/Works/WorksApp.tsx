import React, { useState } from "react";
import { WorksHeader } from "../Layout/WorksHeader";
import { DashboardOverview } from "../Dashboard/DashboardOverview";
import { ProjectsTable } from "../Projects/ProjectsTable";
import { ProjectDetail } from "../Projects/ProjectDetail";
import { ProjectForm } from "../Projects/ProjectForm";
import { SupplierApp } from "../Suppliers/SupplierApp";
import { ProtectedRoute } from "../Auth/ProtectedRoute";
import { ClientProvider } from "../../context/ClientContext";

type View =
  | "dashboard"
  | "projects"
  | "project-detail"
  | "fornecedores";

interface WorksAppProps {
  onBackToMenu: () => void;
}

export function WorksApp({ onBackToMenu }: WorksAppProps) {
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectViewMode, setProjectViewMode] = useState<"detail" | "gantt">("detail");
  const [showProjectForm, setShowProjectForm] = useState(false);

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setProjectViewMode("detail");
    setCurrentView("project-detail");
  };

  const handleProjectGantt = (projectId: string) => {
    setSelectedProjectId(projectId);
    setProjectViewMode("gantt");
    setCurrentView("project-detail");
  };

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
    setProjectViewMode("detail");
    setCurrentView("projects");
  };

  const handleProjectCreated = (_projectData: any) => {
    setShowProjectForm(false);
  };

  const renderContent = () => {
    if (selectedProjectId && currentView === "project-detail") {
      return (
        <ProjectDetail
          projectId={selectedProjectId}
          initialTab={projectViewMode}
          onBack={handleBackToProjects}
        />
      );
    }

    switch (currentView) {
      case "dashboard":
        return (
          <DashboardOverview
            onProjectSelect={handleProjectSelect}
            onCreateProject={() => setShowProjectForm(true)}
          />
        );

      case "projects":
        // Todos os usuários autenticados podem ver a lista de projetos
        return (
          <ProjectsTable
            onProjectSelect={handleProjectSelect}
            onProjectGantt={handleProjectGantt}
            onCreateProject={() => setShowProjectForm(true)}
          />
        );

      case "fornecedores":
        return <SupplierApp onBackToMenu={onBackToMenu} />;

      default:
        return (
          <DashboardOverview
            onProjectSelect={handleProjectSelect}
            onCreateProject={() => setShowProjectForm(true)}
          />
        );
    }
  };

  return (
    <ClientProvider>
      <div className="min-h-screen bg-gray-50" style={{ fontFamily: "Heebo, sans-serif" }}>
        <WorksHeader
          currentView={currentView}
          onViewChange={setCurrentView}
          onBackToMenu={onBackToMenu}
        />

        <main className="max-w-7xl mx-auto px-6 py-8">{renderContent()}</main>

        {/* Gate de criação por permissão específica */}
        <ProtectedRoute requiredPermission="canCreateProjects">
          <ProjectForm
            isOpen={showProjectForm}
            onClose={() => setShowProjectForm(false)}
            onSubmit={handleProjectCreated}
          />
        </ProtectedRoute>
      </div>
    </ClientProvider>
  );
}
