/**
 * Centralized React Query configuration.
 * Import these helpers in every useQuery call to ensure
 * consistent caching, staleTime, and retry strategy.
 */

/** Never retry on RLS / permission errors */
export const rlsSafeRetry = (failureCount: number, error: unknown): boolean => {
  if (error instanceof Error) {
    if (error.message.includes('42501')) return false;
    if (error.message.includes('permission denied')) return false;
    if (error.message.includes('406')) return false;
  }
  return failureCount < 2;
};

// ─── StaleTime presets ────────────────────────────────────────────────────────

/** Static content that never changes (tarot cards, spreads) */
export const STALE_FOREVER = 1000 * 60 * 60 * 24; // 24 h

/** User profile — moderate churn */
export const STALE_MEDIUM = 1000 * 30; // 30 s

/** Subscription status — needs freshness but not instant */
export const STALE_SUB = 1000 * 60 * 5; // 5 min

/** Daily content — fine to cache for a minute */
export const STALE_DAILY = 1000 * 60; // 1 min

/** Computed analytics / energy — can lag a couple minutes */
export const STALE_ANALYTICS = 1000 * 60 * 2; // 2 min

/** Narrative / synchronicity — expensive to generate, cache for 5 min */
export const STALE_NARRATIVE = 1000 * 60 * 5; // 5 min

// ─── GcTime presets ───────────────────────────────────────────────────────────

/** Keep heavy card data in GC cache for one day */
export const GC_CARDS = 1000 * 60 * 60 * 24; // 24 h

/** Default garbage collect window */
export const GC_DEFAULT = 1000 * 60 * 10; // 10 min

// ─── Query key factories — centralised to avoid string typos ─────────────────

export const qk = {
  tarotCards: () => ['tarot-cards'] as const,
  tarotSpreads: () => ['tarot-spreads'] as const,

  profile: (userId: string | undefined) => ['profile', userId] as const,

  subscription: (userId: string | undefined) => ['subscription', userId] as const,

  dailyDraw: (userId: string | undefined, date: string) =>
    ['daily-draw', userId, date] as const,
  dailyDrawsHistory: (userId: string | undefined) =>
    ['daily-draws-history', userId] as const,
  energyProfile: (userId: string | undefined) =>
    ['energy-profile', userId] as const,
  energyDimensions: (userId: string | undefined, days: number) =>
    ['energy-dimensions-profile', userId, days] as const,
  streak: (userId: string | undefined) => ['streak', userId] as const,

  karma: (userId: string | undefined) => ['karma', userId] as const,

  readings: (userId: string | undefined) => ['tarot-readings', userId] as const,
  readingStats: (userId: string | undefined) => ['reading-stats', userId] as const,
  readingDetail: (id: string | undefined) => ['reading-detail', id] as const,

  synchronicity: (userId: string | undefined) =>
    ['synchronicity', userId] as const,

  narrative: (userId: string | undefined) =>
    ['narrative-memory', userId] as const,
  narrativeHistory: (userId: string | undefined) =>
    ['narrative-history', userId] as const,

  featureFlags: () => ['feature-flags'] as const,
  publicConfig: () => ['public-config'] as const,
} as const;
