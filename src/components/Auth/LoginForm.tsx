import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, LogIn, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '../UI/Button';
import { Card, CardHeader, CardContent } from '../UI/Card';
import { getSupabaseClient } from '../../lib/supabase';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemReady, setSystemReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSystem();
  }, []);

  const checkSystem = async () => {
    setChecking(true);

    let client: ReturnType<typeof getSupabaseClient>;
    try {
      client = getSupabaseClient();
      const auth = client.auth;
      if (!auth) {
        throw new Error('Supabase não configurado');
      }
      
      // Teste simples de conectividade
      await client.auth.getSession();
      setSystemReady(true);
    } catch (error) {
      console.log('Problema de conectividade detectado:', error);
      setSystemReady(false);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    let client: ReturnType<typeof getSupabaseClient>;
    try {
      client = getSupabaseClient();
      const auth = client.auth;
      if (!auth) {
        throw new Error('Supabase não configurado');
      }
    } catch (error: any) {
      setError(error.message || 'Sistema não configurado corretamente');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: authError } = await client.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (authError) {
        console.error('Erro de autenticação:', authError);
        
        if (authError.message.includes('Invalid login credentials')) {
          setError('E-mail ou senha incorretos. Verifique suas credenciais.');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('E-mail não confirmado. Verifique sua caixa de entrada.');
        } else if (authError.message.includes('Too many requests')) {
          setError('Muitas tentativas de login. Aguarde alguns minutos.');
        } else {
          setError('Erro de autenticação: ' + authError.message);
        }
        return;
      }

      if (data.session && data.user) {
        console.log('Login realizado com sucesso para:', data.user.email);
        onLoginSuccess();
      } else {
        setError('Falha no login - sessão não criada');
      }
    } catch (e: any) {
      console.error('Erro no login:', e);
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
    setError('');
    setIsLoading(true);

    try {
      const client = getSupabaseClient();
      const { data, error: authError } = await client.auth.signInWithPassword({
        email: userEmail,
        password: userPassword
      });

      if (authError) {
        console.error('Erro no login rápido:', authError);
        setError('Erro no login: ' + authError.message);
        return;
      }

      if (data.session && data.user) {
        console.log('Login rápido realizado com sucesso para:', data.user.email);
        onLoginSuccess();
      } else {
        setError('Falha no login rápido');
      }
    } catch (e: any) {
      console.error('Erro no login rápido:', e);
      setError('Erro de conexão no login rápido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <img src="/png.png" alt="Mutabile Logo" className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mutabile</h1>
              <p className="text-sm text-gray-600">Gestão de Projetos</p>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acesso ao Sistema
          </h2>
          <p className="text-gray-600">Entre com suas credenciais do Supabase</p>
        </div>

        {/* System Status */}
        <div className={`border rounded-lg p-3 ${
          checking ? 'bg-blue-50 border-blue-200 text-blue-800' :
          systemReady ? 'bg-green-50 border-green-200 text-green-800' :
          'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          <div className="flex items-center space-x-2">
            {checking ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : systemReady ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
            <span className="text-sm font-medium">
              {checking ? 'Verificando conexão com Supabase...' :
               systemReady ? 'Conectado ao Supabase - Sistema pronto' :
               'Problemas de conectividade detectados'}
            </span>
          </div>
          {!checking && !systemReady && (
            <div className="mt-2">
              <p className="text-xs text-yellow-700">
                Você ainda pode tentar fazer login. Se persistir, verifique sua conexão com a internet.
              </p>
              <button
                onClick={checkSystem}
                className="text-xs text-yellow-800 underline hover:text-yellow-900 mt-1"
              >
                Tentar verificar novamente
              </button>
            </div>
          )}
        </div>

        {/* Login Form */}
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                  placeholder="seu@email.com"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                    placeholder="Sua senha"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Entrando...
                  </div>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Quick Access */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900">Acesso Rápido</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Usuários cadastrados no Supabase Authentication:</strong>
                </p>
                <p className="text-xs text-blue-700">
                  Use as credenciais cadastradas na aba Authentication do Supabase.
                </p>
              </div>
              
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@mutabile.com.br', 'admin123')}
                className="w-full text-left p-3 text-sm bg-red-50 hover:bg-red-100 rounded border transition-colors font-medium"
                disabled={isLoading}
              >
                <strong>Admin:</strong> admin@mutabile.com.br / admin123
              </button>
              
              <button
                type="button"
                onClick={() => handleQuickLogin('joao@mutabile.com.br', 'joao123')}
                className="w-full text-left p-3 text-sm bg-green-50 hover:bg-green-100 rounded border transition-colors font-medium"
                disabled={isLoading}
              >
                <strong>João:</strong> joao@mutabile.com.br / joao123
              </button>
              
              <button
                type="button"
                onClick={() => handleQuickLogin('carlos@mutabile.com.br', 'carlos123')}
                className="w-full text-left p-3 text-sm bg-blue-50 hover:bg-blue-100 rounded border transition-colors font-medium"
                disabled={isLoading}
              >
                <strong>Carlos:</strong> carlos@mutabile.com.br / carlos123
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            A autenticação é feita diretamente com o Supabase Authentication.
            <br />
            Verifique a aba Authentication no painel do Supabase para gerenciar usuários.
          </p>
        </div>
      </div>
    </div>
  );
}