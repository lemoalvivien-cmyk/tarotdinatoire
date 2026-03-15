import { useMemo } from 'react';

/**
 * Premium feature keys — each maps to a feature_flags column.
 * While ENABLE_MONETIZATION = false, ALL features return hasAccess: true.
 */
export type PremiumFeature =
  | 'unlimited_readings'
  | 'advanced_spreads'
  | 'ai_deep_analysis'
  | 'audio_readings'
  | 'relationship_analysis';

export interface FeatureAccessResult {
  isPremium: boolean;
  isEnabled: boolean;
  hasAccess: boolean;
  loading: boolean;
}

// ── ENABLE_MONETIZATION = false ──────────────────────────────────────────────
// All features are freely accessible during the beta phase.
// When monetization is re-enabled, restore the original subscription checks.
const FREE_ACCESS: FeatureAccessResult = {
  isPremium: true,   // treated as "premium" so existing UI gates open
  isEnabled: true,
  hasAccess: true,
  loading: false,
};

/**
 * Returns access for a single feature.
 * In free-beta mode, always returns full access.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useFeatureAccess(_feature: PremiumFeature): FeatureAccessResult {
  return useMemo(() => FREE_ACCESS, []);
}

/**
 * Returns access for ALL premium features in a single memoised call.
 */
export function useAllFeatureAccess(): Record<PremiumFeature, FeatureAccessResult> {
  return useMemo(() => ({
    unlimited_readings:    FREE_ACCESS,
    advanced_spreads:      FREE_ACCESS,
    ai_deep_analysis:      FREE_ACCESS,
    audio_readings:        FREE_ACCESS,
    relationship_analysis: FREE_ACCESS,
  }), []);
}
