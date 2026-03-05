/**
 * Card slug utilities — convert between DB card IDs and SEO-friendly URL slugs.
 * All slugs are ASCII-only (letters, digits, hyphens) to comply with the route validator.
 *
 * Examples:
 *   cardIdToSlug('major_00')              => 'le-fou'       (French slug from nom_fr)
 *   slugToCardId('le-fou', cards)         => 'major_00'
 *   nameToSlug('Le Mat')                  => 'le-mat'
 */

import type { TarotCard } from '@/types/tarot';

/** Transliterate common French accented chars and lower-case-hyphenate a string */
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    // Strip diacritics (accents)
    .replace(/[\u0300-\u036f]/g, '')
    // Replace non-alphanumeric with hyphen
    .replace(/[^a-z0-9]+/g, '-')
    // Collapse multiple hyphens
    .replace(/-+/g, '-')
    // Trim leading/trailing hyphens
    .replace(/^-|-$/g, '');
}

/** Build a slug for a card — prefer English name for global SEO */
export function cardToSlug(card: Pick<TarotCard, 'id' | 'nom_fr'>): string {
  return nameToSlug(card.nom_fr);
}

/** Resolve a URL slug back to a card from the full card list */
export function slugToCard(slug: string, cards: TarotCard[]): TarotCard | undefined {
  return cards.find(c => nameToSlug(c.nom_fr) === slug);
}

/** Full SEO URL for a card */
export function cardSeoUrl(card: Pick<TarotCard, 'id' | 'nom_fr'>, base = ''): string {
  return `${base}/tarot/${cardToSlug(card)}`;
}
