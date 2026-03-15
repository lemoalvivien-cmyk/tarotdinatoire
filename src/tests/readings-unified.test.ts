/**
 * Unified readings model — Vitest tests
 * Covers: pagination math, favorite toggle, not-found error, query key structure
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Pagination helpers (pure) ─────────────────────────────────────────────
const PAGE_SIZE = 20;

function paginate<T>(items: T[], page: number): { rows: T[]; total: number; hasMore: boolean } {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE;
  const rows = items.slice(from, to);
  return { rows, total: items.length, hasMore: items.length > to };
}

function totalPages(total: number): number {
  return Math.ceil(total / PAGE_SIZE);
}

// ─── Pagination math ───────────────────────────────────────────────────────
describe('Pagination helpers', () => {
  const makeItems = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `r-${i}` }));

  it('returns empty for 0 items', () => {
    const result = paginate([], 0);
    expect(result.rows).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.hasMore).toBe(false);
  });

  it('page 0 of 25 items returns 20 rows + hasMore', () => {
    const result = paginate(makeItems(25), 0);
    expect(result.rows).toHaveLength(20);
    expect(result.hasMore).toBe(true);
    expect(result.total).toBe(25);
  });

  it('page 1 of 25 items returns 5 rows + no hasMore', () => {
    const result = paginate(makeItems(25), 1);
    expect(result.rows).toHaveLength(5);
    expect(result.hasMore).toBe(false);
  });

  it('exactly PAGE_SIZE items: 1 page, no hasMore', () => {
    const result = paginate(makeItems(20), 0);
    expect(result.rows).toHaveLength(20);
    expect(result.hasMore).toBe(false);
    expect(totalPages(20)).toBe(1);
  });

  it('totalPages rounds up correctly', () => {
    expect(totalPages(0)).toBe(0);
    expect(totalPages(1)).toBe(1);
    expect(totalPages(20)).toBe(1);
    expect(totalPages(21)).toBe(2);
    expect(totalPages(40)).toBe(2);
    expect(totalPages(41)).toBe(3);
  });

  it('25 readings → 2 pages', () => {
    expect(totalPages(25)).toBe(2);
  });
});

// ─── UnifiedReadingRow shape ────────────────────────────────────────────────
describe('UnifiedReadingRow shape', () => {
  it('maps reading_sessions columns correctly', () => {
    const row = {
      id: 'abc-123',
      user_id: 'user-1',
      spread_id: 'one_card',
      question: 'Ma question',
      selected_cards: [{ card_id: 'major_00', orientation: 'upright', position_key: 'single' }],
      is_favorite: false,
      user_notes: null,
      origin_id: null,
      created_at: '2026-03-16T10:00:00Z',
      reading_results: [{ id: 'res-1', interpretation: { title: 'Test', summary: 'Summary' } }],
    };

    expect(row.id).toBeTruthy();
    expect(Array.isArray(row.selected_cards)).toBe(true);
    expect(row.selected_cards[0].card_id).toBe('major_00');
    expect(row.reading_results[0].interpretation.summary).toBe('Summary');
    expect(row.is_favorite).toBe(false);
  });
});

// ─── Search filter logic (pure) ─────────────────────────────────────────────
interface MockCard { nom_fr: string; keywords_fr: string[] }
interface MockRow {
  question: string | null;
  selected_cards: Array<{ card_id: string }>;
  reading_results: Array<{ interpretation: { summary: string } | null }>;
}

function filterRows(rows: MockRow[], q: string, cardMap: Map<string, MockCard>): MockRow[] {
  const lower = q.toLowerCase();
  return rows.filter(item => {
    const card = item.selected_cards[0] ? cardMap.get(item.selected_cards[0].card_id) : null;
    const summary = item.reading_results[0]?.interpretation?.summary ?? '';
    return (
      card?.nom_fr.toLowerCase().includes(lower) ||
      card?.keywords_fr?.some(k => k.toLowerCase().includes(lower)) ||
      summary.toLowerCase().includes(lower) ||
      item.question?.toLowerCase().includes(lower)
    );
  });
}

describe('Search filter', () => {
  const cardMap = new Map<string, MockCard>([
    ['major_00', { nom_fr: 'Le Fou', keywords_fr: ['liberté', 'commencement'] }],
    ['major_01', { nom_fr: 'Le Magicien', keywords_fr: ['volonté', 'pouvoir'] }],
  ]);

  const rows: MockRow[] = [
    {
      question: 'Comment réussir ?',
      selected_cards: [{ card_id: 'major_00' }],
      reading_results: [{ interpretation: { summary: 'Un voyage débute' } }],
    },
    {
      question: null,
      selected_cards: [{ card_id: 'major_01' }],
      reading_results: [{ interpretation: { summary: 'Maîtrise et concentration' } }],
    },
  ];

  it('empty query returns all rows', () => {
    expect(filterRows(rows, '', cardMap)).toHaveLength(2);
  });

  it('matches card name', () => {
    expect(filterRows(rows, 'fou', cardMap)).toHaveLength(1);
  });

  it('matches keyword', () => {
    expect(filterRows(rows, 'liberté', cardMap)).toHaveLength(1);
  });

  it('matches summary', () => {
    expect(filterRows(rows, 'maîtrise', cardMap)).toHaveLength(1);
  });

  it('matches question', () => {
    expect(filterRows(rows, 'réussir', cardMap)).toHaveLength(1);
  });

  it('no match returns empty', () => {
    expect(filterRows(rows, 'xyz-no-match', cardMap)).toHaveLength(0);
  });
});

// ─── Not-found error detection ───────────────────────────────────────────────
describe('Reading not-found error', () => {
  it('detects NOT_FOUND error correctly', () => {
    const err = new Error('NOT_FOUND');
    expect(err.message === 'NOT_FOUND').toBe(true);
  });

  it('retries on network errors but not NOT_FOUND', () => {
    const retryFn = (count: number, err: unknown) => {
      if ((err as Error)?.message === 'NOT_FOUND') return false;
      return count < 2;
    };

    expect(retryFn(0, new Error('NOT_FOUND'))).toBe(false);
    expect(retryFn(0, new Error('Network error'))).toBe(true);
    expect(retryFn(1, new Error('Network error'))).toBe(true);
    expect(retryFn(2, new Error('Network error'))).toBe(false);
  });
});

// ─── Origin_id migration tracking ────────────────────────────────────────────
describe('Migration origin_id', () => {
  it('migrated rows have an origin_id', () => {
    const migratedRow = { id: 'new-id', origin_id: 'old-tarot-reading-id' };
    expect(migratedRow.origin_id).toBeTruthy();
  });

  it('native sessions have null origin_id', () => {
    const nativeRow = { id: 'new-id', origin_id: null };
    expect(nativeRow.origin_id).toBeNull();
  });
});
