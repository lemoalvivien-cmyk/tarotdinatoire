import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { MysticBackground, MysticButton } from '@/components/mystic';
import { StepHeader, TarotCard, OracleLoader } from '@/components/tarot-ui';
import { StreakCounter } from '@/components/daily/StreakCounter';
import { EnergyChart } from '@/components/daily/EnergyChart';
import { JourneyTimeline } from '@/components/daily/JourneyTimeline';
import { ReflectionJournal } from '@/components/daily/ReflectionJournal';
import { ShareModal } from '@/components/share/ShareModal';
import { PsychologicalReflection } from '@/components/reflection/PsychologicalReflection';
import { useDailyDraw } from '@/hooks/useDailyDraw';
import { useTarotCards } from '@/hooks/useTarotCards';
import { TarotVoicePlayer } from '@/components/audio/TarotVoicePlayer';
import { Sparkles, ChevronDown, TrendingUp, BookOpen, Share2, Brain } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { DailyDraw } from '@/hooks/useDailyDraw';

// ─── Phase: Anticipation ─────────────────────────────────────────────────────
function AnticipationPhase({
  streak,
  onDraw,
  isDrawing,
}: {
  streak: number;
  onDraw: () => void;
  isDrawing: boolean;
}) {
  return (
    <motion.div
      key="anticipation"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="flex flex-col items-center gap-10 py-4"
    >
      <StreakCounter streak={streak} />

      {/* Mystical orb CTA */}
      <div className="relative flex flex-col items-center gap-6">
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
          className="relative"
        >
          {/* Outer glow */}
          <motion.div
            className="absolute inset-0 rounded-full blur-2xl"
            style={{ background: 'hsl(var(--primary) / 0.3)' }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ repeat: Infinity, duration: 3.5 }}
          />
          {/* The card — face down */}
          <div
            className="relative w-32 h-52 rounded-2xl flex items-center justify-center cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--secondary) / 0.3))',
              border: '1px solid hsl(var(--primary) / 0.5)',
              boxShadow: '0 20px 60px hsl(var(--primary) / 0.25)',
            }}
            onClick={!isDrawing ? onDraw : undefined}
          >
            <img
              src="/public/assets/tarot/back.svg"
              alt="Carte cachée"
              className="w-24 h-auto opacity-60"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <Sparkles
              className="absolute bottom-4 right-4 h-5 w-5 animate-pulse"
              style={{ color: 'hsl(var(--primary))' }}
            />
          </div>
        </motion.div>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            {streak > 0
              ? `Jour ${streak + 1} de votre voyage intérieur`
              : 'Commencez votre voyage intérieur'}
          </p>
          <p className="text-xs text-muted-foreground/60">
            Une carte vous attend — elle a été choisie pour vous aujourd'hui
          </p>
        </div>

        <MysticButton
          onClick={onDraw}
          disabled={isDrawing}
          size="lg"
          className="min-w-48"
        >
          {isDrawing ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">✦</span> Révélation…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Révéler ma carte du jour
            </span>
          )}
        </MysticButton>
      </div>
    </motion.div>
  );
}

// ─── Phase: Reveal ────────────────────────────────────────────────────────────
function RevealPhase({
  draw,
  onContinue,
  onShare,
}: {
  draw: DailyDraw;
  onContinue: () => void;
  onShare: () => void;
}) {
  const { data: allCards } = useTarotCards();
  const card = allCards?.find(c => c.id === draw.card_id);
  const interp = draw.interpretation as Record<string, string> | null;

  return (
    <motion.div
      key="reveal"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center gap-8"
    >
      {/* Card */}
      <motion.div
        initial={{ rotateY: 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        className="w-36"
      >
        <TarotCard
          id={draw.card_id}
          name={card?.nom_fr ?? ''}
          imageUrl={card?.image_url ?? undefined}
          isRevealed={true}
          isSelected={true}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center space-y-2"
      >
        <h2 className="font-serif text-2xl font-semibold text-foreground">
          {card?.nom_fr ?? draw.card_id}
        </h2>
        <p className="text-sm text-muted-foreground capitalize">
          {draw.orientation === 'upright' ? '✦ À l\'endroit' : '✦ Renversée'}
        </p>
        {interp?.title && (
          <p
            className="text-base font-medium mt-2"
            style={{ color: 'hsl(var(--primary))' }}
          >
            {interp.title}
          </p>
        )}
      </motion.div>

      {interp?.summary && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center max-w-sm"
        >
          <p className="text-sm text-foreground/80 leading-relaxed italic">
            {interp.summary}
          </p>
        </motion.div>
      )}

      {interp?.advice && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="w-full max-w-sm px-4 py-3 rounded-xl text-sm text-center"
          style={{
            background: 'hsl(var(--primary) / 0.1)',
            border: '1px solid hsl(var(--primary) / 0.3)',
            color: 'hsl(var(--foreground) / 0.9)',
          }}
        >
          <span className="font-medium">Conseil du jour : </span>
          {interp.advice}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="flex flex-col items-center gap-3"
      >
        <div className="flex items-center gap-3">
          <MysticButton onClick={onContinue} size="lg">
            <BookOpen className="h-4 w-4 mr-2" />
            Écrire ma réflexion
          </MysticButton>
          <button
            onClick={onShare}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'hsl(var(--primary) / 0.15)',
              border: '1px solid hsl(var(--primary) / 0.4)',
              color: 'hsl(var(--primary))',
            }}
          >
            <Share2 className="h-4 w-4" />
            Partager
          </button>
        </div>
        <button
          onClick={onContinue}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <ChevronDown className="h-3 w-3" /> Voir l'ensemble
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DailyRitual() {
  const {
    todayDraw,
    drawLoading,
    streak,
    energyProfile,
    profileLoading,
    recentDraws,
    historyLoading,
    isDrawing,
    performDraw,
    saveJournal,
    hasDrawnToday,
  } = useDailyDraw();

  const { data: allCards } = useTarotCards();

  const [phase, setPhase] = useState<'anticipation' | 'reveal' | 'journal'>(() =>
    hasDrawnToday ? 'journal' : 'anticipation'
  );
  const [localDraw, setLocalDraw] = useState<DailyDraw | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const activeDraw = localDraw ?? todayDraw;

  const handleDraw = async () => {
    const draw = await performDraw();
    if (draw) {
      setLocalDraw(draw);
      setPhase('reveal');
    }
  };

  const activeCard = activeDraw ? allCards?.find(c => c.id === activeDraw.card_id) : null;
  const interp = activeDraw?.interpretation as Record<string, string> | null;

  // If user comes back and already drew today, show journal directly
  const currentPhase = hasDrawnToday && phase === 'anticipation' ? 'journal' : phase;

  if (drawLoading) {
    return (
      <MysticBackground className="min-h-screen flex items-center justify-center">
        <OracleLoader size="lg" message="Chargement de votre rituel…" />
      </MysticBackground>
    );
  }

  return (
    <Layout>
      <MysticBackground className="min-h-screen py-8 md:py-14">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto space-y-8">

            {/* Header */}
            <StepHeader
              title="Rituel Quotidien"
              subtitle="Une carte par jour. Un voyage intérieur."
            />

            {/* Phase transitions */}
            <AnimatePresence mode="wait">
              {currentPhase === 'anticipation' && (
                <AnticipationPhase
                  key="anticipation"
                  streak={streak}
                  onDraw={handleDraw}
                  isDrawing={isDrawing}
                />
              )}

              {currentPhase === 'reveal' && activeDraw && (
                <RevealPhase
                  key="reveal"
                  draw={activeDraw}
                  onContinue={() => setPhase('journal')}
                  onShare={() => setShareOpen(true)}
                />
              )}

              {currentPhase === 'journal' && activeDraw && (
                <motion.div
                  key="journal"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Today's card + streak banner */}
                  <div
                    className="rounded-2xl p-5 flex items-center gap-4"
                    style={{
                      background: 'hsl(var(--card) / 0.6)',
                      border: '1px solid hsl(var(--border))',
                    }}
                  >
                    <StreakCounter streak={streak} className="shrink-0" />
                    <div className="w-px h-16 bg-border" />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs text-muted-foreground">Votre carte du jour</p>
                      <p className="font-serif font-medium text-foreground">
                        {interp?.title ?? activeDraw.card_id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activeDraw.orientation === 'upright' ? 'À l\'endroit' : 'Renversée'}
                        {' · '}
                        {activeDraw.themes?.slice(0, 2).join(', ')}
                      </p>
                    </div>
                    {/* Share button on journal view */}
                    <button
                      onClick={() => setShareOpen(true)}
                      className="shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all hover:scale-105"
                      style={{
                        background: 'hsl(var(--primary) / 0.12)',
                        border: '1px solid hsl(var(--primary) / 0.35)',
                        color: 'hsl(var(--primary))',
                      }}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Partager
                    </button>
                  </div>

                  {/* Tabs: Psychologie / Journal / Énergie / Voyage */}
                  <Tabs defaultValue="psyche">
                    <TabsList className="w-full grid grid-cols-4">
                      <TabsTrigger value="psyche" className="text-xs">
                        <Brain className="h-3.5 w-3.5 mr-1" />
                        Psyché
                      </TabsTrigger>
                      <TabsTrigger value="reflection" className="text-xs">
                        <BookOpen className="h-3.5 w-3.5 mr-1" />
                        Journal
                      </TabsTrigger>
                      <TabsTrigger value="energy" className="text-xs">
                        <TrendingUp className="h-3.5 w-3.5 mr-1" />
                        Énergie
                      </TabsTrigger>
                      <TabsTrigger value="journey" className="text-xs">
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        Voyage
                      </TabsTrigger>
                    </TabsList>

                    {/* ── Psyché tab (new) ── */}
                    <TabsContent value="psyche" className="mt-4">
                      <div
                        className="rounded-2xl p-5"
                        style={{
                          background: 'hsl(var(--card) / 0.5)',
                          border: '1px solid hsl(var(--border))',
                        }}
                      >
                        <PsychologicalReflection
                          drawId={activeDraw.id}
                          cardName={activeCard?.nom_fr ?? activeDraw.card_id}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="reflection" className="mt-4">
                      <div
                        className="rounded-2xl p-5"
                        style={{
                          background: 'hsl(var(--card) / 0.5)',
                          border: '1px solid hsl(var(--border))',
                        }}
                      >
                        <ReflectionJournal
                          drawId={activeDraw.id}
                          reflectionQuestion={
                            activeDraw.reflection_question ??
                            'Quelle émotion cette carte éveille-t-elle en vous aujourd\'hui ?'
                          }
                          existingEntry={activeDraw.journal_entry}
                          existingMood={activeDraw.mood}
                          existingEnergyScore={activeDraw.energy_score}
                          onSave={({ drawId, journal_entry, mood, energy_score }) =>
                            saveJournal.mutate({ drawId, journal_entry, mood, energy_score })
                          }
                          isSaving={saveJournal.isPending}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="energy" className="mt-4">
                      <div
                        className="rounded-2xl p-5"
                        style={{
                          background: 'hsl(var(--card) / 0.5)',
                          border: '1px solid hsl(var(--border))',
                        }}
                      >
                        {profileLoading ? (
                          <OracleLoader size="sm" message="Calcul de votre profil…" />
                        ) : (
                          <EnergyChart
                            history={(energyProfile?.energy_history ?? []) as import('@/hooks/useDailyDraw').EnergyHistory[]}
                            topThemes={(energyProfile?.top_themes ?? []) as import('@/hooks/useDailyDraw').TopTheme[]}
                            avgEnergy={energyProfile?.avg_energy ?? 5}
                          />
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="journey" className="mt-4">
                      <div
                        className="rounded-2xl p-5"
                        style={{
                          background: 'hsl(var(--card) / 0.5)',
                          border: '1px solid hsl(var(--border))',
                        }}
                      >
                        {historyLoading ? (
                          <OracleLoader size="sm" message="Chargement de votre voyage…" />
                        ) : (
                          <JourneyTimeline draws={recentDraws} />
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </MysticBackground>

      {/* Share Modal */}
      {activeDraw && (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          card={activeCard}
          payload={{
            draw_id: activeDraw.id,
            card_id: activeDraw.card_id,
            card_name_fr: activeCard?.nom_fr ?? activeDraw.card_id,
            orientation: activeDraw.orientation,
            interp_title: interp?.title,
            interp_summary: interp?.summary,
            image_url: activeCard?.image_url ?? undefined,
          }}
        />
      )}
    </Layout>
  );
}
