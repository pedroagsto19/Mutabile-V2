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
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  const allowedAuthLevels: User['authLevel'][] = ['admin', 'gestor', 'equipe', 'leitor'];

  const normalizeAuthLevel = (value: any): User['authLevel'] => {
    return allowedAuthLevels.includes(value) ? value : 'admin';
  };

  const ensureValidDate = (value?: string | null): Date => {
    if (!value) return new Date();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const buildFallbackUser = (authUser: any): User | null => {
    if (!authUser?.id || !authUser?.email) {
      console.warn('buildFallbackUser: dados insuficientes para criar usuário fallback');
      return null;
    }

    const metadata = authUser.user_metadata || {};
    const nameFromEmail = typeof authUser.email === 'string'
      ? authUser.email.split('@')[0]
      : 'Usuário';

    const rawAuthLevel = metadata.authLevel || metadata.auth_level;
    const fallbackAuthLevel: User['authLevel'] = allowedAuthLevels.includes(rawAuthLevel as User['authLevel'])
      ? (rawAuthLevel as User['authLevel'])
      : 'leitor';

    return {
      id: authUser.id,
      name: metadata.name || metadata.full_name || nameFromEmail || 'Usuário',
      email: authUser.email,
      role: metadata.role || 'Usuário',
      authLevel: fallbackAuthLevel,
      createdAt: ensureValidDate(authUser.created_at),
      updatedAt: ensureValidDate(authUser.updated_at),
      createdBy: metadata.createdBy || metadata.created_by || undefined,
      teamId: metadata.teamId || metadata.team_id || undefined,
      managerId: metadata.managerId || metadata.manager_id || undefined,
    };
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
      console.warn('ensureUserProfile: authUser inválido', { id: authUser?.id, email: authUser?.email });
      return null;
    }

    console.log('Verificando perfil para:', authUser.email);

    try {
      // Primeiro, tentar buscar por ID (mais eficiente)
      const { data: existingById, error: idError } = await supabase
      .from<DbUserRecord>('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

      if (!idError && existingById) {
        console.log('Perfil encontrado por ID:', existingById.email);
        return existingById;
      }
      
      // Se não encontrou por ID, tentar por email
      console.log('Perfil não encontrado por ID, tentando por email...');
      const { data: existingByEmail, error: emailError } = await supabase
        .from<DbUserRecord>('users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (!emailError && existingByEmail) {
        console.log('Perfil encontrado por email:', existingByEmail.email);
        
        // Se o ID for diferente, atualizar para corresponder ao auth user
        if (existingByEmail.id !== authUser.id) {
          console.log('Atualizando ID do perfil para corresponder ao auth user...');
          const { data: updatedProfile, error: updateError } = await supabase
            .from<DbUserRecord>('users')
            .update({ id: authUser.id })
            .eq('email', authUser.email)
            .select()
            .single();
          
          if (updateError) {
            console.error('Erro ao atualizar ID do perfil:', updateError);
            return existingByEmail; // Retorna o perfil original mesmo com erro de update
          } else {
            console.log('ID do perfil atualizado com sucesso');
            return updatedProfile;
          }
        }
        
        return existingByEmail;
      }
      
      // Se não encontrou nem por ID nem por email, criar novo perfil
      console.log('Criando novo perfil para:', authUser.email);
      
      // Apenas criar perfil se for o admin - outros usuários devem ser criados via interface
      if (authUser.email !== 'admin@mutabile.com.br') {
        console.log('Usuário não é admin - deve ser criado via interface do sistema');
        return null;
      }

      const fallbackName = 'Administrador';

      const profilePayload: Partial<DbUserRecord> & {
        id: string;
        name: string;
        email: string;
        role: string;
        auth_level: string;
      } = {
        id: authUser.id,
        name: fallbackName,
        email: authUser.email,
        role: 'Administrador do Sistema',
        auth_level: 'admin',
        team_id: null,
        manager_id: null,
        created_by: null
      };

      const { data: newProfile, error: insertError } = await supabase
        .from<DbUserRecord>('users')
        .insert(profilePayload)
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao criar perfil do usuário:', insertError);
        return null;
      }

      console.log('Perfil criado com sucesso:', newProfile.email);
      return newProfile;
      
    } catch (error) {
      console.error('Erro geral ao sincronizar perfil:', error);
      return null;
    }
  };

  const fetchUserProfile = async (authUser: any): Promise<User | null> => {
    try {
      console.log('Buscando perfil para:', authUser.email);
      const profile = await ensureUserProfile(authUser);

      if (!profile) {
        console.warn('Perfil do usuário não encontrado na base. Usando dados da sessão para continuar.');
        const fallbackUser = buildFallbackUser(authUser);
        if (!fallbackUser) {
          setError(prev => prev ?? 'Não foi possível sincronizar o perfil do usuário.');
        } else {
          setError(prev => prev ?? 'Perfil do usuário não encontrado na base. Usando dados limitados da sessão.');
        }
        return fallbackUser;
      }

      console.log('Perfil sincronizado:', profile.email);
      return mapUserRecord(profile);
    } catch (e) {
      console.error('Erro ao buscar perfil do usuário:', e);
      const fallbackUser = buildFallbackUser(authUser);
      if (fallbackUser) {
        setError('Erro ao buscar perfil do usuário. Exibindo dados básicos da sessão.');
      }
      return fallbackUser;
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
        setAuthCheckComplete(false);
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Erro ao verificar sessão:', error);
          // Don't set error for common auth issues to avoid infinite loops
          if (!error.message?.includes('Failed to fetch') && !error.message?.includes('401')) {
            setError(explainSupabaseError(error));
          }
          setIsAuthenticated(false);
          setUser(null);
        } else if (session?.user) {
          const userProfile = await fetchUserProfile(session.user);
          if (mounted && userProfile) {
            setUser(userProfile);
            setIsAuthenticated(true);
            setError(null);
          } else if (mounted) {
            console.log('Perfil do usuário não encontrado - será criado no próximo login');
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
          // Don't set error for network issues to avoid infinite loops
          if (!e.message?.includes('Failed to fetch') && !e.message?.includes('401')) {
            setError(explainSupabaseError(e));
          }
          setIsAuthenticated(false);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setAuthCheckComplete(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth event:', event, session?.user?.email);

        // Prevent infinite loops by checking if we're already processing
        if (event === 'TOKEN_REFRESHED' && isLoading) {
          return;
        }

        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user);
          if (mounted && userProfile) {
            setUser(userProfile);
            setIsAuthenticated(true);
            setError(null);
            console.log('Usuário autenticado:', userProfile.email);
          } else if (mounted) {
            console.error('Perfil do usuário não pôde ser sincronizado');
            // Don't set error to avoid infinite loops
            console.warn('Perfil não sincronizado - continuando sem erro');
            setUser(null);
            setIsAuthenticated(false);
          }
        } else if (mounted) {
          console.log('Usuário deslogado');
          setUser(null);
          setIsAuthenticated(false);
          setError(null);
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
      console.log('Lista de usuários atualizada:', users.length, 'usuários');
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
      console.log('Registrando novo usuário:', userData.email);
      
      // Create user in Supabase Auth first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password
      });

      if (authError) {
        console.error('Erro no registro auth:', authError);
        throw new Error(explainSupabaseError(authError));
      }

      if (authData?.user) {
        console.log('Usuário criado no auth, criando perfil...');
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
        console.log('Perfil de usuário criado com sucesso');
      }
    } catch (e: any) {
      console.error('Erro no registro:', e);
      throw new Error(explainSupabaseError(e));
    }
  };

  const updateUser = async (id: string, updates: any): Promise<void> => {
    try {
      console.log('Atualizando usuário:', id);
      await userOperations.update(id, updates);
      await refreshUsers();
      console.log('Usuário atualizado com sucesso');
    } catch (e: any) {
      console.error('Erro ao atualizar usuário:', e);
      throw new Error(`Erro ao atualizar usuário: ${e.message}`);
    }
  };

  const deleteUser = async (id: string): Promise<void> => {
    try {
      console.log('Deletando usuário:', id);
      await userOperations.delete(id);
      await refreshUsers();
      console.log('Usuário deletado com sucesso');
    } catch (e: any) {
      console.error('Erro ao deletar usuário:', e);
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