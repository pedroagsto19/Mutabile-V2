import React, { useState } from 'react';
import { X, Users, Settings as SettingsIcon, Shield } from 'lucide-react';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';
import { UserManagement } from '../Users/UserManagement';
import { useAuth } from '../../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    {
      id: 'general',
      name: 'Geral',
      icon: SettingsIcon,
      available: true
    },
    {
      id: 'users',
      name: 'Usuários',
      icon: Users,
      available: hasPermission('canManageUsers')
    },
    {
      id: 'security',
      name: 'Segurança',
      icon: Shield,
      available: hasPermission('canAccessSettings')
    }
  ].filter(tab => tab.available);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'security':
        return (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Configurações de Segurança</h3>
            <p className="text-gray-600">
              Funcionalidades de segurança serão implementadas em breve.
            </p>
          </div>
        );
      default:
        return (
          <div className="text-center py-12">
            <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Configurações Gerais</h3>
            <p className="text-gray-600">
              Configurações gerais do sistema serão implementadas em breve.
            </p>
          </div>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurações" size="xl">
      <div className="flex h-96">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 pr-4">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-black text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <IconComponent className="h-4 w-4 mr-3" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 pl-6 overflow-y-auto">
          {renderTabContent()}
        </div>
      </div>
    </Modal>
  );
}