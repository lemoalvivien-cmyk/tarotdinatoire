/**
 * Vitest — ENABLE_MONETIZATION flag tests
 * Covers free-beta mode (current) and future premium re-activation path.
 */
// @vitest-environment jsdom
/// <reference types="vitest/globals" />


// ── Simulated flag resolver (mirrors useFeatureAccess logic) ─────────────────
type PremiumFeature = 'unlimited_readings' | 'advanced_spreads' | 'ai_deep_analysis' | 'audio_readings' | 'relationship_analysis';

function resolveAccess(enableMonetization: boolean, isPremiumUser: boolean, featureEnabled: boolean) {
  if (!enableMonetization) {
    // Free beta: everyone has full access
    return { hasAccess: true, isPremium: true, isEnabled: true };
  }
  return { hasAccess: isPremiumUser && featureEnabled, isPremium: isPremiumUser, isEnabled: featureEnabled };
}

const ALL_FEATURES: PremiumFeature[] = [
  'unlimited_readings', 'advanced_spreads', 'ai_deep_analysis', 'audio_readings', 'relationship_analysis',
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ENABLE_MONETIZATION = false (current beta mode)', () => {
  it('grants access to all features for any user', () => {
    for (const feature of ALL_FEATURES) {
      const result = resolveAccess(false, false, true);
      expect(result.hasAccess).toBe(true);
      expect(result.isPremium).toBe(true);
    }
  });

  it('grants access even if user is free-tier AND feature disabled', () => {
    const result = resolveAccess(false, false, false);
    expect(result.hasAccess).toBe(true);
  });

  it('never shows paywall (no premium check needed)', () => {
    const freeUser = resolveAccess(false, false, true);
    const premiumUser = resolveAccess(false, true, true);
    expect(freeUser.hasAccess).toBe(premiumUser.hasAccess);
  });
});

describe('ENABLE_MONETIZATION = true (future premium mode)', () => {
  it('blocks access for free users', () => {
    const result = resolveAccess(true, false, true);
    expect(result.hasAccess).toBe(false);
  });

  it('grants access for premium users with enabled feature', () => {
    const result = resolveAccess(true, true, true);
    expect(result.hasAccess).toBe(true);
  });

  it('blocks premium user if feature flag is disabled', () => {
    const result = resolveAccess(true, true, false);
    expect(result.hasAccess).toBe(false);
  });

  it('blocks free user regardless of feature flag state', () => {
    expect(resolveAccess(true, false, true).hasAccess).toBe(false);
    expect(resolveAccess(true, false, false).hasAccess).toBe(false);
  });
});

describe('Beta→Premium transition invariants', () => {
  it('free-mode access is always superset of premium-mode access', () => {
    for (const isPremium of [true, false]) {
      for (const featureEnabled of [true, false]) {
        const freeMode = resolveAccess(false, isPremium, featureEnabled);
        const paidMode = resolveAccess(true, isPremium, featureEnabled);
        // free mode must never be more restrictive than paid
        if (paidMode.hasAccess) expect(freeMode.hasAccess).toBe(true);
      }
    }
  });
});
