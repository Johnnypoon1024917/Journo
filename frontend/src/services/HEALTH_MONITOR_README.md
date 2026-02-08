# Health Monitor Service

## Overview

The Health Monitor service provides comprehensive backend service health monitoring with automatic feature management and user notifications. It continuously monitors backend services, detects outages, and gracefully handles service degradation by selectively enabling/disabling features.

## Features

- **Automatic Service Health Checking**: Periodically checks backend service availability
- **Feature Management**: Automatically enables/disables features based on service health
- **User Notifications**: Notifies users when service availability changes
- **Offline Mode**: Manages offline-capable features when network is unavailable
- **Configurable**: Customizable health check intervals and thresholds

## Requirements Validated

- **Requirement 5.1**: Service outage detection and status updates
- **Requirement 5.2**: Automatic feature re-enablement on service recovery
- **Requirement 5.3**: Selective feature disabling during partial outages
- **Requirement 5.4**: User notifications for service status changes
- **Requirement 5.5**: Offline mode management

## Usage

### Basic Setup

```typescript
import { healthMonitor } from '../services/healthMonitor';

// Start monitoring services
healthMonitor.monitorServices();

// Subscribe to health updates
const unsubscribe = healthMonitor.subscribe((health) => {
  console.log('System health:', health.overallStatus);
  console.log('Services:', health.services);
});

// Subscribe to service change notifications
const unsubscribeChanges = healthMonitor.subscribeToChanges((changes) => {
  changes.forEach((change) => {
    console.log(`${change.service}: ${change.message}`);
  });
});

// Clean up when done
unsubscribe();
unsubscribeChanges();
healthMonitor.stopMonitoring();
```

### Using React Hooks

```typescript
import { useHealthMonitor, useFeatureEnabled } from '../hooks/useHealthMonitor';

function MyComponent() {
  const { health, isFeatureEnabled, startMonitoring } = useHealthMonitor();
  
  // Start monitoring on mount
  useEffect(() => {
    startMonitoring();
  }, [startMonitoring]);
  
  // Check if a feature is enabled
  const canShowDestinations = isFeatureEnabled('destination-suggestions');
  
  return (
    <div>
      <p>System Status: {health.overallStatus}</p>
      {canShowDestinations ? (
        <DestinationSuggestions />
      ) : (
        <p>Destination suggestions are temporarily unavailable</p>
      )}
    </div>
  );
}
```

### Using Feature-Specific Hook

```typescript
import { useFeatureEnabled } from '../hooks/useHealthMonitor';

function DestinationFeature() {
  const isEnabled = useFeatureEnabled('destination-suggestions');
  
  if (!isEnabled) {
    return <p>This feature is temporarily unavailable</p>;
  }
  
  return <DestinationSuggestions />;
}
```

### Displaying Service Status

```typescript
import { ServiceStatusNotification } from '../components/common/ServiceStatusNotification';
import { SystemHealthIndicator } from '../components/common/SystemHealthIndicator';

function App() {
  return (
    <div>
      {/* Shows notifications when services change */}
      <ServiceStatusNotification />
      
      {/* Shows system health indicator in header */}
      <header>
        <SystemHealthIndicator />
      </header>
      
      {/* Your app content */}
    </div>
  );
}
```

## Service Configuration

### Monitored Services

The following services are monitored by default:

- **api**: Main API health endpoint
- **destinations**: Destination suggestions service
- **trips**: Trip management service
- **auth**: Authentication service
- **weather**: Weather data service
- **maps**: Maps service

### Feature Definitions

Features are automatically managed based on service health:

| Feature | Required Services | Offline Capable |
|---------|------------------|-----------------|
| destination-suggestions | api, destinations | No |
| trip-planning | api, trips | Yes |
| authentication | api, auth | No |
| weather-data | api, weather | No |
| maps | api, maps | Yes |

### Configuration Options

```typescript
healthMonitor.configure({
  interval: 30000,           // Check every 30 seconds
  timeout: 5000,             // 5 second timeout per check
  failureThreshold: 3,       // 3 consecutive failures = unhealthy
  recoveryThreshold: 2,      // 2 consecutive successes = healthy
});
```

## Health Status

### System Health States

- **healthy**: All services operational
- **degraded**: Some services unavailable
- **offline**: Network offline or all services down

### Service Health Status

Each service tracks:

```typescript
interface HealthStatus {
  isHealthy: boolean;        // Current health state
  responseTime: number;      // Last response time in ms
  lastChecked: Date;         // When last checked
  errorCount: number;        // Total error count
  consecutiveFailures: number; // Consecutive failures
}
```

## Offline Mode

When the network goes offline:

1. All services are marked as unhealthy
2. Only offline-capable features remain enabled
3. Users are notified about offline status
4. When network returns, services are re-checked

```typescript
// Manually enable offline mode
healthMonitor.enableOfflineMode();

// Manually disable offline mode
healthMonitor.disableOfflineMode();
```

## Service Change Notifications

Service changes trigger notifications with:

```typescript
interface ServiceChange {
  service: string;           // Service name
  previousStatus: boolean;   // Was healthy
  currentStatus: boolean;    // Is healthy now
  timestamp: Date;           // When changed
  message: string;           // User-friendly message
}
```

## API Reference

### HealthMonitor Methods

#### `monitorServices(): void`
Start monitoring all configured services.

#### `stopMonitoring(): void`
Stop monitoring services.

#### `checkServiceHealth(service: string): Promise<HealthStatus>`
Check health of a specific service.

#### `updateServiceStatus(service: string, status: HealthStatus): void`
Manually update a service's health status.

#### `getOverallHealth(): SystemHealth`
Get current system-wide health information.

#### `isFeatureEnabled(featureName: string): boolean`
Check if a feature is currently enabled.

#### `subscribe(listener: (health: SystemHealth) => void): () => void`
Subscribe to health updates. Returns unsubscribe function.

#### `subscribeToChanges(listener: (changes: ServiceChange[]) => void): () => void`
Subscribe to service change notifications. Returns unsubscribe function.

#### `configure(config: Partial<HealthCheckConfig>): void`
Update health check configuration.

#### `enableOfflineMode(): void`
Manually enable offline mode.

#### `disableOfflineMode(): void`
Manually disable offline mode.

#### `destroy(): void`
Clean up all resources and stop monitoring.

## Testing

The service includes comprehensive unit tests:

```bash
npm test -- healthMonitor.test.ts
```

Tests cover:
- Service health checking
- Overall health status calculation
- Feature management
- Service change notifications
- Offline mode handling
- Subscription management
- Configuration
- Resource cleanup

## Best Practices

1. **Start monitoring early**: Call `monitorServices()` when your app initializes
2. **Use feature checks**: Always check `isFeatureEnabled()` before using features
3. **Handle offline gracefully**: Provide offline alternatives for critical features
4. **Show user feedback**: Use `ServiceStatusNotification` to keep users informed
5. **Clean up**: Call `destroy()` when unmounting or shutting down

## Integration with Other Services

The Health Monitor integrates with:

- **Network Error Handler**: Detects online/offline status
- **API Service**: Monitors API endpoint health
- **Destination Service**: Manages destination feature availability
- **Authentication Service**: Manages auth feature availability

## Troubleshooting

### Services showing as unhealthy

1. Check if backend services are running
2. Verify API endpoints are accessible
3. Check network connectivity
4. Review browser console for errors

### Features not re-enabling after recovery

1. Ensure monitoring is active (`monitorServices()` called)
2. Check `recoveryThreshold` configuration
3. Verify service health endpoints are responding correctly

### Notifications not appearing

1. Ensure `ServiceStatusNotification` component is rendered
2. Check that you're subscribed to changes
3. Verify service status is actually changing

## Future Enhancements

Potential improvements:

- Service-specific health check endpoints
- Configurable retry strategies per service
- Historical health data tracking
- Performance metrics collection
- Integration with error tracking services
- Custom feature dependency rules
- Health check result caching
