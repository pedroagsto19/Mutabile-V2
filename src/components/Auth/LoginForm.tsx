import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, LogIn, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../UI/Button';
import { Card, CardHeader, CardContent } from '../UI/Card';
import { supabase, assertEnv, healthCheck, explainSupabaseError } from '../../lib/supabase';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState<{
    envOk: boolean;
    healthOk: boolean;
    message: string;
    checking: boolean;
  }>({
    envOk: false,
    healthOk: false,
    message: '',
    checking: true
  });

  // Verificação inicial do sistema
  useEffect(() => {
    checkSystemHealth();
  }, []);

  const checkSystemHealth = async () => {
    setSystemStatus(prev => ({ ...prev, checking: true }));
    
    // Verificar variáveis de ambiente
    const envIssues = assertEnv();
    if (envIssues.length > 0) {
      setSystemStatus({
        envOk: false,
        healthOk: false,
        message: `Configuração inválida: ${envIssues.join(' | ')}. Configure no Bolt (Environment).`,
        checking: false
      });
      return;
    }

    // Verificar conectividade
    const health = await healthCheck();
    setSystemStatus({
      envOk: true,
      healthOk: health.ok,
      message: health.ok 
        ? 'Sistema pronto para login' 
        : `Não foi possível alcançar o Supabase: ${health.reason}`,
      checking: false
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (!supabase) {
      setError('Supabase não configurado');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (authError) {
        setError(explainSupabaseError(authError));
        return;
      }

      if (data.session) {
        console.log('Login realizado com sucesso:', data.user?.email);
        onLoginSuccess();
      } else {
        setError('Falha no login: sessão não criada');
      }
    } catch (e: any) {
      console.error('Erro no login:', e);
      setError(explainSupabaseError(e));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (systemStatus.checking) {
      return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>;
    }
    if (systemStatus.envOk && systemStatus.healthOk) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (systemStatus.envOk && !systemStatus.healthOk) {
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusColor = () => {
    if (systemStatus.checking) return 'bg-blue-50 border-blue-200 text-blue-800';
    if (systemStatus.envOk && systemStatus.healthOk) return 'bg-green-50 border-green-200 text-green-800';
    if (systemStatus.envOk && !systemStatus.healthOk) return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    return 'bg-red-50 border-red-200 text-red-800';
  };

  const canLogin = systemStatus.envOk && systemStatus.healthOk && !systemStatus.checking;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <img src="/png.png" alt="Mutabile Logo" className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Mutabile
              </h1>
              <p className="text-sm text-gray-600">Gestão de Projetos</p>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Acesso ao Sistema
          </h2>
          <p className="text-gray-600">
            Entre com suas credenciais
          </p>
        </div>

        {/* System Status */}
        <div className={`border rounded-lg p-3 ${getStatusColor()}`}>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">
              {systemStatus.checking ? 'Verificando sistema...' : systemStatus.message}
            </span>
          </div>
          {!systemStatus.healthOk && systemStatus.envOk && (
            <div className="mt-2 text-xs">
              <p>💡 <strong>Dica:</strong> Configure CORS no Supabase:</p>
              <p>• Authentication → URL Configuration</p>
              <p>• Adicione o domínio do preview do Bolt em "Allowed CORS Origins"</p>
            </div>
          )}
        </div>

        {/* Login Form */}
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
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
                  disabled={!canLogin}
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
                    disabled={!canLogin}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={!canLogin}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !canLogin}
              >
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

        {/* Example Logins */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900">Acesso Inicial</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Primeiro Acesso:</strong>
                </p>
                <p className="text-xs text-blue-700">
                  Use o login de administrador para configurar o sistema e criar seus próprios usuários, clientes, fornecedores e projetos.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!canLogin) return;
                  setEmail('admin@mutabile.com.br');
                  setPassword('admin123');
                  setError('');
                  setIsLoading(true);
                  
                  try {
                    const { data, error: authError } = await supabase.auth.signInWithPassword({
                      email: 'admin@mutabile.com.br',
                      password: 'admin123'
                    });

                    if (authError) {
                      setError(explainSupabaseError(authError));
                      return;
                    }
                    if (data.session) {
                      console.log('Login Admin realizado com sucesso');
                      onLoginSuccess();
                    } else {
                      setError('Falha no login: sessão não criada');
                    }
                  } catch (e: any) {
                    console.error('Erro no login Admin:', e);
                    setError(explainSupabaseError(e));
                  } finally {
                    setIsLoading(false);
                  }
                }}
                className="w-full text-left p-3 text-sm bg-red-50 hover:bg-red-100 rounded border transition-colors font-medium"
                disabled={!canLogin}
              >
                <strong>Login Admin:</strong> admin@mutabile.com.br / admin123
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              💡 Clique no botão acima para fazer login como administrador e começar a configurar o sistema
            </p>
          </CardContent>
        </Card>
        {/* Help Section */}
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-900">Configuração do Supabase</h3>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-600 space-y-2">
              <p><strong>1. Variáveis de Ambiente (Bolt):</strong></p>
              <p>• VITE_SUPABASE_URL</p>
              <p>• VITE_SUPABASE_ANON_KEY</p>
              
              <p><strong>2. CORS (Supabase Dashboard):</strong></p>
              <p>• Authentication → URL Configuration</p>
              <p>• Adicionar domínio *.webcontainer-api.io</p>
              
              <p><strong>3. Email Auth:</strong></p>
              <p>• Configurar conforme necessário</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}