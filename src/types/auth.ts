export interface User {
  id: string;
  name: string;
  email: string;
  role: string; // cargo/função
  authLevel: 'admin' | 'gestor' | 'equipe' | 'leitor';
  password?: string; // Only used during creation/update
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // ID do usuário que criou
  teamId?: string; // Para gestores organizarem suas equipes
  managerId?: string; // ID do gestor responsável (para usuários de equipe)
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Permission {
  canCreateProjects: boolean;
  canEditProjects: boolean;
  canDeleteProjects: boolean;
  canCreateActivities: boolean;
  canEditOwnActivities: boolean;
  canEditAllActivities: boolean;
  canDeleteActivities: boolean;
  canUseTimer: boolean;
  canUpdateProgress: boolean;
  canManageUsers: boolean;
  canChangeUserAuthLevel: boolean;
  canViewReports: boolean;
  canAccessSettings: boolean;
}