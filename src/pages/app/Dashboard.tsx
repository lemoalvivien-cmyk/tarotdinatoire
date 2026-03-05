import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { useDailyDraw } from '@/hooks/useDailyDraw';
import { useDashboardStats } from '@/queries/useDashboardStats';
import { KarmaWidget } from '@/components/gamification/KarmaWidget';
import { Sparkles, Plus, BookOpen, Star, ArrowRight, Flame, Calendar } from 'lucide-react';
import { DashboardSkeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

export default function Dashboard() {
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const { streak, hasDrawnToday, drawLoading } = useDailyDraw();
  const { stats, isLoading: statsLoading } = useDashboardStats();

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!profileLoading && profile && !profile.onboarding_completed) {
      navigate('/app/onboarding', { replace: true });
    }
  }, [profile, profileLoading, navigate]);

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
        <motion.div
          className="max-w-5xl mx-auto space-y-8"
          variants={staggerContainer(0.1, 0)}
          initial="hidden"
          animate="visible"
        >

          {/* Welcome */}
          <motion.div variants={fadeInUp} className="page-header">
            <h1 className="page-header-title">
              Bienvenue dans votre espace mystique
            </h1>
            <p className="page-header-subtitle text-base">Que souhaitez-vous explorer aujourd'hui ?</p>
          </motion.div>

          {/* ─── Daily Ritual CTA — Hero card ──────────────────────────── */}
          <motion.div variants={staggerItem}>
            <Link to="/app/daily" className="group block">
              <div className="action-card-primary relative overflow-hidden">
                <motion.div
                  className="absolute top-4 right-6 text-4xl opacity-20 select-none pointer-events-none"
                  animate={{ rotate: [0, 15, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
                >
                  🔮
                </motion.div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Streak ring */}
                    <div className={`streak-ring ${streak > 0 ? 'streak-ring-active' : 'streak-ring-inactive'}`}>
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
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary">
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
                    className="h-5 w-5 opacity-50 group-hover:opacity-100 transition-all group-hover:translate-x-1 text-primary"
                  />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Quick Actions grid */}
          <motion.div variants={staggerItem} className="grid md:grid-cols-2 gap-5">
            <Link to="/app/new" className="group">
              <div className="action-card-primary">
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
              <div className="action-card">
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
          </motion.div>

          {/* Stats + Streak */}
          <motion.div variants={staggerItem} className="grid grid-cols-2 gap-4">
            <div className="stat-card">
              <p className="stat-card-value">{stats.totalReadings}</p>
              <p className="stat-card-label">Tirages</p>
            </div>
            <div className="stat-card-primary">
              <p className="stat-card-value">{streak}</p>
              <p className="stat-card-label">
                <Flame className="h-3 w-3" /> Série
              </p>
            </div>
          </motion.div>

          {/* Karma / Level widget */}
          <motion.div variants={staggerItem}>
            <KarmaWidget />
          </motion.div>

          {/* Empty state */}
          {stats.totalReadings === 0 && !hasDrawnToday && (
            <motion.div
              variants={staggerItem}
              className="p-10 rounded-2xl glass-mystic text-center space-y-5"
            >
              <div className="page-header-icon mx-auto">
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
            </motion.div>
          )}

          {/* Returning user quick links */}
          {(stats.totalReadings > 0 || hasDrawnToday) && (
            <motion.div variants={staggerItem} className="p-5 rounded-xl bg-card border border-border/50">
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
            </motion.div>
          )}

        </motion.div>
      </div>
    </Layout>
  );
}
