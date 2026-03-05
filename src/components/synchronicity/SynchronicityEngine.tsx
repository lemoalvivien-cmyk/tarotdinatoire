import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, RefreshCw, Loader2, Sparkles, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSynchronicity, type SynchronicityInsight } from '@/hooks/useSynchronicity';
import { useTarotCards } from '@/hooks/useTarotCards';

// ─── Intensity colours using design tokens ────────────────────────────────────
const INTENSITY_STYLES: Record<string, { bg: string; border: string; dot: string }> = {
  low:    { bg: 'hsl(var(--muted) / 0.5)',      border: 'hsl(var(--border))',            dot: 'hsl(var(--muted-foreground))' },
  medium: { bg: 'hsl(var(--primary) / 0.07)',   border: 'hsl(var(--primary) / 0.25)',    dot: 'hsl(var(--primary))' },
  high:   { bg: 'hsl(var(--primary) / 0.13)',   border: 'hsl(var(--primary) / 0.45)',    dot: 'hsl(var(--primary))' },
};

function InsightCard({ insight, index, cardMap }: {
  insight: SynchronicityInsight;
  index: number;
  cardMap: Map<string, { nom_fr: string; image_url: string | null }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const style = INTENSITY_STYLES[insight.intensity] ?? INTENSITY_STYLES.low;
  const relatedCards = insight.card_ids
    .map(id => cardMap.get(id))
    .filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="rounded-xl p-4 cursor-pointer select-none"
      style={{ background: style.bg, border: `1px solid ${style.border}` }}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="flex items-start gap-3">
        {/* Intensity dot */}
        <div className="mt-1 flex-shrink-0 flex flex-col items-center gap-1">
          <span className="text-xl leading-none">{insight.icon}</span>
          <div
            className="w-1.5 h-1.5 rounded-full mt-1"
            style={{ background: style.dot }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground leading-tight mb-0.5">
            {insight.title}
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {insight.body}
          </p>

          <AnimatePresence>
            {expanded && relatedCards.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 mt-3 flex-wrap">
                  {relatedCards.map((card, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
                      style={{ background: 'hsl(var(--background) / 0.7)', border: '1px solid hsl(var(--border))' }}
                    >
                      {card?.image_url && (
                        <img
                          src={card.image_url}
                          alt={card?.nom_fr}
                          className="w-4 h-5 object-cover rounded-sm"
                        />
                      )}
                      <span className="text-foreground/80">{card?.nom_fr}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {relatedCards.length > 0 && (
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-1 text-muted-foreground/50" />
        )}
      </div>
    </motion.div>
  );
}

// ─── Stats row ─────────────────────────────────────────────────────────────────
function PatternStats({ patterns }: { patterns: NonNullable<ReturnType<typeof useSynchronicity>['result']>['patterns'] }) {
  const stats = [
    { label: 'Cartes récurrentes', value: patterns.recurring_cards?.length ?? 0 },
    { label: 'Ce mois-ci',         value: patterns.this_month?.length ?? 0 },
    { label: 'Combinaisons',       value: patterns.combinations?.length ?? 0 },
    { label: 'Patterns numériques',value: patterns.number_patterns?.length ?? 0 },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map(s => (
        <div
          key={s.label}
          className="rounded-lg px-3 py-2 text-center"
          style={{ background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border))' }}
        >
          <p className="text-xl font-serif font-bold" style={{ color: 'hsl(var(--primary))' }}>
            {s.value}
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function SynchronicityEngine() {
  const { result, isLoading, isGenerating, generateInsights, hasInsights } = useSynchronicity();
  const { data: allCards } = useTarotCards();

  const cardMap = new Map(
    (allCards ?? []).map(c => [c.id, { nom_fr: c.nom_fr, image_url: c.image_url }])
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm animate-pulse">Analyse des synchronicités…</p>
      </div>
    );
  }

  if (!hasInsights) {
    return (
      <div
        className="rounded-2xl p-8 text-center space-y-5"
        style={{ background: 'hsl(var(--card) / 0.5)', border: '1px solid hsl(var(--border))' }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
          style={{ background: 'hsl(var(--primary) / 0.1)' }}
        >
          <Zap className="h-7 w-7" style={{ color: 'hsl(var(--primary))' }} />
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-lg font-semibold text-foreground">
            Moteur de Synchronicité
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Détectez les cartes récurrentes, les nombres qui se répètent et les combinaisons mystérieuses entre vos tirages.
          </p>
        </div>
        <Button
          onClick={() => generateInsights(true)}
          disabled={isGenerating}
          className="gap-2"
        >
          {isGenerating ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Analyse en cours…</>
          ) : (
            <><Zap className="h-4 w-4" /> Révéler les synchronicités</>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
          <h3 className="font-serif text-base font-semibold text-foreground">
            Synchronicités détectées
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {result?.total_readings ?? 0} tirages analysés
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => generateInsights(true)}
            disabled={isGenerating}
            title="Régénérer"
          >
            {isGenerating
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <RefreshCw className="h-3.5 w-3.5" />
            }
          </Button>
        </div>
      </div>

      {/* Pattern stats */}
      {result?.patterns && <PatternStats patterns={result.patterns} />}

      {/* Insights list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {(result?.insights ?? []).map((insight, i) => (
            <InsightCard
              key={`${insight.type}-${i}`}
              insight={insight}
              index={i}
              cardMap={cardMap}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 pt-1">
        <Sparkles className="h-3 w-3" />
        <span>Cliquez sur une synchronicité pour voir les cartes associées.</span>
      </div>
    </div>
  );
}
