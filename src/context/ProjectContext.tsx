import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Project, Stage, Activity } from '../types';
import { useTimer } from '../hooks/useTimer';
import { useAuth } from './AuthContext';
import LocalStorage from '../lib/localStorage';

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (project: Project | null) => void;
  addStage: (projectId: string, stage: Omit<Stage, 'id' | 'projectId'>) => void;
  updateStage: (stageId: string, updates: Partial<Stage>) => void;
  addActivity: (stageId: string, activity: Omit<Activity, 'id' | 'stageId'>) => void;
  updateActivity: (activityId: string, updates: Partial<Activity>) => void;
  startActivityTimer: (activityId: string) => void;
  stopActivityTimer: (activityId: string) => void;
  activeTimer: any;
  getElapsedTime: () => number;
  calculateActivityProgress: (activity: Activity) => number;
  canUserEditActivity: (activity: Activity) => boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Helper function to convert local project to app project
const convertLocalProject = (localProject: any): Project => ({
  ...localProject,
  createdAt: new Date(localProject.createdAt),
  updatedAt: new Date(localProject.updatedAt),
  nextDeadline: localProject.nextDeadline ? new Date(localProject.nextDeadline) : undefined,
  stages: localProject.stages.map((stage: any) => ({
    ...stage,
    activities: stage.activities.map((activity: any) => ({
      ...activity,
      plannedStartDate: new Date(activity.plannedStartDate),
      plannedEndDate: new Date(activity.plannedEndDate),
      actualStartDate: activity.actualStartDate ? new Date(activity.actualStartDate) : undefined,
      actualEndDate: activity.actualEndDate ? new Date(activity.actualEndDate) : undefined,
      timerStartTime: activity.timerStartTime ? new Date(activity.timerStartTime) : undefined
    }))
  }))
});

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const { user: currentUser, hasPermission } = useAuth();
  const { activeTimer, startTimer, stopTimer, getElapsedTime } = useTimer();

  // Load projects from localStorage on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    const localProjects = LocalStorage.getProjects();
    setProjects(localProjects.map(convertLocalProject));
  };

  // Filter projects based on user permissions
  const getVisibleProjects = () => {
    if (!currentUser) return [];
    
    // Admin and Gestor can see all projects
    if (currentUser.authLevel === 'admin' || currentUser.authLevel === 'gestor') {
      return projects;
    }
    
    // Equipe can only see projects where they have activities
    if (currentUser.authLevel === 'equipe') {
      return projects.filter(project => 
        project.stages.some(stage => 
          stage.activities.some(activity => 
            activity.responsible === currentUser.name
          )
        )
      );
    }
    
    // Leitor can see all projects (read-only)
    return projects;
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const calculateActivityProgress = (activity: Activity) => {
    // If manually marked as completed, always return 100%
    if (activity.status === 'completed') return 100;
    
    // Calculate progress based on actual time spent vs planned time
    const totalTimeSpent = activity.actualDuration + (
      activeTimer?.activityId === activity.id ? getElapsedTime() : 0
    );
    
    if (activity.plannedDuration > 0) {
      const timeProgress = (totalTimeSpent / activity.plannedDuration) * 100;
      // Cap progress at 100% for display purposes, but allow calculation to exceed for tracking
      return Math.min(Math.round(timeProgress), 100);
    }
    
    return 0;
  };

  const addProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!hasPermission('canCreateProjects')) {
      throw new Error('Sem permissão para criar projetos');
    }
    
    const localProjectData = {
      ...projectData,
      nextDeadline: projectData.nextDeadline?.toISOString(),
      stages: projectData.stages.map(stage => ({
        ...stage,
        activities: stage.activities.map(activity => ({
          ...activity,
          plannedStartDate: activity.plannedStartDate.toISOString(),
          plannedEndDate: activity.plannedEndDate.toISOString(),
          actualStartDate: activity.actualStartDate?.toISOString(),
          actualEndDate: activity.actualEndDate?.toISOString(),
          timerStartTime: activity.timerStartTime?.toISOString()
        }))
      }))
    };
    
    const newLocalProject = LocalStorage.createProject(localProjectData);
    const newProject = convertLocalProject(newLocalProject);
    
    setProjects(prev => [...prev, newProject]);
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    if (!hasPermission('canEditProjects')) {
      throw new Error('Sem permissão para editar projetos');
    }
    
    const updateData = {
      ...updates,
      nextDeadline: updates.nextDeadline?.toISOString(),
      stages: updates.stages?.map(stage => ({
        ...stage,
        activities: stage.activities.map(activity => ({
          ...activity,
          plannedStartDate: activity.plannedStartDate.toISOString(),
          plannedEndDate: activity.plannedEndDate.toISOString(),
          actualStartDate: activity.actualStartDate?.toISOString(),
          actualEndDate: activity.actualEndDate?.toISOString(),
          timerStartTime: activity.timerStartTime?.toISOString()
        }))
      }))
    };
    
    LocalStorage.updateProject(id, updateData);
    loadProjects();
    
    if (currentProject?.id === id) {
      const updatedProject = projects.find(p => p.id === id);
      if (updatedProject) {
        setCurrentProject({ ...updatedProject, ...updates, updatedAt: new Date() });
      }
    }
  };

  const deleteProject = (id: string) => {
    if (!hasPermission('canDeleteProjects')) {
      throw new Error('Sem permissão para excluir projetos');
    }
    
    LocalStorage.deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    
    if (currentProject?.id === id) {
      setCurrentProject(null);
    }
  };

  const addStage = (projectId: string, stageData: Omit<Stage, 'id' | 'projectId'>) => {
    const newStage: Stage = {
      ...stageData,
      id: generateId(),
      projectId
    };
    
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const updatedProject = {
        ...project,
        stages: [...project.stages, newStage],
        updatedAt: new Date()
      };
      updateProject(projectId, updatedProject);
    }
  };

  const updateStage = (stageId: string, updates: Partial<Stage>) => {
    const project = projects.find(p => p.stages.some(s => s.id === stageId));
    if (project) {
      const updatedProject = {
        ...project,
        stages: project.stages.map(s => 
          s.id === stageId ? { ...s, ...updates } : s
        ),
        updatedAt: new Date()
      };
      updateProject(project.id, updatedProject);
    }
  };

  const addActivity = (stageId: string, activityData: Omit<Activity, 'id' | 'stageId'>) => {
    if (!hasPermission('canCreateActivities')) {
      throw new Error('Sem permissão para criar atividades');
    }
    
    const newActivity: Activity = {
      ...activityData,
      id: generateId(),
      stageId
    };
    
    const project = projects.find(p => p.stages.some(s => s.id === stageId));
    if (project) {
      const updatedProject = {
        ...project,
        stages: project.stages.map(s => 
          s.id === stageId 
            ? { ...s, activities: [...s.activities, newActivity] }
            : s
        ),
        updatedAt: new Date()
      };
      updateProject(project.id, updatedProject);
    }
  };

  const updateActivity = (activityId: string, updates: Partial<Activity>) => {
    const project = projects.find(p => 
      p.stages.some(s => s.activities.some(a => a.id === activityId))
    );
    
    if (!project) return;
    
    const activity = project.stages
      .flatMap(s => s.activities)
      .find(a => a.id === activityId);
    
    if (!activity) return;
    
    if (!canUserEditActivity(activity)) {
      throw new Error('Sem permissão para editar esta atividade');
    }
    
    const updatedProject = {
      ...project,
      stages: project.stages.map(s => ({
        ...s,
        activities: s.activities.map(a => 
          a.id === activityId ? { ...a, ...updates } : a
        )
      })),
      updatedAt: new Date()
    };
    
    updateProject(project.id, updatedProject);
  };

  const startActivityTimer = (activityId: string) => {
    // Stop any currently active timer first
    if (activeTimer?.isActive && activeTimer.activityId !== activityId) {
      const elapsed = stopTimer();
      const currentActiveActivity = projects
        .flatMap(p => p.stages)
        .flatMap(s => s.activities)
        .find(a => a.id === activeTimer.activityId);
      
      if (currentActiveActivity) {
        updateActivity(activeTimer.activityId, {
          isTimerActive: false,
          actualDuration: currentActiveActivity.actualDuration + elapsed
        });
      }
    }
    
    // Get the activity to check if it's the first time starting
    const activity = projects
      .flatMap(p => p.stages)
      .flatMap(s => s.activities)
      .find(a => a.id === activityId);
    
    startTimer(activityId);
    
    const updateData: any = { 
      isTimerActive: true,
      status: 'in_progress'
    };
    
    // Only set actualStartDate if it's the first time starting the timer
    if (activity && !activity.actualStartDate) {
      updateData.actualStartDate = new Date();
    }
    
    updateActivity(activityId, updateData);
  };

  const stopActivityTimer = (activityId: string) => {
    const elapsed = stopTimer();
    const activity = projects
      .flatMap(p => p.stages)
      .flatMap(s => s.activities)
      .find(a => a.id === activityId);
    
    if (activity) {
      updateActivity(activityId, {
        isTimerActive: false,
        actualDuration: activity.actualDuration + elapsed
      });
    }
  };

  const canUserEditActivity = (activity: Activity): boolean => {
    if (!currentUser) return false;
    
    // Admin e Gestor podem editar todas as atividades
    if (hasPermission('canEditAllActivities')) return true;
    
    // Usuários da equipe podem editar apenas suas próprias atividades
    if (hasPermission('canEditOwnActivities')) {
      return activity.responsible === currentUser.name;
    }
    
    return false;
  };

  return (
    <ProjectContext.Provider value={{
      projects: getVisibleProjects(),
      currentProject,
      addProject,
      updateProject,
      deleteProject,
      setCurrentProject,
      addStage,
      updateStage,
      addActivity,
      updateActivity,
      startActivityTimer,
      stopActivityTimer,
      activeTimer,
      getElapsedTime,
      calculateActivityProgress,
      canUserEditActivity
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};