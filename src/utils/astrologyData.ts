/**
 * Astrology data: zodiac signs, elements, planets, tarot correspondences
 */

export interface ZodiacSign {
  id: string;
  name_fr: string;
  symbol: string;
  emoji: string;
  element: 'Feu' | 'Terre' | 'Air' | 'Eau';
  ruling_planet: string;
  ruling_planet_fr: string;
  date_range: string;
  start_month: number;
  start_day: number;
  end_month: number;
  end_day: number;
  keywords_fr: string[];
  // Tarot Major Arcana correspondence
  tarot_card_fr: string;
  tarot_card_id: string;
  // Archetypal description
  description_fr: string;
  shadow_fr: string;
  gift_fr: string;
}

export const ZODIAC_SIGNS: ZodiacSign[] = [
  {
    id: 'aries',
    name_fr: 'Bélier',
    symbol: '♈',
    emoji: '🐏',
    element: 'Feu',
    ruling_planet: 'Mars',
    ruling_planet_fr: 'Mars',
    date_range: '21 mars – 19 avril',
    start_month: 3, start_day: 21,
    end_month: 4, end_day: 19,
    keywords_fr: ['courage', 'initiative', 'passion', 'leadership', 'spontanéité'],
    tarot_card_fr: 'L\'Empereur',
    tarot_card_id: 'major_04',
    description_fr: 'Le Bélier est le pionnier du zodiaque, animé par une énergie ardente et un désir de conquête. Il incarne le commencement, l\'audace et la force primordiale.',
    shadow_fr: 'impulsivité, impatience, agressivité',
    gift_fr: 'courage, leadership, élan vital',
  },
  {
    id: 'taurus',
    name_fr: 'Taureau',
    symbol: '♉',
    emoji: '🐂',
    element: 'Terre',
    ruling_planet: 'Venus',
    ruling_planet_fr: 'Vénus',
    date_range: '20 avril – 20 mai',
    start_month: 4, start_day: 20,
    end_month: 5, end_day: 20,
    keywords_fr: ['stabilité', 'sensualité', 'persévérance', 'abondance', 'beauté'],
    tarot_card_fr: 'L\'Hiérophante',
    tarot_card_id: 'major_05',
    description_fr: 'Le Taureau est l\'archétype de la fertilité et de la permanence. Il incarne le plaisir des sens, la loyauté et la construction patiente de la sécurité matérielle.',
    shadow_fr: 'entêtement, possessivité, résistance au changement',
    gift_fr: 'patience, sens pratique, connexion à la matière',
  },
  {
    id: 'gemini',
    name_fr: 'Gémeaux',
    symbol: '♊',
    emoji: '👯',
    element: 'Air',
    ruling_planet: 'Mercury',
    ruling_planet_fr: 'Mercure',
    date_range: '21 mai – 20 juin',
    start_month: 5, start_day: 21,
    end_month: 6, end_day: 20,
    keywords_fr: ['curiosité', 'communication', 'adaptabilité', 'intelligence', 'dualité'],
    tarot_card_fr: 'Les Amoureux',
    tarot_card_id: 'major_06',
    description_fr: 'Les Gémeaux incarnent la dualité et le mouvement perpétuel de l\'esprit. Messagers du zodiaque, ils tissent les liens entre les idées et les personnes.',
    shadow_fr: 'dispersion, superficialité, inconstance',
    gift_fr: 'versatilité, éloquence, connexions',
  },
  {
    id: 'cancer',
    name_fr: 'Cancer',
    symbol: '♋',
    emoji: '🦀',
    element: 'Eau',
    ruling_planet: 'Moon',
    ruling_planet_fr: 'La Lune',
    date_range: '21 juin – 22 juillet',
    start_month: 6, start_day: 21,
    end_month: 7, end_day: 22,
    keywords_fr: ['intuition', 'empathie', 'protection', 'mémoire', 'famille'],
    tarot_card_fr: 'Le Chariot',
    tarot_card_id: 'major_07',
    description_fr: 'Le Cancer est le gardien des racines et de l\'âme profonde. Sa sensibilité lunaire lui permet de percevoir l\'invisible et de créer des espaces sacrés de sécurité.',
    shadow_fr: 'hypersensibilité, attachement, peur du rejet',
    gift_fr: 'intuition, nurturing, profondeur émotionnelle',
  },
  {
    id: 'leo',
    name_fr: 'Lion',
    symbol: '♌',
    emoji: '🦁',
    element: 'Feu',
    ruling_planet: 'Sun',
    ruling_planet_fr: 'Le Soleil',
    date_range: '23 juillet – 22 août',
    start_month: 7, start_day: 23,
    end_month: 8, end_day: 22,
    keywords_fr: ['créativité', 'générosité', 'fierté', 'rayonnement', 'authenticité'],
    tarot_card_fr: 'La Force',
    tarot_card_id: 'major_08',
    description_fr: 'Le Lion rayonne la lumière solaire et incarne la puissance créatrice. Archétype du roi ou de la reine, il inspire par sa présence et transforme tout en or.',
    shadow_fr: 'arrogance, besoin de reconnaissance, ego blessé',
    gift_fr: 'magnanimité, leadership charismatique, joie de vivre',
  },
  {
    id: 'virgo',
    name_fr: 'Vierge',
    symbol: '♍',
    emoji: '🌾',
    element: 'Terre',
    ruling_planet: 'Mercury',
    ruling_planet_fr: 'Mercure',
    date_range: '23 août – 22 septembre',
    start_month: 8, start_day: 23,
    end_month: 9, end_day: 22,
    keywords_fr: ['discernement', 'service', 'précision', 'santé', 'analyse'],
    tarot_card_fr: 'L\'Ermite',
    tarot_card_id: 'major_09',
    description_fr: 'La Vierge est l\'alchimiste du quotidien qui transforme le chaos en ordre sacré. Son intelligence pratique et sa dévotion au service lui confèrent une sagesse unique.',
    shadow_fr: 'perfectionnisme, critique excessive, anxiété',
    gift_fr: 'discernement, dévouement, maîtrise des détails',
  },
  {
    id: 'libra',
    name_fr: 'Balance',
    symbol: '♎',
    emoji: '⚖️',
    element: 'Air',
    ruling_planet: 'Venus',
    ruling_planet_fr: 'Vénus',
    date_range: '23 septembre – 22 octobre',
    start_month: 9, start_day: 23,
    end_month: 10, end_day: 22,
    keywords_fr: ['harmonie', 'équilibre', 'justice', 'beauté', 'diplomatie'],
    tarot_card_fr: 'La Justice',
    tarot_card_id: 'major_11',
    description_fr: 'La Balance incarne la quête de l\'équilibre parfait entre les forces opposées. Gardienne de la justice cosmique, elle cherche l\'harmonie dans toutes les relations.',
    shadow_fr: 'indécision, dépendance aux autres, évitement du conflit',
    gift_fr: 'diplomatie, sens esthétique, équanimité',
  },
  {
    id: 'scorpio',
    name_fr: 'Scorpion',
    symbol: '♏',
    emoji: '🦂',
    element: 'Eau',
    ruling_planet: 'Pluto',
    ruling_planet_fr: 'Pluton',
    date_range: '23 octobre – 21 novembre',
    start_month: 10, start_day: 23,
    end_month: 11, end_day: 21,
    keywords_fr: ['transformation', 'intensité', 'profondeur', 'mystère', 'renaissance'],
    tarot_card_fr: 'La Mort',
    tarot_card_id: 'major_13',
    description_fr: 'Le Scorpion plonge dans les profondeurs de l\'être pour en extraire les vérités cachées. Maître de la transformation, il connaît le chemin à travers les ténèbres vers la lumière.',
    shadow_fr: 'jalousie, obsession, vengeance, manipulation',
    gift_fr: 'perspicacité, résilience, pouvoir de régénération',
  },
  {
    id: 'sagittarius',
    name_fr: 'Sagittaire',
    symbol: '♐',
    emoji: '🏹',
    element: 'Feu',
    ruling_planet: 'Jupiter',
    ruling_planet_fr: 'Jupiter',
    date_range: '22 novembre – 21 décembre',
    start_month: 11, start_day: 22,
    end_month: 12, end_day: 21,
    keywords_fr: ['liberté', 'philosophie', 'aventure', 'vérité', 'expansion'],
    tarot_card_fr: 'La Tempérance',
    tarot_card_id: 'major_14',
    description_fr: 'Le Sagittaire est l\'archer philosophe qui vise toujours plus haut. Sa quête de sens et d\'expansion l\'amène à traverser les frontières du connu.',
    shadow_fr: 'irresponsabilité, dogmatisme, excès',
    gift_fr: 'optimisme, sagesse, vision large',
  },
  {
    id: 'capricorn',
    name_fr: 'Capricorne',
    symbol: '♑',
    emoji: '🐐',
    element: 'Terre',
    ruling_planet: 'Saturn',
    ruling_planet_fr: 'Saturne',
    date_range: '22 décembre – 19 janvier',
    start_month: 12, start_day: 22,
    end_month: 1, end_day: 19,
    keywords_fr: ['ambition', 'discipline', 'sagesse', 'maîtrise', 'héritage'],
    tarot_card_fr: 'Le Diable',
    tarot_card_id: 'major_15',
    description_fr: 'Le Capricorne gravit la montagne avec une détermination silencieuse, portant sur ses épaules la responsabilité de construire quelque chose qui dure.',
    shadow_fr: 'rigidité, pessimisme, obsession du contrôle',
    gift_fr: 'persévérance, intégrité, vision long terme',
  },
  {
    id: 'aquarius',
    name_fr: 'Verseau',
    symbol: '♒',
    emoji: '🏺',
    element: 'Air',
    ruling_planet: 'Uranus',
    ruling_planet_fr: 'Uranus',
    date_range: '20 janvier – 18 février',
    start_month: 1, start_day: 20,
    end_month: 2, end_day: 18,
    keywords_fr: ['innovation', 'liberté', 'humanité', 'originalité', 'révolution'],
    tarot_card_fr: 'L\'Étoile',
    tarot_card_id: 'major_17',
    description_fr: 'Le Verseau est le visionnaire qui apporte la lumière de demain dans le présent. Porteur d\'eau céleste, il nourrit l\'humanité de ses idéaux et de ses inventions.',
    shadow_fr: 'détachement émotionnel, utopisme, rébellion pour la rébellion',
    gift_fr: 'originalité, humanisme, pensée avant-gardiste',
  },
  {
    id: 'pisces',
    name_fr: 'Poissons',
    symbol: '♓',
    emoji: '🐟',
    element: 'Eau',
    ruling_planet: 'Neptune',
    ruling_planet_fr: 'Neptune',
    date_range: '19 février – 20 mars',
    start_month: 2, start_day: 19,
    end_month: 3, end_day: 20,
    keywords_fr: ['compassion', 'intuition', 'spiritualité', 'rêve', 'fusion'],
    tarot_card_fr: 'La Lune',
    tarot_card_id: 'major_18',
    description_fr: 'Les Poissons nagent dans les eaux profondes de l\'inconscient collectif. Mystiques nés, ils dissolvent les frontières entre le visible et l\'invisible.',
    shadow_fr: 'fuite de la réalité, sacrifice de soi, confusion',
    gift_fr: 'empathie universelle, créativité, spiritualité profonde',
  },
];

export const ELEMENT_COLORS: Record<string, { from: string; to: string; text: string }> = {
  'Feu':   { from: 'from-orange-500/20', to: 'to-red-500/20',    text: 'text-orange-400' },
  'Terre': { from: 'from-green-600/20',  to: 'to-emerald-500/20', text: 'text-emerald-400' },
  'Air':   { from: 'from-sky-400/20',    to: 'to-blue-400/20',    text: 'text-sky-400' },
  'Eau':   { from: 'from-blue-500/20',   to: 'to-indigo-500/20',  text: 'text-indigo-400' },
};

export const ELEMENT_EMOJI: Record<string, string> = {
  'Feu': '🔥', 'Terre': '🌍', 'Air': '🌬️', 'Eau': '💧',
};

/**
 * Compute zodiac sign from birth date
 */
export function getZodiacSignFromDate(birthDate: Date): ZodiacSign | null {
  const month = birthDate.getMonth() + 1; // 1-12
  const day = birthDate.getDate();

  for (const sign of ZODIAC_SIGNS) {
    // Handle year wrap (Capricorn spans Dec-Jan)
    if (sign.start_month > sign.end_month) {
      if (
        (month === sign.start_month && day >= sign.start_day) ||
        (month === sign.end_month && day <= sign.end_day)
      ) return sign;
    } else {
      if (
        (month === sign.start_month && day >= sign.start_day) ||
        (month > sign.start_month && month < sign.end_month) ||
        (month === sign.end_month && day <= sign.end_day)
      ) return sign;
    }
  }
  return null;
}

/**
 * Get ZodiacSign object by id
 */
export function getZodiacById(id: string): ZodiacSign | undefined {
  return ZODIAC_SIGNS.find(s => s.id === id);
}

/**
 * Build a rich astrological context string for AI prompts
 */
export function buildAstroContext(sign: ZodiacSign): string {
  return `Signe astrologique: ${sign.name_fr} (${sign.symbol})
Élément: ${sign.element} • Planète gouvernante: ${sign.ruling_planet_fr}
Carte de Tarot associée: ${sign.tarot_card_fr}
Mots-clés: ${sign.keywords_fr.join(', ')}
Dons: ${sign.gift_fr}
Ombres à intégrer: ${sign.shadow_fr}
Archétype: ${sign.description_fr}`;
}
