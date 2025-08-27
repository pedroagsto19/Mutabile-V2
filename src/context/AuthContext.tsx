import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, LoginCredentials, AuthState, Permission } from '../types/auth';
import { supabase, hashPassword, verifyPassword } from '../lib/supabase';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  register: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  getAllUsers: () => User[];
  getUsersByTeam: (teamId: string) => User[];
  getPermissions: (user: User) => Permission;
  hasPermission: (permission: keyof Permission) => boolean;
  canEditUser: (targetUser: User) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to convert local user to app user
const convertLocalUser = (localUser: any): User => ({
  id: localUser.id,
  name: localUser.name,
  email: localUser.email,
  role: localUser.role,
  authLevel: localUser.authLevel,
  teamId: localUser.teamId,
  managerId: localUser.managerId,
  createdBy: localUser.createdBy,
  createdAt: new Date(localUser.createdAt),
  updatedAt: new Date(localUser.updatedAt)
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  // Load users from database on mount
  useEffect(() => {
    loadUsers();
    checkSession();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) throw error;
      
      setUsers((data || []).map(convertDatabaseUser));
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const checkSession = async () => {
    try {
      const savedUserId = localStorage.getItem('current_user_id');
      if (savedUserId) {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', savedUserId)
          .single();
        
        if (data && !error) {
          setAuthState({
            user: convertDatabaseUser(data),
            isAuthenticated: true,
            isLoading: false
          });
          return;
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
    
    setAuthState(prev => ({ ...prev, isLoading: false }));
  };

  // Helper function to convert database user to app user
  const convertDatabaseUser = (dbUser: any): User => ({
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    authLevel: dbUser.auth_level,
    teamId: dbUser.team_id,
    managerId: dbUser.manager_id,
    createdBy: dbUser.created_by,
    createdAt: new Date(dbUser.created_at),
    updatedAt: new Date(dbUser.updated_at)
  });

  const getPermissions = (user: User): Permission => {
    const basePermissions: Permission = {
      canCreateProjects: false,
      canEditProjects: false,
      canDeleteProjects: false,
      canCreateActivities: false,
      canEditOwnActivities: false,
      canEditAllActivities: false,
      canDeleteActivities: false,
      canUseTimer: false,
      canUpdateProgress: false,
      canManageUsers: false,
      canChangeUserAuthLevel: false,
      canViewReports: false,
      canAccessSettings: false
    };

    switch (user.authLevel) {
      case 'admin':
        return {
          canCreateProjects: true,
          canEditProjects: true,
          canDeleteProjects: true,
          canCreateActivities: true,
          canEditOwnActivities: true,
          canEditAllActivities: true,
          canDeleteActivities: true,
          canUseTimer: true,
          canUpdateProgress: true,
          canManageUsers: true,
          canChangeUserAuthLevel: true,
          canViewReports: true,
          canAccessSettings: true
        };
      case 'gestor':
        return {
          ...basePermissions,
          canCreateProjects: true,
          canEditProjects: true,
          canDeleteProjects: true,
          canCreateActivities: true,
          canEditOwnActivities: true,
          canEditAllActivities: true,
          canDeleteActivities: true,
          canUseTimer: true,
          canUpdateProgress: true,
          canManageUsers: true,
          canViewReports: true,
          canAccessSettings: true
        };
      case 'equipe':
        return {
          ...basePermissions,
          canCreateActivities: true,
          canEditOwnActivities: true,
          canUseTimer: true,
          canUpdateProgress: true,
          canViewReports: true
        };
      case 'leitor':
        return {
          ...basePermissions,
          canViewReports: true
        };
      default:
        return basePermissions;
    }
  };

  const hasPermission = (permission: keyof Permission): boolean => {
    if (!authState.user) return false;
    const permissions = getPermissions(authState.user);
    return permissions[permission];
  };

  const canEditUser = (targetUser: User): boolean => {
    if (!authState.user) return false;
    
    // Admin pode editar qualquer usuário
    if (authState.user.authLevel === 'admin') return true;
    
    // Gestor pode editar usuários da sua equipe (exceto outros gestores e admins)
    if (authState.user.authLevel === 'gestor') {
      return targetUser.teamId === authState.user.teamId && 
             targetUser.authLevel !== 'admin' && 
             targetUser.authLevel !== 'gestor';
    }
    
    return false;
  };

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', credentials.email)
        .single();
      
      if (error || !data) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return false;
      }
      
      const isValidPassword = verifyPassword(credentials.password, data.password_hash);
      
      if (isValidPassword) {
        const user = convertDatabaseUser(data);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        });
        localStorage.setItem('current_user_id', user.id);
        return true;
      }
    } catch (error) {
      console.error('Login error:', error);
    }
    
    setAuthState(prev => ({ ...prev, isLoading: false }));
    return false;
  };

  const logout = () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
    localStorage.removeItem('current_user_id');
  };

  const register = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    try {
      const { password, ...userDataWithoutPassword } = userData as any;
      
      const { data, error } = await supabase
        .from('users')
        .insert([{
          name: userDataWithoutPassword.name,
          email: userDataWithoutPassword.email,
          role: userDataWithoutPassword.role,
          auth_level: userDataWithoutPassword.authLevel,
          team_id: userDataWithoutPassword.teamId,
          manager_id: userDataWithoutPassword.managerId,
          created_by: userDataWithoutPassword.createdBy || authState.user?.id,
          password_hash: hashPassword(password || 'temp123')
        }])
        .select()
        .single();
      
      if (error) throw error;

      const newUser = convertDatabaseUser(data);
      await loadUsers(); // Reload users list
      return newUser;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, updates: Partial<User>): Promise<boolean> => {
    try {
      const { password, currentPassword, ...userUpdates } = updates as any;
      
      // If password is being changed, validate current password first
      if (password && currentPassword) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email, password_hash')
          .eq('id', id)
          .single();
        
        if (userError || !userData) {
          throw new Error('Usuário não encontrado');
        }
        
        if (!verifyPassword(currentPassword, userData.password_hash)) {
          throw new Error('Senha atual incorreta');
        }
      }
      
      // Prepare update data
      const updateData: any = {
        name: userUpdates.name,
        email: userUpdates.email,
        role: userUpdates.role,
        auth_level: userUpdates.authLevel,
        team_id: userUpdates.teamId,
        manager_id: userUpdates.managerId
      };
      
      if (password) {
        updateData.password_hash = hashPassword(password);
      }
      
      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      // Update current user if it's the same user
      if (authState.user?.id === id) {
        const { data: updatedUserData } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();
        
        if (updatedUserData) {
          const updatedUser = convertDatabaseUser(updatedUserData);
          setAuthState(prev => ({ ...prev, user: updatedUser }));
        }
      }
      
      await loadUsers(); // Reload users list
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      await loadUsers(); // Reload users list
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const getAllUsers = (): User[] => {
    return users;
  };

  const getUsersByTeam = (teamId: string): User[] => {
    return users.filter(user => user.teamId === teamId);
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      logout,
      register,
      updateUser,
      deleteUser,
      getAllUsers,
      getUsersByTeam,
      getPermissions,
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