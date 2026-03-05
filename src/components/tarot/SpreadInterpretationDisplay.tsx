import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Lightbulb, Shield, Info, MapPin,
  ChevronDown, ChevronUp, RefreshCw, AlertTriangle
} from 'lucide-react';
import { normalizeInterpretation, type NormalizedInterpretation } from '@/utils/interpretationNormalizer';
import { useTarotCards } from '@/hooks/useTarotCards';
import { Button } from '@/components/ui/button';

// ─── Spread-specific colour palettes ────────────────────────────────────────
const SPREAD_PALETTE: Record<string, { from: string; to: string; accent: string }> = {
  three_cards:  { from: 'hsl(var(--primary) / 0.08)',  to: 'hsl(var(--primary) / 0.02)',  accent: 'hsl(var(--primary))' },
  celtic_cross: { from: 'hsl(260 60% 50% / 0.1)',      to: 'hsl(260 60% 50% / 0.02)',     accent: 'hsl(260 60% 55%)' },
  relationship: { from: 'hsl(350 70% 55% / 0.09)',     to: 'hsl(350 70% 55% / 0.02)',     accent: 'hsl(350 70% 55%)' },
  life_path:    { from: 'hsl(45 90% 55% / 0.1)',       to: 'hsl(45 90% 55% / 0.02)',      accent: 'hsl(45 90% 55%)' },
  amour:        { from: 'hsl(330 65% 55% / 0.09)',     to: 'hsl(330 65% 55% / 0.02)',     accent: 'hsl(330 65% 55%)' },
  marseille:    { from: 'hsl(var(--primary) / 0.08)',  to: 'hsl(var(--primary) / 0.02)',  accent: 'hsl(var(--primary))' },
};

const DEFAULT_PALETTE = SPREAD_PALETTE.three_cards;

interface SpreadInterpretationDisplayProps {
  interpretation: unknown;
  spreadId?: string;
  cards?: Array<{ card_id: string; orientation: 'upright' | 'reversed'; position_key: string }>;
  spreadPositions?: Array<{ key: string; label_fr?: string; label: string }>;
  onRetry?: () => void;
  isRetrying?: boolean;
}

// ─── Single position card ────────────────────────────────────────────────────
function PositionCard({
  pos,
  index,
  accent,
  cardImage,
}: {
  pos: NormalizedInterpretation['positionInterpretations'][number];
  index: number;
  accent: string;
  cardImage?: string | null;
}) {
  const [expanded, setExpanded] = useState(index === 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="rounded-2xl overflow-hidden"
      style={{ border: `1px solid ${accent}30` }}
    >
      {/* Header — always visible */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-card/60"
        style={{ background: `${accent}0a` }}
        onClick={() => setExpanded(e => !e)}
      >
        {/* Card thumbnail */}
        <div
          className="w-9 h-12 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
        >
          {cardImage ? (
            <img src={cardImage} alt={pos.cardName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-base">🃏</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: accent }}
            >
              {pos.position}
            </span>
            <span className="text-muted-foreground text-[10px]">•</span>
            <span className="font-serif font-semibold text-foreground text-sm truncate">
              {pos.cardName}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {pos.orientation}
          </p>
        </div>

        <div className="flex-shrink-0 text-muted-foreground">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded message */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className="px-5 pb-5 pt-3"
              style={{ background: 'hsl(var(--card) / 0.5)' }}
            >
              <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">
                {pos.message}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Synthesis section ───────────────────────────────────────────────────────
function SynthesisSection({ text, accent }: { text: string; accent: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl p-6 space-y-4"
      style={{
        background: `linear-gradient(135deg, ${accent}10, ${accent}04)`,
        border: `1px solid ${accent}30`,
      }}
    >
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5" style={{ color: accent }} />
        <h3 className="font-serif text-lg font-semibold text-foreground">Synthèse Globale</h3>
      </div>
      <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">
        {text}
      </p>
    </motion.div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export function SpreadInterpretationDisplay({
  interpretation,
  spreadId = 'three_cards',
  cards = [],
  spreadPositions = [],
  onRetry,
  isRetrying = false,
}: SpreadInterpretationDisplayProps) {
  const data = normalizeInterpretation(interpretation);
  const { data: allCards } = useTarotCards();
  const palette = SPREAD_PALETTE[spreadId] ?? DEFAULT_PALETTE;

  // Build card image map
  const cardImageMap = new Map(
    (allCards ?? []).map(c => [c.id, c.image_url])
  );

  // Match card_id to position
  const cardByPosition = new Map(
    cards.map(c => [c.position_key, c.card_id])
  );

  if (data.hasError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
        <div className="p-4 rounded-full bg-amber-500/10">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-xl font-semibold text-foreground">Interprétation indisponible</h3>
          <p className="text-muted-foreground max-w-md">
            {data.errorMessage || "L'interprétation n'a pas pu être réalisée. Veuillez réessayer."}
          </p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} disabled={isRetrying} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Nouvelle tentative...' : 'Réessayer'}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up">

      {/* Summary banner */}
      {data.summary && data.summary !== 'Les cartes ont été tirées pour vous.' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl px-5 py-4 text-center"
          style={{
            background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
            border: `1px solid ${palette.accent}25`,
          }}
        >
          <p className="text-sm text-foreground/90 leading-relaxed font-medium italic">
            "{data.summary}"
          </p>
        </motion.div>
      )}

      {/* Card-by-card interpretations */}
      {data.positionInterpretations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4" style={{ color: palette.accent }} />
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-foreground/70">
              Lecture carte par carte
            </h3>
          </div>

          {data.positionInterpretations.map((pos, index) => {
            // Find card_id for this position
            const posKey = spreadPositions.find(
              p => (p.label_fr || p.label) === pos.position
            )?.key;
            const cardId = posKey ? cardByPosition.get(posKey) : undefined;
            const cardImage = cardId ? cardImageMap.get(cardId) : undefined;

            return (
              <PositionCard
                key={index}
                pos={pos}
                index={index}
                accent={palette.accent}
                cardImage={cardImage}
              />
            );
          })}
        </div>
      )}

      {/* Global synthesis */}
      {data.general && <SynthesisSection text={data.general} accent={palette.accent} />}

      {/* Actions concrètes */}
      {data.advice.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl p-5 space-y-4"
          style={{ background: 'hsl(var(--card) / 0.6)', border: '1px solid hsl(var(--border))' }}
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" style={{ color: palette.accent }} />
            <h3 className="font-serif text-base font-semibold text-foreground">Actions Concrètes</h3>
          </div>
          <ol className="space-y-2.5">
            {data.advice.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-foreground/85">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                  style={{ background: `${palette.accent}20`, color: palette.accent }}
                >
                  {i + 1}
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ol>
        </motion.div>
      )}

      {/* Ethical note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="rounded-xl p-4"
        style={{ background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border) / 0.5)' }}
      >
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <p className="leading-relaxed">
            {data.safetyMedical || "Ce tirage est un outil d'introspection et ne remplace pas l'avis de professionnels de santé, juridiques ou financiers pour les décisions importantes."}
          </p>
        </div>
      </motion.div>

      {/* Template indicator */}
      {data.isTemplate && (
        <div className="flex items-center gap-2 justify-center text-[10px] text-muted-foreground/50 pt-1">
          <Info className="h-3 w-3" />
          <span>Interprétation basée sur les arcanes traditionnels</span>
        </div>
      )}
    </div>
  );
}
