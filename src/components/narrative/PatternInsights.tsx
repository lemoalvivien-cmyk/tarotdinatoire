import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts';
import type { NarrativePatternData, NarrativeKeyCard } from '@/hooks/useNarrativeEngine';
import { useTarotCards } from '@/hooks/useTarotCards';

interface PatternInsightsProps {
  patternData: NarrativePatternData;
  keyCards: NarrativeKeyCard[];
}

// Map themes to radar axes for psychological profile
const RADAR_AXES = ['amour', 'travail', 'intérieur', 'transformation', 'spirituel', 'matériel'];

function themeScore(themes: { theme: string; count: number }[], axis: string): number {
  const SYNONYMS: Record<string, string[]> = {
    amour:          ['amour', 'relation', 'harmonie', 'romantique', 'couple', 'coeur'],
    travail:        ['travail', 'carrière', 'succès', 'volonté', 'création', 'autorité'],
    intérieur:      ['introspection', 'solitude', 'sagesse', 'subconscient', 'intérieur', 'méditation'],
    transformation: ['transformation', 'changement', 'renouveau', 'cycle', 'rupture', 'fin'],
    spirituel:      ['spiritualité', 'intuition', 'mystère', 'rêves', 'guidance', 'espoir'],
    matériel:       ['abondance', 'stabilité', 'structure', 'matériel', 'sécurité', 'ressources'],
  };
  const synonyms = SYNONYMS[axis] ?? [axis];
  const total = themes.reduce((sum, t) => {
    const match = synonyms.some(s => t.theme.toLowerCase().includes(s));
    return sum + (match ? t.count : 0);
  }, 0);
  return Math.min(100, total * 15);
}

export function PatternInsights({ patternData, keyCards }: PatternInsightsProps) {
  const { data: allCards } = useTarotCards();

  const radarData = useMemo(() =>
    RADAR_AXES.map(axis => ({
      axis: axis.charAt(0).toUpperCase() + axis.slice(1),
      value: themeScore(patternData.top_themes ?? [], axis),
      fullMark: 100,
    })),
    [patternData.top_themes]
  );

  const hasData = radarData.some(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Psychological Radar Profile */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Profil psychologique des arcanes
        </p>
        {hasData ? (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.5}
                />
                <PolarAngleAxis
                  dataKey="axis"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Radar
                  name="Profil"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, 'Intensité']}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-muted-foreground text-xs">
            Profil disponible après plusieurs tirages
          </div>
        )}
      </div>

      {/* Recurring cards grid */}
      {keyCards.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Cartes dominantes
          </p>
          <div className="space-y-2">
            {keyCards.slice(0, 5).map((kc, i) => {
              const card = allCards?.find(c => c.id === kc.card_id);
              const maxCount = keyCards[0]?.count ?? 1;
              const pct = Math.round((kc.count / maxCount) * 100);

              return (
                <motion.div
                  key={kc.card_id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-3"
                >
                  {/* Card mini image */}
                  <div
                    className="w-8 h-12 rounded shrink-0 overflow-hidden"
                    style={{ border: '1px solid hsl(var(--border))' }}
                  >
                    {card?.image_url ? (
                      <img
                        src={card.image_url}
                        alt={kc.card_name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-[8px] text-center"
                        style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}
                      >
                        {kc.card_name.slice(0, 4)}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground truncate">{kc.card_name}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">×{kc.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: i * 0.07 + 0.2, duration: 0.6 }}
                        className="h-full rounded-full"
                        style={{ background: 'hsl(var(--primary))' }}
                      />
                    </div>
                    {kc.keywords.length > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {kc.keywords.join(' · ')}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Orientation balance */}
      {patternData.orientation_split && (
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Balance endroit / renversé
          </p>
          {(() => {
            const u = patternData.orientation_split.upright ?? 0;
            const r = patternData.orientation_split.reversed ?? 0;
            const total = u + r || 1;
            const uprightPct = Math.round((u / total) * 100);
            return (
              <div className="space-y-1.5">
                <div className="h-3 rounded-full overflow-hidden flex" style={{ background: 'hsl(var(--muted))' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${uprightPct}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full rounded-l-full"
                    style={{ background: 'hsl(var(--primary))' }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>À l'endroit : {uprightPct}%</span>
                  <span>Renversée : {100 - uprightPct}%</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
