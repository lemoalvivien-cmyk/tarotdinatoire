import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useDailyDraw } from '@/hooks/useDailyDraw';
import { KarmaWidget } from '@/components/gamification/KarmaWidget';
import { Sparkles, Plus, BookOpen, Star, ArrowRight, Flame, Calendar } from 'lucide-react';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({ totalReadings: 0, favorites: 0 });

  const { streak, hasDrawnToday, drawLoading } = useDailyDraw();

  // Dev logging
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[Dashboard] State:', {
        userId: user?.id,
        profileLoading,
        onboardingCompleted: profile?.onboarding_completed,
      });
    }
  }, [user?.id, profileLoading, profile?.onboarding_completed]);

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!profileLoading && profile && !profile.onboarding_completed) {
      if (import.meta.env.DEV) {
        console.log('[Dashboard] Onboarding not completed, redirecting');
      }
      navigate('/app/onboarding', { replace: true });
    }
  }, [profile, profileLoading, navigate]);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const { count: totalReadings } = await supabase
          .from('tarot_readings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const { count: favorites } = await supabase
          .from('tarot_readings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_favorite', true);

        setStats({ totalReadings: totalReadings || 0, favorites: favorites || 0 });
      } catch (error) {
        if (import.meta.env.DEV) console.error('[Dashboard] Error fetching stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    if (!profileLoading && profile?.onboarding_completed) fetchStats();
  }, [user, profileLoading, profile?.onboarding_completed]);

  if (profileLoading || statsLoading || drawLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <DashboardSkeleton />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* Welcome */}
          <div className="text-center space-y-3 animate-fade-in-up">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
              Bienvenue dans votre espace mystique
            </h1>
            <p className="text-foreground/80">Que souhaitez-vous explorer aujourd'hui ?</p>
          </div>

          {/* ─── Daily Ritual CTA — Hero card ───────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Link to="/app/daily" className="group block">
              <div
                className="relative overflow-hidden rounded-2xl p-6 md:p-8 transition-all hover:-translate-y-1"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))',
                  border: '1px solid hsl(var(--primary) / 0.35)',
                  boxShadow: '0 8px 32px hsl(var(--primary) / 0.15)',
                }}
              >
                {/* Background sparkle */}
                <motion.div
                  className="absolute top-4 right-6 text-4xl opacity-20 select-none pointer-events-none"
                  animate={{ rotate: [0, 15, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
                >
                  🔮
                </motion.div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Flame + streak */}
                    <div
                      className="flex flex-col items-center justify-center w-14 h-14 rounded-full"
                      style={{
                        background: streak > 0
                          ? 'hsl(var(--primary) / 0.2)'
                          : 'hsl(var(--muted) / 0.5)',
                        border: `2px solid ${streak > 0 ? 'hsl(var(--primary) / 0.6)' : 'hsl(var(--border))'}`,
                      }}
                    >
                      <Flame
                        className="h-6 w-6"
                        style={{ color: streak > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
                        fill={streak > 0 ? 'currentColor' : 'none'}
                      />
                      <span
                        className="text-xs font-bold tabular-nums"
                        style={{ color: streak > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
                      >
                        {streak}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h2 className="font-serif text-xl font-semibold text-foreground">
                          Rituel du jour
                        </h2>
                        {hasDrawnToday && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: 'hsl(var(--primary) / 0.15)',
                              color: 'hsl(var(--primary))',
                            }}
                          >
                            ✓ Complété
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground/70">
                        {hasDrawnToday
                          ? 'Voir votre carte et votre réflexion'
                          : 'Votre carte vous attend — tirez-la maintenant'}
                      </p>
                      {streak > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          🔥 {streak} jour{streak > 1 ? 's' : ''} de suite
                        </p>
                      )}
                    </div>
                  </div>

                  <ArrowRight
                    className="h-5 w-5 opacity-50 group-hover:opacity-100 transition-all group-hover:translate-x-1"
                    style={{ color: 'hsl(var(--primary))' }}
                  />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Quick Actions grid */}
          <div className="grid md:grid-cols-2 gap-5">
            <Link to="/app/new" className="group">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-soft transition-all hover:shadow-glow hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-semibold text-foreground">Nouveau tirage</h2>
                    <p className="text-sm text-foreground/70">Spreads complets</p>
                  </div>
                  <ArrowRight className="ml-auto h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            <Link to="/app/history" className="group">
              <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-soft transition-all hover:shadow-soft hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-foreground" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-semibold text-foreground">Mon journal</h2>
                    <p className="text-sm text-foreground/70">Tirages passés</p>
                  </div>
                  <ArrowRight className="ml-auto h-5 w-5 text-foreground/60 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </div>

          {/* Stats + Karma */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-card border border-border/50 text-center">
              <p className="text-3xl font-serif font-semibold text-primary">{stats.totalReadings}</p>
              <p className="text-xs text-foreground/70 mt-1">Tirages</p>
            </div>
            <div
              className="p-5 rounded-xl text-center"
              style={{
                background: 'hsl(var(--primary) / 0.08)',
                border: '1px solid hsl(var(--primary) / 0.2)',
              }}
            >
              <p className="text-3xl font-serif font-semibold" style={{ color: 'hsl(var(--primary))' }}>
                {streak}
              </p>
              <p className="text-xs text-foreground/70 mt-1 flex items-center justify-center gap-1">
                <Flame className="h-3 w-3" /> Série
              </p>
            </div>
          </div>

          {/* Karma / Level widget */}
          <KarmaWidget />

          {/* Empty state */}
          {stats.totalReadings === 0 && !hasDrawnToday && (
            <div className="p-10 rounded-2xl glass-mystic text-center space-y-5 animate-scale-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
                <Star className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-semibold text-foreground">Commencez votre voyage</h3>
                <p className="text-foreground/75 max-w-md mx-auto text-sm">
                  Tirez votre première carte du jour et commencez votre série. Les astres vous attendent.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/app/daily">
                  <Button size="lg" className="btn-mystic">
                    <Calendar className="mr-2 h-4 w-4" />
                    Rituel du jour
                  </Button>
                </Link>
                <Link to="/app/new">
                  <Button size="lg" variant="outline">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Tirage complet
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Returning user quick links */}
          {(stats.totalReadings > 0 || hasDrawnToday) && (
            <div className="p-5 rounded-xl bg-card border border-border/50">
              <h3 className="font-serif text-sm font-semibold text-foreground mb-3">Actions rapides</h3>
              <div className="flex flex-wrap gap-2">
                <Link to="/app/favorites">
                  <Button variant="outline" size="sm">
                    <Star className="h-4 w-4 mr-2" />Mes favoris
                  </Button>
                </Link>
                <Link to="/app/profile">
                  <Button variant="outline" size="sm">Mon profil</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
