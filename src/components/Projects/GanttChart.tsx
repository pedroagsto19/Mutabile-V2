import React, { useMemo } from 'react';
import { format, differenceInDays, addDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardHeader, CardContent } from '../UI/Card';
import type { Activity, Project } from '../../types';

interface GanttChartProps {
  project: Project;
}

export function GanttChart({ project }: GanttChartProps) {
  const allActivities = useMemo(() => {
    return project.stages.flatMap(stage => 
      stage.activities.map(activity => ({
        ...activity,
        stageName: stage.name
      }))
    );
  }, [project.stages]);

  const { startDate, endDate, totalDays } = useMemo(() => {
    if (allActivities.length === 0) {
      const today = new Date();
      return {
        startDate: today,
        endDate: addDays(today, 30),
        totalDays: 30
      };
    }

    const dates = allActivities.flatMap(activity => [
      activity.plannedStartDate,
      activity.plannedEndDate
    ]);

    const minDate = startOfDay(new Date(Math.min(...dates.map(d => d.getTime()))));
    const maxDate = endOfDay(new Date(Math.max(...dates.map(d => d.getTime()))));
    
    return {
      startDate: minDate,
      endDate: maxDate,
      totalDays: differenceInDays(maxDate, minDate) + 1
    };
  }, [allActivities]);

  const getActivityPosition = (activity: Activity) => {
    const activityStart = differenceInDays(activity.plannedStartDate, startDate);
    const activityDuration = differenceInDays(activity.plannedEndDate, activity.plannedStartDate) + 1;
    
    return {
      left: (activityStart / totalDays) * 100,
      width: (activityDuration / totalDays) * 100
    };
  };

  const getActivityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-400',
      medium: 'bg-blue-500',
      high: 'bg-orange-500',
      urgent: 'bg-red-500'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-400';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      not_started: 'bg-gray-300',
      in_progress: 'bg-blue-500',
      completed: 'bg-green-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-300';
  };

  // Generate timeline headers (weeks)
  const timelineHeaders = useMemo(() => {
    const headers = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const weekStart = new Date(currentDate);
      const weekEnd = addDays(weekStart, 6);
      const actualWeekEnd = weekEnd > endDate ? endDate : weekEnd;
      
      const weekDays = differenceInDays(actualWeekEnd, weekStart) + 1;
      const weekWidth = (weekDays / totalDays) * 100;
      
      headers.push({
        start: weekStart,
        end: actualWeekEnd,
        width: weekWidth,
        label: format(weekStart, 'dd/MM', { locale: ptBR })
      });
      
      currentDate = addDays(weekStart, 7);
    }
    
    return headers;
  }, [startDate, endDate, totalDays]);

  if (allActivities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Cronograma (Gantt)</h3>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma atividade cadastrada para exibir o cronograma</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900">Cronograma (Gantt)</h3>
        <p className="text-sm text-gray-600">
          {format(startDate, 'dd/MM/yyyy', { locale: ptBR })} - {format(endDate, 'dd/MM/yyyy', { locale: ptBR })}
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Timeline Header */}
            <div className="flex border-b border-gray-200 mb-4">
              <div className="w-64 flex-shrink-0 py-2 px-4 font-medium text-gray-700">
                Atividade
              </div>
              <div className="flex-1 relative">
                <div className="flex">
                  {timelineHeaders.map((header, index) => (
                    <div
                      key={index}
                      className="border-l border-gray-200 px-2 py-2 text-xs text-gray-600 text-center"
                      style={{ width: `${header.width}%` }}
                    >
                      {header.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Activities */}
            <div className="space-y-2">
              {allActivities.map((activity) => {
                const position = getActivityPosition(activity);
                
                return (
                  <div key={activity.id} className="flex items-center">
                    {/* Activity Info */}
                    <div className="w-64 flex-shrink-0 px-4 py-2">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {activity.stageName} • {activity.responsible}
                      </div>
                    </div>

                    {/* Gantt Bar */}
                    <div className="flex-1 relative h-8 bg-gray-50 rounded">
                      <div
                        className={`absolute top-1 bottom-1 rounded ${getStatusColor(activity.status)} opacity-80 hover:opacity-100 transition-opacity cursor-pointer group`}
                        style={{
                          left: `${position.left}%`,
                          width: `${position.width}%`
                        }}
                        title={`${activity.title}\n${format(activity.plannedStartDate, 'dd/MM/yyyy')} - ${format(activity.plannedEndDate, 'dd/MM/yyyy')}\nProgresso: ${activity.progress}%`}
                      >
                        {/* Progress indicator */}
                        <div
                          className="h-full bg-white bg-opacity-30 rounded-l"
                          style={{ width: `${activity.progress}%` }}
                        />
                        
                        {/* Activity label */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs text-white font-medium truncate px-1">
                            {activity.progress}%
                          </span>
                        </div>
                      </div>

                      {/* Dependencies lines would go here */}
                      {activity.dependencies.map((dep) => {
                        const dependentActivity = allActivities.find(a => a.id === dep.dependsOn);
                        if (!dependentActivity) return null;

                        const depPosition = getActivityPosition(dependentActivity);
                        const currentPosition = getActivityPosition(activity);

                        return (
                          <svg
                            key={dep.id}
                            className="absolute inset-0 pointer-events-none"
                            style={{ zIndex: 10 }}
                          >
                            <line
                              x1={`${depPosition.left + depPosition.width}%`}
                              y1="50%"
                              x2={`${currentPosition.left}%`}
                              y2="50%"
                              stroke="#1C58F6"
                              strokeWidth="2"
                              markerEnd="url(#arrowhead)"
                            />
                            <defs>
                              <marker
                                id="arrowhead"
                                markerWidth="10"
                                markerHeight="7"
                                refX="9"
                                refY="3.5"
                                orient="auto"
                              >
                                <polygon
                                  points="0 0, 10 3.5, 0 7"
                                  fill="black"
                                />
                              </marker>
                            </defs>
                          </svg>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center space-x-6 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-2 bg-gray-300 rounded"></div>
                <span>Não Iniciado</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-2 bg-blue-500 rounded"></div>
                <span>Em Andamento</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-2 bg-green-500 rounded"></div>
                <span>Concluído</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-2 bg-white bg-opacity-30 border border-gray-300 rounded"></div>
                <span>Progresso</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}