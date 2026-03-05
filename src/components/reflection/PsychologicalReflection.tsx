import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePsychologicalReflection } from '@/hooks/usePsychologicalReflection';
import { OracleLoader } from '@/components/tarot-ui/OracleLoader';
import { MysticButton } from '@/components/mystic/MysticButton';
import {
  Heart, Eye, Sun, HelpCircle, Sprout, Star, RefreshCw, AlertTriangle,
  ChevronDown, ChevronUp,
} from 'lucide-react';

interface PsychologicalReflectionProps {
  drawId: string;
  cardName: string;
}

const SECTIONS = [
  {
    key: 'emotional_insight' as const,
    icon: Heart,
    label: 'Paysage émotionnel',
    color: 'hsl(340 80% 65%)',
    bg: 'hsl(340 80% 65% / 0.08)',
    border: 'hsl(340 80% 65% / 0.25)',
    delay: 0.1,
  },
  {
    key: 'shadow_aspect' as const,
    icon: Eye,
    label: 'Ce qui demande lumière',
    color: 'hsl(260 60% 65%)',
    bg: 'hsl(260 60% 65% / 0.08)',
    border: 'hsl(260 60% 65% / 0.25)',
    delay: 0.2,
  },
  {
    key: 'light_aspect' as const,
    icon: Sun,
    label: 'Ta ressource consciente',
    color: 'hsl(45 90% 60%)',
    bg: 'hsl(45 90% 60% / 0.08)',
    border: 'hsl(45 90% 60% / 0.25)',
    delay: 0.3,
  },
  {
    key: 'reflection_question' as const,
    icon: HelpCircle,
    label: 'Question pour ton journal',
    color: 'hsl(200 80% 60%)',
    bg: 'hsl(200 80% 60% / 0.1)',
    border: 'hsl(200 80% 60% / 0.3)',
    delay: 0.4,
    isQuestion: true,
  },
  {
    key: 'growth_suggestion' as const,
    icon: Sprout,
    label: 'Pratique du moment',
    color: 'hsl(145 60% 55%)',
    bg: 'hsl(145 60% 55% / 0.08)',
    border: 'hsl(145 60% 55% / 0.25)',
    delay: 0.5,
  },
];

export function PsychologicalReflection({ drawId, cardName }: PsychologicalReflectionProps) {
  const { reflection, isLoading, isGenerating, regenerate } = usePsychologicalReflection(drawId);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="py-8">
        <OracleLoader size="sm" message="Exploration intérieure en cours…" />
      </div>
    );
  }

  if (!reflection) {
    return (
      <div className="text-center py-6 space-y-3">
        <p className="text-muted-foreground text-sm">La réflexion n'a pas pu être générée.</p>
        <MysticButton onClick={regenerate} disabled={isGenerating} size="sm">
          {isGenerating ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-2" /> : null}
          Réessayer
        </MysticButton>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Archetype badge */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
          <span className="text-xs text-muted-foreground">Archétype :</span>
          <span
            className="text-xs font-semibold"
            style={{ color: 'hsl(var(--primary))' }}
          >
            {reflection.archetype}
          </span>
        </div>
        <button
          onClick={regenerate}
          disabled={isGenerating}
          className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors disabled:opacity-40"
          title="Régénérer"
        >
          <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
        </button>
      </motion.div>

      {/* Affirmation banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.08 }}
        className="rounded-xl px-4 py-3 text-center"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--secondary) / 0.08))',
          border: '1px solid hsl(var(--primary) / 0.3)',
        }}
      >
        <p className="text-xs text-muted-foreground mb-1 tracking-widest uppercase">Affirmation</p>
        <p
          className="font-serif text-base font-medium italic"
          style={{ color: 'hsl(var(--primary))' }}
        >
          « {reflection.affirmation} »
        </p>
      </motion.div>

      {/* Main sections */}
      <div className="space-y-3">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const text = reflection[section.key] as string;
          const isOpen = expanded === section.key;
          const isLong = text.length > 120;

          return (
            <motion.div
              key={section.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: section.delay }}
              className="rounded-xl overflow-hidden"
              style={{
                background: section.bg,
                border: `1px solid ${section.border}`,
              }}
            >
              <div
                className={`px-4 py-3 ${isLong ? 'cursor-pointer' : ''}`}
                onClick={() => isLong && setExpanded(isOpen ? null : section.key)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5" style={{ color: section.color }} />
                    <span
                      className="text-[11px] font-medium uppercase tracking-wider"
                      style={{ color: section.color }}
                    >
                      {section.label}
                    </span>
                  </div>
                  {isLong && (
                    <span style={{ color: section.color }}>
                      {isOpen
                        ? <ChevronUp className="h-3.5 w-3.5" />
                        : <ChevronDown className="h-3.5 w-3.5" />}
                    </span>
                  )}
                </div>

                <AnimatePresence initial={false} mode="wait">
                  {(isOpen || !isLong) ? (
                    <motion.p
                      key="full"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`text-sm leading-relaxed ${section.isQuestion ? 'font-medium italic' : ''}`}
                      style={{ color: 'hsl(var(--foreground) / 0.85)' }}
                    >
                      {section.isQuestion ? `"${text}"` : text}
                    </motion.p>
                  ) : (
                    <motion.p
                      key="preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm leading-relaxed"
                      style={{ color: 'hsl(var(--foreground) / 0.75)' }}
                    >
                      {text.slice(0, 110)}…
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Safety note */}
      {reflection.safety_note && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex gap-3 rounded-xl px-4 py-3"
          style={{
            background: 'hsl(45 90% 60% / 0.08)',
            border: '1px solid hsl(45 90% 60% / 0.3)',
          }}
        >
          <AlertTriangle
            className="h-4 w-4 shrink-0 mt-0.5"
            style={{ color: 'hsl(45 90% 60%)' }}
          />
          <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--foreground) / 0.8)' }}>
            {reflection.safety_note}
          </p>
        </motion.div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-center text-muted-foreground/50 pt-1">
        Ces pistes d'introspection sont à titre informatif uniquement et ne remplacent pas un suivi professionnel.
      </p>
    </motion.div>
  );
}
