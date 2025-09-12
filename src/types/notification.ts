export interface Notification {
  id: string;
  type: 'project_created' | 'project_assigned' | 'activity_assigned';
  title: string;
  message: string;
  importance: 'normal' | 'high' | 'special';
  userId: string;
  isRead: boolean;
  isFixed: boolean; // Para notificações especiais que ficam fixadas
  relatedProjectId?: string;
  relatedActivityId?: string;
  createdAt: Date;
  readAt?: Date;
}

export interface NotificationPreferences {
  userId: string;
  projectCreated: boolean;
  projectAssigned: boolean;
  activityAssigned: boolean;
  emailNotifications: boolean;
  soundEnabled: boolean;
}

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  getNotificationsByImportance: () => {
    special: Notification[];
    high: Notification[];
    normal: Notification[];
  };
}