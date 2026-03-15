/**
 * useMonetization — Central hook for ENABLE_MONETIZATION feature flag.
 *
 * Returns whether monetization is active. When false:
 * - All premium gates are bypassed
 * - Paywall is never shown
 * - Pricing UI is hidden
 *
 * Architecture: the flag defaults to `false` (pure free beta) even if the DB
 * query fails, so users always get access during an outage.
 */
export function useMonetization(): { enabled: boolean; loading: boolean } {
  // ENABLE_MONETIZATION = false hardcoded for the beta phase.
  // To re-enable: flip this constant AND set enable_monetization=true in DB.
  const ENABLE_MONETIZATION = false;
  return { enabled: ENABLE_MONETIZATION, loading: false };
}
