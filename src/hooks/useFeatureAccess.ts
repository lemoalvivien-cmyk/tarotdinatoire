import { useSubscription } from '@/hooks/useSubscription';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

/**
 * Premium feature keys — each maps to a feature_flags column.
 * Add new keys here as the product grows.
 */
export type PremiumFeature =
  | 'unlimited_readings'
  | 'advanced_spreads'
  | 'ai_deep_analysis'
  | 'audio_readings'
  | 'relationship_analysis';

export interface FeatureAccessResult {
  /** User has an active premium/trial subscription */
  isPremium: boolean;
  /** The feature flag is turned ON by admins */
  isEnabled: boolean;
  /** User has subscription AND the feature flag is enabled */
  hasAccess: boolean;
  /** Still loading subscription or flags */
  loading: boolean;
}

const FLAG_MAP: Record<PremiumFeature, keyof import('@/hooks/useFeatureFlags').FeatureFlags> = {
  unlimited_readings:    'enable_unlimited_readings',
  advanced_spreads:      'enable_advanced_spreads',
  ai_deep_analysis:      'enable_ai_deep_analysis',
  audio_readings:        'enable_audio_readings',
  relationship_analysis: 'enable_relationship_analysis',
};

/**
 * Hook that checks BOTH subscription status AND admin feature flag for a given feature.
 *
 * Usage:
 *   const { hasAccess, loading } = useFeatureAccess('advanced_spreads');
 */
export function useFeatureAccess(feature: PremiumFeature): FeatureAccessResult {
  const { isPremium, loading: subLoading } = useSubscription();
  const { data: flags, isLoading: flagsLoading } = useFeatureFlags();

  const loading = subLoading || flagsLoading;
  const flagKey = FLAG_MAP[feature];
  // Default to true if flags haven't loaded yet (fail-open for UX; actual auth happens server-side)
  const isEnabled = flags ? (flags[flagKey] as boolean) ?? true : true;
  const hasAccess = isPremium && isEnabled;

  return { isPremium, isEnabled, hasAccess, loading };
}

/**
 * Returns access status for ALL premium features at once.
 */
export function useAllFeatureAccess(): Record<PremiumFeature, FeatureAccessResult> {
  const { isPremium, loading: subLoading } = useSubscription();
  const { data: flags, isLoading: flagsLoading } = useFeatureFlags();

  const loading = subLoading || flagsLoading;

  const result = {} as Record<PremiumFeature, FeatureAccessResult>;
  const features: PremiumFeature[] = [
    'unlimited_readings',
    'advanced_spreads',
    'ai_deep_analysis',
    'audio_readings',
    'relationship_analysis',
  ];

  for (const feature of features) {
    const flagKey = FLAG_MAP[feature];
    const isEnabled = flags ? (flags[flagKey] as boolean) ?? true : true;
    result[feature] = {
      isPremium,
      isEnabled,
      hasAccess: isPremium && isEnabled,
      loading,
    };
  }

  return result;
}
