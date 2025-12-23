import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Shuffle, Scissors } from 'lucide-react';
import { MysticButton } from '@/components/mystic';
import type { TarotCard as TarotCardType } from '@/types/tarot';
import type { RitualPhase } from '@/hooks/useRitualMachine';

interface DeckViewProps {
  phase: RitualPhase;
  isShuffling: boolean;
  isCutting: boolean;
  onShuffle: () => void;
  onCut: () => void;
  onStartSelection: () => void;
}

/**
 * Deck visualization with shuffle/cut animations
 */
export function DeckView({
  phase,
  isShuffling,
  isCutting,
  onShuffle,
  onCut,
  onStartSelection,
}: DeckViewProps) {
  const showShuffle = phase === 'idle' || phase === 'shuffling';
  const showCut = phase === 'shuffled' || phase === 'cutting';
  const showStartSelection = phase === 'cut';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-8"
    >
      {/* Deck visualization */}
      <div className="relative w-48 h-72">
        {/* Stack of cards */}
        {[...Array(7)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 w-36 h-52 rounded-xl shadow-lg"
            style={{
              background: 'linear-gradient(135deg, hsl(260 30% 18%), hsl(260 25% 12%))',
              border: '1px solid hsl(45 80% 60% / 0.2)',
            }}
            initial={{ 
              x: '-50%', 
              y: '-50%', 
              rotate: (i - 3) * 2.5,
              scale: 1 - i * 0.01,
            }}
            animate={
              isShuffling ? {
                x: ['-50%', `${-50 + (i % 2 === 0 ? 25 : -25)}%`, '-50%'],
                y: ['-50%', `${-50 + (i % 3 === 0 ? -15 : 10)}%`, '-50%'],
                rotate: [(i - 3) * 2.5, (i - 3) * 2.5 + (i % 2 === 0 ? 12 : -12), (i - 3) * 2.5],
              } : isCutting ? {
                x: i < 3 ? `${-50 - 30}%` : `${-50 + 30}%`,
                rotate: i < 3 ? -8 : 8,
              } : { 
                x: '-50%', 
                y: '-50%', 
                rotate: (i - 3) * 2.5 
              }
            }
            transition={{
              duration: isShuffling ? 0.35 : 0.4,
              repeat: isShuffling ? Infinity : 0,
              delay: i * 0.04,
              ease: 'easeInOut',
            }}
          >
            {/* Card back pattern */}
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl">
              <div className="absolute inset-2 border border-white/10 rounded-lg" />
              <svg className="w-20 h-20 opacity-30" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="35" stroke="hsl(45 80% 60%)" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="25" stroke="hsl(260 60% 65%)" strokeWidth="0.3" />
                <path 
                  d="M50 10 L55 40 L90 50 L55 60 L50 90 L45 60 L10 50 L45 40 Z" 
                  stroke="hsl(45 80% 60%)" 
                  strokeWidth="0.4" 
                  fill="none"
                />
              </svg>
              <span className="absolute text-3xl text-white/20">✦</span>
            </div>
          </motion.div>
        ))}

        {/* Glow effect */}
        <div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 rounded-xl blur-2xl opacity-30"
          style={{
            background: 'radial-gradient(ellipse, hsl(260 60% 50%), transparent)',
          }}
        />
      </div>

      {/* Instructions and actions */}
      <div className="text-center space-y-4 max-w-sm">
        {showShuffle && (
          <>
            <h3 className="font-serif text-2xl text-white drop-shadow-lg">
              {isShuffling ? 'Le jeu se mélange...' : 'Mélangez le jeu'}
            </h3>
            <p className="text-white/80 text-sm leading-relaxed">
              Concentrez-vous sur votre question pendant que les cartes se mélangent
            </p>
            <MysticButton
              onClick={onShuffle}
              disabled={isShuffling}
              size="lg"
              leftIcon={<Shuffle className="w-5 h-5" />}
              className="w-full max-w-xs"
            >
              {isShuffling ? 'Mélange en cours...' : 'Mélanger le jeu'}
            </MysticButton>
          </>
        )}

        {showCut && (
          <>
            <h3 className="font-serif text-2xl text-white drop-shadow-lg">
              {isCutting ? 'Coupe en cours...' : 'Coupez le jeu'}
            </h3>
            <p className="text-white/80 text-sm leading-relaxed">
              La coupe scelle votre intention dans les cartes
            </p>
            <MysticButton
              onClick={onCut}
              disabled={isCutting}
              size="lg"
              leftIcon={<Scissors className="w-5 h-5" />}
              className="w-full max-w-xs"
            >
              {isCutting ? 'Coupe...' : 'Couper le jeu'}
            </MysticButton>
          </>
        )}

        {showStartSelection && (
          <>
            <h3 className="font-serif text-2xl text-white drop-shadow-lg">
              Le jeu est prêt
            </h3>
            <p className="text-white/80 text-sm leading-relaxed">
              Les cartes vous attendent. Laissez votre intuition vous guider.
            </p>
            <MysticButton
              onClick={onStartSelection}
              size="lg"
              className="w-full max-w-xs"
            >
              Choisir mes cartes
            </MysticButton>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default DeckView;
