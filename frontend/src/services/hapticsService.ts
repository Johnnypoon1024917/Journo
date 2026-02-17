import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Haptics Service
 * 
 * Provides haptic feedback functionality for iOS touch interactions.
 * Implements Requirement 5.7
 */

export type HapticImpactStyle = 'light' | 'medium' | 'heavy';
export type HapticNotificationType = 'success' | 'warning' | 'error';

class HapticsService {
  /**
   * Trigger impact haptic feedback
   * Used for touch interactions like button presses, drag start, etc.
   */
  async impact(style: HapticImpactStyle = 'medium'): Promise<void> {
    try {
      const impactStyle = this.mapImpactStyle(style);
      await Haptics.impact({ style: impactStyle });
    } catch (error) {
      // Silently fail - haptics are nice-to-have
      console.debug('Haptic impact failed:', error);
    }
  }

  /**
   * Trigger notification haptic feedback
   * Used for success, warning, or error states
   */
  async notification(type: HapticNotificationType): Promise<void> {
    try {
      const notificationType = this.mapNotificationType(type);
      await Haptics.notification({ type: notificationType });
    } catch (error) {
      // Silently fail - haptics are nice-to-have
      console.debug('Haptic notification failed:', error);
    }
  }

  /**
   * Trigger vibration
   * Generic vibration with optional duration
   */
  async vibrate(duration?: number): Promise<void> {
    try {
      if (duration !== undefined) {
        await Haptics.vibrate({ duration });
      } else {
        await Haptics.vibrate();
      }
    } catch (error) {
      // Silently fail - haptics are nice-to-have
      console.debug('Haptic vibrate failed:', error);
    }
  }

  /**
   * Trigger selection start haptic
   * Used when starting a selection gesture
   */
  async selectionStart(): Promise<void> {
    try {
      await Haptics.selectionStart();
    } catch (error) {
      // Silently fail - haptics are nice-to-have
      console.debug('Haptic selection start failed:', error);
    }
  }

  /**
   * Trigger selection changed haptic
   * Used when selection changes during a gesture
   */
  async selectionChanged(): Promise<void> {
    try {
      await Haptics.selectionChanged();
    } catch (error) {
      // Silently fail - haptics are nice-to-have
      console.debug('Haptic selection changed failed:', error);
    }
  }

  /**
   * Trigger selection end haptic
   * Used when ending a selection gesture
   */
  async selectionEnd(): Promise<void> {
    try {
      await Haptics.selectionEnd();
    } catch (error) {
      // Silently fail - haptics are nice-to-have
      console.debug('Haptic selection end failed:', error);
    }
  }

  /**
   * Haptic feedback for sticker drag start
   */
  async stickerDragStart(): Promise<void> {
    await this.impact('light');
  }

  /**
   * Haptic feedback for sticker edit mode
   */
  async stickerEditMode(): Promise<void> {
    await this.impact('medium');
  }

  /**
   * Haptic feedback for sticker delete
   */
  async stickerDelete(): Promise<void> {
    await this.impact('heavy');
  }

  /**
   * Haptic feedback for button press
   */
  async buttonPress(): Promise<void> {
    await this.impact('light');
  }

  /**
   * Haptic feedback for long press
   */
  async longPress(): Promise<void> {
    await this.impact('medium');
  }

  /**
   * Haptic feedback for success action
   */
  async success(): Promise<void> {
    await this.notification('success');
  }

  /**
   * Haptic feedback for error action
   */
  async error(): Promise<void> {
    await this.notification('error');
  }

  /**
   * Haptic feedback for warning action
   */
  async warning(): Promise<void> {
    await this.notification('warning');
  }

  /**
   * Map our impact style to Capacitor's ImpactStyle
   */
  private mapImpactStyle(style: HapticImpactStyle): ImpactStyle {
    const styleMap: Record<HapticImpactStyle, ImpactStyle> = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy
    };
    return styleMap[style];
  }

  /**
   * Map our notification type to Capacitor's NotificationType
   */
  private mapNotificationType(type: HapticNotificationType): NotificationType {
    const typeMap: Record<HapticNotificationType, NotificationType> = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error: NotificationType.Error
    };
    return typeMap[type];
  }
}

export const hapticsService = new HapticsService();
