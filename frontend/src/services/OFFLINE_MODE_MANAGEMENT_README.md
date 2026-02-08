# Offline Mode Management

## Overview

The Offline Mode Management system provides comprehensive offline capability detection, status indicators, and progressive enhancement for slow connections. This system ensures users have a smooth experience regardless of their network conditions.

**Validates: Requirements 5.5, 9.3**

## Architecture

### Components

1. **OfflineFeatureManager** - Core service for managing offline capabilities
2. **OfflineModeIndicator** - Visual indicator for offline status and features
3. **FeatureAvailabilityPanel** - Detailed panel showing feature availability
4. **useProgressiveEnhancement** - Hook for connection-aware feature adjustments
5. **useOfflineCapabilities** - Hook for accessing offline feature information

### Integration Points

- **Health Monitor** - Tracks service health and feature availability
- **Network Error Handler** - Monitors network connectivity and quality
- **Offline Store** - Manages offline data and sync queue

## Features

### 1. Offline-Capable Feature Detection

The system automatically detects which features can work offline:

- **Full Offline Support**: Features that work completely offline
  - Trip planning
  - Packing lists
  - Budget tracking

- **Partial Offline Support**: Features with limited offline functionality
  - Destination suggestions (cached only)
  - Maps (cached tiles only)
  - Weather data (cached forecasts)

- **Network Required**: Features that need internet connection
  - Authentication
  - Real-time collaboration
  - Photo uploads

### 2. Offline/Online Status Indicators

Visual indicators show current connection status and feature availability:

```typescript
import { OfflineModeIndicator } from '../components/common/OfflineModeIndicator';

// Basic usage
<OfflineModeIndicator />

// Compact mode
<OfflineModeIndicator compact position="bottom-right" />

// With details
<OfflineModeIndicator showDetails position="top-right" />
```

### 3. Progressive Enhancement for Slow Connections

Automatically adjusts feature behavior based on connection quality:

```typescript
import { useProgressiveEnhancement } from '../hooks/useProgressiveEnhancement';

function MyComponent() {
  const config = useProgressiveEnhancement();

  return (
    <div>
      {/* Adjust image quality */}
      <img 
        src={config.imageQuality === 'high' ? highResUrl : lowResUrl}
        loading={config.lazyLoadImages ? 'lazy' : 'eager'}
      />

      {/* Disable animations on slow connections */}
      {config.enableAnimations && <AnimatedComponent />}

      {/* Disable real-time features */}
      {config.enableRealtime && <RealtimeUpdates />}
    </div>
  );
}
```

## Usage

### Checking Feature Availability

```typescript
import { useFeatureAvailable } from '../hooks/useOfflineCapabilities';

function TripPlanningComponent() {
  const isTripPlanningAvailable = useFeatureAvailable('trip-planning');

  if (!isTripPlanningAvailable) {
    return <div>Trip planning is currently unavailable</div>;
  }

  return <TripPlanner />;
}
```

### Getting Feature Limitations

```typescript
import { useFeatureLimitations } from '../hooks/useOfflineCapabilities';

function DestinationSearch() {
  const limitations = useFeatureLimitations('destination-suggestions');

  return (
    <div>
      <SearchInput />
      {limitations.length > 0 && (
        <div className="warning">
          <h4>Current Limitations:</h4>
          <ul>
            {limitations.map((limitation, i) => (
              <li key={i}>{limitation}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

### Optimizing Images for Connection Quality

```typescript
import { useOptimizedImage } from '../hooks/useProgressiveEnhancement';

function ImageGallery({ images }) {
  return (
    <div>
      {images.map((image) => {
        const optimizedUrl = useOptimizedImage(image.url, {
          width: 800,
          height: 600,
          quality: 80,
        });

        return <img key={image.id} src={optimizedUrl} alt={image.alt} />;
      })}
    </div>
  );
}
```

### Adjusting Batch Sizes

```typescript
import { useBatchSize } from '../hooks/useProgressiveEnhancement';

function DataList() {
  const batchSize = useBatchSize(20); // Default 20 items

  const { data } = useQuery({
    queryKey: ['items'],
    queryFn: () => fetchItems({ limit: batchSize }),
  });

  return <List items={data} />;
}
```

### Adjusting Polling Intervals

```typescript
import { usePollingInterval } from '../hooks/useProgressiveEnhancement';

function LiveData() {
  const pollingInterval = usePollingInterval(30000); // Default 30s

  const { data } = useQuery({
    queryKey: ['live-data'],
    queryFn: fetchLiveData,
    refetchInterval: pollingInterval, // null when offline
  });

  return <DataDisplay data={data} />;
}
```

### Feature Availability Panel

```typescript
import { FeatureAvailabilityPanel } from '../components/common/FeatureAvailabilityPanel';

// Show all features
<FeatureAvailabilityPanel />

// Show only unavailable features
<FeatureAvailabilityPanel showOnlyUnavailable />

// Compact mode
<FeatureAvailabilityPanel compact />
```

## Connection Quality Levels

The system detects five connection quality levels:

1. **Excellent** (4G+, low latency)
   - All features enabled
   - High-quality images
   - Frequent polling
   - Prefetching enabled

2. **Good** (4G, moderate latency)
   - All features enabled
   - High-quality images
   - Normal polling
   - Prefetching enabled

3. **Fair** (3G)
   - Real-time features disabled
   - Medium-quality images
   - Reduced polling
   - No prefetching

4. **Poor** (2G, high latency)
   - Most features disabled
   - Low-quality images
   - Minimal polling
   - Batch requests

5. **Offline**
   - Only offline-capable features
   - Placeholder images
   - No polling
   - Local storage only

## Progressive Enhancement Strategies

### Image Loading

```typescript
const config = useProgressiveEnhancement();

switch (config.imageQuality) {
  case 'high':
    // Load full resolution
    break;
  case 'medium':
    // Load medium resolution with WebP
    break;
  case 'low':
    // Load low resolution with aggressive compression
    break;
  case 'placeholder':
    // Show SVG placeholder
    break;
}
```

### Animation Control

```typescript
const config = useProgressiveEnhancement();

// Respect user preferences and connection quality
const shouldAnimate = config.enableAnimations && !config.reducedMotion;
```

### Data Fetching

```typescript
const config = useProgressiveEnhancement();

// Batch requests on slow connections
if (config.batchRequests) {
  // Combine multiple requests into one
  const data = await fetchBatch([request1, request2, request3]);
} else {
  // Make individual requests
  const [data1, data2, data3] = await Promise.all([
    fetch1(),
    fetch2(),
    fetch3(),
  ]);
}
```

## Offline Feature Definitions

Features are defined with offline capabilities:

```typescript
{
  featureName: 'trip-planning',
  requiresNetwork: false,
  offlineMode: 'full',
  limitations: [
    'Changes will sync when online',
    'Cannot share trips while offline',
  ],
  fallbackBehavior: 'All trip planning features work offline with local storage',
}
```

### Offline Modes

- **full**: Complete functionality offline
- **partial**: Limited functionality with cached data
- **none**: Requires network connection

## Best Practices

### 1. Always Check Feature Availability

```typescript
const isAvailable = useFeatureAvailable('destination-suggestions');

if (!isAvailable) {
  // Show fallback UI or disable feature
  return <FeatureUnavailable />;
}
```

### 2. Show Clear Offline Indicators

```typescript
<OfflineModeIndicator position="bottom-left" showDetails />
```

### 3. Provide Fallback Options

```typescript
const limitations = useFeatureLimitations('maps');

if (limitations.length > 0) {
  // Show cached maps or alternative navigation
  return <CachedMapView />;
}
```

### 4. Optimize for Connection Quality

```typescript
const config = useProgressiveEnhancement();

// Adjust UI based on connection
if (config.connectionQuality === 'poor') {
  // Show simplified UI
  return <SimplifiedView />;
}
```

### 5. Respect User Preferences

```typescript
const config = useProgressiveEnhancement();

// Always respect reduced motion preference
if (config.reducedMotion) {
  // Disable all animations
}
```

## Testing

### Unit Tests

```bash
npm test offlineFeatureManager.test.ts
npm test useProgressiveEnhancement.test.tsx
```

### Manual Testing

1. **Test Offline Mode**
   - Open DevTools → Network tab
   - Select "Offline" from throttling dropdown
   - Verify offline features work
   - Check offline indicator appears

2. **Test Slow Connection**
   - Select "Slow 3G" from throttling dropdown
   - Verify progressive enhancement activates
   - Check image quality reduces
   - Verify animations disable

3. **Test Feature Availability**
   - Go offline
   - Check feature availability panel
   - Verify correct features are available/unavailable
   - Test fallback behaviors

## Troubleshooting

### Features Not Detecting Offline Mode

1. Check network error handler is initialized
2. Verify health monitor is running
3. Check browser console for errors

### Progressive Enhancement Not Working

1. Verify Network Information API support
2. Check connection quality detection
3. Test with different network conditions

### Images Not Optimizing

1. Verify image URLs support query parameters
2. Check image optimization service
3. Test with different connection qualities

## API Reference

### OfflineFeatureManager

```typescript
// Get feature capability
const capability = offlineFeatureManager.getFeatureCapability('trip-planning');

// Check if feature is available
const isAvailable = offlineFeatureManager.isFeatureAvailable('maps');

// Get offline mode
const mode = offlineFeatureManager.getOfflineMode('weather-data');

// Get limitations
const limitations = offlineFeatureManager.getFeatureLimitations('authentication');

// Subscribe to changes
const unsubscribe = offlineFeatureManager.subscribe((capabilities) => {
  console.log('Capabilities updated:', capabilities);
});
```

### Progressive Enhancement Hooks

```typescript
// Main configuration hook
const config = useProgressiveEnhancement();

// Optimized image URL
const imageUrl = useOptimizedImage(originalUrl, { width: 800, height: 600 });

// Feature gate
const isEnabled = useFeatureGate('realtime-updates');

// Batch size
const batchSize = useBatchSize(20);

// Polling interval
const interval = usePollingInterval(30000);
```

## Future Enhancements

- [ ] Service worker integration for better offline support
- [ ] Background sync API for queued operations
- [ ] Predictive prefetching based on user behavior
- [ ] Adaptive quality based on battery level
- [ ] Network quality history and trends
- [ ] User-configurable quality settings
- [ ] Bandwidth usage tracking and limits

## Related Documentation

- [Health Monitor README](./HEALTH_MONITOR_README.md)
- [Network Error Handling README](./NETWORK_ERROR_HANDLING_README.md)
- [Offline Support README](./OFFLINE_README.md)
- [PWA Manager README](./PWAManager.README.md)
