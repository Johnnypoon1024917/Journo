# Network and API Error Handling System

## Overview

This document describes the comprehensive network and API error handling system implemented for the travel platform. The system provides network connectivity detection, specific error messages based on API failure types, and toast notification integration for user communication.

**Validates: Requirements 4.2, 4.3**

## Architecture

### Components

1. **NetworkErrorHandler Service** (`networkErrorHandler.ts`)
   - Network connectivity monitoring
   - API error classification
   - User-friendly error message generation
   - Network state management and subscription

2. **useNetworkStatus Hook** (`useNetworkStatus.ts`)
   - React hook for monitoring network status
   - Real-time connectivity updates
   - Connection quality information

3. **useApiErrorHandler Hook** (`useApiErrorHandler.ts`)
   - React hook for handling API errors
   - Automatic toast notifications
   - Error classification and recovery suggestions

4. **NetworkStatusIndicator Component** (`NetworkStatusIndicator.tsx`)
   - Visual network status indicator
   - Offline/slow connection warnings
   - Reconnection notifications

5. **Enhanced API Service** (`api.ts`)
   - Integrated network error detection
   - Automatic error classification
   - Enhanced error codes

## Features

### Network Connectivity Detection

The system automatically detects and monitors:
- **Online/Offline Status**: Browser online/offline events
- **Connection Quality**: Slow connections (2G, 3G) using Network Information API
- **Latency Monitoring**: Round-trip time (RTT) tracking
- **Periodic Health Checks**: Regular connectivity verification

### API Error Classification

Errors are classified into specific types with appropriate handling:

#### Network Errors
- **Offline**: No internet connection
- **Fetch Failures**: Network request failures
- **Timeout**: Request took too long

#### HTTP Status Codes
- **400**: Bad Request - Invalid input
- **401**: Unauthorized - Session expired
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource doesn't exist
- **422**: Validation Error - Invalid data format
- **429**: Rate Limit - Too many requests
- **500-599**: Server Errors - Backend issues

#### API Error Codes
- `NETWORK_ERROR`: Network connectivity issues
- `TIMEOUT`: Request timeout
- `OFFLINE`: Application is offline
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `EXTERNAL_API_ERROR`: Third-party service failure
- `INTERNAL_SERVER_ERROR`: Server-side error

### User-Friendly Messages

Each error type provides:
- **Clear Message**: Non-technical explanation
- **Actionable Suggestions**: Steps to resolve the issue
- **Retryability**: Whether the operation can be retried

### Toast Notifications

Errors are communicated via toast notifications:
- **Network/Timeout Errors**: Warning toasts (yellow)
- **Server Errors**: Error toasts (red)
- **Client Errors**: Info or warning toasts based on retryability
- **Custom Messages**: Override default messages when needed

## Usage

### Basic Error Handling

```typescript
import { useApiErrorHandler } from '../hooks/useApiErrorHandler';

function MyComponent() {
  const { handleError } = useApiErrorHandler();

  const fetchData = async () => {
    try {
      const data = await api.get('/endpoint');
      // Handle success
    } catch (error) {
      // Automatically classifies error and shows toast
      handleError(error);
    }
  };

  return <button onClick={fetchData}>Fetch Data</button>;
}
```

### Wrapped Error Handling

```typescript
import { useApiErrorHandler } from '../hooks/useApiErrorHandler';

function MyComponent() {
  const { withErrorHandling } = useApiErrorHandler();

  // Automatically handles errors with toast notifications
  const fetchData = withErrorHandling(async () => {
    return await api.get('/endpoint');
  });

  return <button onClick={fetchData}>Fetch Data</button>;
}
```

### Network Status Monitoring

```typescript
import { useNetworkStatus } from '../hooks/useNetworkStatus';

function MyComponent() {
  const { isOnline, status, rtt } = useNetworkStatus();

  if (!isOnline) {
    return <div>You are offline</div>;
  }

  if (status === 'slow') {
    return <div>Slow connection detected (RTT: {rtt}ms)</div>;
  }

  return <div>Connected</div>;
}
```

### Network Status Indicator

```typescript
import { NetworkStatusIndicator } from '../components/common/NetworkStatusIndicator';

function App() {
  return (
    <div>
      {/* Shows offline status and reconnection messages */}
      <NetworkStatusIndicator position="bottom-right" />
      
      {/* Your app content */}
    </div>
  );
}
```

### Custom Error Handling

```typescript
import { useApiErrorHandler } from '../hooks/useApiErrorHandler';

function MyComponent() {
  const { handleError, getErrorSuggestions } = useApiErrorHandler();

  const fetchData = async () => {
    try {
      const data = await api.get('/endpoint');
    } catch (error) {
      const errorDetails = handleError(error, {
        showToast: false, // Don't show toast
        onError: (details) => {
          // Custom error handling
          console.log('Error type:', details.type);
          console.log('Suggestions:', details.suggestions);
        },
      });

      // Get suggestions for UI
      const suggestions = getErrorSuggestions(error);
      // Display suggestions in custom UI
    }
  };

  return <button onClick={fetchData}>Fetch Data</button>;
}
```

### Direct Network Error Handler Usage

```typescript
import { networkErrorHandler } from '../services/networkErrorHandler';

// Subscribe to network state changes
const unsubscribe = networkErrorHandler.subscribe((state) => {
  console.log('Network status:', state.status);
  console.log('Is online:', state.isOnline);
  console.log('Connection type:', state.effectiveType);
  console.log('Latency:', state.rtt);
});

// Get current network state
const state = networkErrorHandler.getNetworkState();

// Check if online
const isOnline = networkErrorHandler.isOnline();

// Classify an error
const errorDetails = networkErrorHandler.classifyError(error);

// Cleanup
unsubscribe();
```

## Error Details Structure

```typescript
interface NetworkErrorDetails {
  type: 'network' | 'api' | 'timeout' | 'server' | 'client' | 'unknown';
  status?: number;           // HTTP status code
  code?: string;             // API error code
  message: string;           // Technical message
  userMessage: string;       // User-friendly message
  retryable: boolean;        // Can the operation be retried?
  suggestions: string[];     // Steps to resolve the issue
}
```

## Network State Structure

```typescript
interface NetworkState {
  isOnline: boolean;         // Browser online status
  status: NetworkStatus;     // 'online' | 'offline' | 'slow'
  effectiveType?: string;    // '4g', '3g', '2g', 'slow-2g'
  downlink?: number;         // Download speed in Mbps
  rtt?: number;              // Round-trip time in ms
  lastChecked: Date;         // Last connectivity check
}
```

## Integration with API Service

The API service (`api.ts`) is enhanced with network error detection:

```typescript
// Automatically checks network status before throwing errors
if (!networkErrorHandler.isOnline()) {
  throw new ApiError(
    'No internet connection',
    0,
    { originalError: error },
    'NETWORK_ERROR'
  );
}
```

## Testing

The system includes comprehensive unit tests:

- **networkErrorHandler.test.ts**: Tests error classification and network monitoring
- **useApiErrorHandler.test.tsx**: Tests React hook error handling
- **useNetworkStatus.test.tsx**: Tests network status monitoring

Run tests:
```bash
npm test -- networkErrorHandler.test.ts
npm test -- useApiErrorHandler.test.tsx
npm test -- useNetworkStatus.test.tsx
```

## Best Practices

1. **Always Handle Errors**: Use `handleError` or `withErrorHandling` for all API calls
2. **Show Network Status**: Include `NetworkStatusIndicator` in your app
3. **Provide Feedback**: Let users know when operations fail and why
4. **Retry Logic**: Implement retry for retryable errors
5. **Offline Support**: Disable network-dependent features when offline
6. **Custom Messages**: Override default messages for domain-specific errors

## Browser Compatibility

- **Online/Offline Events**: All modern browsers
- **Network Information API**: Chrome, Edge, Opera (limited support in Firefox/Safari)
- **Fallback**: Gracefully degrades when Network Information API is unavailable

## Performance Considerations

- **Periodic Checks**: Every 30 seconds when online (configurable)
- **Lightweight Requests**: Uses HEAD requests for health checks
- **Timeout**: 5-second timeout for connectivity checks
- **Efficient Subscriptions**: Only notifies listeners on state changes

## Future Enhancements

- **Retry Queue**: Automatic retry queue for failed requests
- **Offline Cache**: Cache responses for offline access
- **Service Worker Integration**: Enhanced offline capabilities
- **Analytics**: Track error patterns and network issues
- **Custom Health Endpoints**: Configurable health check endpoints

## Related Documentation

- [Authentication State Manager](./AUTHENTICATION_STATE_MANAGER_README.md)
- [Error Boundary System](../components/common/ERROR_BOUNDARY_README.md)
- [Toast Notifications](../hooks/useToast.ts)
- [API Service](./api.ts)
