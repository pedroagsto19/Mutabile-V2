import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  error: string | null;
  getAllUsers: () => User[];
  register: (userData: any) => Promise<void>;
  updateUser: (id: string, updates: any) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  canEditUser: (user: User) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Mapear usuário do Supabase Auth para nosso tipo User
  const mapAuthUserToUser = (authUser: any): User => {
    const metadata = authUser.user_metadata || {};
    
    // Determinar authLevel baseado no email ou metadata
    let authLevel: User['authLevel'] = 'admin';
    if (metadata.auth_level) {
      authLevel = metadata.auth_level;
    } else {
      // Fallback baseado no email
      if (authUser.email?.includes('admin')) {
        authLevel = 'admin';
      } else if (authUser.email?.includes('gestor')) {
        authLevel = 'gestor';
      } else {
        authLevel = 'equipe';
      }
    }
    
    return {
      id: authUser.id,
      name: metadata.name || authUser.email?.split('@')[0] || 'Usuário',
      email: authUser.email,
      role: metadata.role || 'Usuário do Sistema',
      authLevel,
      teamId: metadata.team_id,
      managerId: metadata.manager_id,
      createdBy: metadata.created_by,
      createdAt: new Date(authUser.created_at),
      updatedAt: new Date(authUser.updated_at || authUser.created_at)
    };
  };

  // Verificação de autenticação
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Erro na sessão:', sessionError);
          throw sessionError;
        }

        if (!mounted) return;

        if (session?.user) {
          const userProfile = mapAuthUserToUser(session.user);
          setUser(userProfile);
          setIsAuthenticated(true);
          setError(null);
          console.log('Usuário autenticado:', userProfile.email);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setError(null);
        }
      } catch (e: any) {
        if (mounted) {
          console.error('Erro na verificação de autenticação:', e);
          setUser(null);
          setIsAuthenticated(false);
          setError('Erro de conectividade com o Supabase');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth event:', event);

        if (session?.user) {
          const userProfile = mapAuthUserToUser(session.user);
          setUser(userProfile);
          setIsAuthenticated(true);
          setError(null);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setError(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Carregar usuários do Supabase Auth (apenas para admins)
  useEffect(() => {
    if (isAuthenticated && user?.authLevel === 'admin') {
      loadAllUsers();
    }
  }, [isAuthenticated, user]);

  const loadAllUsers = async () => {
    try {
      // Para listar usuários, precisaríamos usar a Admin API do Supabase
      // Por enquanto, vamos usar apenas o usuário atual e alguns usuários mock baseados nos emails que vimos
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'Administrador',
          email: 'admin@mutabile.com.br',
          role: 'Administrador do Sistema',
          authLevel: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          name: 'João Oliveira',
          email: 'joao@mutabile.com.br',
          role: 'Gestor de Projetos',
          authLevel: 'gestor',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '3',
          name: 'Carlos Santos',
          email: 'carlos@mutabile.com.br',
          role: 'Arquiteto',
          authLevel: 'equipe',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Incluir o usuário atual se não estiver na lista
      if (user && !mockUsers.find(u => u.email === user.email)) {
        mockUsers.push(user);
      }

      setAllUsers(mockUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setAllUsers([user].filter(Boolean) as User[]);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      setAllUsers([]);
      console.log('Logout realizado com sucesso');
    } catch (e: any) {
      console.error('Erro no logout:', e);
      setError(e.message || 'Erro no logout');
    } finally {
      setIsLoading(false);
    }
  };

  const getAllUsers = (): User[] => allUsers;

  const register = async (userData: any): Promise<void> => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role,
            auth_level: userData.authLevel,
            team_id: userData.teamId || null,
            manager_id: userData.managerId || null,
            created_by: user?.id || null
          }
        }
      });

      if (authError) throw authError;

      if (authData?.user) {
        await loadAllUsers();
      }
    } catch (e: any) {
      throw new Error(e.message || 'Erro ao criar usuário');
    }
  };

  const updateUser = async (id: string, updates: any): Promise<void> => {
    try {
      // Se for o usuário atual, atualizar via updateUser
      if (id === user?.id) {
        const updateData: any = {};
        
        if (updates.name || updates.role || updates.authLevel) {
          updateData.data = {
            name: updates.name,
            role: updates.role,
            auth_level: updates.authLevel
          };
        }

        if (updates.password) {
          updateData.password = updates.password;
        }

        const { error } = await supabase.auth.updateUser(updateData);
        if (error) throw error;

        // Atualizar estado local
        setUser(prev => prev ? { ...prev, ...updates } : null);
      }

      await loadAllUsers();
    } catch (e: any) {
      throw new Error(e.message || 'Erro ao atualizar usuário');
    }
  };

  const deleteUser = async (id: string): Promise<void> => {
    try {
      // Para deletar usuários, seria necessário usar a Admin API do Supabase
      // Por enquanto, apenas removemos da lista local
      setAllUsers(prev => prev.filter(u => u.id !== id));
    } catch (e: any) {
      throw new Error(e.message || 'Erro ao deletar usuário');
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    const permissions = {
      canCreateProjects: user.authLevel === 'admin' || user.authLevel === 'gestor',
      canEditProjects: user.authLevel === 'admin' || user.authLevel === 'gestor',
      canDeleteProjects: user.authLevel === 'admin',
      canCreateActivities: user.authLevel === 'admin' || user.authLevel === 'gestor' || user.authLevel === 'equipe',
      canEditOwnActivities: true,
      canEditAllActivities: user.authLevel === 'admin' || user.authLevel === 'gestor',
      canDeleteActivities: user.authLevel === 'admin' || user.authLevel === 'gestor',
      canUseTimer: true,
      canUpdateProgress: true,
      canManageUsers: user.authLevel === 'admin',
      canChangeUserAuthLevel: user.authLevel === 'admin',
      canViewReports: true,
      canAccessSettings: user.authLevel === 'admin' || user.authLevel === 'gestor'
    };
    
    return permissions[permission as keyof typeof permissions] || false;
  };

  const canEditUser = (targetUser: User): boolean => {
    if (!user) return false;
    if (user.authLevel === 'admin') return true;
    if (user.authLevel === 'gestor') {
      return targetUser.authLevel !== 'admin';
    }
    return user.id === targetUser.id;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      logout,
      error,
      getAllUsers,
      register,
      updateUser,
      deleteUser,
      hasPermission,
      canEditUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};