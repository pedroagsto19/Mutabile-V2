import React from 'react';
import { 
  Building2, 
  Users, 
  ShoppingCart, 
  Calculator, 
  FileText, 
  BarChart3,
  User as UserIcon,
  Settings,
  LogOut,
} from 'lucide-react';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { SettingsModal } from '../Settings/SettingsModal';
import { NotificationCenter } from '../Notifications/NotificationCenter';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function MainMenu() {
  const navigate = useNavigate();
  const { logout, user: currentUser } = useAuth();
  const [showSettings, setShowSettings] = React.useState(false);

  const handleLogout = () => {
    if (confirm('Tem certeza que deseja sair?')) {
      logout();
    }
  };

  const handleSettings = () => setShowSettings(true);

  const modules = [
    {
      id: 'obras',
      name: 'Gestão de Projetos',
      description: 'Gerencie projetos, etapas e cronogramas',
      icon: Building2,
      color: 'bg-blue-500',
      available: true
    },
    {
      id: 'fornecedores',
      name: 'Fornecedores',
      description: 'Cadastro e gestão de fornecedores',
      icon: Users,
      color: 'bg-green-500',
      available: true
    },
    {
      id: 'clientes',
      name: 'Cadastro de Clientes',
      description: 'Gestão de clientes e funil de vendas',
      icon: ShoppingCart,
      color: 'bg-purple-500',
      available: true
    },
    {
      id: 'precificacao',
      name: 'Precificação',
      description: 'Cálculo de preços e margens',
      icon: Calculator,
      color: 'bg-orange-500',
      available: false
    },
    {
      id: 'orcamento',
      name: 'Orçamento',
      description: 'Criação e gestão de orçamentos',
      icon: FileText,
      color: 'bg-red-500',
      available: false
    },
    {
      id: 'relatorios',
      name: 'Relatórios',
      description: 'Análises e relatórios gerenciais',
      icon: BarChart3,
      color: 'bg-indigo-500',
      available: false
    }
  ];

  const handleModuleClick = (moduleId: string, available: boolean) => {
    if (available) {
      switch (moduleId) {
        case 'obras':
          navigate('/obras/dashboard');
          break;
        case 'fornecedores':
          navigate('/fornecedores');
          break;
        case 'clientes':
          navigate('/clientes');
          break;
        default:
          break;
      }
    } else {
      alert('Este módulo estará disponível em breve!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img src="/png.png" alt="Logo" className="h-8 w-auto" />
              <h1 className="text-2xl font-bold text-gray-900">Mutabile</h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationCenter />
              <Button variant="ghost" size="sm" onClick={handleSettings}>
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <button
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                title="Clique para editar seu perfil"
              >
                <UserIcon className="w-5 h-5 text-gray-500" />
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {currentUser?.name ?? 'Usuário'}
                  </p>
                  {currentUser?.email && (
                    <p className="text-xs text-gray-500">
                      {currentUser.email}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {currentUser?.authLevel === 'admin' ? 'Administrador' :
                     currentUser?.authLevel === 'gestor' ? 'Gestor' :
                     currentUser?.authLevel === 'equipe' ? 'Equipe' : 'Leitor'}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Bem-vindo ao Sistema de Gestão
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Selecione um módulo abaixo para começar a trabalhar. Cada módulo oferece 
            ferramentas específicas para diferentes aspectos do seu negócio.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const IconComponent = module.icon;
            return (
              <Card
                key={module.id}
                className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer ${
                  module.available 
                    ? 'hover:scale-105 border-gray-200' 
                    : 'opacity-75 hover:opacity-90 border-gray-100'
                }`}
                onClick={() => handleModuleClick(module.id, module.available)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${module.color}`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    {!module.available && (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Em desenvolvimento
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {module.name}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    {module.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      module.available ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {module.available ? 'Disponível' : 'Em breve'}
                    </span>
                    {module.available && (
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}