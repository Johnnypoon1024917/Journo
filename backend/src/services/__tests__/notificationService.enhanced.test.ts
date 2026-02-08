import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationService } from '../notificationService.js';
import pool from '../../config/database.js';
import { socketService } from '../socketService.js';

// Mock dependencies
vi.mock('../../config/database.js');
vi.mock('../socketService.js');

describe('NotificationService - Enhanced Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createNotification', () => {
    it('should create notification with category and priority', async () => {
      const mockNotification = {
        id: 'notif-1',
        user_id: 'user-1',
        type: 'test',
        category: 'activity',
        priority: 'high',
        title: 'Test',
        message: 'Test message',
        data: {},
        action_url: '/test',
        is_read: false,
        created_at: new Date()
      };

      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [{ user_id: 'user-1', batch_notifications: false, quiet_hours_enabled: false }],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: []
      });

      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [mockNotification],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: []
      });

      const result = await NotificationService.createNotification({
        userId: 'user-1',
        type: 'test',
        title: 'Test',
        message: 'Test message',
        category: 'activity',
        priority: 'high',
        actionUrl: '/test'
      });

      expect(result).toBeDefined();
      expect(result.category).toBe('activity');
      expect(result.priority).toBe('high');
      expect(socketService.emitNotification).toHaveBeenCalledWith('user-1', expect.any(Object));
    });

    it('should use default category and priority if not provided', async () => {
      const mockNotification = {
        id: 'notif-1',
        user_id: 'user-1',
        type: 'test',
        category: 'system',
        priority: 'normal',
        title: 'Test',
        message: 'Test message',
        data: {},
        is_read: false,
        created_at: new Date()
      };

      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [{ user_id: 'user-1', batch_notifications: false, quiet_hours_enabled: false }],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: []
      });

      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [mockNotification],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: []
      });

      const result = await NotificationService.createNotification({
        userId: 'user-1',
        type: 'test',
        title: 'Test',
        message: 'Test message'
      });

      expect(result.category).toBe('system');
      expect(result.priority).toBe('normal');
    });
  });

  describe('getUserNotifications', () => {
    it('should get notifications with filtering', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          user_id: 'user-1',
          type: 'test',
          category: 'activity',
          priority: 'normal',
          title: 'Test 1',
          message: 'Message 1',
          data: {},
          is_read: false,
          created_at: new Date()
        },
        {
          id: 'notif-2',
          user_id: 'user-1',
          type: 'test',
          category: 'collaboration',
          priority: 'high',
          title: 'Test 2',
          message: 'Message 2',
          data: {},
          is_read: true,
          read_at: new Date(),
          created_at: new Date()
        }
      ];

      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: mockNotifications,
        rowCount: 2,
        command: '',
        oid: 0,
        fields: []
      });

      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [{ total: '10', unread: '5' }],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: []
      });

      const result = await NotificationService.getUserNotifications('user-1', {
        limit: 50,
        offset: 0,
        category: 'activity'
      });

      expect(result.notifications).toHaveLength(2);
      expect(result.total).toBe(10);
      expect(result.unreadCount).toBe(5);
    });

    it('should filter by isRead status', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: '',
        oid: 0,
        fields: []
      });

      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [{ total: '0', unread: '0' }],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: []
      });

      await NotificationService.getUserNotifications('user-1', {
        isRead: false
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('is_read = $2'),
        expect.arrayContaining(['user-1', false])
      );
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-02-01');

      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: '',
        oid: 0,
        fields: []
      });

      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [{ total: '0', unread: '0' }],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: []
      });

      await NotificationService.getUserNotifications('user-1', {
        startDate,
        endDate
      });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('created_at >='),
        expect.arrayContaining([startDate])
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotification = {
        id: 'notif-1',
        user_id: 'user-1',
        type: 'test',
        category: 'system',
        priority: 'normal',
        title: 'Test',
        message: 'Test message',
        data: {},
        is_read: true,
        read_at: new Date(),
        created_at: new Date()
      };

      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [mockNotification],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: []
      });

      const result = await NotificationService.markAsRead('notif-1', 'user-1');

      expect(result.isRead).toBe(true);
      expect(result.readAt).toBeDefined();
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notifications'),
        ['notif-1', 'user-1']
      );
    });

    it('should throw error if notification not found', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: '',
        oid: 0,
        fields: []
      });

      await expect(
        NotificationService.markAsRead('notif-1', 'user-1')
      ).rejects.toThrow('Notification not found');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [{ id: 'notif-1' }, { id: 'notif-2' }, { id: 'notif-3' }],
        rowCount: 3,
        command: '',
        oid: 0,
        fields: []
      });

      const count = await NotificationService.markAllAsRead('user-1');

      expect(count).toBe(3);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notifications'),
        ['user-1']
      );
    });

    it('should return 0 if no unread notifications', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: '',
        oid: 0,
        fields: []
      });

      const count = await NotificationService.markAllAsRead('user-1');

      expect(count).toBe(0);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: []
      });

      await NotificationService.deleteNotification('notif-1', 'user-1');

      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
        ['notif-1', 'user-1']
      );
    });

    it('should throw error if notification not found', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: '',
        oid: 0,
        fields: []
      });

      await expect(
        NotificationService.deleteNotification('notif-1', 'user-1')
      ).rejects.toThrow('Notification not found');
    });
  });

  describe('Legacy methods', () => {
    it('should create collaboration invite with enhanced fields', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [{ user_id: 'user-1', batch_notifications: false, quiet_hours_enabled: false }],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: []
      });

      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [{
          id: 'notif-1',
          user_id: 'user-1',
          type: 'collaboration_invite',
          category: 'collaboration',
          priority: 'high',
          title: 'Trip collaboration invite',
          message: 'John invited you to collaborate on "Tokyo Trip" as an editor',
          data: {},
          action_url: '/trips/trip-1',
          is_read: false,
          created_at: new Date()
        }],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: []
      });

      await NotificationService.createCollaborationInvite(
        'user-1',
        'trip-1',
        'Tokyo Trip',
        'John',
        'editor',
        'inviter-1'
      );

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notifications'),
        expect.arrayContaining([
          'user-1',
          'collaboration_invite',
          'Trip collaboration invite',
          expect.stringContaining('John invited you'),
          expect.any(String),
          'collaboration',
          'high',
          '/trips/trip-1'
        ])
      );
    });
  });
});
