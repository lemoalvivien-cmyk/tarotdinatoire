import { motion } from 'framer-motion';
import { LEVEL_META } from '@/hooks/useKarma';

interface LevelBadgeProps {
  level: number;
  levelName: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  animated?: boolean;
  className?: string;
}

const SIZE = {
  sm: { outer: 'w-8 h-8 text-base',     text: 'text-xs' },
  md: { outer: 'w-12 h-12 text-2xl',    text: 'text-sm' },
  lg: { outer: 'w-16 h-16 text-3xl',    text: 'text-base' },
};

export function LevelBadge({
  level,
  levelName,
  size = 'md',
  showName = false,
  animated = false,
  className = '',
}: LevelBadgeProps) {
  const meta = LEVEL_META[level] ?? LEVEL_META[1];
  const s = SIZE[size];

  const badge = (
    <div
      className={`${s.outer} rounded-full flex items-center justify-center shrink-0 ${className}`}
      style={{
        background: `${meta.color}22`,
        border: `2px solid ${meta.color}66`,
        boxShadow: `0 0 12px ${meta.color}33`,
      }}
    >
      <span role="img" aria-label={levelName}>{meta.icon}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      {animated ? (
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          {badge}
        </motion.div>
      ) : badge}

      {showName && (
        <div className="flex flex-col leading-tight">
          <span
            className={`font-serif font-semibold ${s.text}`}
            style={{ color: meta.color }}
          >
            {levelName}
          </span>
          <span className="text-xs text-muted-foreground">Niveau {level}</span>
        </div>
      )}
    </div>
  );
}
