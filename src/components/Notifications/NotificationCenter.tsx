import React, { useState } from 'react';
import { Bell, X, Settings, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';
import { useNotificationSystem } from '../../context/NotificationSystemContext';
import { useProject } from '../../context/ProjectContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationCenterProps {
  onNavigateToProject?: (projectId: string) => void;
  onNavigateToActivity?: (projectId: string, activityId: string) => void;
}

export function NotificationCenter({ onNavigateToProject, onNavigateToActivity }: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    preferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    getNotificationsByImportance
  } = useNotificationSystem();
  
  const { projects } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  
  const { special, high, normal } = getNotificationsByImportance();

  const handleNotificationClick = (notification: any) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navigate to related content
    if (notification.relatedActivityId && notification.relatedProjectId) {
      onNavigateToActivity?.(notification.relatedProjectId, notification.relatedActivityId);
    } else if (notification.relatedProjectId) {
      onNavigateToProject?.(notification.relatedProjectId);
    }

    setIsOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'project_created':
        return '🏗️';
      case 'project_assigned':
        return '👤';
      case 'activity_assigned':
        return '📋';
      default:
        return '🔔';
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'special':
        return 'border-l-4 border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-4 border-l-orange-500 bg-orange-50';
      default:
        return 'border-l-4 border-l-blue-500 bg-blue-50';
    }
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return '';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Projeto não encontrado';
  };

  const NotificationItem = ({ notification }: { notification: any }) => (
    <div
      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
        !notification.isRead ? getImportanceColor(notification.importance) : 'bg-white'
      }`}
      onClick={() => handleNotificationClick(notification)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                {notification.title}
              </h4>
              {notification.importance === 'special' && !notification.isRead && (
                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full font-medium">
                  Especial
                </span>
              )}
              {notification.importance === 'high' && !notification.isRead && (
                <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full font-medium">
                  Alta
                </span>
              )}
            </div>
            <p className={`text-sm mt-1 ${!notification.isRead ? 'text-gray-700' : 'text-gray-500'}`}>
              {notification.message}
            </p>
            {notification.relatedProjectId && (
              <p className="text-xs text-blue-600 mt-1">
                📁 {getProjectName(notification.relatedProjectId)}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              {format(notification.createdAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {!notification.isRead && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                markAsRead(notification.id);
              }}
              className="text-gray-400 hover:text-green-600 transition-colors"
              title="Marcar como lida"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNotification(notification.id);
            }}
            className="text-gray-400 hover:text-red-600 transition-colors"
            title="Excluir notificação"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <ExternalLink className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  );

  const PreferencesModal = () => (
    <Modal
      isOpen={showPreferences}
      onClose={() => setShowPreferences(false)}
      title="Preferências de Notificação"
      size="md"
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tipos de Notificação</h3>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.projectCreated}
                onChange={(e) => updatePreferences({ projectCreated: e.target.checked })}
                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                Novos projetos criados
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.projectAssigned}
                onChange={(e) => updatePreferences({ projectAssigned: e.target.checked })}
                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                Quando for designado responsável por um projeto
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.activityAssigned}
                onChange={(e) => updatePreferences({ activityAssigned: e.target.checked })}
                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                Quando for designado responsável por uma atividade
              </span>
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações Gerais</h3>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.soundEnabled}
                onChange={(e) => updatePreferences({ soundEnabled: e.target.checked })}
                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                Som de notificação
              </span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.emailNotifications}
                onChange={(e) => updatePreferences({ emailNotifications: e.target.checked })}
                className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
              />
              <span className="ml-3 text-sm text-gray-700">
                Notificações por e-mail (em desenvolvimento)
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => setShowPreferences(false)}>
            Salvar Preferências
          </Button>
        </div>
      </div>
    </Modal>
  );

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(true)}
          className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 rounded-lg transition-colors"
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Central de Notificações"
        size="xl"
      >
        <div className="space-y-4">
          {/* Header Actions */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
              </span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Marcar todas como lidas
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreferences(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Preferências
            </Button>
          </div>

          {/* Special Notifications (Fixed) */}
          {special.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-red-800 mb-2 flex items-center">
                🔴 Notificações Especiais (Fixadas)
              </h3>
              <div className="space-y-2">
                {special.map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            </div>
          )}

          {/* High Priority Notifications */}
          {high.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-orange-800 mb-2 flex items-center">
                🟠 Alta Prioridade
              </h3>
              <div className="space-y-2">
                {high.map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            </div>
          )}

          {/* Normal Notifications */}
          <div className="max-h-96 overflow-y-auto">
            {normal.length > 0 ? (
              <div className="space-y-2">
                {normal.map(notification => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma notificação</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <PreferencesModal />
    </>
  );
}