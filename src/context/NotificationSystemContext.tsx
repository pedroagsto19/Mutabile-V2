import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { notificationOperations } from '../lib/database';
import type { Notification, NotificationPreferences, NotificationContextType } from '../types/notification';

const NotificationSystemContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationSystemProvider({ children }: { children: React.ReactNode }) {
  const { user: currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    userId: '',
    projectCreated: true,
    projectAssigned: true,
    activityAssigned: true,
    emailNotifications: false,
    soundEnabled: true
  });

  // Load notifications and preferences on mount
  useEffect(() => {
    if (currentUser) {
      loadNotifications();
      loadPreferences();
    }
  }, [currentUser]);

  const loadNotifications = () => {
    if (!currentUser) return;
    
    notificationOperations.getByUserId(currentUser.id)
      .then(setNotifications)
      .catch(console.error);
  };

  const loadPreferences = () => {
    if (!currentUser) return;
    
    try {
      // Load from Supabase or set defaults
      const defaultPrefs: NotificationPreferences = {
        userId: currentUser.id,
        projectCreated: true,
        projectAssigned: true,
        activityAssigned: true,
        emailNotifications: false,
        soundEnabled: true
      };
      setPreferences(defaultPrefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  // Check for duplicate notifications in the last 5 minutes
  const isDuplicate = (newNotification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    return notifications.some(existing => 
      existing.type === newNotification.type &&
      existing.relatedProjectId === newNotification.relatedProjectId &&
      existing.relatedActivityId === newNotification.relatedActivityId &&
      existing.createdAt > fiveMinutesAgo
    );
  };

  const addNotification = (notificationData: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    if (!currentUser) return;
    
    // Check user preferences
    const prefKey = notificationData.type.replace('_', '').replace('created', 'Created').replace('assigned', 'Assigned') as keyof NotificationPreferences;
    if (preferences[prefKey] === false) return;
    
    // Check for duplicates
    if (isDuplicate(notificationData)) return;
    
    notificationOperations.create(notificationData)
      .then(() => {
        loadNotifications();
        
        // Play sound if enabled
        if (preferences.soundEnabled) {
          playNotificationSound();
        }
      })
      .catch(console.error);
  };

  const markAsRead = (notificationId: string) => {
    notificationOperations.markAsRead(notificationId)
      .then(() => {
        loadNotifications();
      })
      .catch(console.error);
  };

  const markAllAsRead = () => {
    if (!currentUser) return;
    
    notificationOperations.markAllAsRead(currentUser.id)
      .then(() => {
        loadNotifications();
      })
      .catch(console.error);
  };

  const deleteNotification = (notificationId: string) => {
    notificationOperations.delete(notificationId)
      .then(() => {
        loadNotifications();
      })
      .catch(console.error);
  };

  const updatePreferences = (newPreferences: Partial<NotificationPreferences>) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);
    // TODO: Save to Supabase
  };

  const getNotificationsByImportance = () => {
    const special = notifications.filter(n => n.importance === 'special' && !n.isRead);
    const high = notifications.filter(n => n.importance === 'high' && !n.isRead);
    const normal = notifications.filter(n => n.importance === 'normal');
    
    return { special, high, normal };
  };

  const playNotificationSound = () => {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationSystemContext.Provider value={{
      notifications,
      unreadCount,
      preferences,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      updatePreferences,
      getNotificationsByImportance
    }}>
      {children}
    </NotificationSystemContext.Provider>
  );
}

export const useNotificationSystem = () => {
  const context = useContext(NotificationSystemContext);
  if (!context) {
    throw new Error('useNotificationSystem must be used within a NotificationSystemProvider');
  }
  return context;
};