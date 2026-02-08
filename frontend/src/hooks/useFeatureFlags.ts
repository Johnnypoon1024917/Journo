import { useEffect } from 'react';
import { useFeatureFlagStore, FeatureFlags } from '../stores/featureFlagStore';

/**
 * Hook to check if a feature is enabled and track its usage
 */
export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  const isEnabled = useFeatureFlagStore((state) => state.flags[flag]);
  const trackFlagUsage = useFeatureFlagStore((state) => state.trackFlagUsage);

  useEffect(() => {
    // Track that this feature flag was checked
    trackFlagUsage(flag, 'checked');
  }, [flag, trackFlagUsage]);

  return isEnabled;
}

/**
 * Hook to get all feature flags
 */
export function useFeatureFlags(): FeatureFlags {
  return useFeatureFlagStore((state) => state.flags);
}

/**
 * Hook to get feature flag actions
 */
export function useFeatureFlagActions() {
  const setFlag = useFeatureFlagStore((state) => state.setFlag);
  const toggleFlag = useFeatureFlagStore((state) => state.toggleFlag);
  const resetFlags = useFeatureFlagStore((state) => state.resetFlags);
  const trackFlagUsage = useFeatureFlagStore((state) => state.trackFlagUsage);

  return {
    setFlag,
    toggleFlag,
    resetFlags,
    trackFlagUsage,
  };
}

/**
 * Hook to get A/B test information
 */
export function useABTest() {
  const abTestGroup = useFeatureFlagStore((state) => state.abTestGroup);
  const initializeABTest = useFeatureFlagStore((state) => state.initializeABTest);

  return {
    abTestGroup,
    initializeABTest,
    isControl: abTestGroup === 'control',
    isTreatment: abTestGroup === 'treatment',
  };
}

export default useFeatureFlag;
