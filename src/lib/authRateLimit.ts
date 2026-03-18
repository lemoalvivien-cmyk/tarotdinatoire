/**
 * authRateLimit — Client-side helper that calls the auth-rate-limiter Edge Function
 * before any login / signup / reset call.
 *
 * Returns { allowed: boolean, message?: string, retryAfterSeconds?: number }
 * On infrastructure error → fails open (allows the auth call) to prevent DoS.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const RATE_LIMIT_URL = `${SUPABASE_URL}/functions/v1/auth-rate-limiter`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export type AuthAction = 'login' | 'signup' | 'reset';

export interface RateLimitResult {
  allowed: boolean;
  message?: string;
  retryAfterSeconds?: number;
  attempts?: number;
}

/**
 * Check rate limit before auth action.
 * Fail-open on network/infra errors to avoid blocking legitimate users.
 */
export async function checkAuthRateLimit(
  action: AuthAction,
  email: string
): Promise<RateLimitResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const response = await fetch(RATE_LIMIT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
      },
      body: JSON.stringify({ action, email }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await response.json() as {
      allowed: boolean;
      message?: string;
      retry_after_seconds?: number;
      attempts?: number;
    };

    if (response.status === 429 || !data.allowed) {
      return {
        allowed: false,
        message: data.message ?? 'Trop de tentatives. Veuillez patienter avant de réessayer.',
        retryAfterSeconds: data.retry_after_seconds,
        attempts: data.attempts,
      };
    }

    return { allowed: true, attempts: data.attempts };
  } catch {
    // Fail open — never block auth on infrastructure issues
    return { allowed: true };
  }
}

/**
 * Format seconds into a human-readable lockout message in French.
 */
export function formatLockoutDuration(seconds: number): string {
  if (seconds >= 3600) return `${Math.ceil(seconds / 3600)} heure(s)`;
  if (seconds >= 60) return `${Math.ceil(seconds / 60)} minute(s)`;
  return `${seconds} seconde(s)`;
}
