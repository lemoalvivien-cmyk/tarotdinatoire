import { motion } from 'framer-motion';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { DailyDraw } from '@/hooks/useDailyDraw';
import { useTarotCards } from '@/hooks/useTarotCards';
import { TarotCard } from '@/components/tarot-ui';

interface JourneyTimelineProps {
  draws: DailyDraw[];
}

function dateLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return "Aujourd'hui";
  if (isYesterday(d)) return 'Hier';
  return format(d, 'EEEE d MMMM', { locale: fr });
}

const ENERGY_COLORS: Record<string, string> = {
  positif: 'text-emerald-400',
  neutre: 'text-blue-400',
  challenging: 'text-amber-400',
};

export function JourneyTimeline({ draws }: JourneyTimelineProps) {
  const { data: allCards } = useTarotCards();

  if (!draws.length) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm space-y-2">
        <span className="text-3xl block">📖</span>
        <p>Votre voyage commence ici. Revenez chaque jour.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {draws.map((draw, i) => {
        const card = allCards?.find(c => c.id === draw.card_id);
        const energy = (draw.interpretation as Record<string, string> | null)?.energy ?? 'neutre';
        const title  = (draw.interpretation as Record<string, string> | null)?.title ?? draw.card_id;
        const summary = (draw.interpretation as Record<string, string> | null)?.summary ?? '';

        return (
          <motion.div
            key={draw.id}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex gap-4"
          >
            {/* Timeline spine */}
            <div className="flex flex-col items-center">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5"
                style={{ background: 'hsl(var(--primary))' }}
              />
              {i < draws.length - 1 && (
                <div
                  className="w-px flex-1 mt-1"
                  style={{ background: 'hsl(var(--border))' }}
                />
              )}
            </div>

            {/* Content */}
            <div className="pb-5 flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1 capitalize">
                {dateLabel(draw.draw_date)}
              </p>

              <div
                className="rounded-xl p-3 flex gap-3"
                style={{
                  background: 'hsl(var(--card) / 0.6)',
                  border: '1px solid hsl(var(--border))',
                }}
              >
                {/* Tiny card thumbnail */}
                <div className="w-10 shrink-0">
                  <TarotCard
                    id={draw.card_id}
                    name={card?.nom_fr ?? ''}
                    imageUrl={card?.image_url ?? undefined}
                    isRevealed={true}
                    isSelected={false}
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium text-foreground truncate">{title}</p>
                    <span className={`text-xs shrink-0 ${ENERGY_COLORS[energy] ?? 'text-muted-foreground'}`}>
                      {energy === 'positif' ? '↑' : energy === 'challenging' ? '↓' : '→'}
                    </span>
                  </div>

                  {summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{summary}</p>
                  )}

                  {draw.journal_entry && (
                    <p className="text-xs italic text-foreground/60 line-clamp-1 border-l-2 pl-2"
                       style={{ borderColor: 'hsl(var(--primary) / 0.4)' }}>
                      {draw.journal_entry}
                    </p>
                  )}

                  {draw.themes?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {draw.themes.slice(0, 3).map(theme => (
                        <span
                          key={theme}
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{
                            background: 'hsl(var(--primary) / 0.1)',
                            color: 'hsl(var(--primary))',
                          }}
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
