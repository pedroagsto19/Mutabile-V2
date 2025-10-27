import React, { useEffect, useMemo, useState } from "react";
import { WorksHeader } from "../Layout/WorksHeader";
import { DashboardOverview } from "../Dashboard/DashboardOverview";
import { ProjectsTable } from "../Projects/ProjectsTable";
import { ProjectDetail } from "../Projects/ProjectDetail";
import { ProjectForm } from "../Projects/ProjectForm";
import { ProtectedRoute } from "../Auth/ProtectedRoute";
import { useLocation, useNavigate } from "react-router-dom";
import type { Project } from "../../types";

type View = "dashboard" | "projects" | "project-detail";

export function WorksApp({ onBackToMenu }: { onBackToMenu?: () => void } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProjectForm, setShowProjectForm] = useState(false);

  const { currentView, selectedProjectId, projectViewMode } = useMemo(() => {
    const path = location.pathname;
    const projectMatch = path.match(/\/obras\/projects\/([^/]+)(?:\/(gantt))?/);

    if (projectMatch) {
      return {
        currentView: "project-detail" as View,
        selectedProjectId: decodeURIComponent(projectMatch[1]),
        projectViewMode: projectMatch[2] === "gantt" ? "gantt" : "detail" as const
      };
    }

    if (path.startsWith("/obras/projects")) {
      return {
        currentView: "projects" as View,
        selectedProjectId: null,
        projectViewMode: "detail" as const
      };
    }

    return {
      currentView: "dashboard" as View,
      selectedProjectId: null,
      projectViewMode: "detail" as const
    };
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === "/obras" || location.pathname === "/obras/") {
      navigate("/obras/dashboard", { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleBackToMenu = () => {
    if (onBackToMenu) {
      onBackToMenu();
    } else {
      navigate("/", { replace: false });
    }
  };

  const handleProjectSelect = (projectId: string) => {
    navigate(`/obras/projects/${encodeURIComponent(projectId)}`);
  };

  const handleProjectGantt = (projectId: string) => {
    navigate(`/obras/projects/${encodeURIComponent(projectId)}/gantt`);
  };

  const handleBackToProjects = () => {
    navigate("/obras/projects");
  };

  const handleProjectCreated = (_project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    setShowProjectForm(false);
  };

  const handleViewChange = (view: View) => {
    if (view === "dashboard") {
      navigate("/obras/dashboard");
    } else if (view === "projects") {
      navigate("/obras/projects");
    }
  };

  const handleNavigateToProject = (projectId: string) => {
    handleProjectSelect(projectId);
  };

  const handleNavigateToActivity = (projectId: string, activityId: string) => {
    navigate(`/obras/projects/${encodeURIComponent(projectId)}?activity=${encodeURIComponent(activityId)}`);
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

    if (currentView === "projects") {
      return (
        <ProjectsTable
          onProjectSelect={handleProjectSelect}
          onProjectGantt={handleProjectGantt}
          onCreateProject={() => setShowProjectForm(true)}
        />
      );
    }

    return <DashboardOverview onProjectSelect={handleProjectSelect} />;
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "Heebo, sans-serif" }}>
      <WorksHeader
        currentView={currentView}
        onViewChange={handleViewChange}
        onBackToMenu={handleBackToMenu}
        onNavigateToProject={handleNavigateToProject}
        onNavigateToActivity={handleNavigateToActivity}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">{renderContent()}</main>

      <ProtectedRoute requiredPermission="canCreateProjects">
        <ProjectForm
          isOpen={showProjectForm}
          onClose={() => setShowProjectForm(false)}
          onSubmit={handleProjectCreated}
        />
      </ProtectedRoute>
    </div>
  );
}
