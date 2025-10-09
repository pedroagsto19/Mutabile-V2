import React from 'react';
import { useState } from 'react';
import { TrendingUp, Clock, AlertTriangle, CheckCircle, Calendar, User } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../UI/Card';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { ProgressBar } from '../UI/ProgressBar';
import { ProjectsGanttOverview } from './ProjectsGanttOverview';
import { useProject } from '../../context/ProjectContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardOverviewProps {
  onProjectSelect?: (projectId: string) => void;
}

export function DashboardOverview({ onProjectSelect }: DashboardOverviewProps) {
  const { projects } = useProject();
  const [showActiveProjectsModal, setShowActiveProjectsModal] = useState(false);
  const [showRiskProjectsModal, setShowRiskProjectsModal] = useState(false);
  const [showCompletedProjectsModal, setShowCompletedProjectsModal] = useState(false);
  const [showAllProjectsModal, setShowAllProjectsModal] = useState(false);

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'in_progress').length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
    averageProgress: Math.round(
      projects.reduce((acc, p) => acc + p.progress, 0) / (projects.length || 1)
    ),
    projectsAtRisk: projects.filter(p => p.risk === 'at_risk' || p.risk === 'delayed').length,
  };

  const recentProjects = projects
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5);

  const upcomingDeadlines = projects
    .filter(p => p.nextDeadline)
    .sort((a, b) => 
      (a.nextDeadline?.getTime() || 0) - (b.nextDeadline?.getTime() || 0)
    )
    .slice(0, 5);

  const activeProjects = projects.filter(p => p.status === 'in_progress');
  const riskProjects = projects.filter(p => p.risk === 'at_risk' || p.risk === 'delayed');
  const completedProjects = projects.filter(p => p.status === 'completed');
  const allProjects = projects; // Todos os projetos

  const StatCard = ({ title, value, icon: Icon, color, onClick }: any) => (
    <Card>
      <CardContent className={onClick ? 'cursor-pointer hover:bg-gray-50 transition-all duration-200 group' : ''} onClick={onClick}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm transition-colors duration-200 ${onClick ? 'text-gray-500 group-hover:text-gray-700' : 'text-gray-500'}`}>{title}</p>
            <p className={`text-2xl font-bold transition-colors duration-200 ${onClick ? 'text-gray-900 group-hover:text-blue-600' : 'text-gray-900'}`}>{value}</p>
          </div>
          <Icon className={`h-8 w-8 transition-all duration-200 ${color} ${onClick ? 'group-hover:scale-110' : ''}`} />
        </div>
      </CardContent>
    </Card>
  );

  const getCurrentActivities = (project: any) => {
    const today = new Date();
    const activities = project.stages.flatMap((stage: any) => 
      stage.activities.filter((activity: any) => 
        activity.status === 'in_progress' || 
        (activity.plannedStartDate <= today && activity.status === 'not_started')
      )
    );
    return activities;
  };

  const ProjectDetailsModal = ({ 
    isOpen, 
    onClose, 
    title, 
    projects: modalProjects 
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    projects: any[];
  }) => (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="space-y-4">
        {modalProjects.map((project) => {
          const currentActivities = getCurrentActivities(project);
          
          return (
            <div key={project.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 
                    className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                    onClick={() => {
                      onProjectSelect?.(project.id);
                      onClose();
                    }}
                  >
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-600">{project.client} • {project.location}</p>
                  <p className="text-sm text-gray-500">Responsável: {project.responsible}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      project.status === 'completed' ? 'bg-green-100 text-green-800' :
                      project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      project.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status === 'completed' ? 'Concluído' :
                       project.status === 'in_progress' ? 'Em Andamento' :
                       project.status === 'on_hold' ? 'Pausado' : 'Planejamento'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      project.risk === 'delayed' ? 'bg-red-100 text-red-800' :
                      project.risk === 'at_risk' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {project.risk === 'delayed' ? 'Atrasado' :
                       project.risk === 'at_risk' ? 'Em Risco' : 'No Prazo'}
                    </span>
                  </div>
                  <div className="w-32">
                    <ProgressBar value={project.progress} showLabel />
                  </div>
                </div>
              </div>
              
              {/* Current Activities */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Atividades Atuais ({currentActivities.length})
                </h4>
                {currentActivities.length > 0 ? (
                  <div className="space-y-2">
                    {currentActivities.slice(0, 3).map((activity: any) => (
                      <div key={activity.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                            <p className="text-xs text-gray-600">
                              Responsável: {activity.responsible}
                            </p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-gray-500">
                                Início: {format(activity.plannedStartDate, 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                              <span className="text-xs text-gray-500">
                                Fim: {format(activity.plannedEndDate, 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                              activity.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.status === 'completed' ? 'Concluída' :
                               activity.status === 'in_progress' ? 'Em Andamento' : 'Não Iniciada'}
                            </span>
                            <div className="w-16 mt-1">
                              <ProgressBar value={activity.progress} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {currentActivities.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{currentActivities.length - 3} atividades adicionais
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Nenhuma atividade em andamento</p>
                )}
              </div>
            </div>
          );
        })}
        
        {modalProjects.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum projeto encontrado.</p>
          </div>
        )}
      </div>
    </Modal>
  );
  // Empty state when no projects
  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Visão geral dos seus projetos</p>
        </div>

        <Card>
          <CardContent>
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum projeto disponível</h3>
              <p className="text-gray-500">
                Não existem projetos cadastrados no sistema no momento.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modals */}
      <ProjectDetailsModal
        isOpen={showActiveProjectsModal}
        onClose={() => setShowActiveProjectsModal(false)}
        title="Projetos Ativos"
        projects={activeProjects}
      />

      <ProjectDetailsModal
        isOpen={showRiskProjectsModal}
        onClose={() => setShowRiskProjectsModal(false)}
        title="Projetos em Risco"
        projects={riskProjects}
      />

      <ProjectDetailsModal
        isOpen={showCompletedProjectsModal}
        onClose={() => setShowCompletedProjectsModal(false)}
        title="Projetos Concluídos"
        projects={completedProjects}
      />

      <ProjectDetailsModal
        isOpen={showAllProjectsModal}
        onClose={() => setShowAllProjectsModal(false)}
        title="Todos os Projetos"
        projects={allProjects}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Dashboard
        </h1>
        <p className="text-gray-600 mt-1">Visão geral dos seus projetos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Projetos"
          value={stats.totalProjects}
          icon={TrendingUp}
          color="text-black"
          onClick={() => setShowAllProjectsModal(true)}
        />
        <StatCard
          title="Projetos Ativos"
          value={stats.activeProjects}
          icon={Clock}
          color="text-green-600"
          onClick={() => setShowActiveProjectsModal(true)}
        />
        <StatCard
          title="Projetos em Risco"
          value={stats.projectsAtRisk}
          icon={AlertTriangle}
          color="text-orange-600"
          onClick={() => setShowRiskProjectsModal(true)}
        />
        <StatCard
          title="Projetos Concluídos"
          value={stats.completedProjects}
          icon={CheckCircle}
          color="text-emerald-600"
          onClick={() => setShowCompletedProjectsModal(true)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Projetos Recentes</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3
                      className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                      onClick={() => onProjectSelect?.(project.id)}
                    >
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-500">{project.client}</p>
                  </div>
                  <div className="w-24">
                    <ProgressBar value={project.progress} showLabel />
                  </div>
                </div>
              ))}
              {recentProjects.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  Nenhum projeto recente
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Próximos Prazos</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDeadlines.map((project) => (
                <div key={project.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <h3 
                        className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                        onClick={() => onProjectSelect?.(project.id)}
                      >
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {project.nextDeadline?.toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    project.risk === 'delayed' 
                      ? 'bg-red-100 text-red-800' 
                      : project.risk === 'at_risk'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {project.risk === 'delayed' ? 'Atrasado' : 
                     project.risk === 'at_risk' ? 'Em Risco' : 'No Prazo'}
                  </span>
                </div>
              ))}
              {upcomingDeadlines.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  Nenhum prazo próximo
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Gantt Overview */}
      <ProjectsGanttOverview />
    </div>
  );
}