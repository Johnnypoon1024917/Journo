import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFeatureFlagStore } from '../featureFlagStore';

describe('Feature Flag Store', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useFeatureFlagStore.getState();
    store.resetFlags();
    localStorage.clear();
  });

  it('should have default flags disabled', () => {
    const { flags } = useFeatureFlagStore.getState();
    expect(flags.newTripPlannerUI).toBe(false);
  });

  it('should enable a feature flag', () => {
    const { setFlag } = useFeatureFlagStore.getState();
    
    setFlag('newTripPlannerUI', true);
    
    const updatedFlags = useFeatureFlagStore.getState().flags;
    expect(updatedFlags.newTripPlannerUI).toBe(true);
  });

  it('should toggle a feature flag', () => {
    const { toggleFlag } = useFeatureFlagStore.getState();
    
    // Initially false
    expect(useFeatureFlagStore.getState().flags.newTripPlannerUI).toBe(false);
    
    // Toggle to true
    toggleFlag('newTripPlannerUI');
    expect(useFeatureFlagStore.getState().flags.newTripPlannerUI).toBe(true);
    
    // Toggle back to false
    toggleFlag('newTripPlannerUI');
    expect(useFeatureFlagStore.getState().flags.newTripPlannerUI).toBe(false);
  });

  it('should reset flags to defaults', () => {
    const { setFlag, resetFlags } = useFeatureFlagStore.getState();
    
    // Enable flag
    setFlag('newTripPlannerUI', true);
    expect(useFeatureFlagStore.getState().flags.newTripPlannerUI).toBe(true);
    
    // Reset
    resetFlags();
    expect(useFeatureFlagStore.getState().flags.newTripPlannerUI).toBe(false);
  });

  it('should track flag usage', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { trackFlagUsage } = useFeatureFlagStore.getState();
    
    trackFlagUsage('newTripPlannerUI', 'enabled');
    
    // In dev mode, should log to console
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('should persist flags to localStorage', () => {
    const { setFlag } = useFeatureFlagStore.getState();
    
    setFlag('newTripPlannerUI', true);
    
    // Check localStorage
    const stored = localStorage.getItem('feature-flags-storage');
    expect(stored).toBeTruthy();
    
    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.state.flags.newTripPlannerUI).toBe(true);
    }
  });
});
