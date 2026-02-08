export type NotificationCategory = 'collaboration' | 'activity' | 'mention' | 'system';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  message: string;
  data: Record<string, any>;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

export interface NotificationFilters {
  limit?: number;
  offset?: number;
  category?: NotificationCategory;
  isRead?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  notifyOnCollaboratorJoined: boolean;
  notifyOnItemAdded: boolean;
  notifyOnItemEdited: boolean;
  notifyOnItemDeleted: boolean;
  notifyOnScheduleChanged: boolean;
  notifyOnMention: boolean;
  batchNotifications: boolean;
  batchInterval: number; // minutes
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string; // HH:mm format
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateNotificationPreferencesDto {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  inAppNotifications?: boolean;
  notifyOnCollaboratorJoined?: boolean;
  notifyOnItemAdded?: boolean;
  notifyOnItemEdited?: boolean;
  notifyOnItemDeleted?: boolean;
  notifyOnScheduleChanged?: boolean;
  notifyOnMention?: boolean;
  batchNotifications?: boolean;
  batchInterval?: number;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}