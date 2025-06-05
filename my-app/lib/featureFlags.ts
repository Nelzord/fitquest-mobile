// Feature flags for controlling app functionality
export const FEATURE_FLAGS = {
  WORKOUT_LIMIT: false, // Disable workout limit for now
} as const;

// Type for feature flag keys
export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

// Helper function to check if a feature is enabled
export const isFeatureEnabled = (flag: FeatureFlagKey): boolean => {
  return FEATURE_FLAGS[flag];
}; 