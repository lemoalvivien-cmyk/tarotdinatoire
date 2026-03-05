/**
 * RitualStepUI — Atomic sub-components for the NewReading ritual flow.
 * Extracted from NewReading.tsx to keep that file < 200 lines of render logic.
 */
import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import {
  Shuffle, Scissors, Wand2, ArrowLeft,
  Compass, Heart, Target, Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MysticButton } from '@/components/mystic';
import { AnimatedDeck } from '@/components/tarot/AnimatedDeck';
import type { TarotCard } from '@/types/tarot';

// ─── StepContainer ────────────────────────────────────────────────────────────
export function StepContainer({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  );
}

// ─── StepTitle ────────────────────────────────────────────────────────────────
export function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center space-y-2">
      <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-white drop-shadow-lg">
        {title}
      </h1>
      {subtitle && (
        <p className="text-white/80 text-sm sm:text-base drop-shadow-md">{subtitle}</p>
      )}
    </div>
  );
}

// ─── IntentionGrid ────────────────────────────────────────────────────────────
const INTENTIONS = [
  { id: 'guidance', label: 'Guidance générale', icon: Compass, description: 'Un éclairage sur ma situation' },
  { id: 'love',     label: 'Amour',              icon: Heart,   description: 'Relations, sentiments' },
  { id: 'career',   label: 'Carrière',           icon: Target,  description: 'Travail, projets' },
  { id: 'personal', label: 'Développement',      icon: Star,    description: 'Croissance personnelle' },
];

export { INTENTIONS };

export function IntentionGrid({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
      {INTENTIONS.map((intent) => (
        <button
          key={intent.id}
          onClick={() => onSelect(intent.id)}
          className={cn(
            'p-4 sm:p-6 rounded-2xl text-left transition-all duration-200',
            'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400',
            selected === intent.id && 'ring-2 ring-yellow-400 bg-yellow-400/10',
          )}
        >
          <intent.icon className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 mb-2 sm:mb-3" />
          <h3 className="font-medium text-white text-sm sm:text-base">{intent.label}</h3>
          <p className="text-white/60 text-xs sm:text-sm mt-1">{intent.description}</p>
        </button>
      ))}
    </div>
  );
}

// ─── RitualPhase ──────────────────────────────────────────────────────────────
interface RitualPhaseProps {
  phase: string;
  onShuffle: () => void;
  onCut: () => void;
  onStartSelection: () => void;
  shuffledDeck: TarotCard[];
  cardsRequired: number;
  goBack: () => void;
}

export function RitualPhase({
  phase,
  onShuffle,
  onCut,
  onStartSelection,
  shuffledDeck,
  cardsRequired,
  goBack,
}: RitualPhaseProps) {
  const isShuffling = phase === 'shuffling';
  const isCutting   = phase === 'cutting';
  const showShuffle = phase === 'idle' || phase === 'shuffling';
  const showCut     = phase === 'shuffled' || phase === 'cutting';
  const showStart   = phase === 'cut';

  return (
    <div className="space-y-8">
      <StepTitle
        title={
          showShuffle ? (isShuffling ? 'Le jeu se mélange...' : 'Mélangez le jeu') :
          showCut     ? (isCutting  ? 'Coupe en cours...'    : 'Coupez le jeu')   :
          'Le jeu est prêt'
        }
        subtitle={
          showShuffle ? 'Concentrez-vous sur votre question' :
          showCut     ? 'La coupe scelle votre intention'    :
          'Choisissez vos cartes'
        }
      />

      <AnimatedDeck
        cards={shuffledDeck}
        phase={phase as 'idle' | 'shuffling' | 'shuffled' | 'cutting' | 'cut' | 'selecting' | 'ready'}
        selectedCardIds={[]}
        maxCards={cardsRequired}
      />

      <div className="flex flex-col items-center gap-4">
        {showShuffle && (
          <MysticButton size="lg" onClick={onShuffle} disabled={isShuffling}
            leftIcon={<Shuffle className="w-5 h-5" />}>
            {isShuffling ? 'Mélange...' : 'Mélanger le jeu'}
          </MysticButton>
        )}
        {showCut && (
          <MysticButton size="lg" onClick={onCut} disabled={isCutting}
            leftIcon={<Scissors className="w-5 h-5" />}>
            {isCutting ? 'Coupe...' : 'Couper le jeu'}
          </MysticButton>
        )}
        {showStart && (
          <MysticButton size="lg" onClick={onStartSelection}
            leftIcon={<Wand2 className="w-5 h-5" />}>
            Choisir mes cartes
          </MysticButton>
        )}
        <MysticButton variant="ghost" size="sm" onClick={goBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </MysticButton>
      </div>
    </div>
  );
}
