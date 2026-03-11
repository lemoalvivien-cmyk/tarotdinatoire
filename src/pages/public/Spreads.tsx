import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

interface TarotSpread {
  id: string;
  name_fr: string;
  description_fr: string | null;
  card_count: number;
  icon: string | null;
  is_enabled: boolean;
  sort_order: number;
}

export default function Spreads() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: spreads, isLoading, error } = useQuery({
    queryKey: ['public-spreads'],
    queryFn: async (): Promise<TarotSpread[]> => {
      // Use type assertion since new columns aren't in generated types yet
      const { data, error } = await supabase
        .from('tarot_spreads')
        .select('*')
        .order('sort_order' as any, { ascending: true });

      if (error) {
        console.error('[Spreads] Error fetching spreads:', error);
        throw error;
      }
      
      // Map and filter to our interface (filter is_enabled client-side since column not in types yet)
      return (data || [])
        .filter((s: any) => s.is_enabled !== false)
        .map((s: any) => ({
          id: s.id,
          name_fr: s.name_fr,
          description_fr: s.description_fr,
          card_count: s.card_count,
          icon: s.icon,
          is_enabled: s.is_enabled ?? true,
          sort_order: s.sort_order ?? 0,
        }));
    },
    staleTime: 60000, // 1 minute cache
  });

  const handleStartReading = (spreadId: string) => {
    if (user) {
      // User is logged in, go directly to reading
      navigate(`/app/tirage/${spreadId}`);
    } else {
      // User not logged in, go to auth with redirect
      navigate('/auth', { state: { from: `/app/tirage/${spreadId}` } });
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Tirages de Tarot | Tarot Dinatoire"
        description="Découvrez notre catalogue de tirages de tarot : Marseille, Amour, Oui-Non, Persan, Lenormand, Anges, Belline. Interprétations personnalisées par nos tarologues."
      />

      <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <header className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Catalogue des Tirages
            </div>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Choisissez votre Tirage
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explorez nos différents tirages de tarot, chacun conçu pour répondre à vos questions spécifiques.
            </p>
          </header>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-20">
              <p className="text-destructive">Une erreur est survenue lors du chargement des tirages.</p>
              <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
                Réessayer
              </Button>
            </div>
          )}

          {/* Spreads Grid */}
          {spreads && spreads.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {spreads.map((spread) => (
                <article
                  key={spread.id}
                  className="group relative p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
                >
                  {/* Icon */}
                  <div className="text-4xl mb-4">{spread.icon || '🔮'}</div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h2 className="font-serif text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                      {spread.name_fr}
                    </h2>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {spread.description_fr || 'Découvrez ce tirage unique.'}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        {spread.card_count} cartes
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Button
                    onClick={() => handleStartReading(spread.id)}
                    className="w-full mt-6 btn-mystic group/btn"
                  >
                    <span className="flex items-center gap-2">
                      Commencer
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </span>
                  </Button>
                </article>
              ))}
            </div>
          )}

          {/* Empty State */}
          {spreads && spreads.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Aucun tirage disponible pour le moment.</p>
            </div>
          )}

          {/* SEO Content */}
          <section className="mt-16 prose prose-sm dark:prose-invert max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-2xl font-semibold">À propos de nos Tirages de Tarot</h2>
            <p className="text-muted-foreground">
              Notre application propose une variété de tirages de tarot adaptés à toutes vos questions. 
              Que vous cherchiez des réponses sur l'amour, la carrière, ou simplement une guidance générale, 
              nos tirages vous offrent des interprétations personnalisées basées sur la sagesse millénaire du tarot.
            </p>
          </section>
        </div>
      </div>
    </Layout>
  );
}