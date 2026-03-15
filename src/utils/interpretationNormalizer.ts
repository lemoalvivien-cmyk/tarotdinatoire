/**
 * Normalizes any interpretation format (old or new) to a safe display structure.
 * Handles: AI responses, template fallbacks, partial data, null/undefined.
 * 
 * CRITICAL: This function MUST NEVER throw. All access to interpretation data
 * in the UI MUST go through this normalizer to prevent crashes.
 */

import { z } from 'zod';

// Zod schema for validation (used for type-safety, not for throwing)
export const InterpretationSchema = z.object({
  general: z.string(),
  cards: z.array(z.object({
    card_id: z.string(),
    title: z.string().optional(),
    message: z.string(),
    action: z.string().optional(),
  })).optional(),
  synthesis: z.string(),
  actions: z.array(z.string()),
}).partial();

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

// New format from edge function — 4 storytelling sections
interface NewInterpretation {
  resume_court?: string;
  interpretation_par_position?: Array<{
    position?: string;
    carte?: string;
    sens?: 'upright' | 'reversed';
    message?: string;
  }>;
  message_global?: string;
  questions_synchronicite?: string[];
  actions_concretes?: string[];
  message_tarologues?: string;
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

// Error response from API
interface ErrorResponse {
  error?: string;
  message?: string;
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
  /** Questions for "Synchronicité du jour" section */
  synchroniciteQuestions: string[];
  /** Inspirational quote from the 30 tarot traditions */
  messageTarologues: string;
  isTemplate: boolean;
  templateReason?: string;
  hasError: boolean;
  errorMessage?: string;
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

// Type guard to check if it's an error response
function isErrorResponse(data: unknown): data is ErrorResponse {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return 'error' in obj && typeof obj.error === 'string';
}

// Default fallback messages
const DEFAULTS = {
  title: 'Votre Tirage',
  summary: 'Les cartes ont été tirées pour vous.',
  general: 'L\'interprétation n\'a pas pu être réalisée. Veuillez réessayer.',
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
 * Safely extracts a string from an unknown value.
 */
function safeString(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }
  return fallback;
}

/**
 * Safely extracts an array of strings from an unknown value.
 */
function safeStringArray(value: unknown, fallback: string[]): string[] {
  if (Array.isArray(value)) {
    const filtered = value.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
    return filtered.length > 0 ? filtered : fallback;
  }
  return fallback;
}

/**
 * Normalizes any interpretation data to a safe, display-ready format.
 * Handles null, undefined, partial data, wrong formats, errors gracefully.
 * 
 * GUARANTEED: This function NEVER throws. Always returns a valid NormalizedInterpretation.
 */
export function normalizeInterpretation(data: unknown): NormalizedInterpretation {
  // Initialize with safe defaults
  const result: NormalizedInterpretation = {
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
    synchroniciteQuestions: [],
    messageTarologues: '',
    isTemplate: false,
    hasError: false,
  };

  try {
    // Handle null/undefined
    if (!data) {
      result.hasError = true;
      result.errorMessage = 'Aucune interprétation disponible';
      return result;
    }

    // Handle string (raw AI response or error message)
    if (typeof data === 'string') {
      if (data.trim() === '') {
        result.hasError = true;
        result.errorMessage = 'Interprétation vide';
        return result;
      }
      result.summary = data.slice(0, 200) + (data.length > 200 ? '...' : '');
      result.general = data;
      return result;
    }

    // Handle non-object types
    if (typeof data !== 'object') {
      result.hasError = true;
      result.errorMessage = 'Format d\'interprétation invalide';
      return result;
    }

    const obj = data as Record<string, unknown>;

    // Check if it's an error response from the API
    if (isErrorResponse(data)) {
      result.hasError = true;
      result.errorMessage = safeString(obj.message || obj.error, 'Erreur lors de l\'interprétation');
      return result;
    }

    // Check if it's a template
    if (isTemplateFormat(data)) {
      result.isTemplate = true;
      const meta = obj._meta as TemplateInterpretation['_meta'];
      result.templateReason = meta?.reason;
    }

    // Handle NEW format (from edge function)
    if (isNewFormat(data)) {
      const newData = data as NewInterpretation;
      
      // Title - check if exists directly on object
      result.title = safeString(obj.title, DEFAULTS.title);
      
      // Summary from resume_court
      result.summary = safeString(newData.resume_court, DEFAULTS.summary);
      
      // General message
      result.general = safeString(newData.message_global, DEFAULTS.general);
      
      // Build position interpretations if available
      if (newData.interpretation_par_position && Array.isArray(newData.interpretation_par_position)) {
        result.positionInterpretations = newData.interpretation_par_position
          .filter((p): p is NonNullable<typeof p> => p !== null && typeof p === 'object')
          .map(p => ({
            position: safeString(p.position, 'Position'),
            cardName: safeString(p.carte, 'Carte'),
            orientation: p.sens === 'reversed' ? 'Renversée' : 'À l\'endroit',
            message: safeString(p.message, ''),
          }))
          .filter(p => p.message !== '');
        
        // Combine all position messages for general if message_global is missing
        if (!newData.message_global && result.positionInterpretations.length > 0) {
          result.general = result.positionInterpretations
            .map(p => `**${p.position}** (${p.cardName}): ${p.message}`)
            .join('\n\n');
        }
      }
      
      // Actions become advice
      result.advice = safeStringArray(newData.actions_concretes, DEFAULTS.advice);
      
      // Ethics become safety
      if (newData.limites_ethiques) {
        result.safetyMedical = safeString(newData.limites_ethiques, DEFAULTS.safetyMedical);
        result.safetyLegal = '';
        result.safetyFinancial = '';
      }
    }

    // Handle LEGACY format (from template engine or old responses)
    if (isLegacyFormat(data)) {
      const legacyData = data as LegacyInterpretation;
      
      result.title = safeString(legacyData.title, result.title);
      result.summary = safeString(legacyData.summary, result.summary);
      
      if (legacyData.interpretation && typeof legacyData.interpretation === 'object') {
        result.general = safeString(legacyData.interpretation.general, result.general);
        result.love = safeString(legacyData.interpretation.love, result.love);
        result.work = safeString(legacyData.interpretation.work, result.work);
        result.money = safeString(legacyData.interpretation.money, result.money);
      }
      
      result.advice = safeStringArray(legacyData.advice, result.advice);
      result.reflectionQuestions = safeStringArray(legacyData.reflection_questions, result.reflectionQuestions);
      
      if (legacyData.safety && typeof legacyData.safety === 'object') {
        result.safetyMedical = safeString(legacyData.safety.medical, result.safetyMedical);
        result.safetyLegal = safeString(legacyData.safety.legal, result.safetyLegal);
        result.safetyFinancial = safeString(legacyData.safety.financial, result.safetyFinancial);
      }
    }

    // If neither format matched but we have some data, try to extract what we can
    if (!isNewFormat(data) && !isLegacyFormat(data)) {
      // Try to get any useful text
      const possibleFields = ['general', 'message', 'text', 'content', 'summary', 'interpretation'];
      for (const field of possibleFields) {
        if (typeof obj[field] === 'string' && (obj[field] as string).trim() !== '') {
          result.general = obj[field] as string;
          break;
        }
      }
      
      // Try to get title
      if (typeof obj.title === 'string') {
        result.title = obj.title;
      }
    }

  } catch (err) {
    // This should NEVER happen, but just in case
    console.error('[normalizeInterpretation] Unexpected error:', err);
    result.hasError = true;
    result.errorMessage = 'Erreur inattendue lors du traitement de l\'interprétation';
  }

  return result;
}

/**
 * Check if an interpretation is empty or failed
 */
export function isEmptyInterpretation(data: unknown): boolean {
  if (!data) return true;
  if (typeof data === 'string' && data.trim() === '') return true;
  
  try {
    const normalized = normalizeInterpretation(data);
    return normalized.hasError || (normalized.general === DEFAULTS.general && normalized.positionInterpretations.length === 0);
  } catch {
    return true;
  }
}

/**
 * Check if we have a valid interpretation that can be displayed
 */
export function hasValidInterpretation(data: unknown): boolean {
  return !isEmptyInterpretation(data);
}
