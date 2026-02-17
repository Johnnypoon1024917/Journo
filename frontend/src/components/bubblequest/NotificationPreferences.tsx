import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { notificationService } from '../../services/notificationService';

interface NotificationPreferencesState {
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  batchNotifications: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  categories: {
    collaboration: boolean;
    activity: boolean;
    system: boolean;
  };
}

export const NotificationPreferences: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferencesState>({
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    batchNotifications: false,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    categories: {
      collaboration: true,
      activity: true,
      system: true,
    },
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const prefs = await notificationService.getPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await notificationService.updatePreferences(preferences);
      Alert.alert(
        t('notifications.success'),
        t('notifications.preferencesSaved')
      );
    } catch (error) {
      Alert.alert(
        t('notifications.error'),
        t('notifications.failedToSavePreferences')
      );
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferencesState, value: any) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const updateCategoryPreference = (category: keyof NotificationPreferencesState['categories'], value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      categories: { ...prev.categories, [category]: value },
    }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('notifications.deliveryMethods')}</Text>

        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Ionicons name="mail" size={24} color="#007AFF" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{t('notifications.email')}</Text>
              <Text style={styles.settingDescription}>
                {t('notifications.emailDescription')}
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.emailNotifications}
            onValueChange={(value) => updatePreference('emailNotifications', value)}
          />
        </View>

        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications" size={24} color="#007AFF" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{t('notifications.push')}</Text>
              <Text style={styles.settingDescription}>
                {t('notifications.pushDescription')}
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.pushNotifications}
            onValueChange={(value) => updatePreference('pushNotifications', value)}
          />
        </View>

        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Ionicons name="phone-portrait" size={24} color="#007AFF" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{t('notifications.inApp')}</Text>
              <Text style={styles.settingDescription}>
                {t('notifications.inAppDescription')}
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.inAppNotifications}
            onValueChange={(value) => updatePreference('inAppNotifications', value)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('notifications.categories')}</Text>

        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Ionicons name="people" size={24} color="#007AFF" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{t('notifications.collaboration')}</Text>
              <Text style={styles.settingDescription}>
                {t('notifications.collaborationDescription')}
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.categories.collaboration}
            onValueChange={(value) => updateCategoryPreference('collaboration', value)}
          />
        </View>

        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Ionicons name="pulse" size={24} color="#007AFF" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{t('notifications.activity')}</Text>
              <Text style={styles.settingDescription}>
                {t('notifications.activityDescription')}
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.categories.activity}
            onValueChange={(value) => updateCategoryPreference('activity', value)}
          />
        </View>

        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Ionicons name="settings" size={24} color="#007AFF" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{t('notifications.system')}</Text>
              <Text style={styles.settingDescription}>
                {t('notifications.systemDescription')}
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.categories.system}
            onValueChange={(value) => updateCategoryPreference('system', value)}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('notifications.advanced')}</Text>

        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Ionicons name="layers" size={24} color="#007AFF" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{t('notifications.batch')}</Text>
              <Text style={styles.settingDescription}>
                {t('notifications.batchDescription')}
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.batchNotifications}
            onValueChange={(value) => updatePreference('batchNotifications', value)}
          />
        </View>

        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Ionicons name="moon" size={24} color="#007AFF" />
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>{t('notifications.quietHours')}</Text>
              <Text style={styles.settingDescription}>
                {t('notifications.quietHoursDescription')}
              </Text>
            </View>
          </View>
          <Switch
            value={preferences.quietHoursEnabled}
            onValueChange={(value) => updatePreference('quietHoursEnabled', value)}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.disabledButton]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    margin: 20,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
