import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface RitualStep {
  id: string;
  label: string;
  shortLabel?: string;
}

interface RitualStepperProps {
  steps: RitualStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

const defaultSteps: RitualStep[] = [
  { id: 'intention', label: 'Intention', shortLabel: '1' },
  { id: 'question', label: 'Question', shortLabel: '2' },
  { id: 'spread', label: 'Tirage', shortLabel: '3' },
  { id: 'ritual', label: 'Rituel', shortLabel: '4' },
  { id: 'selection', label: 'Sélection', shortLabel: '5' },
  { id: 'reading', label: 'Lecture', shortLabel: '6' },
];

/**
 * Premium stepper for ritual flow
 */
export function RitualStepper({
  steps = defaultSteps,
  currentStep,
  onStepClick,
  className,
}: RitualStepperProps) {
  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      {/* Desktop stepper */}
      <div className="hidden sm:flex items-center justify-between relative">
        {/* Progress line background */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/10" />
        
        {/* Progress line active */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5"
          style={{
            background: 'linear-gradient(90deg, hsl(260 60% 55%), hsl(45 80% 55%))',
          }}
          initial={{ width: '0%' }}
          animate={{ 
            width: `${((currentStep) / (steps.length - 1)) * 100}%` 
          }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
        
        {/* Steps */}
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isPending = index > currentStep;
          
          return (
            <button
              key={step.id}
              className={cn(
                'relative z-10 flex flex-col items-center gap-2',
                'transition-all duration-200',
                onStepClick && isCompleted && 'cursor-pointer',
                !onStepClick && 'cursor-default',
              )}
              onClick={() => isCompleted && onStepClick?.(index)}
              disabled={!isCompleted || !onStepClick}
            >
              {/* Circle */}
              <motion.div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  'border-2 transition-colors duration-200',
                  isCompleted && 'bg-gradient-to-br from-violet-500 to-amber-400 border-transparent',
                  isActive && 'bg-white/10 border-yellow-400 shadow-lg shadow-yellow-400/30',
                  isPending && 'bg-white/5 border-white/20',
                )}
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <span className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-yellow-300' : 'text-white/50'
                  )}>
                    {index + 1}
                  </span>
                )}
              </motion.div>
              
              {/* Label */}
              <span className={cn(
                'text-xs font-medium transition-colors duration-200',
                isActive && 'text-white',
                isCompleted && 'text-white/70',
                isPending && 'text-white/40',
              )}>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Mobile stepper - compact */}
      <div className="sm:hidden flex items-center justify-center gap-2">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div
              key={step.id}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                isActive && 'w-8 bg-gradient-to-r from-violet-400 to-amber-400',
                isCompleted && 'w-4 bg-violet-400/60',
                index > currentStep && 'w-2 bg-white/20',
              )}
            />
          );
        })}
      </div>
      
      {/* Mobile current step label */}
      <div className="sm:hidden text-center mt-3">
        <span className="text-white/90 text-sm font-medium">
          Étape {currentStep + 1} : {steps[currentStep]?.label}
        </span>
      </div>
    </div>
  );
}

export default RitualStepper;
