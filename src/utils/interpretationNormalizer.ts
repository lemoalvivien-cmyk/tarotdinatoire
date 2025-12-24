/**
 * Normalizes any interpretation format (old or new) to a safe display structure.
 * Handles: AI responses, template fallbacks, partial data, null/undefined.
 */

// Old format from frontend types
interface LegacyInterpretation {
  title?: string;
  summary?: string;
  interpretation?: {
    general?: string;
    love?: string;
    work?: string;
    money?: string;
  };
  advice?: string[];
  reflection_questions?: string[];
  safety?: {
    medical?: string;
    legal?: string;
    financial?: string;
  };
}

// New format from edge function
interface NewInterpretation {
  resume_court?: string;
  interpretation_par_position?: Array<{
    position?: string;
    carte?: string;
    sens?: 'upright' | 'reversed';
    message?: string;
  }>;
  message_global?: string;
  actions_concretes?: string[];
  limites_ethiques?: string;
}

// Template format with meta
interface TemplateInterpretation extends LegacyInterpretation {
  _meta?: {
    source: 'template';
    reason: string;
    generated_at: string;
    card_count: number;
  };
}

// Normalized display structure - always safe to access
export interface NormalizedInterpretation {
  title: string;
  summary: string;
  general: string;
  love: string;
  work: string;
  money: string;
  advice: string[];
  reflectionQuestions: string[];
  safetyMedical: string;
  safetyLegal: string;
  safetyFinancial: string;
  positionInterpretations: Array<{
    position: string;
    cardName: string;
    orientation: string;
    message: string;
  }>;
  isTemplate: boolean;
  templateReason?: string;
}

// Type guard to check if we have new format
function isNewFormat(data: unknown): data is NewInterpretation {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return 'resume_court' in obj || 'interpretation_par_position' in obj || 'message_global' in obj;
}

// Type guard to check if we have legacy format
function isLegacyFormat(data: unknown): data is LegacyInterpretation {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return 'interpretation' in obj && typeof obj.interpretation === 'object';
}

// Type guard to check if it's a template
function isTemplateFormat(data: unknown): data is TemplateInterpretation {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return '_meta' in obj && typeof obj._meta === 'object';
}

// Default fallback messages
const DEFAULTS = {
  title: 'Votre Tirage',
  summary: 'Les cartes ont été tirées pour vous.',
  general: 'L\'interprétation n\'a pas pu être générée. Veuillez réessayer.',
  love: 'Interprétation non disponible.',
  work: 'Interprétation non disponible.',
  money: 'Interprétation non disponible.',
  advice: [
    'Prenez un moment pour méditer sur votre tirage.',
    'Notez vos impressions dans un journal.',
    'Faites confiance à votre intuition.',
  ],
  reflectionQuestions: [
    'Que représente ce tirage pour vous ?',
    'Comment pouvez-vous intégrer ce message ?',
  ],
  safetyMedical: 'Ce tirage ne remplace pas un avis médical professionnel.',
  safetyLegal: 'Ce tirage ne constitue pas un conseil juridique.',
  safetyFinancial: 'Ce tirage ne constitue pas un conseil financier.',
};

/**
 * Normalizes any interpretation data to a safe, display-ready format.
 * Handles null, undefined, partial data, wrong formats gracefully.
 */
export function normalizeInterpretation(data: unknown): NormalizedInterpretation {
  // Handle null/undefined
  if (!data) {
    return {
      title: DEFAULTS.title,
      summary: DEFAULTS.summary,
      general: DEFAULTS.general,
      love: DEFAULTS.love,
      work: DEFAULTS.work,
      money: DEFAULTS.money,
      advice: DEFAULTS.advice,
      reflectionQuestions: DEFAULTS.reflectionQuestions,
      safetyMedical: DEFAULTS.safetyMedical,
      safetyLegal: DEFAULTS.safetyLegal,
      safetyFinancial: DEFAULTS.safetyFinancial,
      positionInterpretations: [],
      isTemplate: false,
    };
  }

  // Handle string (raw AI response)
  if (typeof data === 'string') {
    return {
      title: DEFAULTS.title,
      summary: data.slice(0, 200) + (data.length > 200 ? '...' : ''),
      general: data,
      love: DEFAULTS.love,
      work: DEFAULTS.work,
      money: DEFAULTS.money,
      advice: DEFAULTS.advice,
      reflectionQuestions: DEFAULTS.reflectionQuestions,
      safetyMedical: DEFAULTS.safetyMedical,
      safetyLegal: DEFAULTS.safetyLegal,
      safetyFinancial: DEFAULTS.safetyFinancial,
      positionInterpretations: [],
      isTemplate: false,
    };
  }

  const obj = data as Record<string, unknown>;
  const isTemplate = isTemplateFormat(data);
  const templateMeta = isTemplate ? (obj._meta as TemplateInterpretation['_meta']) : undefined;

  // Initialize with defaults
  let result: NormalizedInterpretation = {
    title: DEFAULTS.title,
    summary: DEFAULTS.summary,
    general: DEFAULTS.general,
    love: DEFAULTS.love,
    work: DEFAULTS.work,
    money: DEFAULTS.money,
    advice: [...DEFAULTS.advice],
    reflectionQuestions: [...DEFAULTS.reflectionQuestions],
    safetyMedical: DEFAULTS.safetyMedical,
    safetyLegal: DEFAULTS.safetyLegal,
    safetyFinancial: DEFAULTS.safetyFinancial,
    positionInterpretations: [],
    isTemplate,
    templateReason: templateMeta?.reason,
  };

  // Handle NEW format (from edge function)
  if (isNewFormat(data)) {
    const newData = data as NewInterpretation;
    
    result.title = typeof obj.title === 'string' ? obj.title : DEFAULTS.title;
    result.summary = newData.resume_court || DEFAULTS.summary;
    result.general = newData.message_global || DEFAULTS.general;
    
    // Build general from position interpretations if available
    if (newData.interpretation_par_position && Array.isArray(newData.interpretation_par_position)) {
      result.positionInterpretations = newData.interpretation_par_position
        .filter(p => p && typeof p === 'object')
        .map(p => ({
          position: p.position || 'Position',
          cardName: p.carte || 'Carte',
          orientation: p.sens === 'reversed' ? 'Renversée' : 'À l\'endroit',
          message: p.message || '',
        }));
      
      // Combine all position messages for general if message_global is missing
      if (!newData.message_global && result.positionInterpretations.length > 0) {
        result.general = result.positionInterpretations
          .map(p => `**${p.position}** (${p.cardName}): ${p.message}`)
          .join('\n\n');
      }
    }
    
    // Actions become advice
    if (newData.actions_concretes && Array.isArray(newData.actions_concretes)) {
      result.advice = newData.actions_concretes.filter(a => typeof a === 'string');
    }
    
    // Ethics become safety
    if (newData.limites_ethiques) {
      result.safetyMedical = newData.limites_ethiques;
      result.safetyLegal = '';
      result.safetyFinancial = '';
    }
  }

  // Handle LEGACY format (from template engine)
  if (isLegacyFormat(data)) {
    const legacyData = data as LegacyInterpretation;
    
    result.title = legacyData.title || result.title;
    result.summary = legacyData.summary || result.summary;
    
    if (legacyData.interpretation && typeof legacyData.interpretation === 'object') {
      result.general = legacyData.interpretation.general || result.general;
      result.love = legacyData.interpretation.love || result.love;
      result.work = legacyData.interpretation.work || result.work;
      result.money = legacyData.interpretation.money || result.money;
    }
    
    if (legacyData.advice && Array.isArray(legacyData.advice)) {
      result.advice = legacyData.advice.filter(a => typeof a === 'string');
    }
    
    if (legacyData.reflection_questions && Array.isArray(legacyData.reflection_questions)) {
      result.reflectionQuestions = legacyData.reflection_questions.filter(q => typeof q === 'string');
    }
    
    if (legacyData.safety && typeof legacyData.safety === 'object') {
      result.safetyMedical = legacyData.safety.medical || result.safetyMedical;
      result.safetyLegal = legacyData.safety.legal || result.safetyLegal;
      result.safetyFinancial = legacyData.safety.financial || result.safetyFinancial;
    }
  }

  // Ensure arrays are not empty
  if (result.advice.length === 0) {
    result.advice = DEFAULTS.advice;
  }
  if (result.reflectionQuestions.length === 0) {
    result.reflectionQuestions = DEFAULTS.reflectionQuestions;
  }

  return result;
}

/**
 * Check if an interpretation is empty or failed
 */
export function isEmptyInterpretation(data: unknown): boolean {
  if (!data) return true;
  if (typeof data === 'string' && data.trim() === '') return true;
  
  const normalized = normalizeInterpretation(data);
  return normalized.general === DEFAULTS.general && normalized.positionInterpretations.length === 0;
}
