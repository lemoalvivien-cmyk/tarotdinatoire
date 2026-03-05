import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NarrativeMemory } from '@/hooks/useNarrativeEngine';
import { MysticButton } from '@/components/mystic';
import { RefreshCw, Loader2, BookOpen, Sparkles } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NarrativeMemoryProps {
  narrative: NarrativeMemory | null;
  isLoading: boolean;
  isGenerating: boolean;
  onGenerate: (force?: boolean) => void;
}

const DIRECTION_LABELS = {
  ascending:  { label: 'En progression ↑', color: 'text-emerald-400' },
  descending: { label: 'Période de défi ↓', color: 'text-amber-400' },
  stable:     { label: 'Énergie stable →', color: 'text-blue-400' },
  mixed:      { label: 'Évolution contrastée ~', color: 'text-purple-400' },
};

// Typewriter rendering — splits text into sentences to stagger
function NarrativeParagraphs({ text }: { text: string }) {
  const paragraphs = text.split('\n').filter(Boolean);
  return (
    <div className="space-y-4">
      {paragraphs.map((para, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.18, duration: 0.5 }}
          className="text-sm leading-relaxed text-foreground/85"
        >
          {para}
        </motion.p>
      ))}
    </div>
  );
}

export function NarrativeMemoryCard({ narrative, isLoading, isGenerating, onGenerate }: NarrativeMemoryProps) {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div
        className="rounded-2xl p-6 animate-pulse"
        style={{ background: 'hsl(var(--card) / 0.5)', border: '1px solid hsl(var(--border))' }}
      >
        <div className="h-4 bg-muted rounded w-2/3 mb-3" />
        <div className="h-3 bg-muted rounded w-full mb-2" />
        <div className="h-3 bg-muted rounded w-5/6" />
      </div>
    );
  }

  if (!narrative) {
    return (
      <div
        className="rounded-2xl p-8 text-center space-y-4"
        style={{
          background: 'hsl(var(--primary) / 0.05)',
          border: '1px dashed hsl(var(--primary) / 0.3)',
        }}
      >
        <div className="text-4xl">🔮</div>
        <div className="space-y-2">
          <p className="font-serif text-base font-medium text-foreground">
            Votre récit vous attend
          </p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            L'oracle analysera vos tirages passés et révèlera les patterns de votre voyage intérieur.
          </p>
        </div>
        <MysticButton
          onClick={() => onGenerate(true)}
          disabled={isGenerating}
        >
          {isGenerating
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyse en cours…</>
            : <><Sparkles className="h-4 w-4 mr-2" />Révéler mon récit</>
          }
        </MysticButton>
      </div>
    );
  }

  const direction = narrative.emotional_direction ?? 'stable';
  const dirInfo = DIRECTION_LABELS[direction] ?? DIRECTION_LABELS.stable;
  const patternData = narrative.pattern_data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid hsl(var(--primary) / 0.25)' }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ background: 'hsl(var(--primary) / 0.1)' }}
      >
        <div className="flex items-center gap-3">
          <BookOpen className="h-4 w-4 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
          <div>
            <p className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
              Votre récit
            </p>
            {narrative.time_range_start && (
              <p className="text-[10px] text-muted-foreground">
                {format(parseISO(narrative.time_range_start), 'd MMM', { locale: fr })}
                {' → '}
                {narrative.time_range_end
                  ? format(parseISO(narrative.time_range_end), 'd MMM yyyy', { locale: fr })
                  : 'aujourd\'hui'}
                {' · '}
                {narrative.reading_count} tirage{narrative.reading_count > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        <span className={`text-[11px] font-medium ${dirInfo.color}`}>
          {dirInfo.label}
        </span>
      </div>

      {/* Narrative text */}
      <div
        className="px-5 py-5"
        style={{ background: 'hsl(var(--card) / 0.6)' }}
      >
        <AnimatePresence mode="wait">
          <NarrativeParagraphs key={narrative.id} text={narrative.summary} />
        </AnimatePresence>

        {/* Key cards mentioned */}
        {narrative.key_cards?.length > 0 && (
          <div className="mt-5 pt-4" style={{ borderTop: '1px solid hsl(var(--border))' }}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Cartes du voyage
            </p>
            <div className="flex flex-wrap gap-2">
              {narrative.key_cards.slice(0, 5).map(kc => (
                <div
                  key={kc.card_id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs"
                  style={{
                    background: 'hsl(var(--primary) / 0.12)',
                    border: '1px solid hsl(var(--primary) / 0.3)',
                    color: 'hsl(var(--foreground) / 0.85)',
                  }}
                >
                  <span className="font-medium" style={{ color: 'hsl(var(--primary))' }}>
                    ×{kc.count}
                  </span>
                  {kc.card_name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Themes */}
        {narrative.themes?.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              Thèmes récurrents
            </p>
            <div className="flex flex-wrap gap-1.5">
              {narrative.themes.slice(0, 6).map(theme => (
                <span
                  key={theme}
                  className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                  style={{
                    background: 'hsl(var(--secondary) / 0.3)',
                    color: 'hsl(var(--foreground) / 0.7)',
                  }}
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Expanded stats */}
        <AnimatePresence>
          {expanded && patternData && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="grid grid-cols-3 gap-3 pt-4" style={{ borderTop: '1px solid hsl(var(--border))' }}>
                <div className="text-center">
                  <p className="text-lg font-serif font-bold" style={{ color: 'hsl(var(--primary))' }}>
                    {patternData.streak ?? 0}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Série active</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-serif font-bold" style={{ color: 'hsl(var(--primary))' }}>
                    {patternData.avg_energy ?? 5}/10
                  </p>
                  <p className="text-[10px] text-muted-foreground">Énergie moy.</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-serif font-bold" style={{ color: 'hsl(var(--primary))' }}>
                    {(patternData.orientation_split?.reversed ?? 0) > (patternData.orientation_split?.upright ?? 0)
                      ? '↓ Int.'
                      : '↑ Ext.'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Orientation</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-3"
             style={{ borderTop: '1px solid hsl(var(--border))' }}>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? 'Réduire ▲' : 'Voir les détails ▼'}
          </button>
          <button
            onClick={() => onGenerate(true)}
            disabled={isGenerating}
            className="flex items-center gap-1.5 text-[11px] transition-colors"
            style={{ color: 'hsl(var(--primary))' }}
          >
            {isGenerating
              ? <><Loader2 className="h-3 w-3 animate-spin" />Analyse…</>
              : <><RefreshCw className="h-3 w-3" />Actualiser</>
            }
          </button>
        </div>
      </div>
    </motion.div>
  );
}
