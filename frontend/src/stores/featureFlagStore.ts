import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FeatureFlags = {
  newTripPlannerUI: boolean;
  // Add more feature flags as needed
};

interface FeatureFlagStore {
  flags: FeatureFlags;
  
  // A/B testing
  abTestGroup: 'control' | 'treatment' | null;
  
  // Actions
  setFlag: (flag: keyof FeatureFlags, enabled: boolean) => void;
  toggleFlag: (flag: keyof FeatureFlags) => void;
  resetFlags: () => void;
  initializeABTest: () => void;
  
  // Analytics tracking
  trackFlagUsage: (flag: keyof FeatureFlags, action: string) => void;
}

const DEFAULT_FLAGS: FeatureFlags = {
  newTripPlannerUI: false,
};

// A/B test configuration
const AB_TEST_ENABLED = import.meta.env.VITE_AB_TEST_ENABLED === 'true';
const AB_TEST_TREATMENT_PERCENTAGE = parseInt(
  import.meta.env.VITE_AB_TEST_TREATMENT_PERCENTAGE || '50',
  10
);

export const useFeatureFlagStore = create<FeatureFlagStore>()(
  persist(
    (set, get) => ({
      flags: DEFAULT_FLAGS,
      abTestGroup: null,

      setFlag: (flag: keyof FeatureFlags, enabled: boolean) => {
        set((state) => ({
          flags: {
            ...state.flags,
            [flag]: enabled,
          },
        }));
        
        // Track flag change
        get().trackFlagUsage(flag, enabled ? 'enabled' : 'disabled');
      },

      toggleFlag: (flag: keyof FeatureFlags) => {
        const currentValue = get().flags[flag];
        get().setFlag(flag, !currentValue);
      },

      resetFlags: () => {
        set({ flags: DEFAULT_FLAGS });
        get().trackFlagUsage('newTripPlannerUI', 'reset');
      },

      initializeABTest: () => {
        const { abTestGroup } = get();
        
        // Only initialize if not already set and A/B testing is enabled
        if (abTestGroup !== null || !AB_TEST_ENABLED) {
          return;
        }

        // Randomly assign user to control or treatment group
        const random = Math.random() * 100;
        const group = random < AB_TEST_TREATMENT_PERCENTAGE ? 'treatment' : 'control';
        
        set({ abTestGroup: group });
        
        // Enable new UI for treatment group
        if (group === 'treatment') {
          get().setFlag('newTripPlannerUI', true);
        }
        
        // Track A/B test assignment
        get().trackFlagUsage('newTripPlannerUI', `ab_test_${group}`);
      },

      trackFlagUsage: (flag: keyof FeatureFlags, action: string) => {
        // Send analytics event
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'feature_flag', {
            flag_name: flag,
            action: action,
            ab_test_group: get().abTestGroup,
            timestamp: new Date().toISOString(),
          });
        }
        
        // Log to console in development
        if (import.meta.env.DEV) {
          console.log('[Feature Flag]', {
            flag,
            action,
            abTestGroup: get().abTestGroup,
            currentValue: get().flags[flag],
          });
        }
      },
    }),
    {
      name: 'feature-flags-storage',
      partialize: (state) => ({
        flags: state.flags,
        abTestGroup: state.abTestGroup,
      }),
    }
  )
);

// Hook to check if a feature is enabled
export const useFeatureFlag = (flag: keyof FeatureFlags): boolean => {
  return useFeatureFlagStore((state) => state.flags[flag]);
};

// Hook to get all flags
export const useFeatureFlags = (): FeatureFlags => {
  return useFeatureFlagStore((state) => state.flags);
};

export default useFeatureFlagStore;
