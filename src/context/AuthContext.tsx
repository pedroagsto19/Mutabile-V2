import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { userOperations, type DbUserRecord } from '../lib/database';
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

  const allowedAuthLevels: User['authLevel'][] = ['admin', 'gestor', 'equipe', 'leitor'];

  const normalizeAuthLevel = (value: any): User['authLevel'] => {
    return allowedAuthLevels.includes(value) ? value : 'admin';
  };

  const mapUserRecord = (record: DbUserRecord): User => ({
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    authLevel: normalizeAuthLevel(record.auth_level),
    teamId: record.team_id ?? undefined,
    managerId: record.manager_id ?? undefined,
    createdBy: record.created_by ?? undefined,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at)
  });

  // Simplified auth check
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        if (!supabase) {
          if (mounted) {
            setIsLoading(false);
            setError('Supabase não configurado');
          }
          return;
        }

        // Simple session check with timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );

        const sessionPromise = supabase.auth.getSession();
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;

        if (!mounted) return;

        if (session?.user) {
          // Try to get user profile
          try {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              const userProfile = mapUserRecord(profile);
              setUser(userProfile);
              setIsAuthenticated(true);
              setError(null);
            } else {
              // Create admin profile if it's the admin user
              if (session.user.email === 'admin@mutabile.com.br') {
                const adminProfile = {
                  id: session.user.id,
                  name: 'Administrador',
                  email: session.user.email,
                  role: 'Administrador do Sistema',
                  auth_level: 'admin',
                  team_id: null,
                  manager_id: null,
                  created_by: null
                };

                await supabase.from('users').insert(adminProfile);
                const userProfile = mapUserRecord(adminProfile as any);
                setUser(userProfile);
                setIsAuthenticated(true);
                setError(null);
              } else {
                setError('Usuário não encontrado no sistema');
                setIsAuthenticated(false);
                setUser(null);
              }
            }
          } catch (profileError) {
            console.error('Erro ao buscar perfil:', profileError);
            setError('Erro ao carregar perfil do usuário');
            setIsAuthenticated(false);
            setUser(null);
          }
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
          if (e.message !== 'Timeout') {
            setError('Erro de conectividade');
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase?.auth?.onAuthStateChange?.(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth event:', event);

        if (session?.user) {
          try {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profile) {
              const userProfile = mapUserRecord(profile);
              setUser(userProfile);
              setIsAuthenticated(true);
              setError(null);
            }
          } catch (profileError) {
            console.error('Erro ao buscar perfil:', profileError);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setError(null);
        }
      }
    ) || { data: { subscription: { unsubscribe: () => {} } } };

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshUsers();
    }
  }, [isAuthenticated]);

  const refreshUsers = async () => {
    try {
      const users = await userOperations.getAll();
      setAllUsers(users);
    } catch (fetchError) {
      console.error('Erro ao buscar usuários:', fetchError);
      setAllUsers([]);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await supabase?.auth?.signOut();
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    } catch (e: any) {
      console.error('Erro no logout:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getAllUsers = (): User[] => allUsers;

  const register = async (userData: any): Promise<void> => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password
      });

      if (authError) throw authError;

      if (authData?.user) {
        await userOperations.create({
          id: authData.user.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          authLevel: userData.authLevel,
          teamId: userData.teamId || null,
          managerId: userData.managerId || null,
          createdBy: user?.id || null
        });
        await refreshUsers();
      }
    } catch (e: any) {
      throw new Error(e.message || 'Erro ao criar usuário');
    }
  };

  const updateUser = async (id: string, updates: any): Promise<void> => {
    try {
      await userOperations.update(id, updates);
      await refreshUsers();
    } catch (e: any) {
      throw new Error(e.message || 'Erro ao atualizar usuário');
    }
  };

  const deleteUser = async (id: string): Promise<void> => {
    try {
      await userOperations.delete(id);
      await refreshUsers();
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