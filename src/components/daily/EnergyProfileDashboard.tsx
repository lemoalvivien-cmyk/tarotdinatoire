import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip, CartesianGrid,
} from 'recharts';
import { Heart, Users, Briefcase, Eye, Zap, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useEnergyProfile, type EnergyDimensions } from '@/hooks/useEnergyProfile';

// ─── Dimension metadata ────────────────────────────────────────────────────
const DIMENSIONS: Array<{
  key: keyof EnergyDimensions;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
}> = [
  { key: 'emotionnel', label: 'Émotionnel',  icon: Heart,     color: 'hsl(var(--chart-1, 350 80% 60%))', description: 'Votre état intérieur et résonance émotionnelle' },
  { key: 'relations',  label: 'Relations',   icon: Users,     color: 'hsl(var(--chart-2, 220 70% 60%))', description: 'Qualité de vos liens et dynamiques relationnelles' },
  { key: 'carriere',   label: 'Carrière',    icon: Briefcase, color: 'hsl(var(--chart-3, 160 60% 50%))', description: 'Élan professionnel, projets et ambitions' },
  { key: 'clarte',     label: 'Clarté',      icon: Eye,       color: 'hsl(var(--chart-4, 45 90% 55%))',  description: 'Lucidité mentale et guidance intuitive' },
  { key: 'vitalite',   label: 'Vitalité',    icon: Zap,       color: 'hsl(var(--chart-5, 280 70% 60%))', description: 'Énergie de vie, enthousiasme et force' },
];

// ─── Score label helpers ─────────────────────────────────────────────────────
function scoreLabel(v: number): string {
  if (v >= 9) return 'Exceptionnel';
  if (v >= 7) return 'Élevé';
  if (v >= 5) return 'Équilibré';
  if (v >= 3) return 'Bas';
  return 'Très bas';
}

function scoreColour(v: number): string {
  if (v >= 8) return 'hsl(160 60% 50%)';
  if (v >= 6) return 'hsl(var(--primary))';
  if (v >= 4) return 'hsl(45 90% 55%)';
  return 'hsl(350 70% 55%)';
}

// ─── Trend indicator ────────────────────────────────────────────────────────
function TrendIndicator({ delta }: { delta: number }) {
  if (delta > 0) return (
    <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'hsl(160 60% 50%)' }}>
      <TrendingUp className="w-3 h-3" />+{delta}
    </span>
  );
  if (delta < 0) return (
    <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'hsl(350 70% 55%)' }}>
      <TrendingDown className="w-3 h-3" />{delta}
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
      <Minus className="w-3 h-3" />0
    </span>
  );
}

// ─── Dimension Card ──────────────────────────────────────────────────────────
function DimensionCard({
  dim, value, trend, index,
}: {
  dim: typeof DIMENSIONS[number];
  value: number;
  trend: number;
  index: number;
}) {
  const Icon = dim.icon;
  const pct  = (value / 10) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'hsl(var(--card) / 0.7)', border: '1px solid hsl(var(--border))' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${dim.color}22` }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: dim.color }} />
          </div>
          <span className="text-sm font-medium text-foreground">{dim.label}</span>
        </div>
        <TrendIndicator delta={trend} />
      </div>

      {/* Score bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-baseline">
          <span className="text-xl font-serif font-bold" style={{ color: scoreColour(value) }}>
            {value}
          </span>
          <span className="text-[10px] text-muted-foreground">{scoreLabel(value)}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-muted">
          <motion.div
            className="h-full rounded-full"
            style={{ background: dim.color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.06 + 0.2 }}
          />
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground leading-tight">{dim.description}</p>
    </motion.div>
  );
}

// ─── Radar chart tooltip ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const RadarTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-xl text-xs shadow-lg"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
    >
      <p className="font-medium">{payload[0]?.payload?.subject}</p>
      <p style={{ color: 'hsl(var(--primary))' }}>{payload[0]?.value}/10 — {scoreLabel(payload[0]?.value)}</p>
    </div>
  );
};

// ─── Line chart tooltip ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LineTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-xl text-xs shadow-lg space-y-1"
      style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
    >
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: { color: string; name: string; value: number }) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}/10</p>
      ))}
    </div>
  );
};

// ─── Insight generator ───────────────────────────────────────────────────────
function generateInsights(averages: EnergyDimensions, trend: EnergyDimensions): string[] {
  const insights: string[] = [];

  const sorted = [...DIMENSIONS].sort((a, b) => averages[b.key] - averages[a.key]);
  const strongest = sorted[0];
  const weakest   = sorted[sorted.length - 1];

  if (averages[strongest.key] >= 7) {
    insights.push(`✨ Votre dimension ${strongest.label} rayonne (${averages[strongest.key]}/10) — c'est votre ancre du moment.`);
  }
  if (averages[weakest.key] <= 4) {
    insights.push(`🌙 Votre ${weakest.label} appelle de l'attention (${averages[weakest.key]}/10) — un espace de croissance s'ouvre.`);
  }

  // Trend insights
  const risingDims = DIMENSIONS.filter(d => (trend[d.key] ?? 0) >= 2);
  const fallingDims = DIMENSIONS.filter(d => (trend[d.key] ?? 0) <= -2);

  if (risingDims.length > 0) {
    insights.push(`📈 En montée cette semaine : ${risingDims.map(d => d.label).join(', ')}.`);
  }
  if (fallingDims.length > 0) {
    insights.push(`📉 En baisse cette semaine : ${fallingDims.map(d => d.label).join(', ')} — invitez-les à votre conscience.`);
  }

  const avg = Object.values(averages).reduce((a, b) => a + b, 0) / 5;
  if (avg >= 7.5) insights.push(`🌟 Votre équilibre global est exceptionnel (moyenne ${avg.toFixed(1)}/10).`);
  else if (avg >= 6) insights.push(`⚖️ Votre équilibre global est solide (moyenne ${avg.toFixed(1)}/10).`);
  else if (avg < 4.5) insights.push(`💫 Chaque tirage est une invitation à restaurer l'harmonie. Continuez votre pratique.`);

  return insights.slice(0, 3);
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export function EnergyProfileDashboard() {
  const { data: profile, isLoading } = useEnergyProfile(30);
  const [activeView, setActiveView] = useState<'radar' | 'evolution'>('radar');

  const radarData = useMemo(() => {
    if (!profile?.averages) return [];
    return DIMENSIONS.map(d => ({
      subject: d.label,
      value: profile.averages[d.key] ?? 5,
      fullMark: 10,
    }));
  }, [profile]);

  const chartData = useMemo(() => {
    if (!profile?.history?.length) return [];
    return [...profile.history].map(h => ({
      ...h,
      date: format(parseISO(h.date), 'd/M', { locale: fr }),
    }));
  }, [profile]);

  const insights = useMemo(() => {
    if (!profile?.averages) return [];
    return generateInsights(profile.averages, profile.trend);
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm animate-pulse">Calcul de votre profil énergétique…</p>
      </div>
    );
  }

  const hasData = (profile?.total_scored_draws ?? 0) > 0;

  if (!hasData) {
    return (
      <div
        className="rounded-2xl p-10 text-center space-y-4"
        style={{ background: 'hsl(var(--card) / 0.5)', border: '1px solid hsl(var(--border))' }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
          style={{ background: 'hsl(var(--primary) / 0.1)' }}
        >
          <Zap className="h-7 w-7" style={{ color: 'hsl(var(--primary))' }} />
        </div>
        <h3 className="font-serif text-lg font-semibold text-foreground">Profil Énergétique</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          Votre profil multi-dimensionnel se révèle après votre premier tirage quotidien. Revenez chaque jour pour voir évoluer votre équilibre émotionnel, relationnel, professionnel et spirituel.
        </p>
      </div>
    );
  }

  const avgs = profile!.averages;
  const trend = profile!.trend;

  return (
    <div className="space-y-6">

      {/* Header + view toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-base font-semibold text-foreground">Profil Énergétique</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {profile!.total_scored_draws} tirage{profile!.total_scored_draws > 1 ? 's' : ''} analysé{profile!.total_scored_draws > 1 ? 's' : ''}
          </p>
        </div>
        <div
          className="flex rounded-lg overflow-hidden text-xs"
          style={{ border: '1px solid hsl(var(--border))' }}
        >
          {(['radar', 'evolution'] as const).map(v => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className="px-3 py-1.5 transition-colors"
              style={{
                background: activeView === v ? 'hsl(var(--primary))' : 'transparent',
                color: activeView === v ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
              }}
            >
              {v === 'radar' ? 'Équilibre' : 'Évolution'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <AnimatePresence mode="wait">
        {activeView === 'radar' ? (
          <motion.div
            key="radar"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="h-56"
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Radar
                  name="Énergie"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.18}
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                />
                <ReTooltip content={<RadarTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        ) : (
          <motion.div
            key="evolution"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="h-56"
          >
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[1, 10]} ticks={[1, 5, 10]} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <ReTooltip content={<LineTooltip />} />
                  {DIMENSIONS.map(d => (
                    <Line
                      key={d.key}
                      type="monotone"
                      dataKey={d.key}
                      name={d.label}
                      stroke={d.color}
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Au moins 2 tirages nécessaires pour voir l'évolution.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dimension cards grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {DIMENSIONS.map((dim, i) => (
          <DimensionCard
            key={dim.key}
            dim={dim}
            value={avgs[dim.key] ?? 5}
            trend={trend?.[dim.key] ?? 0}
            index={i}
          />
        ))}
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div
          className="rounded-xl p-4 space-y-2"
          style={{ background: 'hsl(var(--primary) / 0.06)', border: '1px solid hsl(var(--primary) / 0.2)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Insights énergétiques
          </p>
          {insights.map((insight, i) => (
            <motion.p
              key={i}
              className="text-sm text-foreground/85 leading-relaxed"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 + 0.3 }}
            >
              {insight}
            </motion.p>
          ))}
        </div>
      )}
    </div>
  );
}
