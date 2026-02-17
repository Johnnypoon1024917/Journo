import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InvitationLink } from '../../types/invitation';
import { useTranslation } from 'react-i18next';

interface InviteLinkCardProps {
  link: InvitationLink;
  onCopy: (link: string) => void;
  onRevoke: (linkId: string) => void;
}

export const InviteLinkCard: React.FC<InviteLinkCardProps> = ({
  link,
  onCopy,
  onRevoke,
}) => {
  const { t } = useTranslation();

  const isExpired = new Date(link.expiresAt) < new Date();
  const isMaxUsesReached = link.maxUses && link.usedCount >= link.maxUses;
  const isInactive = !link.isActive || isExpired || isMaxUsesReached;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <View style={[styles.card, isInactive && styles.inactiveCard]}>
      <View style={styles.header}>
        <View style={styles.roleContainer}>
          <Ionicons
            name={link.role === 'owner' ? 'shield' : link.role === 'editor' ? 'create' : 'eye'}
            size={16}
            color={isInactive ? '#999' : '#007AFF'}
          />
          <Text style={[styles.role, isInactive && styles.inactiveText]}>
            {t(`collaboration.roles.${link.role}`)}
          </Text>
        </View>
        {isInactive && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {isExpired ? t('collaboration.expired') : 
               isMaxUsesReached ? t('collaboration.maxUsesReached') :
               t('collaboration.revoked')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.details}>
        <Text style={styles.detailText}>
          {t('collaboration.expiresOn')}: {formatDate(link.expiresAt)}
        </Text>
        {link.maxUses && (
          <Text style={styles.detailText}>
            {t('collaboration.uses')}: {link.usedCount}/{link.maxUses}
          </Text>
        )}
        {!link.maxUses && (
          <Text style={styles.detailText}>
            {t('collaboration.uses')}: {link.usedCount}
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.copyButton]}
          onPress={() => onCopy(link.link)}
          disabled={isInactive}
        >
          <Ionicons name="copy-outline" size={16} color={isInactive ? '#999' : '#007AFF'} />
          <Text style={[styles.buttonText, isInactive && styles.inactiveText]}>
            {t('collaboration.copyLink')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.revokeButton]}
          onPress={() => onRevoke(link.id)}
          disabled={isInactive}
        >
          <Ionicons name="close-circle-outline" size={16} color={isInactive ? '#999' : '#FF3B30'} />
          <Text style={[styles.buttonText, styles.revokeText, isInactive && styles.inactiveText]}>
            {t('collaboration.revoke')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inactiveCard: {
    backgroundColor: '#F9F9F9',
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  role: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  statusBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  details: {
    marginBottom: 12,
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  copyButton: {
    backgroundColor: '#E3F2FD',
  },
  revokeButton: {
    backgroundColor: '#FFEBEE',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  revokeText: {
    color: '#FF3B30',
  },
  inactiveText: {
    color: '#999',
  },
});
