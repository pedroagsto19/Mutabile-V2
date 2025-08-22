import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, Building2 } from 'lucide-react';
import { Button } from '../UI/Button';
import { Card, CardHeader, CardContent } from '../UI/Card';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export function LoginForm() {
  const { login, isLoading } = useAuth();
  const { toast } = useNotification();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!credentials.email || !credentials.password) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    const success = await login(credentials);
    if (!success) {
      toast.error('Erro de autenticação', 'E-mail ou senha incorretos');
    }
  };

  const handleDemoLogin = (email: string, password: string) => {
    setCredentials({ email, password });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <img src="/png.png" alt="Mutabile Logo" className="h-12 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Mutabile
              </h1>
              <p className="text-sm text-gray-600">Acompanhamento de Obras</p>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Faça login em sua conta
          </h2>
          <p className="text-gray-600">
            Acesse o sistema de gestão de projetos
          </p>
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
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                  placeholder="seu@email.com"
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
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none"
                    placeholder="Sua senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
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

        {/* Demo Accounts */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Contas de Demonstração</h3>
            <p className="text-sm text-gray-600">Clique para testar diferentes níveis de acesso</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('marina@mutabile.com.br', 'admin123')}
                  className="text-left justify-start h-auto py-3"
                >
                  <div>
                    <p className="font-medium">Admin</p>
                    <p className="text-xs text-gray-500">Acesso total</p>
                    <p className="text-xs text-blue-600">marina@mutabile.com.br</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('ana@mutabile.com.br', 'gestor123')}
                  className="text-left justify-start h-auto py-3"
                >
                  <div>
                    <p className="font-medium">Gestor</p>
                    <p className="text-xs text-gray-500">Gerencia projetos</p>
                    <p className="text-xs text-blue-600">ana@mutabile.com.br</p>
                  </div>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('carlos@mutabile.com.br', 'equipe123')}
                  className="text-left justify-start h-auto py-3"
                >
                  <div>
                    <p className="font-medium">Equipe</p>
                    <p className="text-xs text-gray-500">Executa atividades</p>
                    <p className="text-xs text-blue-600">carlos@mutabile.com.br</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDemoLogin('joao@mutabile.com.br', 'leitor123')}
                  className="text-left justify-start h-auto py-3"
                >
                  <div>
                    <p className="font-medium">Leitor</p>
                    <p className="text-xs text-gray-500">Apenas visualização</p>
                    <p className="text-xs text-blue-600">joao@mutabile.com.br</p>
                  </div>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}