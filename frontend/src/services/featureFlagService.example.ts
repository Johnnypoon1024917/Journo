/**
 * Example usage of the Feature Flag Service
 * 
 * This file demonstrates how to use the feature flag system
 * for gradual rollout, A/B testing, and rollback.
 */

import { FeatureFlagService } from './featureFlagService';
import { useFeatureFlagStore } from '../stores/featureFlagStore';

// Example 1: Basic feature flag usage
export function exampleBasicUsage() {
  const { flags, setFlag } = useFeatureFlagStore.getState();
  
  // Check if feature is enabled
  if (flags.newTripPlannerUI) {
    console.log('New UI is enabled');
  }
  
  // Enable a feature
  setFlag('newTripPlannerUI', true);
  
  // Disable a feature
  setFlag('newTripPlannerUI', false);
}

// Example 2: Creating snapshots before changes
export function exampleSnapshotUsage() {
  const { flags, setFlag } = useFeatureFlagStore.getState();
  
  // Create snapshot before making changes
  FeatureFlagService.createSnapshot(flags, 'Before enabling new UI');
  
  // Make changes
  setFlag('newTripPlannerUI', true);
  
  // If something goes wrong, rollback
  const previousFlags = FeatureFlagService.rollbackToLatest();
  if (previousFlags) {
    setFlag('newTripPlannerUI', previousFlags.newTripPlannerUI);
  }
}

// Example 3: Emergency rollback
export function exampleEmergencyRollback() {
  const { setFlag } = useFeatureFlagStore.getState();
  
  // In case of critical issues, disable all experimental features
  const safeFlags = FeatureFlagService.emergencyRollback();
  
  // Apply safe flags
  setFlag('newTripPlannerUI', safeFlags.newTripPlannerUI);
}

// Example 4: A/B testing
export function exampleABTesting() {
  const { abTestGroup, initializeABTest } = useFeatureFlagStore.getState();
  
  // Initialize A/B test (only runs once per user)
  initializeABTest();
  
  // Check which group the user is in
  if (abTestGroup === 'treatment') {
    console.log('User is in treatment group - show new UI');
  } else if (abTestGroup === 'control') {
    console.log('User is in control group - show old UI');
  }
}

// Example 5: Analytics tracking
export function exampleAnalytics() {
  const { trackFlagUsage } = useFeatureFlagStore.getState();
  
  // Track custom events
  trackFlagUsage('newTripPlannerUI', 'user_clicked_feature');
  trackFlagUsage('newTripPlannerUI', 'feature_error');
  trackFlagUsage('newTripPlannerUI', 'feature_success');
}

// Example 6: Checking rollback availability
export function exampleRollbackCheck() {
  const canRollback = FeatureFlagService.canRollback();
  
  if (canRollback) {
    console.log('Rollback is available');
    
    // Get analytics about snapshots
    const analytics = FeatureFlagService.getAnalytics();
    console.log('Snapshots:', analytics.snapshots);
    console.log('Oldest snapshot:', analytics.oldestSnapshot);
    console.log('Newest snapshot:', analytics.newestSnapshot);
  }
}

// Example 7: Validating flags
export function exampleValidation() {
  const { flags } = useFeatureFlagStore.getState();
  
  const isValid = FeatureFlagService.validateFlags(flags);
  
  if (!isValid) {
    console.error('Invalid feature flags detected');
    // Apply emergency rollback
    const safeFlags = FeatureFlagService.emergencyRollback();
    console.log('Applied safe flags:', safeFlags);
  }
}

// Example 8: Component usage with React hooks
export function ExampleComponent() {
  // Import at component level
  const { useFeatureFlag } = require('../stores/featureFlagStore');
  const isNewUIEnabled = useFeatureFlag('newTripPlannerUI');
  
  return isNewUIEnabled ? 'New UI' : 'Old UI';
}

// Example 9: Conditional rendering based on A/B test
export function ExampleABTestComponent() {
  const { useABTest } = require('../hooks/useFeatureFlags');
  const { isTreatment, isControl } = useABTest();
  
  if (isTreatment) {
    return 'Treatment variant';
  } else if (isControl) {
    return 'Control variant';
  }
  
  return 'Default variant';
}

// Example 10: Managing snapshots
export function exampleSnapshotManagement() {
  // Get all snapshots
  const snapshots = FeatureFlagService.getSnapshots();
  console.log('All snapshots:', snapshots);
  
  // Rollback to specific snapshot
  const flags = FeatureFlagService.rollback(0); // Most recent
  console.log('Rolled back to:', flags);
  
  // Clear all snapshots
  FeatureFlagService.clearSnapshots();
  console.log('All snapshots cleared');
}
