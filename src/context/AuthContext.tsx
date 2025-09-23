import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabaseClient } from '../lib/supabase';
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

  const requireSupabaseClient = () => {
    const client = getSupabaseClient();
    try {
      const auth = client.auth;
      if (!auth) {
        throw new Error('Supabase não configurado');
      }
    } catch (error) {
      throw new Error('Supabase não configurado');
    }
    return client;
  };

  // Mapear usuário do Supabase Auth para nosso tipo User
  const mapAuthUserToUser = (authUser: any): User => {
    // Extrair informações do user_metadata ou usar defaults
    const metadata = authUser.user_metadata || {};
    
    return {
      id: authUser.id,
      name: metadata.name || authUser.email?.split('@')[0] || 'Usuário',
      email: authUser.email,
      role: metadata.role || 'Usuário do Sistema',
      authLevel: metadata.auth_level || 'admin', // Default para admin para o usuário principal
      teamId: metadata.team_id,
      managerId: metadata.manager_id,
      createdBy: metadata.created_by,
      createdAt: new Date(authUser.created_at),
      updatedAt: new Date(authUser.updated_at || authUser.created_at)
    };
  };

  // Verificação de autenticação simplificada
  useEffect(() => {
    let mounted = true;

    let client: ReturnType<typeof requireSupabaseClient>;
    try {
      client = requireSupabaseClient();
    } catch (error: any) {
      setIsLoading(false);
      setError(error.message || 'Supabase não configurado');
      return () => {
        mounted = false;
      };
    }

    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await client.auth.getSession();
        
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
    const { data: { subscription } } = client.auth.onAuthStateChange(
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

  // Carregar todos os usuários do Supabase Auth
  useEffect(() => {
    if (isAuthenticated && user?.authLevel === 'admin') {
      loadAllUsers();
    }
  }, [isAuthenticated, user]);

  const loadAllUsers = async () => {
    try {
      const client = requireSupabaseClient();
      
      // Apenas admins podem listar usuários
      if (user?.authLevel !== 'admin') {
        setAllUsers([user].filter(Boolean) as User[]);
        return;
      }

      // Para listar usuários, precisaríamos usar a Admin API do Supabase
      // Por enquanto, vamos usar apenas o usuário atual
      setAllUsers([user].filter(Boolean) as User[]);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setAllUsers([user].filter(Boolean) as User[]);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const client = requireSupabaseClient();
      const { error } = await client.auth.signOut();
      
      if (error) throw error;
      
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
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
      const client = requireSupabaseClient();
      
      const { data: authData, error: authError } = await client.auth.signUp({
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
      const client = requireSupabaseClient();
      
      // Atualizar metadata do usuário
      const { error } = await client.auth.updateUser({
        data: {
          name: updates.name,
          role: updates.role,
          auth_level: updates.authLevel,
          team_id: updates.teamId,
          manager_id: updates.managerId
        }
      });

      if (error) throw error;

      // Se for o usuário atual, atualizar o estado local
      if (id === user?.id) {
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