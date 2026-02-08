# Feature Flag System

This document describes the feature flag system implemented for the Journo trip planner application.

## Overview

The feature flag system allows for:
- **Gradual rollout** of new features
- **A/B testing** to measure feature impact
- **Quick rollback** if issues are detected
- **User control** to enable/disable experimental features
- **Analytics tracking** to monitor feature usage

## Architecture

### Components

1. **Feature Flag Store** (`featureFlagStore.ts`)
   - Zustand store with persistence
   - Manages feature flag state
   - Handles A/B test assignment
   - Tracks analytics events

2. **Feature Flag Service** (`featureFlagService.ts`)
   - Snapshot management for rollback
   - Emergency rollback functionality
   - Flag validation
   - Analytics data collection

3. **Feature Flag Hooks** (`useFeatureFlags.ts`)
   - `useFeatureFlag(flag)` - Check if a feature is enabled
   - `useFeatureFlags()` - Get all flags
   - `useFeatureFlagActions()` - Get flag manipulation functions
   - `useABTest()` - Get A/B test information

4. **UI Components**
   - Settings page toggle for feature flags
   - Feature flag banner for active experimental features
   - Rollback button in settings

## Usage

### Checking if a Feature is Enabled

```typescript
import { useFeatureFlag } from '../stores/featureFlagStore';

function MyComponent() {
  const isNewUIEnabled = useFeatureFlag('newTripPlannerUI');
  
  return (
    <div>
      {isNewUIEnabled ? (
        <NewUI />
      ) : (
        <OldUI />
      )}
    </div>
  );
}
```

### Adding a New Feature Flag

1. Add the flag to the `FeatureFlags` type in `featureFlagStore.ts`:

```typescript
export type FeatureFlags = {
  newTripPlannerUI: boolean;
  myNewFeature: boolean; // Add your flag here
};
```

2. Add the default value in `DEFAULT_FLAGS`:

```typescript
const DEFAULT_FLAGS: FeatureFlags = {
  newTripPlannerUI: false,
  myNewFeature: false, // Add default value
};
```

3. Add a toggle in the Settings page if needed.

### Enabling A/B Testing

Set environment variables in `.env`:

```bash
VITE_AB_TEST_ENABLED=true
VITE_AB_TEST_TREATMENT_PERCENTAGE=50
```

- `VITE_AB_TEST_ENABLED`: Enable/disable A/B testing
- `VITE_AB_TEST_TREATMENT_PERCENTAGE`: Percentage of users in treatment group (0-100)

### Creating a Snapshot Before Changes

```typescript
import { FeatureFlagService } from '../services/featureFlagService';

// Create snapshot before changing flags
FeatureFlagService.createSnapshot(currentFlags, 'User enabled new UI');
```

### Rolling Back

```typescript
import { FeatureFlagService } from '../services/featureFlagService';

// Rollback to most recent snapshot
const previousFlags = FeatureFlagService.rollbackToLatest();
if (previousFlags) {
  // Apply previous flags
  setFlag('newTripPlannerUI', previousFlags.newTripPlannerUI);
}

// Emergency rollback (disables all experimental features)
const safeFlags = FeatureFlagService.emergencyRollback();
```

## Analytics Tracking

The system automatically tracks:
- Feature flag checks
- Flag enable/disable actions
- A/B test group assignments
- Rollback events

Events are sent to Google Analytics (if configured) and logged to console in development.

### Analytics Events

```javascript
// Event structure
{
  event: 'feature_flag',
  flag_name: 'newTripPlannerUI',
  action: 'enabled' | 'disabled' | 'checked' | 'ab_test_control' | 'ab_test_treatment',
  ab_test_group: 'control' | 'treatment' | null,
  timestamp: '2024-11-14T10:30:00.000Z'
}
```

## Rollback Mechanism

### Automatic Snapshots

Snapshots are automatically created when:
- User toggles a feature flag in settings
- A/B test is initialized

### Manual Snapshots

```typescript
FeatureFlagService.createSnapshot(flags, 'Before major release');
```

### Snapshot Storage

- Stored in localStorage under `feature-flag-snapshots`
- Maximum of 10 snapshots kept
- Oldest snapshots are automatically pruned

### Emergency Rollback

In case of critical issues:

```typescript
// Disables all experimental features immediately
const safeFlags = FeatureFlagService.emergencyRollback();
```

## Best Practices

1. **Always use feature flags for major UI changes**
   - Allows gradual rollout
   - Easy to disable if issues arise

2. **Create snapshots before changes**
   - Enables quick rollback
   - Maintains change history

3. **Monitor analytics**
   - Track feature adoption
   - Measure A/B test results

4. **Clean up old flags**
   - Remove flags after full rollout
   - Keep the codebase clean

5. **Test both states**
   - Test with flag enabled
   - Test with flag disabled
   - Ensure smooth transitions

## Security Considerations

- Feature flags are stored in localStorage (client-side only)
- No sensitive data should be controlled by feature flags
- Server-side validation should not rely on client-side flags
- A/B test assignment is random and client-side only

## Migration Path

When a feature is fully rolled out:

1. Remove the feature flag check from code
2. Remove the flag from `FeatureFlags` type
3. Remove the toggle from Settings page
4. Clean up any flag-specific code
5. Update documentation

## Troubleshooting

### Flag not persisting
- Check localStorage is enabled
- Check for localStorage quota issues
- Verify Zustand persist middleware is working

### A/B test not working
- Verify `VITE_AB_TEST_ENABLED=true` in `.env`
- Check that `initializeABTest()` is called in App.tsx
- Clear localStorage to reset assignment

### Analytics not tracking
- Verify Google Analytics is configured
- Check console for tracking events in development
- Ensure `gtag` is available on window object

## Future Enhancements

- Server-side feature flag management
- Remote flag configuration
- Advanced targeting (by user, region, etc.)
- Feature flag dashboard
- Automated A/B test analysis
