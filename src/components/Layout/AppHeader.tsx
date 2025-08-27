import React from 'react';
import { LogOut, User, Settings } from 'lucide-react';
import { Button } from '../UI/Button';
import { useAuth } from '../../context/AuthContext';

export function AppHeader() {
  const { user, logout, isLoading } = useAuth();

  const handleLogout = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await logout();
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src="/png.png" alt="Mutabile Logo" className="h-8 w-auto" />
          <div>
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Mutabile
            </h1>
            <p className="text-sm text-gray-600">Sistema de Gestão</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{user?.email}</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
            ) : (
              <LogOut className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}