import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, hasValidSession, explainSupabaseError } from '../lib/supabase';
import { userOperations } from '../lib/database';
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

  const fetchUserProfile = async (authUser: any): Promise<User | null> => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();
      
      if (error || !user) {
        console.error('Usuário não encontrado no localStorage');
        return null;
      }

      // Convert date strings to Date objects
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        authLevel: user.auth_level,
        teamId: user.team_id,
        managerId: user.manager_id,
        createdBy: user.created_by,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at)
      };
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

    // Check initial session
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session?.user?.email);
        
        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user);
          if (userProfile) {
            setUser(userProfile);
            setIsAuthenticated(true);
            setError(null);
          } else {
            setError('Perfil do usuário não encontrado');
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
        
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erro ao verificar sessão:', error);
        setError(explainSupabaseError(error));
        setIsAuthenticated(false);
        setUser(null);
      } else if (session?.user) {
        const userProfile = await fetchUserProfile(session.user);
        if (userProfile) {
          setUser(userProfile);
          setIsAuthenticated(true);
          setError(null);
        } else {
          setError('Perfil do usuário não encontrado');
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (e: any) {
      console.error('Erro ao verificar sessão:', e);
      setError(explainSupabaseError(e));
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
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

  // Placeholder functions for compatibility
  const getAllUsers = (): User[] => {
    const [users, setUsers] = useState<User[]>([]);
    
    React.useEffect(() => {
      userOperations.getAll().then(setUsers).catch(console.error);
    }, []);
    
    return users;
  };

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
        // Create user profile in database
        await userOperations.create({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          authLevel: userData.authLevel,
          teamId: userData.teamId || null,
          managerId: userData.managerId || null,
          createdBy: user?.id || null
        });
      }
    } catch (e: any) {
      throw new Error(explainSupabaseError(e));
    }
  };

  const updateUser = async (id: string, updates: any): Promise<void> => {
    try {
      await userOperations.update(id, updates);
    } catch (e: any) {
      throw new Error(`Erro ao atualizar usuário: ${e.message}`);
    }
  };

  const deleteUser = async (id: string): Promise<void> => {
    try {
      await userOperations.delete(id);
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