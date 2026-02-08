import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationPreferencesService } from '../notificationPreferencesService.js';
import pool from '../../config/database.js';

// Mock dependencies
vi.mock('../../config/database.js');

describe('NotificationPreferencesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPreferences', () => {
    it('should return user preferences if they exist', async () => {
      const mockPreferences = {
        user_id: 'user-1',
        email_notifications: true,
        push_notifications: true,
        in_app_notifications: true,
        notify_on_collaborator_joined: true,
        notify_on_item_added: true,
        notify_on_item_edited: false,
        notify_on_item_deleted: true,
        notify_on_schedule_changed: true,
        notify_on_mention: true,
        batch_notifications: false,
        batch_interval: 1,
        quiet_hours_enabled: false,
        quiet_hours_start: null,
        quiet_hours_end: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [mockPreferences],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: []
      });

      const result = await NotificationPreferencesService.getPreferences('user-1');

      expect(result.userId).toBe('user-1');
      expect(result.emailNotifications).toBe(true);
      expect(result.batchNotifications).toBe(false);
    });

    it('should return default preferences if none exist', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: '',
        oid: 0,
        fields: []
      });

      const result = await NotificationPreferencesService.getPreferences('user-1');

      expect(result.userId).toBe('user-1');
      expect(result.emailNotifications).toBe(true);
      expect(result.pushNotifications).toBe(true);
      expect(result.inAppNotifications).toBe(true);
      expect(result.notifyOnItemEdited).toBe(false); // Too noisy by default
      expect(result.batchNotifications).toBe(false);
      expect(result.quietHoursEnabled).toBe(false);
    });
  });

  describe('updatePreferences', () => {
    it('should create preferences if they do not exist', async () => {
      // First query returns no existing preferences
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: '',
        oid: 0,
        fields: []
      });

      // Second query creates new preferences
      const mockCreated = {
        user_id: 'user-1',
        email_notifications: false,
        push_notifications: true,
        in_app_notifications: true,
        notify_on_collaborator_joined: true,
        notify_on_item_added: true,
        notify_on_item_edited: false,
        notify_on_item_deleted: true,
        notify_on_schedule_changed: true,
        notify_on_mention: true,
        batch_notifications: false,
        batch_interval: 1,
        quiet_hours_enabled: false,
        quiet_hours_start: null,
        quiet_hours_end: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [mockCreated],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: []
      });

      const result = await NotificationPreferencesService.updatePreferences('user-1', {
        emailNotifications: false
      });

      expect(result.emailNotifications).toBe(false);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO notification_preferences'),
        expect.any(Array)
      );
    });

    it('should update existing preferences', async () => {
      const mockExisting = {
        user_id: 'user-1',
        email_notifications: true,
        push_notifications: true,
        in_app_notifications: true,
        notify_on_collaborator_joined: true,
        notify_on_item_added: true,
        notify_on_item_edited: false,
        notify_on_item_deleted: true,
        notify_on_schedule_changed: true,
        notify_on_mention: true,
        batch_notifications: false,
        batch_interval: 1,
        quiet_hours_enabled: false,
        quiet_hours_start: null,
        quiet_hours_end: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      // First query returns existing preferences
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [mockExisting],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: []
      });

      // Second query updates preferences
      const mockUpdated = { ...mockExisting, batch_notifications: true, batch_interval: 5 };
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [mockUpdated],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: []
      });

      const result = await NotificationPreferencesService.updatePreferences('user-1', {
        batchNotifications: true,
        batchInterval: 5
      });

      expect(result.batchNotifications).toBe(true);
      expect(result.batchInterval).toBe(5);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE notification_preferences'),
        expect.any(Array)
      );
    });

    it('should handle quiet hours settings', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: '',
        oid: 0,
        fields: []
      });

      const mockCreated = {
        user_id: 'user-1',
        email_notifications: true,
        push_notifications: true,
        in_app_notifications: true,
        notify_on_collaborator_joined: true,
        notify_on_item_added: true,
        notify_on_item_edited: false,
        notify_on_item_deleted: true,
        notify_on_schedule_changed: true,
        notify_on_mention: true,
        batch_notifications: false,
        batch_interval: 1,
        quiet_hours_enabled: true,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        created_at: new Date(),
        updated_at: new Date()
      };

      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [mockCreated],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: []
      });

      const result = await NotificationPreferencesService.updatePreferences('user-1', {
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00'
      });

      expect(result.quietHoursEnabled).toBe(true);
      expect(result.quietHoursStart).toBe('22:00');
      expect(result.quietHoursEnd).toBe('08:00');
    });

    it('should return existing preferences if no updates provided', async () => {
      const mockExisting = {
        user_id: 'user-1',
        email_notifications: true,
        push_notifications: true,
        in_app_notifications: true,
        notify_on_collaborator_joined: true,
        notify_on_item_added: true,
        notify_on_item_edited: false,
        notify_on_item_deleted: true,
        notify_on_schedule_changed: true,
        notify_on_mention: true,
        batch_notifications: false,
        batch_interval: 1,
        quiet_hours_enabled: false,
        quiet_hours_start: null,
        quiet_hours_end: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [mockExisting],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: []
      });

      const result = await NotificationPreferencesService.updatePreferences('user-1', {});

      expect(result.userId).toBe('user-1');
      expect(pool.query).toHaveBeenCalledTimes(1); // Only the SELECT query
    });
  });

  describe('deletePreferences', () => {
    it('should delete user preferences', async () => {
      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: []
      });

      await NotificationPreferencesService.deletePreferences('user-1');

      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM notification_preferences WHERE user_id = $1',
        ['user-1']
      );
    });
  });

  describe('shouldNotify', () => {
    it('should return false if in-app notifications are disabled', async () => {
      const mockPreferences = {
        user_id: 'user-1',
        email_notifications: true,
        push_notifications: true,
        in_app_notifications: false,
        notify_on_collaborator_joined: true,
        notify_on_item_added: true,
        notify_on_item_edited: false,
        notify_on_item_deleted: true,
        notify_on_schedule_changed: true,
        notify_on_mention: true,
        batch_notifications: false,
        batch_interval: 1,
        quiet_hours_enabled: false,
        quiet_hours_start: null,
        quiet_hours_end: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [mockPreferences],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: []
      });

      const result = await NotificationPreferencesService.shouldNotify(
        'user-1',
        'notifyOnItemAdded'
      );

      expect(result).toBe(false);
    });

    it('should check specific notification type', async () => {
      const mockPreferences = {
        user_id: 'user-1',
        email_notifications: true,
        push_notifications: true,
        in_app_notifications: true,
        notify_on_collaborator_joined: true,
        notify_on_item_added: true,
        notify_on_item_edited: false,
        notify_on_item_deleted: true,
        notify_on_schedule_changed: true,
        notify_on_mention: true,
        batch_notifications: false,
        batch_interval: 1,
        quiet_hours_enabled: false,
        quiet_hours_start: null,
        quiet_hours_end: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [mockPreferences],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: []
      });

      const result = await NotificationPreferencesService.shouldNotify(
        'user-1',
        'notifyOnItemEdited'
      );

      expect(result).toBe(false);
    });

    it('should return true for enabled notification types', async () => {
      const mockPreferences = {
        user_id: 'user-1',
        email_notifications: true,
        push_notifications: true,
        in_app_notifications: true,
        notify_on_collaborator_joined: true,
        notify_on_item_added: true,
        notify_on_item_edited: false,
        notify_on_item_deleted: true,
        notify_on_schedule_changed: true,
        notify_on_mention: true,
        batch_notifications: false,
        batch_interval: 1,
        quiet_hours_enabled: false,
        quiet_hours_start: null,
        quiet_hours_end: null,
        created_at: new Date(),
        updated_at: new Date()
      };

      vi.mocked(pool.query).mockResolvedValueOnce({
        rows: [mockPreferences],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: []
      });

      const result = await NotificationPreferencesService.shouldNotify(
        'user-1',
        'notifyOnItemAdded'
      );

      expect(result).toBe(true);
    });
  });
});
