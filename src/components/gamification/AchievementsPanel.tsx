import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useKarma, ACHIEVEMENT_META } from '@/hooks/useKarma';

interface AchievementsPanelProps {
  className?: string;
}

const ALL_ACHIEVEMENT_KEYS = Object.keys(ACHIEVEMENT_META);

export function AchievementsPanel({ className = '' }: AchievementsPanelProps) {
  const { karma, isLoading } = useKarma();

  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  const earned = new Set(karma?.achievements?.map(a => a.key) ?? []);
  const earnedCount = earned.size;
  const totalCount = ALL_ACHIEVEMENT_KEYS.length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-sm font-semibold text-foreground">
          Succès
        </h3>
        <span className="text-xs text-muted-foreground tabular-nums">
          {earnedCount}/{totalCount}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {ALL_ACHIEVEMENT_KEYS.map((key, i) => {
          const meta = ACHIEVEMENT_META[key];
          const isEarned = earned.has(key);
          const earnedData = karma?.achievements.find(a => a.key === key);

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="relative rounded-xl p-3 flex items-start gap-3"
              style={{
                background: isEarned
                  ? 'hsl(var(--primary) / 0.08)'
                  : 'hsl(var(--muted) / 0.25)',
                border: `1px solid ${isEarned ? 'hsl(var(--primary) / 0.35)' : 'hsl(var(--border) / 0.5)'}`,
                opacity: isEarned ? 1 : 0.55,
              }}
            >
              {/* Icon */}
              <div
                className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xl"
                style={{
                  background: isEarned
                    ? 'hsl(var(--primary) / 0.15)'
                    : 'hsl(var(--muted) / 0.4)',
                }}
              >
                {isEarned ? meta.icon : <Lock className="h-4 w-4 text-muted-foreground" />}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-semibold leading-tight truncate"
                  style={{ color: isEarned ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
                >
                  {meta.label}
                </p>
                <p className="text-xs text-muted-foreground leading-snug line-clamp-2 mt-0.5">
                  {meta.description}
                </p>
                {isEarned && (
                  <p className="text-xs mt-1 font-medium" style={{ color: 'hsl(var(--primary))' }}>
                    +{earnedData?.xp_reward ?? meta.xp} XP
                  </p>
                )}
              </div>

              {/* Earned sparkle */}
              {isEarned && (
                <div
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse"
                  style={{ background: 'hsl(var(--primary))' }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {earnedCount === 0 && (
        <p className="text-center text-xs text-muted-foreground py-2">
          Commencez votre premier tirage pour débloquer des succès ✦
        </p>
      )}
    </div>
  );
}
