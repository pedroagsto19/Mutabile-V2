import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import type { Notification, NotificationPreferences, NotificationContextType } from '../types/notification';

const NotificationSystemContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'mutabile_notifications';
const PREFERENCES_KEY = 'mutabile_notification_preferences';

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
    
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${currentUser.id}`);
      if (saved) {
        const parsedNotifications = JSON.parse(saved).map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          readAt: n.readAt ? new Date(n.readAt) : undefined
        }));
        setNotifications(parsedNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const saveNotifications = (notifs: Notification[]) => {
    if (!currentUser) return;
    
    try {
      const serialized = notifs.map(n => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt?.toISOString()
      }));
      localStorage.setItem(`${STORAGE_KEY}_${currentUser.id}`, JSON.stringify(serialized));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  };

  const loadPreferences = () => {
    if (!currentUser) return;
    
    try {
      const saved = localStorage.getItem(`${PREFERENCES_KEY}_${currentUser.id}`);
      if (saved) {
        setPreferences(JSON.parse(saved));
      } else {
        // Set default preferences for new user
        const defaultPrefs: NotificationPreferences = {
          userId: currentUser.id,
          projectCreated: true,
          projectAssigned: true,
          activityAssigned: true,
          emailNotifications: false,
          soundEnabled: true
        };
        setPreferences(defaultPrefs);
        localStorage.setItem(`${PREFERENCES_KEY}_${currentUser.id}`, JSON.stringify(defaultPrefs));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = (prefs: NotificationPreferences) => {
    if (!currentUser) return;
    
    try {
      localStorage.setItem(`${PREFERENCES_KEY}_${currentUser.id}`, JSON.stringify(prefs));
    } catch (error) {
      console.error('Error saving preferences:', error);
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
    const prefKey = notificationData.type.replace('_', '') as keyof NotificationPreferences;
    if (preferences[prefKey] === false) return;
    
    // Check for duplicates
    if (isDuplicate(notificationData)) return;
    
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      isRead: false
    };
    
    const updatedNotifications = [newNotification, ...notifications];
    setNotifications(updatedNotifications);
    saveNotifications(updatedNotifications);
    
    // Play sound if enabled
    if (preferences.soundEnabled) {
      playNotificationSound();
    }
  };

  const markAsRead = (notificationId: string) => {
    const updatedNotifications = notifications.map(n => 
      n.id === notificationId 
        ? { ...n, isRead: true, readAt: new Date() }
        : n
    );
    setNotifications(updatedNotifications);
    saveNotifications(updatedNotifications);
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({
      ...n,
      isRead: true,
      readAt: new Date()
    }));
    setNotifications(updatedNotifications);
    saveNotifications(updatedNotifications);
  };

  const deleteNotification = (notificationId: string) => {
    const updatedNotifications = notifications.filter(n => n.id !== notificationId);
    setNotifications(updatedNotifications);
    saveNotifications(updatedNotifications);
  };

  const updatePreferences = (newPreferences: Partial<NotificationPreferences>) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);
    savePreferences(updatedPreferences);
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