import { motion } from 'framer-motion';
import { Shuffle, Scissors, Hand, Sparkles, Check } from 'lucide-react';
import { MysticButton } from '@/components/mystic';
import type { RitualPhase } from '@/hooks/useRitualMachine';
import { cn } from '@/lib/utils';

interface RitualStepIndicatorProps {
  phase: RitualPhase;
}

const steps = [
  { phase: 'shuffling', label: 'Mélange', icon: Shuffle },
  { phase: 'cutting', label: 'Coupe', icon: Scissors },
  { phase: 'selecting', label: 'Sélection', icon: Hand },
  { phase: 'ready', label: 'Validation', icon: Check },
] as const;

function getStepState(stepPhase: string, currentPhase: RitualPhase): 'completed' | 'active' | 'pending' {
  const phaseOrder: RitualPhase[] = ['idle', 'shuffling', 'shuffled', 'cutting', 'cut', 'selecting', 'ready', 'interpreting', 'done'];
  const currentIndex = phaseOrder.indexOf(currentPhase);
  
  const stepPhaseMapping: Record<string, number> = {
    'shuffling': phaseOrder.indexOf('shuffling'),
    'cutting': phaseOrder.indexOf('cutting'),
    'selecting': phaseOrder.indexOf('selecting'),
    'ready': phaseOrder.indexOf('ready'),
  };
  
  const stepIndex = stepPhaseMapping[stepPhase];
  
  if (currentIndex > stepIndex + 1) return 'completed';
  if (stepPhase === 'shuffling' && (currentPhase === 'shuffling' || currentPhase === 'shuffled')) return 'active';
  if (stepPhase === 'cutting' && (currentPhase === 'cutting' || currentPhase === 'cut')) return 'active';
  if (stepPhase === 'selecting' && currentPhase === 'selecting') return 'active';
  if (stepPhase === 'ready' && currentPhase === 'ready') return 'active';
  if (currentIndex >= stepIndex) return 'completed';
  
  return 'pending';
}

export function RitualStepIndicator({ phase }: RitualStepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4">
      {steps.map((step, index) => {
        const state = getStepState(step.phase, phase);
        const Icon = step.icon;
        
        return (
          <div key={step.phase} className="flex items-center gap-2 sm:gap-4">
            <motion.div
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300',
                state === 'completed' && 'bg-mp-brand-gold/20 text-mp-brand-gold',
                state === 'active' && 'bg-mp-brand-violet/20 text-mp-brand-violet ring-2 ring-mp-brand-violet/40',
                state === 'pending' && 'bg-mp-surface-glass text-muted-foreground',
              )}
              initial={{ scale: 0.9, opacity: 0.5 }}
              animate={{ 
                scale: state === 'active' ? 1.05 : 1, 
                opacity: state === 'pending' ? 0.5 : 1 
              }}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">{step.label}</span>
            </motion.div>
            {index < steps.length - 1 && (
              <div 
                className={cn(
                  'w-6 sm:w-12 h-0.5 rounded-full transition-colors duration-300',
                  state === 'completed' ? 'bg-mp-brand-gold/40' : 'bg-mp-surface-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface ShufflePhaseProps {
  isShuffling: boolean;
  onShuffle: () => void;
}

export function ShufflePhase({ isShuffling, onShuffle }: ShufflePhaseProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center gap-8"
    >
      {/* Animated deck */}
      <div className="relative w-40 h-60">
        {[...Array(7)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 w-32 h-48 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--mp-bg-700)), hsl(var(--mp-bg-900)))',
              border: '1px solid hsl(var(--mp-surface-border))',
            }}
            initial={{ x: '-50%', y: '-50%', rotate: (i - 3) * 3 }}
            animate={isShuffling ? {
              x: ['-50%', `${-50 + (i % 2 === 0 ? 20 : -20)}%`, '-50%'],
              y: ['-50%', `${-50 + Math.sin(i) * 10}%`, '-50%'],
              rotate: [(i - 3) * 3, (i - 3) * 3 + (i % 2 === 0 ? 10 : -10), (i - 3) * 3],
            } : { x: '-50%', y: '-50%', rotate: (i - 3) * 3 }}
            transition={{
              duration: 0.4,
              repeat: isShuffling ? Infinity : 0,
              delay: i * 0.05,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl opacity-20">✦</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center space-y-4">
        <h3 className="font-serif text-2xl text-foreground">
          {isShuffling ? 'Mélange en cours...' : 'Mélangez le jeu'}
        </h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          Concentrez-vous sur votre question pendant que les cartes se mélangent
        </p>
      </div>

      <MysticButton
        onClick={onShuffle}
        disabled={isShuffling}
        size="lg"
        leftIcon={<Shuffle className="w-5 h-5" />}
      >
        {isShuffling ? 'Mélange...' : 'Mélanger le jeu'}
      </MysticButton>
    </motion.div>
  );
}

interface CutPhaseProps {
  isCutting: boolean;
  onCut: () => void;
}

export function CutPhase({ isCutting, onCut }: CutPhaseProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center gap-8"
    >
      {/* Cut animation */}
      <div className="relative w-48 h-60 flex justify-center">
        <motion.div
          className="absolute w-32 h-48 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--mp-bg-700)), hsl(var(--mp-bg-900)))',
            border: '1px solid hsl(var(--mp-surface-border))',
          }}
          animate={isCutting ? { x: -30, rotate: -5 } : { x: 0, rotate: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl opacity-20">✦</span>
          </div>
        </motion.div>
        <motion.div
          className="absolute w-32 h-48 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--mp-bg-700)), hsl(var(--mp-bg-900)))',
            border: '1px solid hsl(var(--mp-surface-border))',
          }}
          animate={isCutting ? { x: 30, rotate: 5 } : { x: 0, rotate: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl opacity-20">✦</span>
          </div>
        </motion.div>
      </div>

      <div className="text-center space-y-4">
        <h3 className="font-serif text-2xl text-foreground">
          {isCutting ? 'Coupe...' : 'Coupez le jeu'}
        </h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          Coupez le jeu pour sceller votre intention
        </p>
      </div>

      <MysticButton
        onClick={onCut}
        disabled={isCutting}
        size="lg"
        leftIcon={<Scissors className="w-5 h-5" />}
      >
        {isCutting ? 'Coupe...' : 'Couper le jeu'}
      </MysticButton>
    </motion.div>
  );
}

interface SelectionHeaderProps {
  currentPosition: string | null;
  selectedCount: number;
  totalRequired: number;
}

export function SelectionHeader({ currentPosition, selectedCount, totalRequired }: SelectionHeaderProps) {
  const isComplete = selectedCount >= totalRequired;
  
  return (
    <div className="text-center space-y-4">
      <h3 className="font-serif text-2xl text-foreground">
        {isComplete ? 'Sélection complète' : 'Choisissez vos cartes'}
      </h3>
      {currentPosition && !isComplete && (
        <motion.p
          key={currentPosition}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-mp-brand-violet text-lg font-medium"
        >
          Position : {currentPosition}
        </motion.p>
      )}
      <p className="text-muted-foreground text-sm">
        {isComplete 
          ? 'Validez votre tirage pour recevoir l\'interprétation' 
          : 'Sélectionnez les cartes qui vous attirent'
        }
      </p>
    </div>
  );
}

interface ValidateButtonProps {
  canValidate: boolean;
  onClick: () => void;
  selectedCount: number;
  totalRequired: number;
}

export function ValidateButton({ canValidate, onClick, selectedCount, totalRequired }: ValidateButtonProps) {
  return (
    <MysticButton
      onClick={onClick}
      disabled={!canValidate}
      size="lg"
      className="w-full max-w-md"
      leftIcon={canValidate ? <Sparkles className="w-5 h-5" /> : undefined}
    >
      {canValidate 
        ? 'Valider et recevoir l\'interprétation' 
        : `Sélectionnez ${totalRequired - selectedCount} carte${totalRequired - selectedCount > 1 ? 's' : ''} de plus`
      }
    </MysticButton>
  );
}
