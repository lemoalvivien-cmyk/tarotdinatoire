import { motion } from 'framer-motion';
import { Sparkles, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ELEMENT_COLORS, ELEMENT_EMOJI, type ZodiacSign } from '@/utils/astrologyData';

interface AstroTarotBadgeProps {
  zodiacSign: ZodiacSign;
  className?: string;
}

/**
 * Compact badge showing the zodiac ↔ tarot correspondence
 * Used in reading sessions & interpretation headers
 */
export function AstroTarotBadge({ zodiacSign, className }: AstroTarotBadgeProps) {
  const colors = ELEMENT_COLORS[zodiacSign.element];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-xl',
        `bg-gradient-to-r ${colors.from} ${colors.to}`,
        'border border-white/10',
        className
      )}
    >
      <span className="text-2xl">{zodiacSign.emoji}</span>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={cn('text-sm font-semibold', colors.text)}>
            {zodiacSign.name_fr}
          </span>
          <span className={cn('text-sm', colors.text)}>{zodiacSign.symbol}</span>
          <span className="text-muted-foreground text-xs">•</span>
          <span className="text-xs text-muted-foreground">
            {ELEMENT_EMOJI[zodiacSign.element]} {zodiacSign.element}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          Tarot associé : {zodiacSign.tarot_card_fr}
        </p>
      </div>
    </motion.div>
  );
}

interface AstroInsightPanelProps {
  zodiacSign: ZodiacSign;
  context?: 'reading' | 'daily' | 'profile';
  className?: string;
}

/**
 * Expanded panel showing gifts, shadows and elemental insight
 * Used inside reading results and daily ritual
 */
export function AstroInsightPanel({ zodiacSign, context = 'reading', className }: AstroInsightPanelProps) {
  const colors = ELEMENT_COLORS[zodiacSign.element];

  const contextMessages: Record<string, string> = {
    reading: `Les cartes résonnent avec l'énergie de votre signe ${zodiacSign.name_fr}. Votre nature ${zodiacSign.element.toLowerCase()} guide l'interprétation.`,
    daily: `Votre tirage du jour s'illumine à travers le prisme de votre signe ${zodiacSign.name_fr}.`,
    profile: `Votre essence zodiacale enrichit chaque tirage d'une profondeur unique.`,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl overflow-hidden',
        `bg-gradient-to-br ${colors.from} ${colors.to}`,
        'border border-white/10',
        className
      )}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Star className={cn('h-4 w-4', colors.text)} />
          <span className={cn('text-sm font-semibold', colors.text)}>
            Influence Astrologique
          </span>
          <span className="text-lg ml-auto">{zodiacSign.emoji}</span>
        </div>

        {/* Context message */}
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {contextMessages[context]}
        </p>

        {/* Gift / Shadow */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-background/20 p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">Dons</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{zodiacSign.gift_fr}</p>
          </div>
          <div className="rounded-lg bg-background/20 p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="h-3 w-3 text-purple-400" />
              <span className="text-xs font-medium text-purple-400">À intégrer</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{zodiacSign.shadow_fr}</p>
          </div>
        </div>

        {/* Planetary ruler */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>✦ Gouverné par {zodiacSign.ruling_planet_fr}</span>
          <span>{ELEMENT_EMOJI[zodiacSign.element]} Élément {zodiacSign.element}</span>
        </div>
      </div>
    </motion.div>
  );
}
