import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakCounterProps {
  streak: number;
  className?: string;
}

export function StreakCounter({ streak, className = '' }: StreakCounterProps) {
  const isAlive = streak > 0;

  const flameColor = streak >= 30
    ? 'text-yellow-300'
    : streak >= 14
    ? 'text-orange-400'
    : streak >= 7
    ? 'text-orange-500'
    : 'text-muted-foreground';

  const label = streak === 0
    ? 'Commencez votre série'
    : streak === 1
    ? '1 jour de suite'
    : `${streak} jours de suite`;

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <motion.div
        animate={isAlive ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={{ repeat: isAlive ? Infinity : 0, duration: 2.5, ease: 'easeInOut' }}
        className="relative"
      >
        <Flame
          className={`h-9 w-9 transition-colors duration-500 ${flameColor}`}
          fill={isAlive ? 'currentColor' : 'none'}
        />
        {streak >= 7 && (
          <motion.div
            className="absolute inset-0 rounded-full blur-md opacity-40"
            style={{ background: 'hsl(var(--primary))' }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </motion.div>

      <motion.span
        key={streak}
        initial={{ y: -6, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-3xl font-serif font-bold text-foreground tabular-nums"
      >
        {streak}
      </motion.span>

      <span className="text-xs text-muted-foreground">{label}</span>

      {/* Milestone badges */}
      {streak > 0 && streak % 7 === 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-1 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            background: 'hsl(var(--primary) / 0.15)',
            color: 'hsl(var(--primary))',
            border: '1px solid hsl(var(--primary) / 0.3)',
          }}
        >
          {streak === 7 && '🌙 1 semaine'}
          {streak === 14 && '⭐ 2 semaines'}
          {streak === 21 && '🌟 3 semaines'}
          {streak === 30 && '✨ 1 mois — Oracle confirmé'}
          {streak > 30 && `🔮 ${streak} jours`}
        </motion.div>
      )}
    </div>
  );
}
