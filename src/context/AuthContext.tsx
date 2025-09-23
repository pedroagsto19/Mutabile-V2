import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types/auth';
import { userOperations } from '../lib/database';

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
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

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

  // Sincronizar usuários do Authentication com a tabela users
  const syncAuthUsers = async () => {
    try {
      console.log('Sincronizando usuários do Authentication...');
      
      // 1. Executar função de sincronização no Supabase
      const { error: syncError } = await supabase.rpc('sync_auth_users');
      
      if (syncError) {
        console.error('Erro na sincronização:', syncError);
        throw syncError;
      }
      
      // 2. Buscar usuários sincronizados da tabela users
      const users = await userOperations.getAll();
      setAllUsers(users);
      setLastSyncTime(new Date());
      
      console.log(`${users.length} usuários sincronizados com sucesso`);
    } catch (error: any) {
      console.error('Erro ao sincronizar usuários:', error);
      
      // Fallback: buscar diretamente do Authentication se a sincronização falhar
      try {
        console.log('Tentando buscar diretamente do Authentication...');
        const { data: authUsers, error: authError } = await supabase.rpc('get_auth_users');
        
        if (authError) throw authError;
        
        const mappedUsers: User[] = (authUsers || []).map((authUser: any) => ({
          id: authUser.id,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
          email: authUser.email,
          role: authUser.user_metadata?.role || 'Usuário do Sistema',
          authLevel: authUser.user_metadata?.auth_level || 'equipe',
          teamId: authUser.user_metadata?.team_id,
          managerId: authUser.user_metadata?.manager_id,
          createdBy: authUser.user_metadata?.created_by,
          createdAt: new Date(authUser.created_at),
          updatedAt: new Date(authUser.updated_at || authUser.created_at)
        }));
        
        setAllUsers(mappedUsers);
        console.log(`${mappedUsers.length} usuários carregados diretamente do Authentication`);
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError);
        throw new Error('Não foi possível carregar usuários do Authentication');
      }
    }
  };

  // Carregar usuários quando autenticado
  useEffect(() => {
    if (isAuthenticated && user) {
      syncAuthUsers();
      
      // Sincronizar a cada 5 minutos para manter atualizado
      const interval = setInterval(() => {
        syncAuthUsers();
      }, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const getAllUsers = (): User[] => allUsers;

  // Criar usuário no Authentication e sincronizar automaticamente
  const createAuthUser = async (userData: any): Promise<void> => {
    try {
      console.log('Criando usuário no Authentication:', userData.email);
      
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
        email_confirm: true
      });

      if (authError) {
        console.error('Erro ao criar usuário no Authentication:', authError);
        throw authError;
      }

      console.log('Usuário criado no Authentication:', authData.user?.email);
      
      // 2. Sincronizar automaticamente
      await syncAuthUsers();
      
    } catch (e: any) {
      console.error('Erro no createAuthUser:', e);
      throw new Error(e.message || 'Erro ao criar usuário');
    }
  };

  // Atualizar metadata do usuário no Authentication e sincronizar
  const updateUserMetadata = async (userId: string, metadata: any): Promise<void> => {
    try {
      console.log('Atualizando metadata do usuário:', userId, metadata);
      
      // 1. Atualizar no Supabase Authentication
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: metadata
      });

      if (authError) {
        console.error('Erro ao atualizar metadata no Authentication:', authError);
        throw authError;
      }

      console.log('Metadata atualizado no Authentication');
      
      // 2. Sincronizar automaticamente
      await syncAuthUsers();
      
      // 3. Se for o usuário atual, atualizar estado local
      if (userId === user?.id) {
        setUser(prev => prev ? { 
          ...prev, 
          name: metadata.name || prev.name,
          role: metadata.role || prev.role,
          authLevel: metadata.auth_level || prev.authLevel,
          teamId: metadata.team_id || prev.teamId,
          managerId: metadata.manager_id || prev.managerId
        } : null);
      }
      
    } catch (e: any) {
      console.error('Erro no updateUserMetadata:', e);
      throw new Error(e.message || 'Erro ao atualizar usuário');
    }
  };

  // Deletar usuário do Authentication (sincronização automática via trigger)
  const deleteAuthUser = async (userId: string): Promise<void> => {
    try {
      console.log('Deletando usuário do Authentication:', userId);
      
      // Deletar do Supabase Authentication
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
        console.error('Erro ao deletar usuário do Authentication:', authError);
        throw authError;
      }

      console.log('Usuário deletado do Authentication');
      
      // Sincronizar automaticamente
      await syncAuthUsers();
      
    } catch (e: any) {
      console.error('Erro no deleteAuthUser:', e);
      throw new Error(e.message || 'Erro ao deletar usuário');
    }
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