import { useMemo } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

/**
 * Premium feature keys — each maps to a feature_flags column.
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

const FLAG_MAP: Record<PremiumFeature, keyof import('@/hooks/useFeatureFlags').FeatureFlags> = {
  unlimited_readings:    'enable_unlimited_readings',
  advanced_spreads:      'enable_advanced_spreads',
  ai_deep_analysis:      'enable_ai_deep_analysis',
  audio_readings:        'enable_audio_readings',
  relationship_analysis: 'enable_relationship_analysis',
};

const FEATURES = Object.keys(FLAG_MAP) as PremiumFeature[];

/**
 * Returns access for a single feature.
 * Memoised — only re-computes when isPremium or flags change.
 */
export function useFeatureAccess(feature: PremiumFeature): FeatureAccessResult {
  const { isPremium, loading: subLoading } = useSubscription();
  const { data: flags, isLoading: flagsLoading } = useFeatureFlags();

  return useMemo(() => {
    const loading = subLoading || flagsLoading;
    const isEnabled = flags ? (flags[FLAG_MAP[feature]] as boolean) ?? true : true;
    return { isPremium, isEnabled, hasAccess: isPremium && isEnabled, loading };
  }, [isPremium, subLoading, flags, flagsLoading, feature]);
}

/**
 * Returns access for ALL premium features in a single memoised call.
 * Avoids N separate subscriptions when multiple features are needed at once.
 */
export function useAllFeatureAccess(): Record<PremiumFeature, FeatureAccessResult> {
  const { isPremium, loading: subLoading } = useSubscription();
  const { data: flags, isLoading: flagsLoading } = useFeatureFlags();

  return useMemo(() => {
    const loading = subLoading || flagsLoading;
    return Object.fromEntries(
      FEATURES.map((feature) => {
        const isEnabled = flags ? (flags[FLAG_MAP[feature]] as boolean) ?? true : true;
        return [feature, { isPremium, isEnabled, hasAccess: isPremium && isEnabled, loading }];
      })
    ) as Record<PremiumFeature, FeatureAccessResult>;
  }, [isPremium, subLoading, flags, flagsLoading]);
}
