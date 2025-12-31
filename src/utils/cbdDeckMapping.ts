/**
 * CBD Tarot Deck Mapping Utilities
 * Maps CBD deck filenames (a01..a22, b01..e14) to database card IDs
 */

// Mapping CBD filename prefix to suit
const SUIT_MAP: Record<string, string> = {
  'b': 'wands',     // Bâtons
  'c': 'cups',      // Coupes
  'd': 'pentacles', // Deniers
  'e': 'swords',    // Épées
};

// Mapping number to rank for minor arcana
const RANK_MAP: Record<number, string> = {
  1: 'ace',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'page',
  12: 'knight',
  13: 'queen',
  14: 'king',
};

// French names for minor arcana
const MINOR_NAMES_FR: Record<string, Record<string, string>> = {
  wands: {
    ace: 'As de Bâtons',
    '2': 'Deux de Bâtons',
    '3': 'Trois de Bâtons',
    '4': 'Quatre de Bâtons',
    '5': 'Cinq de Bâtons',
    '6': 'Six de Bâtons',
    '7': 'Sept de Bâtons',
    '8': 'Huit de Bâtons',
    '9': 'Neuf de Bâtons',
    '10': 'Dix de Bâtons',
    page: 'Valet de Bâtons',
    knight: 'Cavalier de Bâtons',
    queen: 'Reine de Bâtons',
    king: 'Roi de Bâtons',
  },
  cups: {
    ace: 'As de Coupes',
    '2': 'Deux de Coupes',
    '3': 'Trois de Coupes',
    '4': 'Quatre de Coupes',
    '5': 'Cinq de Coupes',
    '6': 'Six de Coupes',
    '7': 'Sept de Coupes',
    '8': 'Huit de Coupes',
    '9': 'Neuf de Coupes',
    '10': 'Dix de Coupes',
    page: 'Valet de Coupes',
    knight: 'Cavalier de Coupes',
    queen: 'Reine de Coupes',
    king: 'Roi de Coupes',
  },
  pentacles: {
    ace: 'As de Deniers',
    '2': 'Deux de Deniers',
    '3': 'Trois de Deniers',
    '4': 'Quatre de Deniers',
    '5': 'Cinq de Deniers',
    '6': 'Six de Deniers',
    '7': 'Sept de Deniers',
    '8': 'Huit de Deniers',
    '9': 'Neuf de Deniers',
    '10': 'Dix de Deniers',
    page: 'Valet de Deniers',
    knight: 'Cavalier de Deniers',
    queen: 'Reine de Deniers',
    king: 'Roi de Deniers',
  },
  swords: {
    ace: "As d'Épées",
    '2': "Deux d'Épées",
    '3': "Trois d'Épées",
    '4': "Quatre d'Épées",
    '5': "Cinq d'Épées",
    '6': "Six d'Épées",
    '7': "Sept d'Épées",
    '8': "Huit d'Épées",
    '9': "Neuf d'Épées",
    '10': "Dix d'Épées",
    page: "Valet d'Épées",
    knight: "Cavalier d'Épées",
    queen: "Reine d'Épées",
    king: "Roi d'Épées",
  },
};

export interface CardMapping {
  cbdFilename: string;  // e.g., 'a01.jpg'
  cardId: string;       // e.g., 'major_01' or 'minor_wands_ace'
  type: 'major' | 'minor';
  numero: number;
  nomFr: string;
}

/**
 * Parse a CBD filename and return the card mapping
 * @param filename - CBD filename like 'a01.jpg' or 'b14.jpg'
 */
export function parseCbdFilename(filename: string): CardMapping | null {
  // Normalize: lowercase, remove extension
  const baseName = filename.toLowerCase().replace(/\.(jpg|jpeg|png)$/i, '');
  
  // Match pattern: letter + 2 digits
  const match = baseName.match(/^([a-e])(\d{2})$/);
  if (!match) {
    // Skip z01 and other non-card files
    return null;
  }
  
  const [, letter, numStr] = match;
  const num = parseInt(numStr, 10);
  
  // Major Arcana: a01-a22
  if (letter === 'a') {
    if (num < 1 || num > 22) return null;
    
    // a22 = Le Mat (major_00), a01-a21 = major_01-major_21
    const arcanaNum = num === 22 ? 0 : num;
    const cardId = `major_${arcanaNum.toString().padStart(2, '0')}`;
    
    // French names for major arcana
    const majorNames: Record<number, string> = {
      0: 'Le Mat',
      1: 'Le Bateleur',
      2: 'La Papesse',
      3: "L'Impératrice",
      4: "L'Empereur",
      5: 'Le Pape',
      6: "L'Amoureux",
      7: 'Le Chariot',
      8: 'La Justice',
      9: "L'Hermite",
      10: 'La Roue de Fortune',
      11: 'La Force',
      12: 'Le Pendu',
      13: "L'Arcane sans Nom",
      14: 'Tempérance',
      15: 'Le Diable',
      16: 'La Maison Dieu',
      17: "L'Étoile",
      18: 'La Lune',
      19: 'Le Soleil',
      20: 'Le Jugement',
      21: 'Le Monde',
    };
    
    return {
      cbdFilename: filename,
      cardId,
      type: 'major',
      numero: arcanaNum,
      nomFr: majorNames[arcanaNum] || `Arcane ${arcanaNum}`,
    };
  }
  
  // Minor Arcana: b01-b14, c01-c14, d01-d14, e01-e14
  const suit = SUIT_MAP[letter];
  if (!suit || num < 1 || num > 14) return null;
  
  const rank = RANK_MAP[num];
  const cardId = `minor_${suit}_${rank}`;
  const nomFr = MINOR_NAMES_FR[suit]?.[rank] || `${rank} de ${suit}`;
  
  return {
    cbdFilename: filename,
    cardId,
    type: 'minor',
    numero: num,
    nomFr,
  };
}

/**
 * Generate all expected CBD mappings (78 cards)
 */
export function generateAllCbdMappings(): CardMapping[] {
  const mappings: CardMapping[] = [];
  
  // Major arcana: a01-a22
  for (let i = 1; i <= 22; i++) {
    const filename = `a${i.toString().padStart(2, '0')}.jpg`;
    const mapping = parseCbdFilename(filename);
    if (mapping) mappings.push(mapping);
  }
  
  // Minor arcana: b, c, d, e (01-14 each)
  for (const letter of ['b', 'c', 'd', 'e']) {
    for (let i = 1; i <= 14; i++) {
      const filename = `${letter}${i.toString().padStart(2, '0')}.jpg`;
      const mapping = parseCbdFilename(filename);
      if (mapping) mappings.push(mapping);
    }
  }
  
  return mappings;
}

/**
 * Get the storage path for a card in the tarot-cards bucket
 */
export function getStoragePath(cbdFilename: string): string {
  return `tarot/cbd/${cbdFilename.toLowerCase()}`;
}
