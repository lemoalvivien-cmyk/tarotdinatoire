import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { MysticBackground } from '@/components/mystic';
import { StepHeader, OracleLoader } from '@/components/tarot-ui';
import { NarrativeMemoryCard } from '@/components/narrative/NarrativeMemoryCard';
import { PatternInsights } from '@/components/narrative/PatternInsights';
import { EnergyChart } from '@/components/daily/EnergyChart';
import { StreakCounter } from '@/components/daily/StreakCounter';
import { JourneyTimeline } from '@/components/daily/JourneyTimeline';
import { SynchronicityEngine } from '@/components/synchronicity/SynchronicityEngine';
import { useNarrativeEngine } from '@/hooks/useNarrativeEngine';
import { useDailyDraw } from '@/hooks/useDailyDraw';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, BarChart2, BookOpen, Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Journey() {
  const {
    narrative,
    isLoading: narrativeLoading,
    isGenerating,
    generateNarrative,
  } = useNarrativeEngine();

  const {
    streak,
    energyProfile,
    profileLoading,
    recentDraws,
    historyLoading,
  } = useDailyDraw();

  const [activeTab, setActiveTab] = useState('narrative');

  return (
    <Layout>
      <MysticBackground className="min-h-screen py-8 md:py-14">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto space-y-6">

            {/* Header */}
            <StepHeader
              title="Votre Voyage"
              subtitle="Patterns, mémoire et récit de votre chemin intérieur"
            />

            {/* Streak + Stats banner */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5 flex items-center gap-6"
              style={{
                background: 'hsl(var(--primary) / 0.08)',
                border: '1px solid hsl(var(--primary) / 0.2)',
              }}
            >
              <StreakCounter streak={streak} />

              <div className="h-16 w-px bg-border" />

              <div className="grid grid-cols-2 gap-4 flex-1">
                <div className="text-center">
                  <p
                    className="text-2xl font-serif font-bold"
                    style={{ color: 'hsl(var(--primary))' }}
                  >
                    {narrative?.reading_count ?? '—'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Tirages totaux</p>
                </div>
                <div className="text-center">
                  <p
                    className="text-2xl font-serif font-bold"
                    style={{ color: 'hsl(var(--primary))' }}
                  >
                    {narrative?.themes?.length ?? 0}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Thèmes détectés</p>
                </div>
              </div>
            </motion.div>

            {/* Main tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-5">
                <TabsTrigger value="narrative" className="text-xs">
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Récit
                </TabsTrigger>
                <TabsTrigger value="sync" className="text-xs">
                  <Zap className="h-3.5 w-3.5 mr-1" />
                  Sync
                </TabsTrigger>
                <TabsTrigger value="patterns" className="text-xs">
                  <BarChart2 className="h-3.5 w-3.5 mr-1" />
                  Radar
                </TabsTrigger>
                <TabsTrigger value="energy" className="text-xs">
                  <BarChart2 className="h-3.5 w-3.5 mr-1" />
                  Énergie
                </TabsTrigger>
                <TabsTrigger value="timeline" className="text-xs">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  Ligne
                </TabsTrigger>
              </TabsList>

              {/* ── Narrative tab ───────────────────────────────────── */}
              <TabsContent value="narrative" className="mt-4">
                <NarrativeMemoryCard
                  narrative={narrative ?? null}
                  isLoading={narrativeLoading}
                  isGenerating={isGenerating}
                  onGenerate={(force) => generateNarrative(force ?? false)}
                />
              </TabsContent>

              {/* ── Patterns tab ────────────────────────────────────── */}
              <TabsContent value="patterns" className="mt-4">
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: 'hsl(var(--card) / 0.5)',
                    border: '1px solid hsl(var(--border))',
                  }}
                >
                  {narrativeLoading ? (
                    <OracleLoader size="sm" message="Analyse des patterns…" />
                  ) : narrative?.pattern_data ? (
                    <PatternInsights
                      patternData={narrative.pattern_data}
                      keyCards={narrative.key_cards ?? []}
                    />
                  ) : (
                    <div className="text-center py-10 text-muted-foreground text-sm space-y-2">
                      <BookOpen className="h-8 w-8 mx-auto opacity-40" />
                      <p>Générez votre récit pour voir les patterns.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ── Energy tab ──────────────────────────────────────── */}
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

              {/* ── Timeline tab ────────────────────────────────────── */}
              <TabsContent value="timeline" className="mt-4">
                <div
                  className="rounded-2xl p-5"
                  style={{
                    background: 'hsl(var(--card) / 0.5)',
                    border: '1px solid hsl(var(--border))',
                  }}
                >
                  {historyLoading ? (
                    <OracleLoader size="sm" message="Chargement du voyage…" />
                  ) : (
                    <JourneyTimeline draws={recentDraws} />
                  )}
                </div>
              </TabsContent>
            </Tabs>

          </div>
        </div>
      </MysticBackground>
    </Layout>
  );
}
