// Re-export auth types
export type { User } from './auth';
export type { Supplier, SupplierFilters } from './supplier';

export interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  responsible: string;
  controlNumber: string;
  description: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed';
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  stages: Stage[];
  risk: 'on_time' | 'at_risk' | 'delayed';
  nextDeadline?: Date;
  previousActivitiesState?: Array<{
    stageId: string;
    activities: Array<{
      id: string;
      status: 'not_started' | 'in_progress' | 'completed';
      progress: number;
      actualEndDate?: Date;
      checklist: Array<{
        id: string;
        completed: boolean;
      }>;
    }>;
  }>;
}

export interface Stage {
  id: string;
  name: string;
  projectId: string;
  order: number;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  activities: Activity[];
  notificationRecipients: string[];
  isCustom: boolean;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  responsible: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  plannedStartDate: Date;
  plannedEndDate: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  plannedDuration: number; // hours
  actualDuration: number; // hours
  progress: number; // 0-100
  status: 'not_started' | 'in_progress' | 'completed';
  stageId: string;
  dependencies: ActivityDependency[];
  isTimerActive: boolean;
  timerStartTime?: Date;
  checklist: ChecklistItem[];
  driveLinks: DriveLink[];
}

export interface DriveLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  createdAt: Date;
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface ActivityDependency {
  id: string;
  dependsOn: string; // activity id
  type: 'finish_start' | 'start_start' | 'finish_finish' | 'start_finish';
}

export interface Timer {
  activityId: string;
  startTime: Date;
  isActive: boolean;
}

export interface ProjectFilters {
  status?: string;
  client?: string;
  responsible?: string;
  search?: string;
}