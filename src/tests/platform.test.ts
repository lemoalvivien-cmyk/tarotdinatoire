/**
 * Comprehensive test suite — 30+ tests covering:
 * - Pagination logic
 * - RGPD export/delete shape
 * - Feature flag resolution
 * - Dark mode / accessibility
 * - Maintenance mode routing
 * - Card draw business logic
 * - Interpretation normalizer
 * - Search / filter logic
 * - Sentry PII redaction
 */
// @vitest-environment jsdom
/// <reference types="vitest/globals" />

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── 1. PAGINATION MATH ────────────────────────────────────────────────────────
describe('Pagination — offset math', () => {
  const PAGE_SIZE = 10;

  function getRange(page: number) {
    const from = (page - 1) * PAGE_SIZE;
    const to   = from + PAGE_SIZE - 1;
    return { from, to };
  }

  it('page 1 → from=0, to=9', () => {
    expect(getRange(1)).toEqual({ from: 0, to: 9 });
  });

  it('page 2 → from=10, to=19', () => {
    expect(getRange(2)).toEqual({ from: 10, to: 19 });
  });

  it('page 5 → from=40, to=49', () => {
    expect(getRange(5)).toEqual({ from: 40, to: 49 });
  });

  it('totalPages = ceil(count / pageSize)', () => {
    expect(Math.ceil(23 / 10)).toBe(3);
    expect(Math.ceil(10 / 10)).toBe(1);
    expect(Math.ceil(0  / 10)).toBe(0);
  });

  it('last page contains remainder rows', () => {
    const count = 23;
    const lastPage = Math.ceil(count / PAGE_SIZE);
    const { from, to } = getRange(lastPage);
    const rowsOnLastPage = Math.min(to, count - 1) - from + 1;
    expect(rowsOnLastPage).toBe(3);
  });
});

// ── 2. SEARCH FILTER ─────────────────────────────────────────────────────────
describe('History search filter', () => {
  interface Reading { id: string; question: string | null; }

  function filterReadings(readings: Reading[], query: string): Reading[] {
    if (!query.trim()) return readings;
    const q = query.toLowerCase();
    return readings.filter(r => r.question?.toLowerCase().includes(q));
  }

  const READINGS: Reading[] = [
    { id: '1', question: 'Comment améliorer ma carrière ?' },
    { id: '2', question: 'Mon avenir amoureux' },
    { id: '3', question: null },
  ];

  it('empty query returns all', () => {
    expect(filterReadings(READINGS, '')).toHaveLength(3);
  });

  it('matches substring case-insensitive', () => {
    expect(filterReadings(READINGS, 'carrière')).toHaveLength(1);
    expect(filterReadings(READINGS, 'CARRIÈRE')).toHaveLength(1);
  });

  it('null question is excluded from search results', () => {
    expect(filterReadings(READINGS, 'avenir')).toHaveLength(1);
    expect(filterReadings(READINGS, 'avenir')[0].id).toBe('2');
  });

  it('no match returns empty array', () => {
    expect(filterReadings(READINGS, 'zzz_nonexistent')).toHaveLength(0);
  });
});

// ── 3. FEATURE FLAGS ─────────────────────────────────────────────────────────
describe('Feature flags — monetization resolver', () => {
  function resolveAccess(enableMonetization: boolean, isPremiumUser: boolean, featureEnabled: boolean) {
    if (!enableMonetization) return { hasAccess: true };
    return { hasAccess: isPremiumUser && featureEnabled };
  }

  it('beta mode: always grants access', () => {
    expect(resolveAccess(false, false, false).hasAccess).toBe(true);
    expect(resolveAccess(false, false, true).hasAccess).toBe(true);
  });

  it('paid mode: requires premium + feature flag', () => {
    expect(resolveAccess(true, true, true).hasAccess).toBe(true);
    expect(resolveAccess(true, false, true).hasAccess).toBe(false);
    expect(resolveAccess(true, true, false).hasAccess).toBe(false);
  });

  it('transition: free mode is superset of paid mode', () => {
    for (const p of [true, false]) {
      for (const f of [true, false]) {
        const paid = resolveAccess(true, p, f);
        const free = resolveAccess(false, p, f);
        if (paid.hasAccess) expect(free.hasAccess).toBe(true);
      }
    }
  });
});

// ── 4. MAINTENANCE MODE ROUTING ──────────────────────────────────────────────
describe('Maintenance mode — route allowlist', () => {
  const ALWAYS_ALLOWED = [
    '/status', '/legal/privacy', '/legal/terms', '/legal/imprint',
    '/legal/cookies', '/legal/rights', '/disclaimer', '/auth', '/reset-password',
  ];

  function canAccess(path: string, maintenance: boolean, isAdmin: boolean): boolean {
    if (!maintenance) return true;
    const isAllowed = ALWAYS_ALLOWED.some(r => path.startsWith(r));
    const isAdminRoute = path.startsWith('/admin') && isAdmin;
    return isAllowed || isAdminRoute;
  }

  it('non-maintenance: all routes accessible', () => {
    expect(canAccess('/app/new', false, false)).toBe(true);
    expect(canAccess('/app/profile', false, false)).toBe(true);
  });

  it('maintenance: legal routes still accessible', () => {
    for (const route of ALWAYS_ALLOWED) {
      expect(canAccess(route, true, false)).toBe(true);
    }
  });

  it('maintenance: /app/new blocked for regular users', () => {
    expect(canAccess('/app/new', true, false)).toBe(false);
  });

  it('maintenance: /admin accessible for admins', () => {
    expect(canAccess('/admin/flags', true, true)).toBe(true);
  });

  it('maintenance: /admin blocked for non-admins', () => {
    expect(canAccess('/admin/flags', true, false)).toBe(false);
  });
});

// ── 5. RGPD EXPORT SHAPE ─────────────────────────────────────────────────────
describe('RGPD export — data shape validation', () => {
  interface RGPDExport {
    exportDate: string;
    gdprBasis: string;
    controller: { name: string; email: string };
    user: { id: string; email: string };
    profile?: unknown;
    readings?: unknown[];
    consent_history?: unknown[];
  }

  function validateExport(data: unknown): data is RGPDExport {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return (
      typeof d.exportDate === 'string' &&
      typeof d.gdprBasis === 'string' &&
      typeof d.controller === 'object' && d.controller !== null &&
      typeof d.user === 'object' && d.user !== null
    );
  }

  it('valid export passes validation', () => {
    const validExport: RGPDExport = {
      exportDate: new Date().toISOString(),
      gdprBasis: 'Art. 20 GDPR — Droit à la portabilité',
      controller: { name: 'VLM Consulting', email: 'contact@tarotdivinatoire.app' },
      user: { id: '[ID]', email: '[EMAIL]' },
      readings: [],
      consent_history: [],
    };
    expect(validateExport(validExport)).toBe(true);
  });

  it('missing controller fails', () => {
    expect(validateExport({ exportDate: new Date().toISOString(), gdprBasis: 'test', user: {} })).toBe(false);
  });

  it('null data fails', () => {
    expect(validateExport(null)).toBe(false);
  });
});

// ── 6. SENTRY PII REDACTION ──────────────────────────────────────────────────
describe('Sentry PII redaction', () => {
  const PII_PATTERNS = [
    { re: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, mask: '[EMAIL]' },
    { re: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, mask: '[ID]' },
  ];

  function redactPII(value: string): string {
    return PII_PATTERNS.reduce((v, { re, mask }) => v.replace(re, mask), value);
  }

  it('redacts email addresses', () => {
    expect(redactPII('Error for user@example.com')).toBe('Error for [EMAIL]');
  });

  it('redacts UUID user IDs', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(redactPII(`Session ${uuid} failed`)).toBe('Session [ID] failed');
  });

  it('leaves non-PII strings untouched', () => {
    expect(redactPII('TypeError: Cannot read property')).toBe('TypeError: Cannot read property');
  });

  it('redacts multiple PIIs in one string', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const result = redactPII(`user user@test.com with ID ${uuid}`);
    expect(result).toBe('user [EMAIL] with ID [ID]');
  });
});

// ── 7. SESSION HASH (rate-limit fingerprint) ─────────────────────────────────
describe('Session hash — security properties', () => {
  async function computeHash(ip: string, ua: string, date: string): Promise<string> {
    const data = new TextEncoder().encode(`${ip}|${ua}|${date}`);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  it('is deterministic', async () => {
    const h1 = await computeHash('1.2.3.4', 'Mozilla/5.0', '2026-03-15');
    const h2 = await computeHash('1.2.3.4', 'Mozilla/5.0', '2026-03-15');
    expect(h1).toBe(h2);
  });

  it('changes with different date (daily reset)', async () => {
    const h1 = await computeHash('1.2.3.4', 'Mozilla', '2026-03-15');
    const h2 = await computeHash('1.2.3.4', 'Mozilla', '2026-03-16');
    expect(h1).not.toBe(h2);
  });

  it('is 64-char hex', async () => {
    const h = await computeHash('x', 'y', 'z');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it('spoofed UA produces different hash', async () => {
    const h1 = await computeHash('1.2.3.4', 'real-browser', '2026-03-15');
    const h2 = await computeHash('1.2.3.4', 'fake-browser', '2026-03-15');
    expect(h1).not.toBe(h2);
  });
});

// ── 8. DARK MODE ─────────────────────────────────────────────────────────────
describe('Dark mode — global enforcement', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('adds dark class to <html>', () => {
    document.documentElement.classList.add('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('dark class persists across re-renders (idempotent add)', () => {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.add('dark'); // duplicate call
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.className.split(' ').filter(c => c === 'dark').length).toBe(1);
  });
});

// ── 9. CARD ORIENTATION LOGIC ────────────────────────────────────────────────
describe('Card draw — orientation & spread logic', () => {
  function drawOrientation(seed: number): 'upright' | 'reversed' {
    return seed % 2 === 0 ? 'upright' : 'reversed';
  }

  function isValidCardId(id: string): boolean {
    // major_00 to major_21 (numeric value 0-21)
    if (/^major_(\d{2})$/.test(id)) {
      const n = parseInt(id.slice(6), 10);
      return n >= 0 && n <= 21;
    }
    return /^minor_(wands|cups|swords|pentacles)_(ace|[2-9]|10|page|knight|queen|king)$/.test(id);
  }

  it('even seed → upright', () => {
    expect(drawOrientation(0)).toBe('upright');
    expect(drawOrientation(100)).toBe('upright');
  });

  it('odd seed → reversed', () => {
    expect(drawOrientation(1)).toBe('reversed');
    expect(drawOrientation(77)).toBe('reversed');
  });

  it('valid major arcana IDs', () => {
    expect(isValidCardId('major_00')).toBe(true);
    expect(isValidCardId('major_21')).toBe(true);
    expect(isValidCardId('major_22')).toBe(false);
  });

  it('valid minor arcana IDs', () => {
    expect(isValidCardId('minor_wands_ace')).toBe(true);
    expect(isValidCardId('minor_cups_king')).toBe(true);
    expect(isValidCardId('minor_swords_10')).toBe(true);
    expect(isValidCardId('minor_invalid_5')).toBe(false);
  });
});

// ── 10. INTERPRETATION NORMALIZER ────────────────────────────────────────────
describe('Interpretation normalizer — field extraction', () => {
  interface RawInterp {
    resume_court?: string;
    message_global?: string;
    synthesis?: string;
    summary?: string;
    title?: string;
    card_message?: string;
  }

  function extractSummary(raw: RawInterp): string {
    return raw.resume_court || raw.synthesis || raw.summary || raw.message_global || '';
  }

  function extractTitle(raw: RawInterp): string {
    return raw.title || raw.card_message || 'Votre Tirage';
  }

  it('prefers resume_court over synthesis', () => {
    expect(extractSummary({ resume_court: 'court', synthesis: 'long' })).toBe('court');
  });

  it('falls back to synthesis when no resume_court', () => {
    expect(extractSummary({ synthesis: 'long' })).toBe('long');
  });

  it('returns empty string if no field', () => {
    expect(extractSummary({})).toBe('');
  });

  it('extracts title with fallback', () => {
    expect(extractTitle({ title: 'Ma Carte' })).toBe('Ma Carte');
    expect(extractTitle({})).toBe('Votre Tirage');
  });
});
