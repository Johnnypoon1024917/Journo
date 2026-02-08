import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';

export const MemberCardSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {[1, 2, 3].map((index) => (
        <View key={index} style={styles.card}>
          <Skeleton width={56} height={56} borderRadius={28} />
          <View style={styles.info}>
            <Skeleton width="60%" height={18} marginBottom={6} />
            <Skeleton width="40%" height={14} marginBottom={4} />
            <Skeleton width="50%" height={12} />
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
  },
  info: {
    flex: 1,
  },
});
