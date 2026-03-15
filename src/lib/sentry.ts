/**
 * Sentry — initialisation, PII redaction, custom traces.
 * DSN via VITE_SENTRY_DSN env var (set in Lovable Secrets).
 * PII: emails and user IDs are auto-scrubbed before sending.
 */
import * as Sentry from '@sentry/react';

// ── PII Patterns ─────────────────────────────────────────────────────────────
const PII_PATTERNS = [
  // Emails
  { re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, mask: '[EMAIL]' },
  // UUIDs (user ids, session ids)
  { re: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, mask: '[ID]' },
];

function redactPII(value: string): string {
  return PII_PATTERNS.reduce((v, { re, mask }) => v.replace(re, mask), value);
}

// ── Init ─────────────────────────────────────────────────────────────────────
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    if (import.meta.env.DEV) console.info('[Sentry] No DSN configured — skipping init');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || 'unknown',

    // Performance
    tracesSampleRate: import.meta.env.PROD ? 0.15 : 1.0,
    profilesSampleRate: 0.05,

    // PII scrubbing at the event level
    beforeSend(event) {
      // Scrub breadcrumbs
      if (event.breadcrumbs?.values) {
        event.breadcrumbs.values = event.breadcrumbs.values.map(b => ({
          ...b,
          message: b.message ? redactPII(b.message) : b.message,
        }));
      }
      // Scrub exception values
      event.exception?.values?.forEach(ex => {
        if (ex.value) ex.value = redactPII(ex.value);
      });
      // Remove user email if leaked
      if (event.user?.email) event.user.email = '[REDACTED]';
      if (event.user?.username) event.user.username = '[REDACTED]';
      return event;
    },

    // Never send local dev noise
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection',
      'ChunkLoadError',
      'NetworkError',
    ],

    integrations: [
      Sentry.browserTracingIntegration(),
    ],
  });
}

// ── Custom tracing helpers ────────────────────────────────────────────────────

/** Wrap an async fn in a Sentry span for storytelling / IA quality tracing. */
export async function traceAIInterpretation<T>(
  spreadId: string,
  fn: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    { name: 'tarot.interpretation', op: 'ai.storytelling', attributes: { spread_id: spreadId } },
    fn
  );
}

/** Trace RGPD operations — export / delete. */
export async function traceRGPDOperation<T>(
  operation: 'export' | 'delete',
  fn: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    { name: `rgpd.${operation}`, op: 'rgpd', attributes: { operation } },
    fn
  );
}

/** Track feature flag reads (for flag drift detection). */
export function captureFeatureFlagRead(flagName: string, value: unknown) {
  Sentry.addBreadcrumb({
    category: 'feature_flag',
    message: `${flagName} = ${JSON.stringify(value)}`,
    level: 'info',
  });
}

/** Mark first draw milestone. */
export function markFirstDraw() {
  Sentry.addBreadcrumb({
    category: 'gamification',
    message: 'first_draw_completed',
    level: 'info',
  });
}

export { Sentry };
