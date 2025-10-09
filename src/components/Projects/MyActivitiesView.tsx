import React, { useState, useMemo } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2, Play, Pause, ChevronDown, ChevronRight } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { ProgressBar } from '../UI/ProgressBar';
import { format } from 'date-fns';
import type { Activity, Project } from '../../types';

interface ActivityWithProject extends Activity {
  projectName: string;
  projectId: string;
  stageName: string;
}

export function MyActivitiesView() {
  const { projects } = useProject();
  const { currentUser } = useAuth();
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'completed'>('active');

  const myActivities = useMemo(() => {
    const activities: ActivityWithProject[] = [];

    projects.forEach(project => {
      project.stages.forEach(stage => {
        stage.activities
          .filter(activity => activity.responsible === currentUser?.email)
          .forEach(activity => {
            activities.push({
              ...activity,
              projectName: project.name,
              projectId: project.id,
              stageName: stage.name
            });
          });
      });
    });

    return activities.sort((a, b) =>
      new Date(a.plannedEndDate).getTime() - new Date(b.plannedEndDate).getTime()
    );
  }, [projects, currentUser]);

  const filteredActivities = useMemo(() => {
    switch (filter) {
      case 'active':
        return myActivities.filter(a => a.status === 'in_progress');
      case 'pending':
        return myActivities.filter(a => a.status === 'not_started' || a.status === 'on_hold');
      case 'completed':
        return myActivities.filter(a => a.status === 'completed');
      default:
        return myActivities;
    }
  }, [myActivities, filter]);

  const groupedByProject = useMemo(() => {
    const grouped = new Map<string, ActivityWithProject[]>();
    filteredActivities.forEach(activity => {
      const existing = grouped.get(activity.projectId) || [];
      grouped.set(activity.projectId, [...existing, activity]);
    });
    return grouped;
  }, [filteredActivities]);

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      not_started: 'bg-gray-100 text-gray-700',
      in_progress: 'bg-blue-100 text-blue-700',
      on_hold: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      not_started: 'Não Iniciada',
      in_progress: 'Em Andamento',
      on_hold: 'Pausada',
      completed: 'Concluída'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[priority as keyof typeof colors] || 'text-gray-600';
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      critical: 'Crítica'
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const isOverdue = (activity: Activity) => {
    return new Date(activity.plannedEndDate) < new Date() && activity.status !== 'completed';
  };

  if (myActivities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white rounded-lg shadow-sm px-8 py-6">
          <p className="text-lg text-blue-600">
            Não existem atividades atribuídas a você no momento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas Atividades</h1>
          <p className="text-gray-600 mt-1">{filteredActivities.length} atividades encontradas</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todas ({myActivities.length})
          </Button>
          <Button
            variant={filter === 'active' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            Ativas ({myActivities.filter(a => a.status === 'in_progress').length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pendentes ({myActivities.filter(a => a.status === 'not_started' || a.status === 'on_hold').length})
          </Button>
          <Button
            variant={filter === 'completed' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Concluídas ({myActivities.filter(a => a.status === 'completed').length})
          </Button>
        </div>
      </div>

      {filteredActivities.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">Nenhuma atividade encontrada para este filtro.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {Array.from(groupedByProject.entries()).map(([projectId, activities]) => {
            const project = projects.find(p => p.id === projectId);
            if (!project) return null;

            const isExpanded = expandedProjects.has(projectId);

            return (
              <Card key={projectId} className="overflow-hidden">
                <button
                  onClick={() => toggleProject(projectId)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-500">{project.client} - {project.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{activities.length} atividades</span>
                    <ProgressBar value={project.progress} className="w-24" showLabel />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200">
                    {activities.map(activity => (
                      <div
                        key={activity.id}
                        className="px-6 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-base font-medium text-gray-900">{activity.title}</h4>
                              <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(activity.status)}`}>
                                {getStatusLabel(activity.status)}
                              </span>
                              {isOverdue(activity) && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                                  <AlertCircle className="h-3 w-3" />
                                  Atrasada
                                </span>
                              )}
                            </div>

                            {activity.description && (
                              <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Etapa:</span>
                                <span>{activity.stageName}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Prioridade:</span>
                                <span className={getPriorityColor(activity.priority)}>
                                  {getPriorityLabel(activity.priority)}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>{format(new Date(activity.plannedStartDate), 'dd/MM/yyyy')}</span>
                                <span>→</span>
                                <span className={isOverdue(activity) ? 'text-red-600 font-medium' : ''}>
                                  {format(new Date(activity.plannedEndDate), 'dd/MM/yyyy')}
                                </span>
                              </div>
                              {activity.isTimerActive && (
                                <div className="flex items-center gap-1 text-blue-600">
                                  <Play className="h-4 w-4" />
                                  <span className="font-medium">Timer ativo</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <ProgressBar value={activity.progress} className="w-20" showLabel />
                            {activity.checklist && activity.checklist.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>
                                  {activity.checklist.filter(i => i.completed).length}/{activity.checklist.length} itens
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
