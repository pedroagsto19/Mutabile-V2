import React, { createContext, useContext, useEffect, useState } from 'react';
import { ToastContainer } from '../components/UI/Toast';
import { ConfirmDialog } from '../components/UI/ConfirmDialog';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useAuth } from './AuthContext';
import { notificationOperations } from '../lib/database';
import type {
  Notification,
  NotificationPreferences,
  NotificationContextType as NotificationSystemValue
} from '../types/notification';

type ToastMethods = {
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
};

interface NotificationContextValue extends NotificationSystemValue {
  toast: ToastMethods;
  confirm: (options: {
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    confirmText?: string;
    cancelText?: string;
  }) => Promise<boolean>;
}

const defaultPreferences: NotificationPreferences = {
  userId: '',
  projectCreated: true,
  projectAssigned: true,
  activityAssigned: true,
  emailNotifications: false,
  soundEnabled: true
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user: currentUser } = useAuth();
  const { toasts, removeToast, success, error, warning, info } = useToast();
  const { isOpen, options, confirm, handleConfirm, handleCancel } = useConfirm();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setPreferences(defaultPreferences);
      return;
    }

    loadNotifications(currentUser.id);
    loadPreferences(currentUser.id);
  }, [currentUser?.id]);

  const loadNotifications = async (userId: string) => {
    try {
      const notificationList = await notificationOperations.getByUserId(userId);
      setNotifications(notificationList);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const loadPreferences = (userId: string) => {
    setPreferences({
      ...defaultPreferences,
      userId
    });
  };

  const getPreferenceKey = (type: Notification['type']): keyof NotificationPreferences => {
    switch (type) {
      case 'project_created':
        return 'projectCreated';
      case 'project_assigned':
        return 'projectAssigned';
      case 'activity_assigned':
        return 'activityAssigned';
      default:
        return 'projectCreated';
    }
  };

  const isDuplicate = (
    existingNotifications: Notification[],
    candidate: Omit<Notification, 'id' | 'createdAt' | 'isRead'>
  ) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    return existingNotifications.some(existing =>
      existing.type === candidate.type &&
      existing.relatedProjectId === candidate.relatedProjectId &&
      existing.relatedActivityId === candidate.relatedActivityId &&
      existing.createdAt > fiveMinutesAgo
    );
  };

  const addNotification = async (notificationData: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    if (!currentUser) return;

    const preferenceKey = getPreferenceKey(notificationData.type);
    if (preferences[preferenceKey] === false) return;

    if (isDuplicate(notifications, notificationData)) return;

    try {
      await notificationOperations.create(notificationData);
      await loadNotifications(currentUser.id);
      if (preferences.soundEnabled) {
        playNotificationSound();
      }
    } catch (err) {
      console.error('Error creating notification:', err);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationOperations.markAsRead(notificationId);
      if (currentUser) {
        await loadNotifications(currentUser.id);
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;

    try {
      await notificationOperations.markAllAsRead(currentUser.id);
      await loadNotifications(currentUser.id);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationOperations.delete(notificationId);
      if (currentUser) {
        await loadNotifications(currentUser.id);
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const updatePreferences = (newPreferences: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...newPreferences
    }));
    // TODO: Persistir preferências no Supabase
  };

  const playNotificationSound = () => {
    if (typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (err) {
      console.log('Could not play notification sound:', err);
    }
  };

  const contextValue: NotificationContextValue = {
    notifications,
    unreadCount: notifications.filter(n => !n.isRead).length,
    preferences,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    getNotificationsByImportance: () => {
      const special = notifications.filter(n => n.importance === 'special' && !n.isRead);
      const high = notifications.filter(n => n.importance === 'high' && !n.isRead);
      const normal = notifications.filter(n => n.importance === 'normal');
      return { special, high, normal };
    },
    toast: { success, error, warning, info },
    confirm
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={options.title}
        message={options.message}
        type={options.type}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
      />
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
