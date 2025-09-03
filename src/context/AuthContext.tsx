import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, hasValidSession, explainSupabaseError } from '../lib/supabase';
type SupabaseUser = any;
import type { User } from '../types/auth';

interface AuthContextType {
  user: SupabaseUser | null;
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
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setUser(session.user);
          setIsAuthenticated(true);
          setError(null);
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
        setUser(session.user);
        setIsAuthenticated(true);
        setError(null);
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
    return [];
  };

  const register = async (userData: any): Promise<void> => {
    throw new Error('Registration is disabled');
  };

  const updateUser = async (id: string, updates: any): Promise<void> => {
    throw new Error('User updates not implemented');
  };

  const deleteUser = async (id: string): Promise<void> => {
    throw new Error('User deletion not implemented');
  };

  const hasPermission = (permission: string): boolean => {
    return false;
  };

  const canEditUser = (user: User): boolean => {
    return false;
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