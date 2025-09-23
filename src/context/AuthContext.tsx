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
  loadAllUsers: () => Promise<void>;
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
    
    // Determinar authLevel baseado no metadata ou email
    let authLevel: User['authLevel'] = 'equipe';
    if (metadata.auth_level) {
      authLevel = metadata.auth_level;
    } else {
      // Fallback baseado no email para usuários existentes
      if (authUser.email?.includes('admin')) {
        authLevel = 'admin';
      } else if (authUser.email?.includes('joao')) {
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

  // Carregar todos os usuários do Supabase Authentication
  const loadAllUsers = async () => {
    try {
      // Buscar usuários da tabela users que sincroniza com Authentication
      const { data: usersData, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar usuários:', error);
        // Fallback para usuários mock se não conseguir carregar
        const mockUsers: User[] = [
          {
            id: '1',
            name: 'Administrador',
            email: 'admin@mutabile.com.br',
            role: 'Administrador do Sistema',
            authLevel: 'admin',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        setAllUsers(mockUsers);
        return;
      }

      // Mapear dados da tabela users para o tipo User
      const mappedUsers: User[] = (usersData || []).map(userData => ({
        id: userData.admin_user_id || userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        authLevel: userData.auth_level,
        teamId: userData.team_id,
        managerId: userData.manager_id,
        createdBy: userData.created_by,
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at)
      }));

      setAllUsers(mappedUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setAllUsers([]);
    }
  };

  // Carregar usuários quando autenticado
  useEffect(() => {
    if (isAuthenticated && user?.authLevel === 'admin') {
      loadAllUsers();
    }
  }, [isAuthenticated, user]);

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

  // Criar usuário no Authentication e sincronizar com tabela users
  const createAuthUser = async (userData: any): Promise<void> => {
    try {
      // 1. Criar usuário no Supabase Authentication
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: {
          name: userData.name,
          role: userData.role,
          auth_level: userData.authLevel,
          team_id: userData.teamId || null,
          manager_id: userData.managerId || null,
          created_by: user?.id || null
        },
        email_confirm: true // Confirmar email automaticamente
      });

      if (authError) throw authError;

      // 2. Sincronizar com tabela users
      if (authData?.user) {
        const { error: dbError } = await supabase
          .from('users')
          .insert([{
            admin_user_id: authData.user.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            auth_level: userData.authLevel,
            team_id: userData.teamId || null,
            manager_id: userData.managerId || null,
            created_by: user?.id || null
          }]);

        if (dbError) {
          console.error('Erro ao sincronizar com tabela users:', dbError);
          // Não falhar se a sincronização der erro, o usuário foi criado no Authentication
        }
      }

      await loadAllUsers();
    } catch (e: any) {
      throw new Error(e.message || 'Erro ao criar usuário');
    }
  };

  // Atualizar metadata do usuário no Authentication e sincronizar com tabela users
  const updateUserMetadata = async (userId: string, metadata: any): Promise<void> => {
    try {
      // 1. Atualizar no Supabase Authentication
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: metadata
      });

      if (authError) throw authError;

      // 2. Sincronizar com tabela users
      const { error: dbError } = await supabase
        .from('users')
        .update({
          name: metadata.name,
          role: metadata.role,
          auth_level: metadata.auth_level,
          team_id: metadata.team_id || null,
          manager_id: metadata.manager_id || null
        })
        .eq('admin_user_id', userId);

      if (dbError) {
        console.error('Erro ao sincronizar com tabela users:', dbError);
      }

      // 3. Se for o usuário atual, atualizar estado local
      if (userId === user?.id) {
        setUser(prev => prev ? { 
          ...prev, 
          name: metadata.name,
          role: metadata.role,
          authLevel: metadata.auth_level,
          teamId: metadata.team_id,
          managerId: metadata.manager_id
        } : null);
      }

      await loadAllUsers();
    } catch (e: any) {
      throw new Error(e.message || 'Erro ao atualizar usuário');
    }
  };

  // Deletar usuário do Authentication e tabela users
  const deleteAuthUser = async (userId: string): Promise<void> => {
    try {
      // 1. Deletar da tabela users primeiro
      const { error: dbError } = await supabase
        .from('users')
        .delete()
        .eq('admin_user_id', userId);

      if (dbError) {
        console.error('Erro ao deletar da tabela users:', dbError);
      }

      // 2. Deletar do Supabase Authentication
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) throw authError;

      await loadAllUsers();
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
      loadAllUsers,
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