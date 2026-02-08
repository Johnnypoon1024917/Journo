import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NotificationToast, ToastNotification } from './NotificationToast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ToastContainerProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  const insets = useSafeAreaInsets();
  
  // Show max 3 toasts
  const visibleToasts = toasts.slice(0, 3);

  if (visibleToasts.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          top: Platform.OS === 'ios' ? insets.top + 8 : 8,
        },
      ]}
      pointerEvents="box-none"
    >
      {visibleToasts.map((toast) => (
        <NotificationToast key={toast.id} notification={toast} onDismiss={onDismiss} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
});
