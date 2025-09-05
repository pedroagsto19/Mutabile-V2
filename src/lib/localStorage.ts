// Sistema de armazenamento local
import { supabase } from './supabase';

export interface LocalUser {
  id: string;
  name: string;
  email: string;
  role: string;
  authLevel: 'admin' | 'gestor' | 'equipe' | 'leitor';
  teamId?: string;
  managerId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalProject {
  id: string;
  name: string;
  client: string;
  location: string;
  responsible: string;
  controlNumber: string;
  description: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed';
  progress: number;
  risk: 'on_time' | 'at_risk' | 'delayed';
  nextDeadline?: string;
  stages: any[];
  createdAt: string;
  updatedAt: string;
}

export interface LocalActivity {
  id: string;
  title: string;
  description: string;
  responsible: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  plannedDuration: number;
  actualDuration: number;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  stageId: string;
  dependencies: any[];
  isTimerActive: boolean;
  timerStartTime?: string;
}

export interface LocalStage {
  id: string;
  name: string;
  projectId: string;
  order: number;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  activities: LocalActivity[];
  notificationRecipients: string[];
  isCustom: boolean;
}
// A validação de senha deve ocorrer no servidor (ex.: Supabase)

class LocalStorage {
  private static USERS_KEY = 'mutabile_users';
  private static PROJECTS_KEY = 'mutabile_projects';
  private static CURRENT_USER_KEY = 'mutabile_current_user';

  // Inicializar dados padrão se não existirem
  static initializeDefaultData() {
    try {
      // Always clear and reinitialize for demo purposes
      localStorage.removeItem(this.USERS_KEY);
      localStorage.removeItem(this.PROJECTS_KEY);
      localStorage.removeItem(this.CURRENT_USER_KEY);
      
      if (!localStorage.getItem(this.USERS_KEY)) {
        const defaultUsers: LocalUser[] = [
          {
            id: '1',
            name: 'Marina Costa',
            email: 'marina@mutabile.com.br',
            role: 'Administradora',
            authLevel: 'admin',
            teamId: 'team1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Ana Silva',
            email: 'ana@mutabile.com.br',
            role: 'Gerente de Projetos',
            authLevel: 'gestor',
            teamId: 'team1',
            createdBy: '1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '3',
            name: 'Carlos Santos',
            email: 'carlos@mutabile.com.br',
            role: 'Arquiteto',
            authLevel: 'equipe',
            teamId: 'team1',
            managerId: '2',
            createdBy: '2',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '4',
            name: 'João Oliveira',
            email: 'joao@mutabile.com.br',
            role: 'Cliente',
            authLevel: 'leitor',
            teamId: 'team1',
            createdBy: '2',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];

        console.log('Initializing default users:', defaultUsers.map(u => ({
          email: u.email,
          authLevel: u.authLevel
        })));
        
        localStorage.setItem(this.USERS_KEY, JSON.stringify(defaultUsers));
      }

      if (!localStorage.getItem(this.PROJECTS_KEY)) {
        const sampleActivities: LocalActivity[] = [
          {
            id: 'act1',
            title: 'Levantamento do terreno',
            description: 'Análise topográfica e condições do local',
            responsible: 'Carlos Santos',
            priority: 'high',
            plannedStartDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            plannedEndDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
            plannedDuration: 24,
            actualDuration: 0,
            progress: 0,
            status: 'not_started',
            stageId: 'stage1',
            dependencies: [],
            isTimerActive: false
          },
          {
            id: 'act2',
            title: 'Estudo de viabilidade',
            description: 'Análise de zoneamento e restrições legais',
            responsible: 'Ana Silva',
            priority: 'medium',
            plannedStartDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
            plannedEndDate: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString(),
            plannedDuration: 16,
            actualDuration: 0,
            progress: 0,
            status: 'not_started',
            stageId: 'stage1',
            dependencies: [{ id: 'dep1', dependsOn: 'act1', type: 'finish_start' }],
            isTimerActive: false
          }
        ];

        const sampleStages: LocalStage[] = [
          {
            id: 'stage1',
            name: 'Anteprojeto',
            projectId: '1',
            order: 1,
            progress: 0,
            status: 'not_started',
            activities: sampleActivities,
            notificationRecipients: ['ana@mutabile.com.br'],
            isCustom: false
          },
          {
            id: 'stage2',
            name: 'Projeto Legal',
            projectId: '1',
            order: 2,
            progress: 0,
            status: 'not_started',
            activities: [],
            notificationRecipients: ['ana@mutabile.com.br'],
            isCustom: false
          },
          {
            id: 'stage3',
            name: 'Projeto Executivo',
            projectId: '1',
            order: 3,
            progress: 0,
            status: 'not_started',
            activities: [],
            notificationRecipients: ['ana@mutabile.com.br'],
            isCustom: false
          }
        ];

        const defaultProjects: LocalProject[] = [
          {
            id: '1',
            name: 'Residência Jardins',
            client: 'João e Maria Oliveira',
            location: 'São Paulo, SP',
            responsible: 'Ana Silva',
            controlNumber: 'MUT-2025-001',
            description: 'Casa unifamiliar de alto padrão com 380m²',
            status: 'in_progress',
            progress: 15,
            risk: 'on_time',
            nextDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            stages: sampleStages,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Edifício Comercial Centro',
            client: 'Construtora Delta',
            location: 'Rio de Janeiro, RJ',
            responsible: 'Carlos Santos',
            controlNumber: 'MUT-2025-002',
            description: 'Edifício comercial de 12 andares',
            status: 'planning',
            progress: 5,
            risk: 'on_time',
            stages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        
        localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(defaultProjects));
      }
    } catch (error) {
      console.error('Error initializing default data:', error);
      // Se houver erro, limpar dados corrompidos e tentar novamente
      localStorage.removeItem(this.USERS_KEY);
      localStorage.removeItem(this.PROJECTS_KEY);
      localStorage.removeItem(this.CURRENT_USER_KEY);
      
      // Tentar inicializar novamente com dados mínimos
      const defaultUsers: LocalUser[] = [
        {
          id: '1',
          name: 'Marina Costa',
          email: 'marina@mutabile.com.br',
          role: 'Administradora',
          authLevel: 'admin',
          teamId: 'team1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      localStorage.setItem(this.USERS_KEY, JSON.stringify(defaultUsers));
      
      const defaultProjects: LocalProject[] = [];
      localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(defaultProjects));
    }
  }

  // Métodos para usuários
  static getUsers(): LocalUser[] {
    try {
      const users = localStorage.getItem(this.USERS_KEY);
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  static saveUsers(users: LocalUser[]) {
    try {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }

  static async authenticateUser(email: string, password: string): Promise<LocalUser | null> {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.log('Password verification failed:', error.message);
        return null;
      }

      const users = this.getUsers();
      return users.find(u => u.email === email) || null;
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  }

  static createUser(userData: Omit<LocalUser, 'id' | 'createdAt' | 'updatedAt'>): LocalUser {
    try {
      const users = this.getUsers();
      const newUser: LocalUser = {
        ...userData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      users.push(newUser);
      this.saveUsers(users);
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static updateUser(id: string, updates: Partial<LocalUser>): boolean {
    try {
      const users = this.getUsers();
      const userIndex = users.findIndex(u => u.id === id);

      if (userIndex === -1) return false;

      const updatedUser = { ...users[userIndex], ...updates };

      updatedUser.updatedAt = new Date().toISOString();
      users[userIndex] = updatedUser;

      this.saveUsers(users);
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  }

  static deleteUser(id: string): boolean {
    try {
      const users = this.getUsers();
      const filteredUsers = users.filter(u => u.id !== id);
      
      if (filteredUsers.length === users.length) return false;
      
      this.saveUsers(filteredUsers);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  // Métodos para projetos
  static getProjects(): LocalProject[] {
    try {
      const projects = localStorage.getItem(this.PROJECTS_KEY);
      return projects ? JSON.parse(projects) : [];
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  }

  static saveProjects(projects: LocalProject[]) {
    try {
      localStorage.setItem(this.PROJECTS_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error('Error saving projects:', error);
    }
  }

  static createProject(projectData: Omit<LocalProject, 'id' | 'createdAt' | 'updatedAt'>): LocalProject {
    try {
      const projects = this.getProjects();
      const newProject: LocalProject = {
        ...projectData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      projects.push(newProject);
      this.saveProjects(projects);
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  static updateProject(id: string, updates: Partial<LocalProject>): boolean {
    try {
      const projects = this.getProjects();
      const projectIndex = projects.findIndex(p => p.id === id);
      
      if (projectIndex === -1) return false;
      
      const updatedProject = { 
        ...projects[projectIndex], 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      projects[projectIndex] = updatedProject;
      this.saveProjects(projects);
      return true;
    } catch (error) {
      console.error('Error updating project:', error);
      return false;
    }
  }

  static deleteProject(id: string): boolean {
    try {
      const projects = this.getProjects();
      const filteredProjects = projects.filter(p => p.id !== id);
      
      if (filteredProjects.length === projects.length) return false;
      
      this.saveProjects(filteredProjects);
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  }

  // Usuário atual
  static getCurrentUser(): LocalUser | null {
    try {
      const user = localStorage.getItem(this.CURRENT_USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  static setCurrentUser(user: LocalUser | null) {
    try {
      if (user) {
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(this.CURRENT_USER_KEY);
      }
    } catch (error) {
      console.error('Error setting current user:', error);
    }
  }
}

export default LocalStorage;