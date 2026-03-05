import { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import type { EnergyHistory, TopTheme } from '@/hooks/useDailyDraw';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EnergyChartProps {
  history: EnergyHistory[];
  topThemes: TopTheme[];
  avgEnergy: number;
}

const MOOD_LABELS: Record<number, string> = {
  1: 'Difficile', 2: 'Pesant', 3: 'Mélancolique', 4: 'Calme',
  5: 'Neutre', 6: 'Serein', 7: 'Énergique', 8: 'Lumineux',
  9: 'Inspiré', 10: 'Extatique',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="px-3 py-2 rounded-xl text-xs shadow-lg"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        color: 'hsl(var(--foreground))',
      }}
    >
      <p className="font-medium">{format(parseISO(d.date), 'EEEE d MMM', { locale: fr })}</p>
      <p style={{ color: 'hsl(var(--primary))' }}>{MOOD_LABELS[d.score] ?? ''} ({d.score}/10)</p>
    </div>
  );
};

export function EnergyChart({ history, topThemes, avgEnergy }: EnergyChartProps) {
  const chartData = useMemo(
    () =>
      [...history]
        .reverse()
        .map(h => ({
          date: h.date,
          score: h.score,
          card_id: h.card_id,
        })),
    [history]
  );

  if (!chartData.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm gap-2">
        <span className="text-3xl">🌙</span>
        <p>Votre profil énergétique se révèlera après quelques tirages.</p>
      </div>
    );
  }

  const maxThemeCount = topThemes[0]?.count ?? 1;

  return (
    <div className="space-y-6">
      {/* Énergie moyenne */}
      <div className="flex items-center gap-4">
        <div
          className="flex flex-col items-center justify-center w-16 h-16 rounded-full shrink-0"
          style={{
            background: 'hsl(var(--primary) / 0.12)',
            border: '2px solid hsl(var(--primary) / 0.4)',
          }}
        >
          <span className="text-xl font-serif font-bold" style={{ color: 'hsl(var(--primary))' }}>
            {avgEnergy}
          </span>
          <span className="text-[10px] text-muted-foreground">/10</span>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Énergie moyenne : {MOOD_LABELS[avgEnergy] ?? 'Équilibré'}
          </p>
          <p className="text-xs text-muted-foreground">
            Calculée sur {chartData.length} tirage{chartData.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Line chart */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={d => format(parseISO(d), 'd/M')}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[1, 10]}
              ticks={[1, 5, 10]}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={avgEnergy}
              stroke="hsl(var(--primary))"
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#energyGrad)"
              dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top themes */}
      {topThemes.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            Thèmes dominants
          </p>
          <div className="space-y-2">
            {topThemes.slice(0, 5).map(({ theme, count }) => (
              <div key={theme} className="flex items-center gap-3">
                <span className="text-xs text-foreground/80 w-28 capitalize truncate">{theme}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(count / maxThemeCount) * 100}%`,
                      background: 'hsl(var(--primary))',
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
