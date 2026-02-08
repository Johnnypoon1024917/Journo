import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { invitationLinkService } from '../../services/invitationLinkService';

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  sentAt: string;
  expiresAt: string;
}

interface PendingInvitationsProps {
  tripId: string;
}

export const PendingInvitations: React.FC<PendingInvitationsProps> = ({ tripId }) => {
  const { t } = useTranslation();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchInvitations();
  }, [tripId]);

  const fetchInvitations = async () => {
    try {
      // This would need to be implemented in the backend
      // const response = await invitationLinkService.getPendingInvitations(tripId);
      // setInvitations(response);
      setInvitations([]); // Placeholder
    } catch (error) {
      console.error('Failed to fetch pending invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (invitationId: string) => {
    Alert.alert(
      t('collaboration.cancelInvitation'),
      t('collaboration.cancelInvitationMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('collaboration.cancel'),
          style: 'destructive',
          onPress: async () => {
            setActionLoading(invitationId);
            try {
              // await invitationLinkService.cancelInvitation(tripId, invitationId);
              fetchInvitations();
            } catch (error) {
              Alert.alert(
                t('collaboration.error'),
                t('collaboration.failedToCancelInvitation')
              );
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleResend = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      // await invitationLinkService.resendInvitation(tripId, invitationId);
      Alert.alert(
        t('collaboration.success'),
        t('collaboration.invitationResent')
      );
    } catch (error) {
      Alert.alert(
        t('collaboration.error'),
        t('collaboration.failedToResendInvitation')
      );
    } finally {
      setActionLoading(null);
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('collaboration.pendingInvitations')}</Text>

      {invitations.map((invitation) => {
        const expired = isExpired(invitation.expiresAt);
        const isLoading = actionLoading === invitation.id;

        return (
          <View key={invitation.id} style={styles.invitationCard}>
            <View style={styles.invitationInfo}>
              <View style={styles.emailContainer}>
                <Ionicons name="mail" size={20} color="#666" />
                <Text style={styles.email}>{invitation.email}</Text>
              </View>

              <View style={styles.details}>
                <View style={styles.detailItem}>
                  <Ionicons
                    name={invitation.role === 'editor' ? 'create' : 'eye'}
                    size={16}
                    color="#666"
                  />
                  <Text style={styles.detailText}>
                    {t(`collaboration.roles.${invitation.role}`)}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Ionicons name="calendar" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {t('collaboration.sent')}: {formatDate(invitation.sentAt)}
                  </Text>
                </View>

                {expired && (
                  <View style={styles.expiredBadge}>
                    <Text style={styles.expiredText}>{t('collaboration.expired')}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.actions}>
              {!expired && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.resendButton]}
                  onPress={() => handleResend(invitation.id)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <>
                      <Ionicons name="refresh" size={16} color="#007AFF" />
                      <Text style={styles.resendText}>{t('collaboration.resend')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => handleCancel(invitation.id)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FF3B30" />
                ) : (
                  <>
                    <Ionicons name="close-circle" size={16} color="#FF3B30" />
                    <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  invitationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  invitationInfo: {
    marginBottom: 12,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  details: {
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  expiredBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  expiredText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  resendButton: {
    backgroundColor: '#E3F2FD',
  },
  cancelButton: {
    backgroundColor: '#FFEBEE',
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
