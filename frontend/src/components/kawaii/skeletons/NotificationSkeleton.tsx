import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';

export const NotificationSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((index) => (
        <View key={index} style={styles.item}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <View style={styles.content}>
            <Skeleton width="80%" height={16} marginBottom={6} />
            <Skeleton width="100%" height={14} marginBottom={4} />
            <Skeleton width="30%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  item: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  content: {
    flex: 1,
  },
});
