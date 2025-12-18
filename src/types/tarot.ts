export interface TarotCard {
  id: string;
  nom_fr: string;
  type: 'major' | 'minor';
  numero: number | null;
  meaning_upright_fr: string | null;
  meaning_reversed_fr: string | null;
  keywords_fr: string[] | null;
  image_url: string | null;
}

export interface DrawnCard {
  card_id: string;
  orientation: 'upright' | 'reversed';
  position_key: string;
}

export interface CardFocus {
  card_id: string;
  name_fr: string;
  orientation: string;
  meaning: string;
  keywords: string[];
}

export interface TarotInterpretation {
  title: string;
  summary: string;
  card_focus: CardFocus[];
  guidance: {
    message: string;
    actions: string[];
    questions_to_reflect: string[];
    warning: string;
  };
  affirmation: string;
  disclaimer: string;
}

export interface TarotReading {
  id: string;
  user_id: string;
  spread_id: string | null;
  question: string | null;
  cards: DrawnCard[];
  ai_interpretation: TarotInterpretation | null;
  user_notes: string | null;
  is_favorite: boolean;
  created_at: string;
}
