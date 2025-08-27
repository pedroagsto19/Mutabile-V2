import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, LoginCredentials, AuthState, Permission } from '../types/auth';
import LocalStorage from '../lib/localStorage';

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

  // Initialize local storage and load users on mount
  useEffect(() => {
    LocalStorage.initializeDefaultData();
    loadUsers();
    
    // Check for existing session
    const savedUser = LocalStorage.getCurrentUser();
    if (savedUser) {
      setAuthState({
        user: convertLocalUser(savedUser),
        isAuthenticated: true,
        isLoading: false
      });
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const loadUsers = () => {
    try {
      const localUsers = LocalStorage.getUsers();
      setUsers(localUsers.map(convertLocalUser));
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

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
      const localUser = LocalStorage.authenticateUser(credentials.email, credentials.password);
      
      if (localUser) {
        const user = convertLocalUser(localUser);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        });
        LocalStorage.setCurrentUser(localUser);
        return true;
      } else {
        console.log('Authentication failed for:', credentials.email);
        // Debug: log available users
        const users = LocalStorage.getUsers();
        console.log('Available users:', users.map(u => ({ email: u.email, authLevel: u.authLevel })));
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
    LocalStorage.setCurrentUser(null);
  };

  const register = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    try {
      const { password, ...userDataWithoutPassword } = userData as any;
      
      const newLocalUser = LocalStorage.createUser({
        ...userDataWithoutPassword,
        password: password || 'temp123'
      });

      const newUser = convertLocalUser(newLocalUser);
      loadUsers(); // Reload users list
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
        const user = users.find(u => u.id === id);
        if (user) {
          const localUser = LocalStorage.authenticateUser(user.email, currentPassword);
          if (!localUser) {
            throw new Error('Senha atual incorreta');
          }
        }
      }
      
      // Prepare update data
      const updateData: any = { ...userUpdates };
      if (password) {
        updateData.password = password;
      }
      
      const success = LocalStorage.updateUser(id, updateData);
      
      if (success) {
        // Update current user if it's the same user
        if (authState.user?.id === id) {
          const updatedLocalUser = LocalStorage.getUsers().find(u => u.id === id);
          if (updatedLocalUser) {
            const updatedUser = convertLocalUser(updatedLocalUser);
            setAuthState(prev => ({ ...prev, user: updatedUser }));
            LocalStorage.setCurrentUser(updatedLocalUser);
          }
        }
        
        loadUsers(); // Reload users list
        return true;
      }
      
      throw new Error('Erro ao atualizar usuário');
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      const success = LocalStorage.deleteUser(id);
      
      if (success) {
        loadUsers(); // Reload users list
        return true;
      }
      
      throw new Error('Erro ao excluir usuário');
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