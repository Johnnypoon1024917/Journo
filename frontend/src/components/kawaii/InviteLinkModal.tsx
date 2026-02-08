import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import * as Clipboard from 'expo-clipboard';
import { invitationLinkService } from '../../services/invitationLinkService';
import { InvitationLink } from '../../types/invitation';
import { InviteLinkCard } from './InviteLinkCard';

interface InviteLinkModalProps {
  visible: boolean;
  tripId: string;
  onClose: () => void;
}

export const InviteLinkModal: React.FC<InviteLinkModalProps> = ({
  visible,
  tripId,
  onClose,
}) => {
  const { t } = useTranslation();
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [expiration, setExpiration] = useState<'1d' | '7d' | '30d'>('7d');
  const [maxUses, setMaxUses] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<InvitationLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchLinks();
    }
  }, [visible, tripId]);

  const fetchLinks = async () => {
    setLoadingLinks(true);
    try {
      const response = await invitationLinkService.getInvitationLinks(tripId);
      setLinks(response);
    } catch (error) {
      console.error('Failed to fetch invitation links:', error);
    } finally {
      setLoadingLinks(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const expirationHours = {
        '1d': 24,
        '7d': 168,
        '30d': 720,
      }[expiration];

      const newLink = await invitationLinkService.generateInvitationLink(tripId, {
        role,
        expiresInHours: expirationHours,
        maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
      });

      await Clipboard.setStringAsync(newLink.link);
      Alert.alert(
        t('collaboration.success'),
        t('collaboration.linkCopied')
      );
      
      fetchLinks();
    } catch (error) {
      Alert.alert(
        t('collaboration.error'),
        t('collaboration.failedToGenerateLink')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (link: string) => {
    await Clipboard.setStringAsync(link);
    Alert.alert(t('collaboration.success'), t('collaboration.linkCopied'));
  };

  const handleRevoke = async (linkId: string) => {
    Alert.alert(
      t('collaboration.confirmRevoke'),
      t('collaboration.confirmRevokeMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('collaboration.revoke'),
          style: 'destructive',
          onPress: async () => {
            try {
              await invitationLinkService.revokeInvitationLink(tripId, linkId);
              fetchLinks();
            } catch (error) {
              Alert.alert(
                t('collaboration.error'),
                t('collaboration.failedToRevokeLink')
              );
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('collaboration.inviteViaLink')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('collaboration.createNewLink')}</Text>

              <View style={styles.field}>
                <Text style={styles.label}>{t('collaboration.role')}</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={role}
                    onValueChange={(value) => setRole(value)}
                    style={styles.picker}
                  >
                    <Picker.Item label={t('collaboration.roles.editor')} value="editor" />
                    <Picker.Item label={t('collaboration.roles.viewer')} value="viewer' />
                  </Picker>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>{t('collaboration.expiration')}</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={expiration}
                    onValueChange={(value) => setExpiration(value)}
                    style={styles.picker}
                  >
                    <Picker.Item label={t('collaboration.1day')} value="1d" />
                    <Picker.Item label={t('collaboration.7days')} value="7d" />
                    <Picker.Item label={t('collaboration.30days')} value="30d" />
                  </Picker>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.generateButton, loading && styles.disabledButton]}
                onPress={handleGenerate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="link" size={20} color="#fff" />
                    <Text style={styles.generateButtonText}>
                      {t('collaboration.generateLink')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('collaboration.activeLinks')}</Text>
              {loadingLinks ? (
                <ActivityIndicator size="large" color="#007AFF" />
              ) : links.length === 0 ? (
                <Text style={styles.emptyText}>{t('collaboration.noActiveLinks')}</Text>
              ) : (
                links.map((link) => (
                  <InviteLinkCard
                    key={link.id}
                    link={link}
                    onCopy={handleCopy}
                    onRevoke={handleRevoke}
                  />
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    paddingVertical: 20,
  },
});
