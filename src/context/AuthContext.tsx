import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { userOperations } from '../lib/database';
import type { User } from '../types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  error: string | null;
  getAllUsers: () => User[];
  syncAuthUsers: () => Promise<User[]>;
  updateUserMetadata: (userId: string, metadata: any) => Promise<void>;
  deleteAuthUser: (userId: string) => Promise<void>;
  createAuthUser: (userData: any) => Promise<void>;
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

    return {
      id: authUser.id,
      name: metadata.name || authUser.email?.split('@')[0] || 'Usuário',
      email: authUser.email,
      role: metadata.role || 'Usuário do Sistema',
      authLevel: (metadata.auth_level || 'leitor') as User['authLevel'],
      teamId: metadata.team_id,
      managerId: metadata.manager_id,
      createdBy: metadata.created_by,
      createdAt: new Date(authUser.created_at),
      updatedAt: new Date(authUser.updated_at || authUser.created_at)
    };
  };

  const loadUsersFromDatabase = async (fallback?: User): Promise<User[]> => {
    try {
      const usersFromDb = await userOperations.getAll();
      setAllUsers(usersFromDb);
      return usersFromDb;
    } catch (error) {
      console.error('Erro ao carregar usuários da tabela users:', error);
      const fallbackUsers = allUsers.length > 0
        ? allUsers
        : fallback
          ? [fallback]
          : [];
      setAllUsers(fallbackUsers);
      return fallbackUsers;
    }
  };

  const syncUsersWithAuth = async (fallback?: User): Promise<User[]> => {
    try {
      await userOperations.syncFromAuth();
    } catch (error) {
      console.error('Erro ao sincronizar usuários do Authentication:', error);
    }

    return loadUsersFromDatabase(fallback);
  };

  const resolveUserProfile = async (authUser: any): Promise<User> => {
    const fallbackProfile = mapAuthUserToUser(authUser);
    const users = await syncUsersWithAuth(fallbackProfile);
    const matchedUser = users.find((candidate) => candidate.id === authUser.id);
    return matchedUser || fallbackProfile;
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
          const userProfile = await resolveUserProfile(session.user);
          setUser(userProfile);
          setIsAuthenticated(true);
          setError(null);
          console.log('Usuário autenticado:', session.user.email);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setError(null);
          setAllUsers([]);
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
          const userProfile = await resolveUserProfile(session.user);
          setUser(userProfile);
          setIsAuthenticated(true);
          setError(null);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setError(null);
          setAllUsers([]);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Carregar todos os usuários do Authentication
  const syncAuthUsers = async () => {
    const fallback = user || undefined;
    return syncUsersWithAuth(fallback);
  };

  // Carregar usuários quando autenticado
  useEffect(() => {
    if (isAuthenticated && user && allUsers.length === 0) {
      syncAuthUsers().catch(console.error);
    }
  }, [isAuthenticated, user, allUsers.length]);

  const getAllUsers = (): User[] => allUsers;

  // Criar usuário no Authentication
  const createAuthUser = async (userData: any): Promise<void> => {
    throw new Error('Criação de usuários deve ser implementada via backend seguro com service_role key. Esta operação não pode ser executada no frontend por questões de segurança.');
  };

  // Atualizar metadata do usuário no Authentication
  const updateUserMetadata = async (userId: string, metadata: any): Promise<void> => {
    if (userId === user?.id) {
      // Atualizar usuário atual (permitido com chave anon)
      try {
        const { error } = await supabase.auth.updateUser({
          data: metadata
        });
        
        if (error) {
          throw error;
        }
        
        // Atualizar estado local
        setUser(prev => prev ? { 
          ...prev, 
          name: metadata.name || prev.name,
          role: metadata.role || prev.role,
          authLevel: metadata.auth_level || prev.authLevel,
          teamId: metadata.team_id || prev.teamId,
          managerId: metadata.manager_id || prev.managerId
        } : null);
        
      } catch (e: any) {
        console.error('Erro ao atualizar próprio usuário:', e);
        throw new Error(e.message || 'Erro ao atualizar usuário');
      }
    } else {
      // Atualizar outros usuários requer backend seguro
      throw new Error('Atualização de outros usuários deve ser implementada via backend seguro com service_role key. Esta operação não pode ser executada no frontend por questões de segurança.');
    }
  };

  // Deletar usuário do Authentication
  const deleteAuthUser = async (userId: string): Promise<void> => {
    throw new Error('Exclusão de usuários deve ser implementada via backend seguro com service_role key. Esta operação não pode ser executada no frontend por questões de segurança.');
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
      syncAuthUsers,
      updateUserMetadata,
      deleteAuthUser,
      createAuthUser,
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