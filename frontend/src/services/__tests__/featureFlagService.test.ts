import { describe, it, expect, beforeEach } from 'vitest';
import { FeatureFlagService } from '../featureFlagService';
import { FeatureFlags } from '../../stores/featureFlagStore';

describe('Feature Flag Service', () => {
  const mockFlags: FeatureFlags = {
    newTripPlannerUI: false,
  };

  beforeEach(() => {
    // Clear snapshots before each test
    FeatureFlagService.clearSnapshots();
    localStorage.clear();
  });

  it('should create a snapshot', () => {
    FeatureFlagService.createSnapshot(mockFlags, 'Test snapshot');
    
    const snapshots = FeatureFlagService.getSnapshots();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].flags.newTripPlannerUI).toBe(false);
    expect(snapshots[0].reason).toBe('Test snapshot');
  });

  it('should limit snapshots to MAX_SNAPSHOTS', () => {
    // Create 15 snapshots (max is 10)
    for (let i = 0; i < 15; i++) {
      FeatureFlagService.createSnapshot(mockFlags, `Snapshot ${i}`);
    }
    
    const snapshots = FeatureFlagService.getSnapshots();
    expect(snapshots).toHaveLength(10);
    expect(snapshots[0].reason).toBe('Snapshot 14'); // Most recent
  });

  it('should rollback to latest snapshot', () => {
    const initialFlags: FeatureFlags = { newTripPlannerUI: false };
    const updatedFlags: FeatureFlags = { newTripPlannerUI: true };
    
    FeatureFlagService.createSnapshot(initialFlags, 'Initial');
    FeatureFlagService.createSnapshot(updatedFlags, 'Updated');
    
    const rolledBack = FeatureFlagService.rollbackToLatest();
    expect(rolledBack).toBeTruthy();
    expect(rolledBack?.newTripPlannerUI).toBe(true);
  });

  it('should rollback to specific snapshot', () => {
    FeatureFlagService.createSnapshot({ newTripPlannerUI: false }, 'First');
    FeatureFlagService.createSnapshot({ newTripPlannerUI: true }, 'Second');
    
    const rolledBack = FeatureFlagService.rollback(1); // Second oldest
    expect(rolledBack).toBeTruthy();
    expect(rolledBack?.newTripPlannerUI).toBe(false);
  });

  it('should return null for invalid rollback index', () => {
    FeatureFlagService.createSnapshot(mockFlags, 'Test');
    
    const rolledBack = FeatureFlagService.rollback(999);
    expect(rolledBack).toBeNull();
  });

  it('should check if rollback is available', () => {
    expect(FeatureFlagService.canRollback()).toBe(false);
    
    FeatureFlagService.createSnapshot(mockFlags, 'Test');
    expect(FeatureFlagService.canRollback()).toBe(true);
  });

  it('should perform emergency rollback', () => {
    const safeFlags = FeatureFlagService.emergencyRollback();
    
    expect(safeFlags.newTripPlannerUI).toBe(false);
  });

  it('should validate flags', () => {
    const validFlags: FeatureFlags = { newTripPlannerUI: true };
    expect(FeatureFlagService.validateFlags(validFlags)).toBe(true);
    
    const invalidFlags = { newTripPlannerUI: 'invalid' } as any;
    expect(FeatureFlagService.validateFlags(invalidFlags)).toBe(false);
  });

  it('should get analytics', () => {
    FeatureFlagService.createSnapshot(mockFlags, 'First');
    FeatureFlagService.createSnapshot(mockFlags, 'Second');
    
    const analytics = FeatureFlagService.getAnalytics();
    expect(analytics.snapshots).toBe(2);
    expect(analytics.oldestSnapshot).toBeTruthy();
    expect(analytics.newestSnapshot).toBeTruthy();
  });

  it('should clear all snapshots', () => {
    FeatureFlagService.createSnapshot(mockFlags, 'Test');
    expect(FeatureFlagService.getSnapshots()).toHaveLength(1);
    
    FeatureFlagService.clearSnapshots();
    expect(FeatureFlagService.getSnapshots()).toHaveLength(0);
  });
});
