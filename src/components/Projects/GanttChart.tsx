import React, { useMemo, useState } from 'react';
import { format, differenceInDays, addDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardHeader, CardContent } from '../UI/Card';
import { Button } from '../UI/Button';
import { Calendar, Clock, User, TrendingUp, AlertTriangle } from 'lucide-react';
import type { Activity, Project } from '../../types';

interface GanttChartProps {
  project: Project;
}

interface ActivityWithStage extends Activity {
  stageName: string;
}

interface CalculatedActivity extends ActivityWithStage {
  planned: {
    startDate: Date;
    endDate: Date;
    duration: number;
  };
  actual: {
    startDate: Date | null;
    endDate: Date | null;
    duration: number;
    estimatedEndDate: Date | null;
  };
}

interface ActivityTooltip {
  activity: CalculatedActivity;
  type: 'planned' | 'actual';
  position: { x: number; y: number };
}

export function GanttChart({ project }: GanttChartProps) {
  const [showMode, setShowMode] = React.useState<'planned' | 'actual' | 'both'>('both');
  const [tooltip, setTooltip] = useState<ActivityTooltip | null>(null);

  const allActivities = useMemo(() => {
    return project.stages.flatMap(stage => 
      stage.activities.map(activity => ({
        ...activity,
        stageName: stage.name
      }))
    );
  }, [project.stages]);

  // Calculate real timeline based on actual progress and dependencies
  const calculatedActivities = useMemo((): CalculatedActivity[] => {
    const activities = allActivities.map(activity => ({
      ...activity,
      planned: {
        startDate: activity.plannedStartDate,
        endDate: activity.plannedEndDate,
        duration: differenceInDays(activity.plannedEndDate, activity.plannedStartDate) + 1
      },
      actual: {
        startDate: activity.actualStartDate,
        endDate: activity.actualEndDate,
        duration: activity.actualDuration,
        estimatedEndDate: null as Date | null
      }
    }));

    // Calculate actual timeline considering dependencies
    const calculateActualTimeline = () => {
      const processed = new Set<string>();
      
      const processActivity = (activity: CalculatedActivity): void => {
        if (processed.has(activity.id)) return;
        
        // First process all dependencies
        activity.dependencies.forEach(dep => {
          const depActivity = activities.find(a => a.id === dep.dependsOn);
          if (depActivity && !processed.has(depActivity.id)) {
            processActivity(depActivity);
          }
        });

        // Calculate actual start date
        let actualStartDate = activity.actual.startDate;
        
        // If not started yet, calculate based on dependencies
        if (!actualStartDate) {
          let latestDependencyEnd: Date | null = null;
          
          activity.dependencies.forEach(dep => {
            const depActivity = activities.find(a => a.id === dep.dependsOn);
            if (depActivity) {
              let depEndDate: Date | null = null;
              
              if (depActivity.actual.endDate) {
                depEndDate = depActivity.actual.endDate;
              } else if (depActivity.actual.estimatedEndDate) {
                depEndDate = depActivity.actual.estimatedEndDate;
              } else if (depActivity.actual.startDate) {
                // Estimate based on actual start + planned duration
                const plannedDurationDays = differenceInDays(depActivity.planned.endDate, depActivity.planned.startDate);
                depEndDate = addDays(depActivity.actual.startDate, plannedDurationDays);
              } else {
                // Use planned dates as fallback
                depEndDate = depActivity.planned.endDate;
              }
              
              if (!latestDependencyEnd || (depEndDate && depEndDate > latestDependencyEnd)) {
                latestDependencyEnd = depEndDate;
              }
            }
          });
          
          // Set actual start date based on dependencies or planned date
          actualStartDate = latestDependencyEnd ? addDays(latestDependencyEnd, 1) : activity.planned.startDate;
        }

        // Calculate actual/estimated end date
        let actualEndDate = activity.actual.endDate;
        
        if (!actualEndDate && actualStartDate) {
          if (activity.status === 'completed') {
            // If completed but no end date, use start date + actual duration
            const durationInDays = Math.max(1, Math.ceil(activity.actual.duration / 8)); // Convert hours to days
            actualEndDate = addDays(actualStartDate, durationInDays - 1);
          } else {
            // Estimate end date based on progress and actual time spent
            const plannedDurationDays = differenceInDays(activity.planned.endDate, activity.planned.startDate) + 1;
            
            if (activity.progress > 0 && activity.actual.duration > 0) {
              // Calculate estimated total duration based on current progress
              const estimatedTotalHours = activity.actual.duration / (activity.progress / 100);
              const estimatedTotalDays = Math.ceil(estimatedTotalHours / 8);
              actualEndDate = addDays(actualStartDate, estimatedTotalDays - 1);
            } else {
              // Use planned duration as fallback
              actualEndDate = addDays(actualStartDate, plannedDurationDays - 1);
            }
          }
        }

        // Update the activity with calculated values
        activity.actual.startDate = actualStartDate;
        activity.actual.estimatedEndDate = actualEndDate;
        
        processed.add(activity.id);
      };

      // Process all activities
      activities.forEach(processActivity);
    };

    calculateActualTimeline();
    return activities;
  }, [allActivities]);

  const { startDate, endDate, totalDays } = useMemo(() => {
    if (calculatedActivities.length === 0) {
      const today = new Date();
      return {
        startDate: today,
        endDate: addDays(today, 30),
        totalDays: 30
      };
    }

    const dates: Date[] = [];
    
    calculatedActivities.forEach(activity => {
      // Add planned dates
      dates.push(activity.planned.startDate, activity.planned.endDate);
      
      // Add actual dates
      if (activity.actual.startDate) {
        dates.push(activity.actual.startDate);
      }
      if (activity.actual.endDate) {
        dates.push(activity.actual.endDate);
      }
      if (activity.actual.estimatedEndDate) {
        dates.push(activity.actual.estimatedEndDate);
      }
    });

    const minDate = startOfDay(new Date(Math.min(...dates.map(d => d.getTime()))));
    const maxDate = endOfDay(new Date(Math.max(...dates.map(d => d.getTime()))));
    
    return {
      startDate: minDate,
      endDate: maxDate,
      totalDays: differenceInDays(maxDate, minDate) + 1
    };
  }, [calculatedActivities]);

  const getPlannedPosition = (activity: CalculatedActivity) => {
    const activityStart = differenceInDays(activity.planned.startDate, startDate);
    const activityDuration = differenceInDays(activity.planned.endDate, activity.planned.startDate) + 1;
    
    return {
      left: (activityStart / totalDays) * 100,
      width: (activityDuration / totalDays) * 100
    };
  };

  const getActualPosition = (activity: CalculatedActivity) => {
    const actualStart = activity.actual.startDate || activity.planned.startDate;
    const actualEnd = activity.actual.endDate || activity.actual.estimatedEndDate || activity.planned.endDate;
    
    const activityStart = differenceInDays(actualStart, startDate);
    const activityDuration = differenceInDays(actualEnd, actualStart) + 1;
    
    return {
      left: (activityStart / totalDays) * 100,
      width: (activityDuration / totalDays) * 100
    };
  };

  const getStatusColor = (activity: CalculatedActivity, isActual: boolean = false) => {
    if (isActual) {
      if (activity.status === 'completed') return 'bg-green-600';
      if (activity.status === 'in_progress') return 'bg-blue-600';
      return 'bg-gray-400';
    } else {
      if (activity.status === 'completed') return 'bg-green-300';
      if (activity.status === 'in_progress') return 'bg-blue-300';
      return 'bg-gray-300';
    }
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

  const getVarianceInfo = (activity: CalculatedActivity) => {
    const plannedDuration = differenceInDays(activity.planned.endDate, activity.planned.startDate) + 1;
    const actualStart = activity.actual.startDate || activity.planned.startDate;
    const actualEnd = activity.actual.endDate || activity.actual.estimatedEndDate || activity.planned.endDate;
    const actualDuration = differenceInDays(actualEnd, actualStart) + 1;
    
    const durationVariance = actualDuration - plannedDuration;
    const startVariance = activity.actual.startDate ? 
      differenceInDays(activity.actual.startDate, activity.planned.startDate) : 0;
    
    return { durationVariance, startVariance, actualDuration, plannedDuration };
  };

  const handleBarClick = (event: React.MouseEvent, activity: CalculatedActivity, type: 'planned' | 'actual') => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      activity,
      type,
      position: {
        x: event.clientX,
        y: event.clientY
      }
    });
  };

  const ActivityTooltipMenu = ({ tooltip }: { tooltip: ActivityTooltip }) => {
    const { activity, type } = tooltip;
    const variance = getVarianceInfo(activity);
    
    const isPlanned = type === 'planned';
    const startDate = isPlanned ? activity.planned.startDate : (activity.actual.startDate || activity.planned.startDate);
    const endDate = isPlanned ? activity.planned.endDate : (activity.actual.endDate || activity.actual.estimatedEndDate || activity.planned.endDate);
    const duration = isPlanned ? activity.planned.duration : variance.actualDuration;

    return (
      <div
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-80 max-w-96"
        style={{
          left: `${tooltip.position.x + 10}px`,
          top: `${tooltip.position.y - 10}px`,
          transform: 'translateY(-100%)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
              {activity.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {activity.stageName} • {activity.responsible}
            </p>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ml-3 ${
            isPlanned ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
          }`}>
            {isPlanned ? 'Previsto' : 'Real'}
          </div>
        </div>

        {/* Status and Progress */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              activity.status === 'completed' ? 'bg-green-500' :
              activity.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-400'
            }`} />
            <span className="text-xs text-gray-600">
              {activity.status === 'completed' ? 'Concluída' :
               activity.status === 'in_progress' ? 'Em Andamento' : 'Não Iniciada'}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-3 w-3 text-gray-400" />
            <span className="text-xs font-medium text-gray-900">{activity.progress}%</span>
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1 text-gray-600">
              <Calendar className="h-3 w-3" />
              <span>Início:</span>
            </div>
            <span className="font-medium text-gray-900">
              {format(startDate, 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1 text-gray-600">
              <Calendar className="h-3 w-3" />
              <span>Fim:</span>
            </div>
            <span className="font-medium text-gray-900">
              {format(endDate, 'dd/MM/yyyy', { locale: ptBR })}
              {!isPlanned && !activity.actual.endDate && (
                <span className="text-orange-600 ml-1">(estimado)</span>
              )}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1 text-gray-600">
              <Clock className="h-3 w-3" />
              <span>Duração:</span>
            </div>
            <span className="font-medium text-gray-900">
              {duration} {duration === 1 ? 'dia' : 'dias'}
            </span>
          </div>
        </div>

        {/* Variance Information (only for actual) */}
        {!isPlanned && (variance.durationVariance !== 0 || variance.startVariance !== 0) && (
          <div className="border-t border-gray-100 pt-3 mb-3">
            <div className="flex items-center space-x-1 mb-2">
              <AlertTriangle className="h-3 w-3 text-orange-500" />
              <span className="text-xs font-medium text-gray-700">Variações</span>
            </div>
            <div className="space-y-1">
              {variance.startVariance !== 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Início:</span>
                  <span className={`font-medium ${
                    variance.startVariance > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {variance.startVariance > 0 ? '+' : ''}{variance.startVariance} dias
                  </span>
                </div>
              )}
              {variance.durationVariance !== 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Duração:</span>
                  <span className={`font-medium ${
                    variance.durationVariance > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {variance.durationVariance > 0 ? '+' : ''}{variance.durationVariance} dias
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Time Information */}
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center space-x-1 mb-2">
            <Clock className="h-3 w-3 text-blue-500" />
            <span className="text-xs font-medium text-gray-700">Tempo de Trabalho</span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Planejado:</span>
              <span className="font-medium text-gray-900">
                {activity.plannedDuration}h
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Realizado:</span>
              <span className="font-medium text-gray-900">
                {activity.actualDuration.toFixed(1)}h
              </span>
            </div>
            {activity.actualDuration > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Eficiência:</span>
                <span className={`font-medium ${
                  activity.actualDuration <= activity.plannedDuration ? 'text-green-600' : 'text-red-600'
                }`}>
                  {((activity.plannedDuration / activity.actualDuration) * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dependencies */}
        {activity.dependencies.length > 0 && (
          <div className="border-t border-gray-100 pt-3 mt-3">
            <div className="flex items-center space-x-1 mb-2">
              <User className="h-3 w-3 text-purple-500" />
              <span className="text-xs font-medium text-gray-700">Dependências</span>
            </div>
            <div className="space-y-1">
              {activity.dependencies.map((dep) => {
                const depActivity = calculatedActivities.find(a => a.id === dep.dependsOn);
                return depActivity ? (
                  <div key={dep.id} className="text-xs text-gray-600">
                    • {depActivity.title}
                  </div>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (calculatedActivities.length === 0) {
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
    <>
      {/* Overlay to close tooltip */}
      {tooltip && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setTooltip(null)}
        />
      )}
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Cronograma (Gantt)</h3>
              <p className="text-sm text-gray-600">
                {format(startDate, 'dd/MM/yyyy', { locale: ptBR })} - {format(endDate, 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={showMode === 'planned' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShowMode('planned')}
              >
                Previsto
              </Button>
              <Button
                variant={showMode === 'actual' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShowMode('actual')}
              >
                Real
              </Button>
              <Button
                variant={showMode === 'both' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setShowMode('both')}
              >
                Ambos
              </Button>
            </div>
          </div>
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
              <div className="space-y-3">
                {calculatedActivities.map((activity) => {
                  const plannedPosition = getPlannedPosition(activity);
                  const actualPosition = getActualPosition(activity);
                  const variance = getVarianceInfo(activity);
                  
                  return (
                    <div key={activity.id} className="flex items-center">
                      {/* Activity Info */}
                      <div className="w-64 flex-shrink-0 px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {activity.stageName} • {activity.responsible}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {variance.durationVariance !== 0 && (
                            <span className={variance.durationVariance > 0 ? 'text-red-600' : 'text-green-600'}>
                              {variance.durationVariance > 0 ? '+' : ''}{variance.durationVariance}d
                            </span>
                          )}
                          {variance.startVariance !== 0 && (
                            <span className={`ml-2 ${variance.startVariance > 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                              Início: {variance.startVariance > 0 ? '+' : ''}{variance.startVariance}d
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Gantt Bars */}
                      <div className="flex-1 relative h-12 bg-gray-50 rounded">
                        {/* Planned Bar */}
                        {(showMode === 'planned' || showMode === 'both') && (
                          <div
                            className={`absolute rounded opacity-60 cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(activity, false)}`}
                            style={{
                              left: `${plannedPosition.left}%`,
                              width: `${plannedPosition.width}%`,
                              top: showMode === 'both' ? '2px' : '4px',
                              height: showMode === 'both' ? '16px' : '32px'
                            }}
                            onClick={(e) => handleBarClick(e, activity, 'planned')}
                          >
                            {showMode === 'planned' && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs text-white font-medium truncate px-1">
                                  {activity.progress}%
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actual Bar */}
                        {(showMode === 'actual' || showMode === 'both') && (
                          <div
                            className={`absolute rounded cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(activity, true)}`}
                            style={{
                              left: `${actualPosition.left}%`,
                              width: `${actualPosition.width}%`,
                              top: showMode === 'both' ? '22px' : '4px',
                              height: showMode === 'both' ? '16px' : '32px'
                            }}
                            onClick={(e) => handleBarClick(e, activity, 'actual')}
                          >
                            {/* Progress indicator for actual bar */}
                            <div
                              className="h-full bg-white bg-opacity-30 rounded-l"
                              style={{ width: `${activity.progress}%` }}
                            />
                            
                            {showMode === 'actual' && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs text-white font-medium truncate px-1">
                                  {activity.progress}%
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Dependencies lines */}
                        {activity.dependencies.map((dep) => {
                          const dependentActivity = calculatedActivities.find(a => a.id === dep.dependsOn);
                          if (!dependentActivity) return null;

                          const depPosition = showMode === 'actual' ? getActualPosition(dependentActivity) : getPlannedPosition(dependentActivity);
                          const currentPosition = showMode === 'actual' ? getActualPosition(activity) : getPlannedPosition(activity);

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
                                stroke="#6366f1"
                                strokeWidth="2"
                                strokeDasharray="3,3"
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
                                    fill="#6366f1"
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
                {(showMode === 'planned' || showMode === 'both') && (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-2 bg-gray-300 rounded opacity-60"></div>
                      <span>Previsto - Não Iniciado</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-2 bg-blue-300 rounded opacity-60"></div>
                      <span>Previsto - Em Andamento</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-2 bg-green-300 rounded opacity-60"></div>
                      <span>Previsto - Concluído</span>
                    </div>
                  </>
                )}
                {(showMode === 'actual' || showMode === 'both') && (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-2 bg-gray-600 rounded"></div>
                      <span>Real - Não Iniciado</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-2 bg-blue-600 rounded"></div>
                      <span>Real - Em Andamento</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-2 bg-green-600 rounded"></div>
                      <span>Real - Concluído</span>
                    </div>
                  </>
                )}
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-1 border-2 border-indigo-500 border-dashed"></div>
                  <span>Dependências</span>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Resumo do Projeto</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Atividades Totais</p>
                    <p className="font-medium">{calculatedActivities.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Concluídas</p>
                    <p className="font-medium text-green-600">
                      {calculatedActivities.filter(a => a.status === 'completed').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Em Andamento</p>
                    <p className="font-medium text-blue-600">
                      {calculatedActivities.filter(a => a.status === 'in_progress').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Com Atraso</p>
                    <p className="font-medium text-red-600">
                      {calculatedActivities.filter(a => {
                        const variance = getVarianceInfo(a);
                        return variance.durationVariance > 0 || variance.startVariance > 0;
                      }).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tooltip Menu */}
      {tooltip && <ActivityTooltipMenu tooltip={tooltip} />}
    </>
  );
}