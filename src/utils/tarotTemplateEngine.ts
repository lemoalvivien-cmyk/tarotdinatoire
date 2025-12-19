import type { TarotCard, TarotInterpretation, DrawnCard } from '@/types/tarot';

/**
 * Moteur de templates local pour interprétations hybrides
 * Génère des interprétations riches basées sur : carte + position + thème
 * Fonctionne même si l'IA est indisponible (402/500)
 */

// Templates de phrases par thème et orientation
const THEME_TEMPLATES = {
  general: {
    upright: [
      "Cette carte illumine votre chemin avec une énergie positive de {keywords}.",
      "Les forces de {keywords} sont à l'œuvre dans votre situation.",
      "Un message clair émerge autour des thèmes de {keywords}.",
    ],
    reversed: [
      "Cette carte vous invite à explorer les blocages liés à {keywords}.",
      "Une invitation à rééquilibrer les énergies de {keywords} dans votre vie.",
      "Les défis autour de {keywords} demandent votre attention.",
    ],
  },
  love: {
    upright: [
      "Dans vos relations, {card} apporte une belle énergie de {keyword}.",
      "L'amour s'exprime à travers les qualités de {keyword} et d'ouverture.",
      "Vos liens affectifs bénéficient de l'influence de {keyword}.",
    ],
    reversed: [
      "En amour, {card} suggère de travailler sur {keyword}.",
      "Vos relations appellent à plus de {keyword} et de communication.",
      "Un temps de réflexion sur {keyword} dans vos liens est nécessaire.",
    ],
  },
  work: {
    upright: [
      "Professionnellement, {card} favorise {keyword} et la progression.",
      "Votre carrière s'épanouit grâce aux qualités de {keyword}.",
      "Les opportunités liées à {keyword} se présentent à vous.",
    ],
    reversed: [
      "Au travail, {card} invite à reconsidérer votre approche de {keyword}.",
      "Des ajustements autour de {keyword} amélioreront votre situation pro.",
      "Le moment est venu de réévaluer {keyword} dans votre carrière.",
    ],
  },
  money: {
    upright: [
      "Financièrement, {card} indique une période favorable pour {keyword}.",
      "Vos ressources s'alignent avec les énergies de {keyword}.",
      "L'abondance se manifeste à travers {keyword}.",
    ],
    reversed: [
      "En matière d'argent, {card} conseille la prudence avec {keyword}.",
      "Revoyez votre relation à {keyword} pour plus d'équilibre financier.",
      "Une réflexion sur {keyword} et vos finances s'impose.",
    ],
  },
};

// Templates par position dans le tirage
const POSITION_CONTEXTS: Record<string, { intro: string; focus: string }> = {
  past: {
    intro: "Dans le passé",
    focus: "Les fondations de votre situation actuelle reposent sur",
  },
  present: {
    intro: "Dans le présent",
    focus: "L'énergie dominante de ce moment est",
  },
  future: {
    intro: "Pour l'avenir",
    focus: "Les tendances qui se dessinent pointent vers",
  },
  single: {
    intro: "Pour votre question",
    focus: "Le message central de cette carte est",
  },
  situation: {
    intro: "Concernant la situation",
    focus: "Le contexte actuel met en lumière",
  },
  obstacle: {
    intro: "L'obstacle principal",
    focus: "Le défi à surmonter concerne",
  },
  advice: {
    intro: "Le conseil",
    focus: "La voie recommandée implique",
  },
  outcome: {
    intro: "L'issue probable",
    focus: "Si vous suivez ce chemin, attendez-vous à",
  },
  yourself: {
    intro: "Vous-même",
    focus: "Votre état intérieur reflète",
  },
  environment: {
    intro: "Votre environnement",
    focus: "Les influences extérieures apportent",
  },
  hopes: {
    intro: "Vos espoirs et craintes",
    focus: "Vos aspirations profondes touchent à",
  },
  yes: {
    intro: "La réponse",
    focus: "Les énergies indiquent",
  },
  no: {
    intro: "La réponse",
    focus: "Les énergies suggèrent",
  },
  maybe: {
    intro: "La nuance",
    focus: "Des éléments à considérer incluent",
  },
};

// Conseils génériques enrichis
const GENERIC_ADVICE = [
  "Prenez le temps de méditer sur ce message avant d'agir.",
  "Faites confiance à votre intuition pour guider vos choix.",
  "Notez vos impressions et revenez-y dans quelques jours.",
  "Observez comment ces thèmes se manifestent dans votre quotidien.",
  "Restez ouvert aux signes et synchronicités autour de vous.",
];

// Questions de réflexion par position
const REFLECTION_BY_POSITION: Record<string, string[]> = {
  past: [
    "Quels événements passés résonnent avec cette carte ?",
    "Comment cette énergie a-t-elle façonné votre présent ?",
  ],
  present: [
    "Comment cette énergie se manifeste-t-elle maintenant dans votre vie ?",
    "Que pouvez-vous faire aujourd'hui pour honorer ce message ?",
  ],
  future: [
    "Comment vous préparez-vous à cette énergie à venir ?",
    "Quelles actions pouvez-vous entreprendre pour faciliter cette transition ?",
  ],
  default: [
    "Que représente cette carte dans votre situation actuelle ?",
    "Comment pouvez-vous intégrer ce message dans votre vie ?",
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getPositionContext(positionKey: string): { intro: string; focus: string } {
  return POSITION_CONTEXTS[positionKey] || POSITION_CONTEXTS.single;
}

function formatTemplate(
  template: string,
  card: TarotCard,
  keywords: string[]
): string {
  const keywordStr = keywords.slice(0, 3).join(', ') || 'transformation';
  const singleKeyword = keywords[0] || 'évolution';
  
  return template
    .replace('{card}', card.nom_fr)
    .replace('{keywords}', keywordStr)
    .replace('{keyword}', singleKeyword);
}

/**
 * Génère une interprétation pour une seule carte avec position
 */
export function generateCardInterpretation(
  card: TarotCard,
  orientation: 'upright' | 'reversed',
  positionKey: string,
  positionLabel: string
): {
  positionLabel: string;
  cardName: string;
  orientation: string;
  interpretation: string;
  keywords: string[];
} {
  const isReversed = orientation === 'reversed';
  const meaning = isReversed ? card.meaning_reversed_fr : card.meaning_upright_fr;
  const keywords = card.keywords_fr || ['mystère', 'introspection'];
  const orientationType = isReversed ? 'reversed' : 'upright';
  
  const positionCtx = getPositionContext(positionKey);
  const themeTemplate = pickRandom(THEME_TEMPLATES.general[orientationType]);
  const formattedTheme = formatTemplate(themeTemplate, card, keywords);
  
  const baseInterpretation = meaning 
    ? `${meaning.slice(0, 200)}${meaning.length > 200 ? '...' : ''}`
    : formattedTheme;

  const interpretation = `${positionCtx.intro}, ${card.nom_fr} ${isReversed ? 'renversée' : 'à l\'endroit'} apparaît. ${positionCtx.focus} ${baseInterpretation.toLowerCase().startsWith('l') || baseInterpretation.toLowerCase().startsWith('a') ? '' : ': '}${baseInterpretation}`;

  return {
    positionLabel,
    cardName: card.nom_fr,
    orientation: isReversed ? 'Renversée' : 'À l\'endroit',
    interpretation,
    keywords,
  };
}

/**
 * Génère une interprétation complète multi-cartes basée sur templates
 */
export function generateTemplateInterpretation(
  cards: Array<{
    card: TarotCard;
    drawnCard: DrawnCard;
    positionLabel: string;
  }>,
  spreadName: string,
  question?: string
): TarotInterpretation {
  // Générer les interprétations individuelles
  const cardInterpretations = cards.map(({ card, drawnCard, positionLabel }) =>
    generateCardInterpretation(card, drawnCard.orientation, drawnCard.position_key, positionLabel)
  );

  // Collecter tous les mots-clés
  const allKeywords = cardInterpretations.flatMap(ci => ci.keywords);
  const uniqueKeywords = [...new Set(allKeywords)].slice(0, 6);
  const dominantKeyword = allKeywords[0] || 'transformation';

  // Construire le titre
  const title = cards.length === 1
    ? `${cards[0].card.nom_fr} – Tirage ${spreadName}`
    : `Tirage ${spreadName} – ${cards.length} cartes`;

  // Construire le résumé
  const cardNames = cardInterpretations.map(ci => ci.cardName).join(', ');
  const summary = question
    ? `Pour votre question "${question.slice(0, 50)}${question.length > 50 ? '...' : ''}", les cartes ${cardNames} vous offrent un éclairage sur les thèmes de ${uniqueKeywords.slice(0, 3).join(', ')}.`
    : `Ce tirage ${spreadName} met en lumière les énergies de ${cardNames}. Les thèmes dominants sont : ${uniqueKeywords.slice(0, 3).join(', ')}.`;

  // Construire l'interprétation générale
  const generalParts = cardInterpretations.map(ci => ci.interpretation);
  const general = generalParts.join('\n\n');

  // Interprétations thématiques
  const orientationType = cards[0]?.drawnCard.orientation === 'reversed' ? 'reversed' : 'upright';
  
  const love = formatTemplate(
    pickRandom(THEME_TEMPLATES.love[orientationType]),
    cards[0]?.card || { nom_fr: 'Les cartes' } as TarotCard,
    uniqueKeywords
  );
  
  const work = formatTemplate(
    pickRandom(THEME_TEMPLATES.work[orientationType]),
    cards[0]?.card || { nom_fr: 'Les cartes' } as TarotCard,
    uniqueKeywords.slice(1)
  );
  
  const money = formatTemplate(
    pickRandom(THEME_TEMPLATES.money[orientationType]),
    cards[0]?.card || { nom_fr: 'Les cartes' } as TarotCard,
    uniqueKeywords.slice(2)
  );

  // Conseils
  const advice = [
    `Méditez sur les thèmes de ${uniqueKeywords.slice(0, 3).join(', ')}.`,
    ...GENERIC_ADVICE.slice(0, 2),
  ];

  // Questions de réflexion
  const primaryPosition = cards[0]?.drawnCard.position_key || 'default';
  const reflectionQuestions = [
    ...(REFLECTION_BY_POSITION[primaryPosition] || REFLECTION_BY_POSITION.default),
    `Comment les énergies de ${dominantKeyword} résonnent-elles avec votre situation ?`,
  ];

  return {
    title,
    summary,
    interpretation: {
      general,
      love,
      work,
      money,
    },
    advice,
    reflection_questions: reflectionQuestions,
    safety: {
      medical: 'Ce tirage ne remplace pas un avis médical professionnel.',
      legal: 'Ce tirage ne constitue pas un conseil juridique.',
      financial: 'Ce tirage ne constitue pas un conseil financier.',
    },
  };
}

/**
 * Structure pour stocker une interprétation template en DB
 */
export interface TemplateInterpretationData extends TarotInterpretation {
  _meta: {
    source: 'template';
    reason: 'AI_UNAVAILABLE' | 'INSUFFICIENT_BALANCE' | 'RATE_LIMITED' | 'AI_ERROR' | 'NETWORK_ERROR';
    generated_at: string;
    card_count: number;
  };
}

export function createTemplateForStorage(
  interpretation: TarotInterpretation,
  reason: TemplateInterpretationData['_meta']['reason'],
  cardCount: number
): TemplateInterpretationData {
  return {
    ...interpretation,
    _meta: {
      source: 'template',
      reason,
      generated_at: new Date().toISOString(),
      card_count: cardCount,
    },
  };
}
