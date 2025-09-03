import React from 'react';
import { Building2, Settings, User, ArrowLeft, LogOut, Edit } from 'lucide-react';
import { Button } from '../UI/Button';
import { SettingsModal } from '../Settings/SettingsModal';
import { ProfileModal } from '../Users/ProfileModal';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface WorksHeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onBackToMenu: () => void;
}

export function WorksHeader({ currentView, onViewChange, onBackToMenu }: WorksHeaderProps) {
  const { user: currentUser, hasPermission, logout } = useAuth();
  const { confirm } = useNotification();
  const [showSettings, setShowSettings] = React.useState(false);
  const [showProfile, setShowProfile] = React.useState(false);

  const handleProfileClick = () => {
    setShowProfile(true);
  };


  const handleLogout = () => {
    confirm({
      title: 'Sair do Sistema',
      message: 'Tem certeza que deseja sair?',
      type: 'warning',
      confirmText: 'Sair',
      cancelText: 'Cancelar'
    }).then((confirmed) => {
      if (confirmed) {
        logout();
      }
    });
  };

  if (!currentUser) return null;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onBackToMenu}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Menu Principal
            </Button>
            <div className="h-6 w-px bg-gray-300"></div>
            <img src="/png.png" alt="Mutabile Logo" className="h-8 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Gestão de Projetos
              </h1>
              <p className="text-sm text-gray-600">Acompanhamento de Atividades</p>
            </div>
          </div>
          
          <nav className="flex space-x-1">
            <Button
              variant={currentView === 'dashboard' ? 'primary' : 'ghost'}
              onClick={() => onViewChange('dashboard')}
            >
              Dashboard
            </Button>
            <Button
              variant={currentView === 'projects' ? 'primary' : 'ghost'}
              onClick={() => onViewChange('projects')}
              disabled={!hasPermission('canViewReports')}
            >
              Projetos
            </Button>
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-gray-300"></div>
          <button
            onClick={handleProfileClick}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            title="Clique para editar seu perfil"
          >
            <User className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              {currentUser.name}
            </span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {currentUser.authLevel === 'admin' ? 'Admin' :
               currentUser.authLevel === 'gestor' ? 'Gestor' :
               currentUser.authLevel === 'equipe' ? 'Equipe' : 'Leitor'}
            </span>
          </button>
        </div>
      </div>
      
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
      
      <ProfileModal 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
      />
    </header>
  );
}