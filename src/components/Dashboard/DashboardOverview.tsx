import React from 'react';
import { TrendingUp, Clock, AlertTriangle, CheckCircle, Calendar, User } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../UI/Card';
import { ProgressBar } from '../UI/ProgressBar';
import { useProject } from '../../context/ProjectContext';

interface DashboardOverviewProps {
  onProjectSelect?: (projectId: string) => void;
}

export function DashboardOverview({ onProjectSelect }: DashboardOverviewProps) {
  const { projects } = useProject();

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

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
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
        />
        <StatCard
          title="Projetos Ativos"
          value={stats.activeProjects}
          icon={Clock}
          color="text-green-600"
        />
        <StatCard
          title="Projetos em Risco"
          value={stats.projectsAtRisk}
          icon={AlertTriangle}
          color="text-orange-600"
        />
        <StatCard
          title="Projetos Concluídos"
          value={stats.completedProjects}
          icon={CheckCircle}
          color="text-emerald-600"
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

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Visão Geral de Progresso</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p 
                      className="font-medium text-gray-900 truncate hover:text-blue-600 cursor-pointer transition-colors"
                      onClick={() => onProjectSelect?.(project.id)}
                    >
                      {project.name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{project.client}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-32">
                    <ProgressBar value={project.progress} />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">
                    {project.progress}%
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    project.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : project.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800'
                      : project.status === 'on_hold'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status === 'completed' ? 'Concluído' :
                     project.status === 'in_progress' ? 'Em Andamento' :
                     project.status === 'on_hold' ? 'Pausado' : 'Planejamento'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}