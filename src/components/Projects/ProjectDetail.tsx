import React, { useState } from 'react';
import { ArrowLeft, Edit, CheckCircle, Plus, Play, Pause, Square, Clock, BarChart3 } from 'lucide-react';
import { Button } from '../UI/Button';
import { Card, CardHeader, CardContent } from '../UI/Card';
import { ProgressBar } from '../UI/ProgressBar';
import { Modal } from '../UI/Modal';
import { GanttChart } from './GanttChart';
import { ProjectForm } from './ProjectForm';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { ProtectedRoute } from '../Auth/ProtectedRoute';
import type { Project, Activity } from '../../types';

interface ProjectDetailProps {
  projectId: string;
  initialTab?: 'detail' | 'gantt';
  onBack: () => void;
}

export function ProjectDetail({ projectId, initialTab = 'detail', onBack }: ProjectDetailProps) {
  const { projects, addActivity, updateActivity, startActivityTimer, stopActivityTimer, activeTimer, getElapsedTime, updateProject, calculateActivityProgress, canUserEditActivity } = useProject();
  const { user: currentUser, hasPermission, getAllUsers } = useAuth();
  const users = getAllUsers();
  const [activeTab, setActiveTab] = useState<'stages' | 'gantt'>(initialTab === 'gantt' ? 'gantt' : 'stages');
  const [activeStage, setActiveStage] = useState(0);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [showEditProject, setShowEditProject] = useState(false);
  const [showTimeEditor, setShowTimeEditor] = useState(false);
  const [editingTimeActivity, setEditingTimeActivity] = useState<Activity | null>(null);
  const [showEditProjectForm, setShowEditProjectForm] = useState(false);

  const project = projects.find(p => p.id === projectId);
  if (!project || !currentUser) return null;

  const formatDate = (date: Date) => {
    // Criar uma nova data ajustando o fuso horário para evitar problemas de exibição
    const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return adjustedDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    const s = Math.floor(((hours - h) * 60 - m) * 60);
    return `${h}h ${m}m ${s}s`;
  };

  const handleTimerAction = (activity: Activity) => {
    if (activity.isTimerActive) {
      stopActivityTimer(activity.id);
    } else {
      // Check if there's another active timer and warn user
      const hasActiveTimer = projects
        .flatMap(p => p.stages)
        .flatMap(s => s.activities)
        .some(a => a.isTimerActive && a.id !== activity.id);
      
      if (hasActiveTimer) {
        if (!confirm('Já existe um timer ativo em outra atividade. Deseja parar o timer atual e iniciar este?')) {
          return;
        }
      }
      
      // Set actual start date if this is the first time starting the timer
      if (!activity.actualStartDate) {
        updateActivity(activity.id, { actualStartDate: new Date() });
      }
      
      startActivityTimer(activity.id);
    }
  };

  const getElapsedTimeForActivity = (activityId: string) => {
    if (activeTimer?.activityId === activityId && activeTimer.isActive) {
      return getElapsedTime();
    }
    return 0;
  };

  const handleEditProject = () => {
    setShowEditProjectForm(true);
  };

  const handleCompleteProject = () => {
    if (confirm('Tem certeza que deseja marcar este projeto como concluído?')) {
      updateProject(projectId, { 
        status: 'completed',
        progress: 100
      });
    }
  };

  const handleUpdateProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    updateProject(project.id, projectData);
    setShowEditProjectForm(false);
  };

  const handleEditTime = (activity: Activity) => {
    if (currentUser.authLevel === 'admin') {
      setEditingTimeActivity(activity);
      setShowTimeEditor(true);
    }
  };

  const handleCompleteActivity = (activity: Activity) => {
    if (confirm('Tem certeza que deseja marcar esta atividade como concluída?')) {
      updateActivity(activity.id, {
        status: 'completed',
        progress: 100,
        actualEndDate: new Date()
      });
    }
  };

  const TimeEditorModal = () => {
    const [timeData, setTimeData] = useState({
      hours: editingTimeActivity ? Math.floor(editingTimeActivity.actualDuration) : 0,
      minutes: editingTimeActivity ? Math.floor((editingTimeActivity.actualDuration % 1) * 60) : 0,
      seconds: editingTimeActivity ? Math.floor(((editingTimeActivity.actualDuration % 1) * 60 % 1) * 60) : 0
    });
    const [actualStartDate, setActualStartDate] = useState(
      editingTimeActivity?.actualStartDate 
        ? editingTimeActivity.actualStartDate.toISOString().split('T')[0]
        : ''
    );

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingTimeActivity) {
        const totalHours = timeData.hours + (timeData.minutes / 60) + (timeData.seconds / 3600);
        const updateData: any = {
          actualDuration: totalHours
        };
        
        if (actualStartDate) {
          updateData.actualStartDate = new Date(actualStartDate + 'T12:00:00');
        } else {
          updateData.actualStartDate = null;
        }
        
        updateActivity(editingTimeActivity.id, updateData);
        setShowTimeEditor(false);
        setEditingTimeActivity(null);
      }
    };

    return (
      <Modal 
        isOpen={showTimeEditor} 
        onClose={() => {
          setShowTimeEditor(false);
          setEditingTimeActivity(null);
        }} 
        title="Editar Tempo e Data de Início Real"
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Editando tempo para: <strong>{editingTimeActivity?.title}</strong>
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Início Real
            </label>
            <input
              type="date"
              value={actualStartDate}
              onChange={(e) => setActualStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Deixe em branco para remover a data de início real
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horas
              </label>
              <input
                type="number"
                min="0"
                value={timeData.hours}
                onChange={(e) => setTimeData(prev => ({ ...prev, hours: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minutos
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={timeData.minutes}
                onChange={(e) => setTimeData(prev => ({ ...prev, minutes: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Segundos
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={timeData.seconds}
                onChange={(e) => setTimeData(prev => ({ ...prev, seconds: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowTimeEditor(false);
                setEditingTimeActivity(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    );
  };
  
  const ActivityForm = () => {
    const currentStageActivities = project.stages[activeStage]?.activities || [];
    const allActivities = project.stages.flatMap(stage => stage.activities);
    
    const [formData, setFormData] = useState({
      title: editingActivity?.title || '',
      description: editingActivity?.description || '',
      responsible: editingActivity?.responsible || '',
      priority: editingActivity?.priority || 'medium' as const,
      plannedStartDate: editingActivity?.plannedStartDate 
        ? editingActivity.plannedStartDate.toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      plannedEndDate: editingActivity?.plannedEndDate 
        ? editingActivity.plannedEndDate.toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      plannedDuration: editingActivity?.plannedDuration || 8,
      dependencies: editingActivity?.dependencies || []
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validate dates
      const startDate = new Date(formData.plannedStartDate + 'T12:00:00');
      const endDate = new Date(formData.plannedEndDate + 'T12:00:00');
      
      if (startDate >= endDate) {
        alert('A data de início deve ser anterior à data de fim');
        return;
      }
      
      const activityData = {
        title: formData.title,
        description: formData.description,
        responsible: formData.responsible,
        priority: formData.priority,
        plannedStartDate: startDate,
        plannedEndDate: endDate,
        plannedDuration: formData.plannedDuration,
        actualDuration: editingActivity?.actualDuration || 0,
        progress: editingActivity?.progress || 0,
        status: editingActivity?.status || 'not_started' as const,
        dependencies: formData.dependencies,
        isTimerActive: false,
        actualStartDate: editingActivity?.actualStartDate || undefined
      };

      if (editingActivity) {
        updateActivity(editingActivity.id, activityData);
      } else {
        addActivity(project.stages[activeStage].id, activityData);
      }
      
      setShowActivityForm(false);
      setEditingActivity(null);
    };

    const toggleDependency = (activityId: string) => {
      setFormData(prev => ({
        ...prev,
        dependencies: prev.dependencies.some(dep => dep.dependsOn === activityId)
          ? prev.dependencies.filter(dep => dep.dependsOn !== activityId)
          : [...prev.dependencies, { id: Math.random().toString(36).substr(2, 9), dependsOn: activityId, type: 'finish_start' }]
      }));
    };

    return (
      <Modal 
        isOpen={showActivityForm} 
        onClose={() => {
          setShowActivityForm(false);
          setEditingActivity(null);
        }} 
        title={editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsável *
              </label>
              <select
                required
                value={formData.responsible}
                onChange={(e) => setFormData(prev => ({ ...prev, responsible: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              >
                <option value="">Selecione um responsável</option>
                {users.map(user => (
                  <option key={user.id} value={user.name}>
                    {user.name} - {user.role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Início Previsto *
              </label>
              <input
                type="date"
                required
                value={formData.plannedStartDate}
                onChange={(e) => setFormData(prev => ({ ...prev, plannedStartDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Fim Previsto *
              </label>
              <input
                type="date"
                required
                value={formData.plannedEndDate}
                onChange={(e) => setFormData(prev => ({ ...prev, plannedEndDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duração (horas)
              </label>
              <input
                type="number"
                min="1"
                value={formData.plannedDuration}
                onChange={(e) => setFormData(prev => ({ ...prev, plannedDuration: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
              />
            </div>
          </div>

          {/* Dependencies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Dependências
            </label>
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {allActivities
                .filter(activity => activity.id !== editingActivity?.id)
                .map(activity => (
                  <label key={activity.id} className="flex items-center mb-2 last:mb-0">
                    <input
                      type="checkbox"
                      checked={formData.dependencies.some(dep => dep.dependsOn === activity.id)}
                      onChange={() => toggleDependency(activity.id)}
                      className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {activity.title}
                      <span className="text-gray-500 ml-1">
                        ({project.stages.find(s => s.activities.some(a => a.id === activity.id))?.name})
                      </span>
                    </span>
                  </label>
                ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowActivityForm(false);
                setEditingActivity(null);
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingActivity ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
    );
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      urgent: 'Urgente'
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  return (
    <div className="space-y-6">
      <ActivityForm />
      <TimeEditorModal />
      
      {/* Edit Project Form */}
      <ProtectedRoute requiredPermission="canEditProjects">
        <ProjectForm
          isOpen={showEditProjectForm}
          onClose={() => setShowEditProjectForm(false)}
          onSubmit={handleUpdateProject}
          project={project}
        />
      </ProtectedRoute>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {project.name}
            </h1>
            <p className="text-gray-600">{project.client} • {project.location}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <ProtectedRoute requiredPermission="canEditProjects">
            <Button variant="outline" onClick={handleEditProject}>
              <Edit className="h-4 w-4 mr-2" />
              Editar projeto
            </Button>
          </ProtectedRoute>
          <ProtectedRoute requiredPermission="canEditProjects">
            <Button variant="primary" onClick={handleCompleteProject}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Concluir Projeto
            </Button>
          </ProtectedRoute>
        </div>
      </div>

      {/* Project Info */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-500">Responsável</p>
              <p className="font-medium">{project.responsible}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Controle</p>
              <p className="font-medium">{project.controlNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">Em Andamento</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Progresso Geral</p>
              <div className="mt-2">
                <ProgressBar value={project.progress} showLabel />
              </div>
            </div>
          </div>
          {project.description && (
            <div className="mt-6">
              <p className="text-sm text-gray-500">Descrição</p>
              <p className="mt-1 text-gray-900">{project.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stages Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('stages')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'stages'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Etapas
          </button>
          <button
            onClick={() => setActiveTab('gantt')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
              activeTab === 'gantt'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Cronograma
          </button>
          {activeTab === 'stages' && project.stages.map((stage, index) => (
            <button
              key={stage.id}
              onClick={() => setActiveStage(index)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeStage === index
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {stage.name}
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {Math.round(stage.progress)}%
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'gantt' ? (
        <GanttChart project={project} />
      ) : (
        /* Stages Content */
        <div className="space-y-6">
          {/* Stage Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {project.stages[activeStage]?.name}
              </h2>
              <p className="text-gray-600 mt-1">
                {project.stages[activeStage]?.activities.length || 0} atividades
              </p>
            </div>
            
            <ProtectedRoute requiredPermission="canCreateActivities">
              <Button onClick={() => setShowActivityForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Atividade
              </Button>
            </ProtectedRoute>
          </div>

          {/* Activities */}
          <div className="space-y-4">
            {project.stages[activeStage]?.activities.map(activity => {
              const progress = calculateActivityProgress(activity);
              const elapsedTime = getElapsedTimeForActivity(activity.id);
              const totalTime = activity.actualDuration + elapsedTime;
              
              return (
                <Card key={activity.id}>
                  <CardContent>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-gray-900">{activity.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(activity.priority)}`}>
                            {getPriorityLabel(activity.priority)}
                          </span>
                          {activity.status === 'completed' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        
                        {activity.description && (
                          <p className="text-gray-600 text-sm mb-3">{activity.description}</p>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Responsável</p>
                            <p className="font-medium">{activity.responsible}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Início Previsto</p>
                            <p className="font-medium">{formatDate(activity.plannedStartDate)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Início Real</p>
                            <p className="font-medium">
                              {activity.actualStartDate ? formatDate(activity.actualStartDate) : 'Não iniciado'}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Fim Previsto</p>
                            <p className="font-medium">{formatDate(activity.plannedEndDate)}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                          <div>
                            <p className="text-gray-500">Tempo Realizado</p>
                            <p className="font-medium">{formatTime(totalTime)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Tempo Planejado</p>
                            <p className="font-medium">{formatTime(activity.plannedDuration)}</p>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">
                              Progresso: {Math.round(progress)}% (tempo realizado ÷ tempo planejado)
                            </span>
                          </div>
                          <ProgressBar value={progress} />
                          {progress > 100 && (
                            <p className="text-xs text-orange-600 mt-1">
                              ⚠️ Tempo realizado excede o planejado
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {/* Complete Activity Button */}
                        {canUserEditActivity(activity) && activity.status !== 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCompleteActivity(activity)}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Atividade Concluída
                          </Button>
                        )}
                        
                        {/* Timer Controls */}
                        {hasPermission('canUseTimer') && canUserEditActivity(activity) && activity.status !== 'completed' && (
                          <Button
                            variant={activity.isTimerActive ? "primary" : "outline"}
                            size="sm"
                            onClick={() => handleTimerAction(activity)}
                          >
                            {activity.isTimerActive ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        
                        {activity.isTimerActive && hasPermission('canUseTimer') && canUserEditActivity(activity) && activity.status !== 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => stopActivityTimer(activity.id)}
                          >
                            <Square className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Time Editor for Admin */}
                        {currentUser.authLevel === 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTime(activity)}
                            title="Editar tempo realizado e data de início real"
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {canUserEditActivity(activity) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingActivity(activity);
                              setShowActivityForm(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {(!project.stages[activeStage]?.activities || project.stages[activeStage].activities.length === 0) && (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhuma atividade cadastrada nesta etapa.</p>
                <ProtectedRoute requiredPermission="canCreateActivities">
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowActivityForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar primeira atividade
                  </Button>
                </ProtectedRoute>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}