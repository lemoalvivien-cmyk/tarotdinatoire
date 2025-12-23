/**
 * Seeded random number generator (Mulberry32)
 * Provides reproducible random sequences for a given seed
 */
export function createSeededRandom(seed: number): () => number {
  let a = seed;
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates (Durstenfeld) shuffle with optional seed
 * @param array - Array to shuffle (not mutated)
 * @param seed - Optional seed for reproducible shuffle
 * @returns New shuffled array
 */
export function shuffleArray<T>(array: T[], seed?: number): T[] {
  const result = [...array];
  const random = seed !== undefined ? createSeededRandom(seed) : Math.random;
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  
  return result;
}

/**
 * Cut the deck at a random position
 * @param deck - Array to cut
 * @param seed - Optional seed for reproducible cut position
 * @returns New array with cut applied
 */
export function cutDeck<T>(deck: T[], seed?: number): T[] {
  if (deck.length <= 1) return [...deck];
  
  const random = seed !== undefined ? createSeededRandom(seed) : Math.random;
  
  // Cut at a position between 1/4 and 3/4 of the deck
  const minCut = Math.floor(deck.length * 0.25);
  const maxCut = Math.floor(deck.length * 0.75);
  const cutPosition = minCut + Math.floor(random() * (maxCut - minCut));
  
  // Take from cut position to end, then from start to cut position
  return [...deck.slice(cutPosition), ...deck.slice(0, cutPosition)];
}

/**
 * Generate a random seed based on current time and randomness
 */
export function generateSeed(): number {
  return Math.floor(Date.now() + Math.random() * 1000000);
}

/**
 * Determine card orientation (upright/reversed)
 * @param seed - Optional seed for reproducibility
 * @param threshold - Probability of upright (default 0.5)
 */
export function determineOrientation(seed?: number, threshold = 0.5): 'upright' | 'reversed' {
  const random = seed !== undefined ? createSeededRandom(seed) : Math.random;
  return random() < threshold ? 'upright' : 'reversed';
}
