import {
  PushNotifications,
  Token,
  PushNotificationSchema,
  ActionPerformed,
  DeliveredNotifications
} from '@capacitor/push-notifications';

/**
 * Push Notifications Service
 * 
 * Provides push notification functionality with permission handling for iOS.
 * Implements Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

export interface PushNotificationPermissionStatus {
  receive: 'prompt' | 'granted' | 'denied';
}

export interface NotificationPreferences {
  all: boolean;
  importantOnly: boolean;
  none: boolean;
}

type NotificationListener = (notification: PushNotificationSchema) => void;
type TokenListener = (token: Token) => void;
type ActionListener = (action: ActionPerformed) => void;

class PushNotificationsService {
  private isInitialized = false;
  private deviceToken: string | null = null;
  private notificationListeners: Set<NotificationListener> = new Set();
  private tokenListeners: Set<TokenListener> = new Set();
  private actionListeners: Set<ActionListener> = new Set();

  /**
   * Check push notification permissions
   */
  async checkPermissions(): Promise<PushNotificationPermissionStatus> {
    try {
      const permissions = await PushNotifications.checkPermissions();
      return {
        receive: permissions.receive as PushNotificationPermissionStatus['receive']
      };
    } catch (error) {
      console.error('Error checking push notification permissions:', error);
      throw error;
    }
  }

  /**
   * Request push notification permissions
   */
  async requestPermissions(): Promise<PushNotificationPermissionStatus> {
    try {
      const permissions = await PushNotifications.requestPermissions();
      return {
        receive: permissions.receive as PushNotificationPermissionStatus['receive']
      };
    } catch (error) {
      console.error('Error requesting push notification permissions:', error);
      throw error;
    }
  }

  /**
   * Initialize push notifications
   * Sets up listeners and registers for notifications
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Push notifications already initialized');
      return;
    }

    try {
      // Check permissions first
      const permissions = await this.checkPermissions();
      
      // Request permissions if not granted
      if (permissions.receive !== 'granted') {
        const newPermissions = await this.requestPermissions();
        if (newPermissions.receive !== 'granted') {
          throw new Error('Push notification permission denied');
        }
      }

      // Set up listeners
      this.setupListeners();

      // Register for push notifications
      await PushNotifications.register();

      this.isInitialized = true;
      console.log('Push notifications initialized successfully');
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      throw error;
    }
  }

  /**
   * Set up notification listeners
   */
  private setupListeners(): void {
    // Registration success - receive device token
    PushNotifications.addListener('registration', (token: Token) => {
      console.log('Push registration success, token:', token.value);
      this.deviceToken = token.value;
      this.tokenListeners.forEach(listener => listener(token));
    });

    // Registration error
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error);
    });

    // Notification received while app is in foreground
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
        this.notificationListeners.forEach(listener => listener(notification));
      }
    );

    // Notification action performed (user tapped notification)
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        console.log('Push notification action performed:', action);
        this.actionListeners.forEach(listener => listener(action));
      }
    );
  }

  /**
   * Get the device token
   */
  getDeviceToken(): string | null {
    return this.deviceToken;
  }

  /**
   * Add a listener for received notifications
   */
  addNotificationListener(listener: NotificationListener): () => void {
    this.notificationListeners.add(listener);
    return () => this.notificationListeners.delete(listener);
  }

  /**
   * Add a listener for token registration
   */
  addTokenListener(listener: TokenListener): () => void {
    this.tokenListeners.add(listener);
    return () => this.tokenListeners.delete(listener);
  }

  /**
   * Add a listener for notification actions
   */
  addActionListener(listener: ActionListener): () => void {
    this.actionListeners.add(listener);
    return () => this.actionListeners.delete(listener);
  }

  /**
   * Get delivered notifications
   */
  async getDeliveredNotifications(): Promise<DeliveredNotifications> {
    try {
      return await PushNotifications.getDeliveredNotifications();
    } catch (error) {
      console.error('Error getting delivered notifications:', error);
      throw error;
    }
  }

  /**
   * Remove specific delivered notifications
   */
  async removeDeliveredNotifications(notifications: DeliveredNotifications): Promise<void> {
    try {
      await PushNotifications.removeDeliveredNotifications(notifications);
    } catch (error) {
      console.error('Error removing delivered notifications:', error);
      throw error;
    }
  }

  /**
   * Remove all delivered notifications
   */
  async removeAllDeliveredNotifications(): Promise<void> {
    try {
      await PushNotifications.removeAllDeliveredNotifications();
    } catch (error) {
      console.error('Error removing all delivered notifications:', error);
      throw error;
    }
  }

  /**
   * Clean up listeners and unregister
   */
  async cleanup(): Promise<void> {
    try {
      await PushNotifications.removeAllListeners();
      this.notificationListeners.clear();
      this.tokenListeners.clear();
      this.actionListeners.clear();
      this.deviceToken = null;
      this.isInitialized = false;
    } catch (error) {
      console.error('Error cleaning up push notifications:', error);
      throw error;
    }
  }
}

export const pushNotificationsService = new PushNotificationsService();
