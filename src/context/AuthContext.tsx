import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, explainSupabaseError } from '../lib/supabase';
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

  const normalizeAuthLevel = (value: any): User['authLevel'] => {
    const allowed: User['authLevel'][] = ['admin', 'gestor', 'equipe', 'leitor'];
    return allowed.includes(value) ? value : 'admin';
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

  const ensureUserProfile = async (authUser: any) => {
    if (!authUser?.id || !authUser?.email) {
      return null;
    }

    const existingById = await supabase
      .from<DbUserRecord>('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (existingById.error) {
      console.error('Erro ao verificar perfil por ID:', existingById.error);
      throw existingById.error;
    }

    if (existingById.data) {
      return existingById.data;
    }

    const existingByEmail = await supabase
      .from<DbUserRecord>('users')
      .select('*')
      .eq('email', authUser.email)
      .maybeSingle();

    if (existingByEmail.error) {
      console.error('Erro ao verificar perfil por e-mail:', existingByEmail.error);
      throw existingByEmail.error;
    }

    const fallbackName = authUser.user_metadata?.full_name
      || authUser.user_metadata?.name
      || (authUser.email?.split('@')[0] || 'Usuário Mutabile');

    const profilePayload: Partial<DbUserRecord> & {
      id: string;
      name: string;
      email: string;
      role: string;
      auth_level: string;
    } = {
      id: authUser.id,
      name: existingByEmail.data?.name || fallbackName,
      email: authUser.email,
      role: existingByEmail.data?.role || authUser.user_metadata?.role || 'Administrador',
      auth_level: normalizeAuthLevel(existingByEmail.data?.auth_level || authUser.user_metadata?.auth_level),
      team_id: existingByEmail.data?.team_id ?? authUser.user_metadata?.team_id ?? null,
      manager_id: existingByEmail.data?.manager_id ?? authUser.user_metadata?.manager_id ?? null,
      created_by: existingByEmail.data?.created_by ?? null
    };

    const upsertedProfile = await supabase
      .from<DbUserRecord>('users')
      .upsert(profilePayload, { onConflict: 'email' })
      .select()
      .single();

    if (upsertedProfile.error) {
      console.error('Erro ao sincronizar perfil do usuário:', upsertedProfile.error);
      throw upsertedProfile.error;
    }

    return upsertedProfile.data;
  };

  const fetchUserProfile = async (authUser: any): Promise<User | null> => {
    try {
      const profile = await ensureUserProfile(authUser);

      if (!profile) {
        console.error('Não foi possível sincronizar o perfil do usuário.');
        return null;
      }

      return mapUserRecord(profile);
    } catch (e) {
      console.error('Erro ao buscar perfil do usuário:', e);
      return null;
    }
  };

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      setError('Supabase não configurado');
      return;
    }

    let mounted = true;

    // Check initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Erro ao verificar sessão:', error);
          setError(explainSupabaseError(error));
          setIsAuthenticated(false);
          setUser(null);
        } else if (session?.user) {
          const userProfile = await fetchUserProfile(session.user);
          if (mounted && userProfile) {
            setUser(userProfile);
            setIsAuthenticated(true);
            setError(null);
          } else if (mounted) {
            setError('Perfil do usuário não encontrado');
            setUser(null);
            setIsAuthenticated(false);
          }
        } else if (mounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (e: any) {
        if (mounted) {
          console.error('Erro ao verificar sessão:', e);
          setError(explainSupabaseError(e));
          setIsAuthenticated(false);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth event:', event, session?.user?.email);

        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user);
          if (mounted && userProfile) {
            setUser(userProfile);
            setIsAuthenticated(true);
            setError(null);
          } else if (mounted) {
            setError('Perfil do usuário não encontrado');
            setUser(null);
            setIsAuthenticated(false);
          }
        } else if (mounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    );

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
      if (!supabase) {
        throw new Error('Supabase não configurado');
      }

      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro no logout:', error);
        setError(explainSupabaseError(error));
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setError(null);
        console.log('Logout realizado com sucesso');
      }
    } catch (e: any) {
      console.error('Erro no logout:', e);
      setError(explainSupabaseError(e));
    } finally {
      setIsLoading(false);
    }
  };

  const getAllUsers = (): User[] => allUsers;

  const register = async (userData: any): Promise<void> => {
    try {
      // Create user in Supabase Auth first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password
      });

      if (authError) {
        throw new Error(explainSupabaseError(authError));
      }

      if (authData?.user) {
        // Create or update user profile in database with the auth user ID
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
      throw new Error(explainSupabaseError(e));
    }
  };

  const updateUser = async (id: string, updates: any): Promise<void> => {
    try {
      await userOperations.update(id, updates);
      await refreshUsers();
    } catch (e: any) {
      throw new Error(`Erro ao atualizar usuário: ${e.message}`);
    }
  };

  const deleteUser = async (id: string): Promise<void> => {
    try {
      await userOperations.delete(id);
      await refreshUsers();
    } catch (e: any) {
      throw new Error(`Erro ao deletar usuário: ${e.message}`);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // Use actual auth level from database
    const permissions = {
      canCreateProjects: user.authLevel === 'admin' || user.authLevel === 'gestor',
      canEditProjects: user.authLevel === 'admin' || user.authLevel === 'gestor',
      canDeleteProjects: user.authLevel === 'admin',
      canCreateActivities: user.authLevel === 'admin' || user.authLevel === 'gestor' || user.authLevel === 'equipe',
      canEditOwnActivities: true,
      canEditAllActivities: user.authLevel === 'admin' || user.authLevel === 'gestor',
      canDeleteActivities: user.authLevel === 'admin' || user.authLevel === 'gestor',
      canUseTimer: true, // Everyone can use timer
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

    // Admin can edit anyone
    if (user.authLevel === 'admin') return true;

    // Gestor can edit team members (but not admins)
    if (user.authLevel === 'gestor') {
      return targetUser.authLevel !== 'admin';
    }

    // Regular users can only edit their own profile
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