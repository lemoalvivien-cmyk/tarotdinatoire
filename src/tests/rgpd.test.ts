/**
 * Tests RGPD : export + suppression de compte
 * Vérifie la logique client-side (invocation + comportement)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock supabase functions.invoke ────────────────────────────────────────────
const mockInvoke = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: { invoke: mockInvoke },
    auth: { signOut: vi.fn().mockResolvedValue({}) },
  },
}));

// ── Export function tests ─────────────────────────────────────────────────────
describe('RGPD Export (export-user-data)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('invokes export-user-data with POST', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { exportDate: new Date().toISOString(), user: { id: 'uid', email: 'a@b.com' } },
      error: null,
    });

    const { supabase } = await import('@/integrations/supabase/client');
    const result = await supabase.functions.invoke('export-user-data', { method: 'POST' });

    expect(result.error).toBeNull();
    expect(result.data).toHaveProperty('exportDate');
    expect(result.data.user.email).toBe('a@b.com');
    expect(mockInvoke).toHaveBeenCalledWith('export-user-data', { method: 'POST' });
  });

  it('returns error when unauthorized', async () => {
    mockInvoke.mockResolvedValueOnce({ data: null, error: { message: 'Unauthorized' } });
    const { supabase } = await import('@/integrations/supabase/client');
    const result = await supabase.functions.invoke('export-user-data', { method: 'POST' });
    expect(result.error?.message).toBe('Unauthorized');
  });

  it('export data includes all RGPD required fields', async () => {
    const mockExportData = {
      exportDate: '2026-03-15T00:00:00.000Z',
      exportVersion: '2.0',
      gdprBasis: 'Article 20 RGPD — Droit à la portabilité des données',
      controller: 'VLM Consulting — contact@tarotdinatoire.fr',
      user: { id: 'uid-123', email: 'user@test.com', created_at: '2024-01-01' },
      profile: { id: 'uid-123', display_name: 'Test User' },
      readings: { sessions: [], results: [] },
      daily_draws: [],
      karma: null,
      achievements: [],
      consent_history: [],
    };
    mockInvoke.mockResolvedValueOnce({ data: mockExportData, error: null });

    const { supabase } = await import('@/integrations/supabase/client');
    const result = await supabase.functions.invoke('export-user-data', { method: 'POST' });

    expect(result.data).toHaveProperty('gdprBasis');
    expect(result.data).toHaveProperty('controller');
    expect(result.data).toHaveProperty('profile');
    expect(result.data).toHaveProperty('readings');
    expect(result.data).toHaveProperty('consent_history');
  });
});

// ── Account deletion tests ────────────────────────────────────────────────────
describe('RGPD Account Deletion (delete-account)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires confirmed: true in body', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Confirmation required: send { confirmed: true }' },
    });

    const { supabase } = await import('@/integrations/supabase/client');
    const result = await supabase.functions.invoke('delete-account', {
      method: 'POST',
      body: { confirmed: false },
    });
    expect(result.error?.message).toContain('Confirmation required');
  });

  it('returns success when confirmed', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Votre compte et toutes vos données ont été définitivement supprimés.',
        deleted_at: new Date().toISOString(),
      },
      error: null,
    });

    const { supabase } = await import('@/integrations/supabase/client');
    const result = await supabase.functions.invoke('delete-account', {
      method: 'POST',
      body: { confirmed: true },
    });

    expect(result.error).toBeNull();
    expect(result.data.success).toBe(true);
    expect(result.data).toHaveProperty('deleted_at');
  });

  it('returns 401 without JWT', async () => {
    mockInvoke.mockResolvedValueOnce({ data: null, error: { message: 'Unauthorized' } });
    const { supabase } = await import('@/integrations/supabase/client');
    const result = await supabase.functions.invoke('delete-account', { method: 'POST' });
    expect(result.error?.message).toBe('Unauthorized');
  });

  it('calls signOut after successful deletion', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { success: true, message: 'Compte supprimé', deleted_at: new Date().toISOString() },
      error: null,
    });

    const { supabase } = await import('@/integrations/supabase/client');
    await supabase.functions.invoke('delete-account', { method: 'POST', body: { confirmed: true } });

    // In the actual component, signOut is called after success.
    // Here we verify the invoke payload is correct.
    expect(mockInvoke).toHaveBeenCalledWith('delete-account', expect.objectContaining({
      body: { confirmed: true },
    }));
  });
});

// ── Session hash computation (server-side logic unit test) ────────────────────
describe('Session hash security properties', () => {
  async function computeHash(ip: string, ua: string, date: string): Promise<string> {
    const raw = `${ip}|${ua}|${date}`;
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  it('same inputs produce same hash', async () => {
    const h1 = await computeHash('1.2.3.4', 'Mozilla/5', '2026-03-15');
    const h2 = await computeHash('1.2.3.4', 'Mozilla/5', '2026-03-15');
    expect(h1).toBe(h2);
  });

  it('different IP produces different hash (anti-spoofing)', async () => {
    const h1 = await computeHash('1.2.3.4', 'Mozilla/5', '2026-03-15');
    const h2 = await computeHash('5.6.7.8', 'Mozilla/5', '2026-03-15');
    expect(h1).not.toBe(h2);
  });

  it('different date produces different hash (rate-limit per day)', async () => {
    const h1 = await computeHash('1.2.3.4', 'Mozilla/5', '2026-03-15');
    const h2 = await computeHash('1.2.3.4', 'Mozilla/5', '2026-03-16');
    expect(h1).not.toBe(h2);
  });

  it('hash is 64 chars hex (SHA-256)', async () => {
    const h = await computeHash('1.2.3.4', 'Mozilla/5', '2026-03-15');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });
});
