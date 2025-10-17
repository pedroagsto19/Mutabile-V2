import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { userOperations } from '../lib/database';
import type { User } from '../types/auth';

type SupabaseKeyRole = 'anon' | 'service_role' | string | null;

const decodeSupabaseKeyRole = (key?: string): SupabaseKeyRole => {
  if (!key) return null;

  const [, payload] = key.split('.');
  if (!payload) return null;

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const globalObject = globalThis as unknown as {
      atob?: (value: string) => string;
      Buffer?: { from: (value: string, encoding: string) => { toString: (encoding: string) => string } };
    };

    let decoded = '';
    if (typeof globalObject?.atob === 'function') {
      decoded = globalObject.atob(base64);
    } else if (globalObject?.Buffer) {
      decoded = globalObject.Buffer.from(base64, 'base64').toString('binary');
    } else {
      return null;
    }

    const jsonPayload = decodeURIComponent(
      decoded
        .split('')
        .map(char => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );

    const parsed = JSON.parse(jsonPayload);
    return typeof parsed.role === 'string' ? parsed.role : null;
  } catch (error) {
    console.warn('Não foi possível determinar o tipo da chave do Supabase:', error);
    return null;
  }
};

const determineAuthSyncAvailability = (): boolean => {
  const explicitFlag = import.meta.env.VITE_SUPABASE_ENABLE_AUTH_SYNC;
  if (explicitFlag === 'true') {
    return true;
  }

  if (explicitFlag === 'false') {
    return false;
  }

  const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (decodeSupabaseKeyRole(serviceRoleKey) === 'service_role') {
    return true;
  }

  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return decodeSupabaseKeyRole(anonKey) === 'service_role';
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  error: string | null;
  getAllUsers: () => User[];
  syncAuthUsers: () => Promise<void>;
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
  const canSyncAuthUsers = useMemo(() => determineAuthSyncAvailability(), []);

  // Mapear usuário do Supabase Auth para nosso tipo User
  const mapAuthUserToUser = (authUser: any): User => {
    const metadata = authUser.user_metadata || {};
    
    // Definir authLevel baseado nos metadados persistidos no Supabase
    const authLevel: User['authLevel'] = metadata.auth_level || metadata.authLevel || 'equipe';
    
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

  const upsertUsers = useCallback((usersToMerge: User[]) => {
    if (!usersToMerge.length) return;

    setAllUsers(prev => {
      const userMap = new Map(prev.map(existingUser => [existingUser.id, existingUser]));
      usersToMerge.forEach(newUser => {
        userMap.set(newUser.id, newUser);
      });
      return Array.from(userMap.values());
    });
  }, []);

  const loadUsersFromDatabase = useCallback(async (fallbackUser?: User): Promise<User[]> => {
    try {
      const users = await userOperations.getAll();
      if (users.length > 0) {
        setAllUsers(users);
        return users;
      }

      if (fallbackUser) {
        upsertUsers([fallbackUser]);
        return [fallbackUser];
      }

      return [];
    } catch (loadError) {
      console.error('Erro ao carregar usuários do banco de dados:', loadError);
      if (fallbackUser) {
        upsertUsers([fallbackUser]);
        return [fallbackUser];
      }
      return [];
    }
  }, [upsertUsers]);

  const syncUsersWithAuth = useCallback(async (fallbackUser?: User) => {
    if (!canSyncAuthUsers) {
      console.info('Sincronização de usuários com Auth ignorada: apenas chave anon disponível.');
      await loadUsersFromDatabase(fallbackUser);
      return;
    }

    try {
      await userOperations.syncFromAuth();
    } catch (syncError) {
      console.error('Erro ao sincronizar usuários com Supabase Auth:', syncError);
    } finally {
      await loadUsersFromDatabase(fallbackUser);
    }
  }, [canSyncAuthUsers, loadUsersFromDatabase]);

  const resolveUserProfile = useCallback((authUser: any): User => {
    const mappedUser = mapAuthUserToUser(authUser);
    upsertUsers([mappedUser]);
    syncUsersWithAuth(mappedUser).catch(console.error);
    return mappedUser;
  }, [syncUsersWithAuth, upsertUsers]);

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
          const userProfile = resolveUserProfile(session.user);
          setUser(userProfile);
          setIsAuthenticated(true);
          setError(null);
          console.log('Usuário autenticado:', session.user.email);
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
          const userProfile = resolveUserProfile(session.user);
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

  // Carregar todos os usuários do Authentication
  const syncAuthUsers = useCallback(async () => {
    const fallbackUser = user ?? undefined;

    if (!isAuthenticated) {
      await loadUsersFromDatabase(fallbackUser);
      return;
    }

    await syncUsersWithAuth(fallbackUser);
  }, [isAuthenticated, loadUsersFromDatabase, syncUsersWithAuth, user]);

  // Carregar usuários quando autenticado
  useEffect(() => {
    if (isAuthenticated) {
      syncAuthUsers().catch(console.error);
    }
  }, [isAuthenticated, syncAuthUsers]);

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