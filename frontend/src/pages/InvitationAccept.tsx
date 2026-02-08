import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { invitationLinkService } from '../services/invitationLinkService';
import { RootStackParamList } from '../types/navigation';

type InvitationAcceptRouteProp = RouteProp<RootStackParamList, 'InvitationAccept'>;
type InvitationAcceptNavigationProp = NativeStackNavigationProp<RootStackParamList, 'InvitationAccept'>;

interface InvitationDetails {
  tripId: string;
  tripName: string;
  inviterName: string;
  role: string;
  expiresAt: string;
  isValid: boolean;
  errorMessage?: string;
}

export const InvitationAccept: React.FC = () => {
  const route = useRoute<InvitationAcceptRouteProp>();
  const navigation = useNavigation<InvitationAcceptNavigationProp>();
  const { t } = useTranslation();
  const { token } = route.params;

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [details, setDetails] = useState<InvitationDetails | null>(null);

  useEffect(() => {
    fetchInvitationDetails();
  }, [token]);

  const fetchInvitationDetails = async () => {
    try {
      const response = await invitationLinkService.getInvitationDetails(token);
      setDetails(response);
    } catch (error: any) {
      setDetails({
        tripId: '',
        tripName: '',
        inviterName: '',
        role: '',
        expiresAt: '',
        isValid: false,
        errorMessage: error.message || t('collaboration.invalidLink'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!details?.isValid) return;

    setAccepting(true);
    try {
      await invitationLinkService.acceptInvitation(token);
      navigation.replace('TripDetails', { tripId: details.tripId });
    } catch (error: any) {
      alert(error.message || t('collaboration.failedToAcceptInvitation'));
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    navigation.navigate('Home');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t('collaboration.loadingInvitation')}</Text>
      </View>
    );
  }

  if (!details?.isValid) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#FF3B30" />
          <Text style={styles.errorTitle}>{t('collaboration.invalidInvitation')}</Text>
          <Text style={styles.errorMessage}>
            {details?.errorMessage || t('collaboration.linkExpiredOrInvalid')}
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleDecline}>
            <Text style={styles.buttonText}>{t('common.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name="mail-open" size={48} color="#007AFF" />
        </View>

        <Text style={styles.title}>{t('collaboration.youreInvited')}</Text>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="map" size={20} color="#666" />
            <Text style={styles.detailLabel}>{t('collaboration.trip')}:</Text>
            <Text style={styles.detailValue}>{details.tripName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="person" size={20} color="#666" />
            <Text style={styles.detailLabel}>{t('collaboration.invitedBy')}:</Text>
            <Text style={styles.detailValue}>{details.inviterName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="shield" size={20} color="#666" />
            <Text style={styles.detailLabel}>{t('collaboration.role')}:</Text>
            <Text style={styles.detailValue}>
              {t(`collaboration.roles.${details.role}`)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time" size={20} color="#666" />
            <Text style={styles.detailLabel}>{t('collaboration.expiresOn')}:</Text>
            <Text style={styles.detailValue}>
              {new Date(details.expiresAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.acceptButton, accepting && styles.disabledButton]}
            onPress={handleAccept}
            disabled={accepting}
          >
            {accepting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.buttonText}>{t('collaboration.acceptInvitation')}</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.declineButton]}
            onPress={handleDecline}
            disabled={accepting}
          >
            <Ionicons name="close-circle" size={20} color="#FF3B30" />
            <Text style={[styles.buttonText, styles.declineText]}>
              {t('collaboration.decline')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 24,
  },
  detailsContainer: {
    marginBottom: 24,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  actions: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#007AFF',
  },
  declineButton: {
    backgroundColor: '#F2F2F7',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  declineText: {
    color: '#FF3B30',
  },
  errorContainer: {
    alignItems: 'center',
    gap: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
