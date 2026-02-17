import { BiometricAuth, BiometryType, BiometryError, BiometryErrorType } from '@aparajita/capacitor-biometric-auth';
import { Capacitor } from '@capacitor/core';

/**
 * Biometric Authentication Service
 * 
 * Provides biometric authentication (Face ID, Touch ID) for iOS.
 * Implements Requirement 16.8
 */

export interface BiometricAvailability {
  isAvailable: boolean;
  biometryType: 'none' | 'touchId' | 'faceId' | 'fingerprintAuthentication' | 'faceAuthentication' | 'irisAuthentication';
  reason?: string;
}

export interface BiometricAuthOptions {
  reason: string;
  title?: string;
  subtitle?: string;
  fallbackTitle?: string;
  cancelTitle?: string;
  allowDeviceCredential?: boolean;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  errorType?: string;
}

class BiometricAuthService {
  private isNativePlatform: boolean;

  constructor() {
    this.isNativePlatform = Capacitor.isNativePlatform();
  }

  /**
   * Check if biometric authentication is available
   * Returns availability status and biometry type
   */
  async isAvailable(): Promise<BiometricAvailability> {
    if (!this.isNativePlatform) {
      return {
        isAvailable: false,
        biometryType: 'none',
        reason: 'Biometric authentication not available on web platform'
      };
    }

    try {
      const result = await BiometricAuth.checkBiometry();
      
      return {
        isAvailable: result.isAvailable,
        biometryType: this.mapBiometryType(result.biometryType),
        reason: result.reason
      };
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return {
        isAvailable: false,
        biometryType: 'none',
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Authenticate using biometrics
   * Returns authentication result
   */
  async authenticate(options: BiometricAuthOptions): Promise<BiometricAuthResult> {
    if (!this.isNativePlatform) {
      return {
        success: false,
        error: 'Biometric authentication not available on web platform',
        errorType: 'unavailable'
      };
    }

    try {
      // Check if biometrics are available first
      const availability = await this.isAvailable();
      if (!availability.isAvailable) {
        return {
          success: false,
          error: availability.reason || 'Biometric authentication not available',
          errorType: 'unavailable'
        };
      }

      // Perform authentication
      await BiometricAuth.authenticate({
        reason: options.reason,
        cancelTitle: options.cancelTitle || 'Cancel',
        allowDeviceCredential: options.allowDeviceCredential ?? true,
        iosFallbackTitle: options.fallbackTitle || 'Use Password',
        androidTitle: options.title || 'Biometric Authentication',
        androidSubtitle: options.subtitle,
        androidConfirmationRequired: false
      });

      return {
        success: true
      };
    } catch (error) {
      console.error('Biometric authentication error:', error);
      
      // Handle BiometryError
      if (this.isBiometryError(error)) {
        return {
          success: false,
          error: error.message,
          errorType: this.mapErrorType(error.code)
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
        errorType: 'unknown'
      };
    }
  }

  /**
   * Authenticate with automatic fallback to password
   * If biometrics fail or are unavailable, returns error for password fallback
   */
  async authenticateWithFallback(options: BiometricAuthOptions): Promise<BiometricAuthResult> {
    const result = await this.authenticate({
      ...options,
      allowDeviceCredential: true
    });

    // If biometrics are unavailable or user cancelled, indicate password fallback needed
    if (!result.success && (result.errorType === 'unavailable' || result.errorType === 'userCancel')) {
      return {
        success: false,
        error: 'Biometric authentication unavailable or cancelled',
        errorType: 'fallbackRequired'
      };
    }

    return result;
  }

  /**
   * Get biometry type name for display
   */
  async getBiometryTypeName(): Promise<string> {
    const availability = await this.isAvailable();
    
    switch (availability.biometryType) {
      case 'faceId':
        return 'Face ID';
      case 'touchId':
        return 'Touch ID';
      case 'faceAuthentication':
        return 'Face Authentication';
      case 'fingerprintAuthentication':
        return 'Fingerprint';
      case 'irisAuthentication':
        return 'Iris Authentication';
      default:
        return 'Biometric Authentication';
    }
  }

  /**
   * Check if device supports biometric authentication
   */
  async supportsBiometrics(): Promise<boolean> {
    const availability = await this.isAvailable();
    return availability.isAvailable;
  }

  /**
   * Resume biometric authentication after app returns from background
   * Useful for re-authenticating when app becomes active
   */
  async resumeListener(): Promise<void> {
    if (!this.isNativePlatform) {
      return;
    }

    try {
      await BiometricAuth.addResumeListener(() => {
        console.debug('Biometric authentication resumed');
      });
    } catch (error) {
      console.error('Error resuming biometric listener:', error);
    }
  }

  /**
   * Check if running on native platform
   */
  isNative(): boolean {
    return this.isNativePlatform;
  }

  /**
   * Map biometry type from plugin to our type
   */
  private mapBiometryType(type: BiometryType): BiometricAvailability['biometryType'] {
    switch (type) {
      case BiometryType.none:
        return 'none';
      case BiometryType.touchId:
        return 'touchId';
      case BiometryType.faceId:
        return 'faceId';
      case BiometryType.fingerprintAuthentication:
        return 'fingerprintAuthentication';
      case BiometryType.faceAuthentication:
        return 'faceAuthentication';
      case BiometryType.irisAuthentication:
        return 'irisAuthentication';
      default:
        return 'none';
    }
  }

  /**
   * Map error type from plugin to our error type
   */
  private mapErrorType(code: BiometryErrorType): string {
    switch (code) {
      case BiometryErrorType.biometryNotAvailable:
        return 'unavailable';
      case BiometryErrorType.biometryNotEnrolled:
        return 'notEnrolled';
      case BiometryErrorType.userCancel:
        return 'userCancel';
      case BiometryErrorType.userFallback:
        return 'userFallback';
      case BiometryErrorType.systemCancel:
        return 'systemCancel';
      case BiometryErrorType.invalidContext:
        return 'invalidContext';
      case BiometryErrorType.notInteractive:
        return 'notInteractive';
      case BiometryErrorType.passcodeNotSet:
        return 'passcodeNotSet';
      case BiometryErrorType.biometryLockout:
        return 'lockout';
      case BiometryErrorType.appCancel:
        return 'appCancel';
      default:
        return 'unknown';
    }
  }

  /**
   * Type guard for BiometryError
   */
  private isBiometryError(error: unknown): error is BiometryError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error
    );
  }
}

// Export singleton instance
export const biometricAuthService = new BiometricAuthService();
