import React, { useState } from 'react';
import { WorksHeader } from '../Layout/WorksHeader';
import { DashboardOverview } from '../Dashboard/DashboardOverview';
import { ProjectsTable } from '../Projects/ProjectsTable';
import { ProjectDetail } from '../Projects/ProjectDetail';
import { ProjectForm } from '../Projects/ProjectForm';
import { ProtectedRoute } from '../Auth/ProtectedRoute';
import { SupplierApp } from '../Suppliers/SupplierApp';

interface WorksAppProps {
  onBackToMenu: () => void;
}

export function WorksApp({ onBackToMenu }: WorksAppProps) {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectViewMode, setProjectViewMode] = useState<'detail' | 'gantt'>('detail');
  const [showProjectForm, setShowProjectForm] = useState(false);


  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setProjectViewMode('detail');
    setCurrentView('project-detail');
  };

  const handleProjectGantt = (projectId: string) => {
    setSelectedProjectId(projectId);
    setProjectViewMode('gantt');
    setCurrentView('project-detail');
  };

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
    setProjectViewMode('detail');
    setCurrentView('projects');
  };

  const handleProjectCreated = (projectData: any) => {
    setShowProjectForm(false);
  };

  const renderContent = () => {
    if (selectedProjectId && currentView === 'project-detail') {
      return (
        <ProjectDetail 
          projectId={selectedProjectId} 
          initialTab={projectViewMode}
          onBack={handleBackToProjects}
        />
      );
    case 'fornecedores':
      return <SupplierApp onBackToMenu={onBackToMenu} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <DashboardOverview onProjectSelect={handleProjectSelect} />;
      case 'projects':
        return (
          <ProtectedRoute requiredPermission="canViewReports">
            <ProjectsTable 
              onProjectSelect={handleProjectSelect}
              onProjectGantt={handleProjectGantt}
              onCreateProject={() => setShowProjectForm(true)}
            />
          </ProtectedRoute>
        );
      default:
        return <DashboardOverview onProjectSelect={handleProjectSelect} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Heebo, sans-serif' }}>
      <WorksHeader 
        currentView={currentView} 
        onViewChange={setCurrentView}
        onBackToMenu={onBackToMenu}
      />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {renderContent()}
      </main>

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