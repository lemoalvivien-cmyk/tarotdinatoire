import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Plus, BookOpen, Star, ArrowRight } from 'lucide-react';
import { DashboardSkeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({ totalReadings: 0, favorites: 0 });

  // Log for debugging
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[Dashboard] State:', {
        userId: user?.id,
        profileLoading,
        onboardingCompleted: profile?.onboarding_completed,
      });
    }
  }, [user?.id, profileLoading, profile?.onboarding_completed]);

  // Redirect to onboarding if not completed (backup check - ProtectedRoute should handle this)
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
        // Fetch stats
        const { count: totalReadings } = await supabase
          .from('tarot_readings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const { count: favorites } = await supabase
          .from('tarot_readings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_favorite', true);

        setStats({
          totalReadings: totalReadings || 0,
          favorites: favorites || 0,
        });
      } catch (error) {
        console.error('[Dashboard] Error fetching stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    if (!profileLoading && profile?.onboarding_completed) {
      fetchStats();
    }
  }, [user, profileLoading, profile?.onboarding_completed]);

  if (profileLoading || statsLoading) {
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
        <div className="max-w-5xl mx-auto space-y-10">
          {/* Welcome */}
          <div className="text-center space-y-4 animate-fade-in-up">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
              Bienvenue dans votre espace mystique
            </h1>
            <p className="text-foreground/80">
              Que souhaitez-vous explorer aujourd'hui ?
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            <Link to="/app/new" className="group">
              <div className="p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-soft transition-all hover:shadow-glow hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-foreground">Nouveau tirage</h2>
                    <p className="text-sm text-foreground/75">Commencer une consultation</p>
                  </div>
                  <ArrowRight className="ml-auto h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            <Link to="/app/history" className="group">
              <div className="p-8 rounded-2xl bg-card border border-border/50 shadow-soft transition-all hover:shadow-soft hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-secondary/30 flex items-center justify-center">
                    <BookOpen className="h-7 w-7 text-foreground" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-semibold text-foreground">Mon journal</h2>
                    <p className="text-sm text-foreground/75">Consulter mes tirages passés</p>
                  </div>
                  <ArrowRight className="ml-auto h-5 w-5 text-foreground/60 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-xl bg-card border border-border/50 text-center">
              <p className="text-3xl font-serif font-semibold text-primary">{stats.totalReadings}</p>
              <p className="text-sm text-foreground/75">Tirages réalisés</p>
            </div>
            <div className="p-6 rounded-xl bg-card border border-border/50 text-center">
              <p className="text-3xl font-serif font-semibold text-secondary">{stats.favorites}</p>
              <p className="text-sm text-foreground/75">Favoris</p>
            </div>
            <div className="p-6 rounded-xl bg-card border border-border/50 text-center col-span-2 md:col-span-1">
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium text-primary">PREMIUM</span>
              </div>
              <p className="text-sm text-foreground/75 mt-1">3,90€/mois</p>
            </div>
          </div>

          {/* Recent or Empty State */}
          {stats.totalReadings === 0 ? (
            <div className="p-12 rounded-2xl glass-mystic text-center space-y-6 animate-scale-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
                <Star className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-xl font-semibold text-foreground">Commencez votre voyage</h3>
                <p className="text-foreground/80 max-w-md mx-auto">
                  Vous n'avez pas encore effectué de tirage. 
                  Laissez les cartes vous guider vers une meilleure compréhension de vous-même.
                </p>
              </div>
              <Link to="/app/new">
                <Button size="lg" className="btn-mystic">
                  Faire mon premier tirage
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-semibold text-foreground">Actions rapides</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/app/favorites">
                  <Button variant="outline" size="sm">
                    <Star className="h-4 w-4 mr-2" />
                    Mes favoris
                  </Button>
                </Link>
                <Link to="/app/profile">
                  <Button variant="outline" size="sm">
                    Mon profil
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
