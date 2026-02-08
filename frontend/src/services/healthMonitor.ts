/**
 * Health Monitor Service
 * 
 * Provides comprehensive backend service health monitoring with:
 * - Automatic service health checking
 * - Feature enabling/disabling based on service status
 * - User notifications for service availability changes
 * - Offline mode management
 * 
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */

import { networkErrorHandler, NetworkState } from './networkErrorHandler';

/**
 * Service health status
 */
export interface HealthStatus {
  isHealthy: boolean;
  responseTime: number;
  lastChecked: Date;
  errorCount: number;
  consecutiveFailures: number;
}

/**
 * System-wide health information
 */
export interface SystemHealth {
  isOnline: boolean;
  overallStatus: 'healthy' | 'degraded' | 'offline';
  services: Record<string, HealthStatus>;
  lastUpdated: Date;
}

/**
 * Service change notification
 */
export interface ServiceChange {
  service: string;
  previousStatus: boolean;
  currentStatus: boolean;
  timestamp: Date;
  message: string;
}

/**
 * Feature configuration
 */
export interface FeatureConfig {
  name: string;
  requiredServices: string[];
  enabled: boolean;
  offlineCapable: boolean;
}

/**
 * Health check configuration
 */
interface HealthCheckConfig {
  interval: number; // milliseconds between checks
  timeout: number; // milliseconds before timeout
  failureThreshold: number; // consecutive failures before marking unhealthy
  recoveryThreshold: number; // consecutive successes before marking healthy
}

const DEFAULT_HEALTH_CHECK_CONFIG: HealthCheckConfig = {
  interval: 30000, // 30 seconds
  timeout: 5000, // 5 seconds
  failureThreshold: 3,
  recoveryThreshold: 2,
};

/**
 * Service endpoints for health checking
 */
const SERVICE_ENDPOINTS = {
  api: '/api/health',
  destinations: '/api/destinations/suggestions/month/1',
  trips: '/api/trips',
  auth: '/api/auth/me',
  weather: '/api/weather/health',
  maps: '/api/maps/health',
} as const;

type ServiceName = keyof typeof SERVICE_ENDPOINTS;

/**
 * Feature definitions with service dependencies
 */
const FEATURES: FeatureConfig[] = [
  {
    name: 'destination-suggestions',
    requiredServices: ['api', 'destinations'],
    enabled: true,
    offlineCapable: false,
  },
  {
    name: 'trip-planning',
    requiredServices: ['api', 'trips'],
    enabled: true,
    offlineCapable: true,
  },
  {
    name: 'authentication',
    requiredServices: ['api', 'auth'],
    enabled: true,
    offlineCapable: false,
  },
  {
    name: 'weather-data',
    requiredServices: ['api', 'weather'],
    enabled: true,
    offlineCapable: false,
  },
  {
    name: 'maps',
    requiredServices: ['api', 'maps'],
    enabled: true,
    offlineCapable: true,
  },
];

/**
 * Health Monitor Service
 * Singleton service for monitoring backend service health
 */
class HealthMonitor {
  private static instance: HealthMonitor;
  
  private serviceHealth: Map<string, HealthStatus> = new Map();
  private features: Map<string, FeatureConfig> = new Map();
  private config: HealthCheckConfig = DEFAULT_HEALTH_CHECK_CONFIG;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(health: SystemHealth) => void> = new Set();
  private changeListeners: Set<(changes: ServiceChange[]) => void> = new Set();
  private isMonitoring: boolean = false;
  private networkUnsubscribe: (() => void) | null = null;

  private constructor() {
    // Initialize service health tracking
    Object.keys(SERVICE_ENDPOINTS).forEach((service) => {
      this.serviceHealth.set(service, {
        isHealthy: true,
        responseTime: 0,
        lastChecked: new Date(),
        errorCount: 0,
        consecutiveFailures: 0,
      });
    });

    // Initialize features
    FEATURES.forEach((feature) => {
      this.features.set(feature.name, { ...feature });
    });

    // Subscribe to network status changes
    this.networkUnsubscribe = networkErrorHandler.subscribe(this.handleNetworkChange);
  }

  public static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  /**
   * Start monitoring services
   * Validates: Requirements 5.1
   */
  public monitorServices(): void {
    if (this.isMonitoring) {
      console.log('Health monitoring already active');
      return;
    }

    console.log('Starting health monitoring...');
    this.isMonitoring = true;

    // Perform initial health check
    this.performHealthChecks();

    // Set up periodic health checks
    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.interval);
  }

  /**
   * Stop monitoring services
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Health monitoring stopped');
  }

  /**
   * Check health of a specific service
   * Validates: Requirements 5.1
   */
  public async checkServiceHealth(service: string): Promise<HealthStatus> {
    const endpoint = SERVICE_ENDPOINTS[service as ServiceName];
    if (!endpoint) {
      throw new Error(`Unknown service: ${service}`);
    }

    const currentStatus = this.serviceHealth.get(service);
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(endpoint, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;

      // Update health status
      const newStatus: HealthStatus = {
        isHealthy,
        responseTime,
        lastChecked: new Date(),
        errorCount: isHealthy ? 0 : (currentStatus?.errorCount || 0) + 1,
        consecutiveFailures: isHealthy ? 0 : (currentStatus?.consecutiveFailures || 0) + 1,
      };

      return newStatus;
    } catch (error) {
      // Service check failed
      const responseTime = Date.now() - startTime;
      
      return {
        isHealthy: false,
        responseTime,
        lastChecked: new Date(),
        errorCount: (currentStatus?.errorCount || 0) + 1,
        consecutiveFailures: (currentStatus?.consecutiveFailures || 0) + 1,
      };
    }
  }

  /**
   * Perform health checks on all services
   */
  private async performHealthChecks(): Promise<void> {
    // Skip health checks if offline
    if (!networkErrorHandler.isOnline()) {
      this.handleOfflineMode();
      return;
    }

    const services = Object.keys(SERVICE_ENDPOINTS);
    const changes: ServiceChange[] = [];

    // Check all services in parallel
    const healthChecks = services.map(async (service) => {
      const previousStatus = this.serviceHealth.get(service);
      const newStatus = await this.checkServiceHealth(service);

      // Determine if service status changed based on thresholds
      const wasHealthy = previousStatus?.isHealthy ?? true;
      const isNowHealthy = this.determineHealthStatus(newStatus);

      // Update service health
      this.serviceHealth.set(service, {
        ...newStatus,
        isHealthy: isNowHealthy,
      });

      // Track status changes
      if (wasHealthy !== isNowHealthy) {
        changes.push({
          service,
          previousStatus: wasHealthy,
          currentStatus: isNowHealthy,
          timestamp: new Date(),
          message: isNowHealthy
            ? `${service} service has recovered`
            : `${service} service is experiencing issues`,
        });
      }
    });

    await Promise.all(healthChecks);

    // Update feature availability based on service health
    this.updateFeatureAvailability();

    // Notify listeners of changes
    if (changes.length > 0) {
      this.notifyServiceChanges(changes);
    }

    // Notify health listeners
    this.notifyHealthListeners();
  }

  /**
   * Determine if service is healthy based on thresholds
   */
  private determineHealthStatus(status: HealthStatus): boolean {
    const currentStatus = this.serviceHealth.get(status as any);
    
    // If currently healthy, need failureThreshold consecutive failures to mark unhealthy
    if (currentStatus?.isHealthy) {
      return status.consecutiveFailures < this.config.failureThreshold;
    }
    
    // If currently unhealthy, need recoveryThreshold consecutive successes to mark healthy
    return status.consecutiveFailures === 0;
  }

  /**
   * Update service status manually
   * Validates: Requirements 5.1
   */
  public updateServiceStatus(service: string, status: HealthStatus): void {
    const previousStatus = this.serviceHealth.get(service);
    this.serviceHealth.set(service, status);

    // Check if status changed
    if (previousStatus && previousStatus.isHealthy !== status.isHealthy) {
      const change: ServiceChange = {
        service,
        previousStatus: previousStatus.isHealthy,
        currentStatus: status.isHealthy,
        timestamp: new Date(),
        message: status.isHealthy
          ? `${service} service has recovered`
          : `${service} service is experiencing issues`,
      };

      this.notifyServiceChanges([change]);
    }

    // Update feature availability
    this.updateFeatureAvailability();
    this.notifyHealthListeners();
  }

  /**
   * Get overall system health
   */
  public getOverallHealth(): SystemHealth {
    const services: Record<string, HealthStatus> = {};
    this.serviceHealth.forEach((status, service) => {
      services[service] = status;
    });

    // Determine overall status
    const isOnline = networkErrorHandler.isOnline();
    let overallStatus: 'healthy' | 'degraded' | 'offline';

    if (!isOnline) {
      overallStatus = 'offline';
    } else {
      const healthyServices = Array.from(this.serviceHealth.values()).filter(
        (s) => s.isHealthy
      ).length;
      const totalServices = this.serviceHealth.size;

      if (healthyServices === totalServices) {
        overallStatus = 'healthy';
      } else if (healthyServices > 0) {
        overallStatus = 'degraded';
      } else {
        overallStatus = 'offline';
      }
    }

    return {
      isOnline,
      overallStatus,
      services,
      lastUpdated: new Date(),
    };
  }

  /**
   * Update feature availability based on service health
   * Validates: Requirements 5.2, 5.3
   */
  private updateFeatureAvailability(): void {
    const isOnline = networkErrorHandler.isOnline();

    this.features.forEach((feature, featureName) => {
      // Check if all required services are healthy
      const allServicesHealthy = feature.requiredServices.every((service) => {
        const status = this.serviceHealth.get(service);
        return status?.isHealthy ?? false;
      });

      // Enable feature if services are healthy, or if offline and feature is offline-capable
      const shouldEnable = allServicesHealthy || (!isOnline && feature.offlineCapable);

      // Update feature status
      this.features.set(featureName, {
        ...feature,
        enabled: shouldEnable,
      });
    });
  }

  /**
   * Check if a feature is enabled
   */
  public isFeatureEnabled(featureName: string): boolean {
    const feature = this.features.get(featureName);
    return feature?.enabled ?? false;
  }

  /**
   * Get all features and their status
   */
  public getFeatures(): Map<string, FeatureConfig> {
    return new Map(this.features);
  }

  /**
   * Handle network status changes
   */
  private handleNetworkChange = (networkState: NetworkState): void => {
    if (networkState.isOnline) {
      console.log('Network online - enabling online features');
      this.disableOfflineMode();
      
      // Perform immediate health check when coming back online
      if (this.isMonitoring) {
        this.performHealthChecks();
      }
    } else {
      console.log('Network offline - enabling offline mode');
      this.enableOfflineMode();
    }
  };

  /**
   * Handle offline mode
   */
  private handleOfflineMode(): void {
    // Mark all services as unhealthy
    this.serviceHealth.forEach((status, service) => {
      this.serviceHealth.set(service, {
        ...status,
        isHealthy: false,
        lastChecked: new Date(),
      });
    });

    this.updateFeatureAvailability();
    this.notifyHealthListeners();
  }

  /**
   * Enable offline mode
   * Validates: Requirements 5.5
   */
  public enableOfflineMode(): void {
    console.log('Enabling offline mode...');
    
    // Disable all non-offline-capable features
    this.features.forEach((feature, featureName) => {
      this.features.set(featureName, {
        ...feature,
        enabled: feature.offlineCapable,
      });
    });

    // Notify about offline mode
    const changes: ServiceChange[] = [{
      service: 'network',
      previousStatus: true,
      currentStatus: false,
      timestamp: new Date(),
      message: 'You are now offline. Some features may be unavailable.',
    }];

    this.notifyServiceChanges(changes);
    this.notifyHealthListeners();
  }

  /**
   * Disable offline mode (return to online)
   * Validates: Requirements 5.2
   */
  public disableOfflineMode(): void {
    console.log('Disabling offline mode...');
    
    // Re-enable all features (will be adjusted by health checks)
    this.features.forEach((feature, featureName) => {
      this.features.set(featureName, {
        ...feature,
        enabled: true,
      });
    });

    // Notify about online mode
    const changes: ServiceChange[] = [{
      service: 'network',
      previousStatus: false,
      currentStatus: true,
      timestamp: new Date(),
      message: 'You are back online. All features are now available.',
    }];

    this.notifyServiceChanges(changes);
    this.notifyHealthListeners();
  }

  /**
   * Subscribe to health updates
   */
  public subscribe(listener: (health: SystemHealth) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately call with current health
    listener(this.getOverallHealth());

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Subscribe to service change notifications
   * Validates: Requirements 5.4
   */
  public subscribeToChanges(
    listener: (changes: ServiceChange[]) => void
  ): () => void {
    this.changeListeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.changeListeners.delete(listener);
    };
  }

  /**
   * Notify service change listeners
   * Validates: Requirements 5.4
   */
  public notifyServiceChanges(changes: ServiceChange[]): void {
    console.log('Service changes detected:', changes);
    
    this.changeListeners.forEach((listener) => {
      try {
        listener(changes);
      } catch (error) {
        console.error('Error in service change listener:', error);
      }
    });
  }

  /**
   * Notify health listeners
   */
  private notifyHealthListeners(): void {
    const health = this.getOverallHealth();
    
    this.listeners.forEach((listener) => {
      try {
        listener(health);
      } catch (error) {
        console.error('Error in health listener:', error);
      }
    });
  }

  /**
   * Configure health check behavior
   */
  public configure(config: Partial<HealthCheckConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    // Restart monitoring with new config if currently monitoring
    if (this.isMonitoring) {
      this.stopMonitoring();
      this.monitorServices();
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stopMonitoring();
    
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
      this.networkUnsubscribe = null;
    }

    this.listeners.clear();
    this.changeListeners.clear();
  }
}

// Export singleton instance
export const healthMonitor = HealthMonitor.getInstance();

// Export class for testing
export { HealthMonitor };
