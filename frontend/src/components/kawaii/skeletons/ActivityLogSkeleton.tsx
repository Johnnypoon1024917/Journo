import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';

export const ActivityLogSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((index) => (
        <View key={index} style={styles.item}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={styles.content}>
            <Skeleton width="70%" height={16} marginBottom={8} />
            <Skeleton width="90%" height={14} marginBottom={4} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  content: {
    flex: 1,
  },
});
