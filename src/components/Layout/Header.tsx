import React from 'react';
import { Building2, Settings, User } from 'lucide-react';
import { Button } from '../UI/Button';
import { SettingsModal } from '../Settings/SettingsModal';
import { useProject } from '../../context/ProjectContext';

interface HeaderProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Header({ currentView, onViewChange }: HeaderProps) {
  const { currentUser } = useProject();

  const [showSettings, setShowSettings] = React.useState(false);

  const handleProfileClick = () => {
    // TODO: Implement profile functionality
    alert('Funcionalidade de perfil será implementada em breve');
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <img src="/png.webp" alt="Mutabile Logo" className="h-8 w-8" />
            <img src="/png.webp" alt="Mutabile Logo" className="h-8 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Mutabile
              </h1>
              <p className="text-sm text-gray-600">Gestão de Projetos</p>
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
            >
              Projetos
            </Button>
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={handleSettingsClick}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleProfileClick}>
            <User className="h-4 w-4" />
            <span className="ml-2">{currentUser.name}</span>
            {currentUser.role === 'admin' && (
              <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Admin
              </span>
            )}
          </Button>
        </div>
      </div>
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </header>
  );
}