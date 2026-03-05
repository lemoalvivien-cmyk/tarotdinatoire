import { motion } from 'framer-motion';
import { Zap, Flame, TrendingUp } from 'lucide-react';
import { useKarma, LEVEL_META } from '@/hooks/useKarma';
import { LevelBadge } from './LevelBadge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';

interface KarmaWidgetProps {
  compact?: boolean;
  className?: string;
}

export function KarmaWidget({ compact = false, className = '' }: KarmaWidgetProps) {
  const { karma, isLoading } = useKarma();

  if (isLoading) {
    return (
      <div
        className={`rounded-2xl p-4 animate-pulse ${className}`}
        style={{ background: 'hsl(var(--card) / 0.6)', border: '1px solid hsl(var(--border))' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted/50" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted/50 rounded w-24" />
            <div className="h-2 bg-muted/50 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!karma) return null;

  const meta = LEVEL_META[karma.level] ?? LEVEL_META[1];
  const isMaxLevel = karma.level === 4;

  if (compact) {
    return (
      <Link to="/app/profile" className="block">
        <div
          className={`flex items-center gap-2 rounded-xl px-3 py-2 transition-all hover:scale-105 ${className}`}
          style={{
            background: `${meta.color}15`,
            border: `1px solid ${meta.color}40`,
          }}
        >
          <LevelBadge level={karma.level} levelName={karma.level_name} size="sm" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold" style={{ color: meta.color }}>
              {karma.level_name}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {karma.xp} XP
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-5 space-y-4 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${meta.color}12, ${meta.color}06)`,
        border: `1px solid ${meta.color}35`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <LevelBadge
          level={karma.level}
          levelName={karma.level_name}
          size="lg"
          showName
          animated
        />

        {/* XP pill */}
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{
            background: `${meta.color}20`,
            border: `1px solid ${meta.color}50`,
          }}
        >
          <Zap className="h-3.5 w-3.5" style={{ color: meta.color }} />
          <span className="text-sm font-bold tabular-nums" style={{ color: meta.color }}>
            {karma.xp} XP
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {!isMaxLevel && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progression vers le niveau suivant</span>
            <span className="tabular-nums">{karma.progress_pct}%</span>
          </div>
          <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted) / 0.5)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${meta.color}, ${meta.color}cc)` }}
              initial={{ width: 0 }}
              animate={{ width: `${karma.progress_pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {meta.description}
          </p>
        </div>
      )}

      {isMaxLevel && (
        <p className="text-xs font-medium text-center py-1" style={{ color: meta.color }}>
          ✦ Niveau maximum atteint — Vous êtes Oracle ✦
        </p>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 pt-1">
        {[
          { icon: <Flame className="h-3.5 w-3.5" />, value: karma.streak, label: 'Série' },
          { icon: <TrendingUp className="h-3.5 w-3.5" />, value: karma.total_readings, label: 'Tirages' },
          { icon: <Zap className="h-3.5 w-3.5" />, value: karma.total_daily_draws, label: 'Rituels' },
        ].map(({ icon, value, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 p-2.5 rounded-xl"
            style={{ background: 'hsl(var(--background) / 0.5)', border: '1px solid hsl(var(--border) / 0.5)' }}
          >
            <div className="text-muted-foreground">{icon}</div>
            <span className="text-base font-bold tabular-nums text-foreground">{value}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
