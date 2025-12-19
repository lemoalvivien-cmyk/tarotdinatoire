import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, Crown, Wand2 } from 'lucide-react';
import type { TarotCard } from '@/types/tarot';

export default function CardsList() {
  const { data: cards, isLoading, error } = useQuery({
    queryKey: ['tarot-cards-public'],
    queryFn: async (): Promise<TarotCard[]> => {
      const { data, error } = await supabase
        .from('tarot_cards')
        .select('id, nom_fr, type, numero, meaning_upright_fr, meaning_reversed_fr, keywords_fr, image_url')
        .order('type')
        .order('numero');

      if (error) throw error;

      return data.map(card => ({
        ...card,
        type: card.type as 'major' | 'minor',
      }));
    },
    staleTime: 60000,
  });

  const majorCards = cards?.filter(c => c.type === 'major') || [];
  const minorCards = cards?.filter(c => c.type === 'minor') || [];

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEOHead
        title="Toutes les Cartes du Tarot - Significations & Interprétations"
        description="Explorez les 78 cartes du Tarot : 22 Arcanes Majeurs et 56 Arcanes Mineurs. Découvrez leurs significations à l'endroit et renversé, mots-clés et conseils."
      />

      <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <header className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Encyclopédie du Tarot
            </div>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Les Cartes du Tarot
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez les 78 cartes du tarot, leurs significations et leurs messages pour votre vie.
            </p>
          </header>

          {error && (
            <div className="text-center py-12">
              <p className="text-destructive">Erreur lors du chargement des cartes.</p>
              <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
                Réessayer
              </Button>
            </div>
          )}

          {/* Major Arcana */}
          {majorCards.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Crown className="h-6 w-6 text-primary" />
                <h2 className="font-serif text-2xl font-semibold">
                  Les 22 Arcanes Majeurs
                </h2>
              </div>
              <p className="text-muted-foreground">
                Les Arcanes Majeurs représentent les grandes leçons de vie et les forces cosmiques qui influencent notre destinée.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {majorCards.map((card) => (
                  <Link
                    key={card.id}
                    to={`/cartes/${card.id}`}
                    className="group p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card/80 hover:border-primary/30 transition-all text-center"
                  >
                    {card.image_url ? (
                      <img
                        src={card.image_url}
                        alt={card.nom_fr}
                        className="w-20 h-32 mx-auto rounded-lg object-cover mb-3 group-hover:scale-105 transition-transform shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-32 mx-auto rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-3 border border-border/30">
                        <span className="text-3xl">🎴</span>
                      </div>
                    )}
                    <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {card.nom_fr}
                    </h3>
                    {card.numero !== null && (
                      <span className="text-xs text-muted-foreground">N° {card.numero}</span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Minor Arcana */}
          {minorCards.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Wand2 className="h-6 w-6 text-primary" />
                <h2 className="font-serif text-2xl font-semibold">
                  Les 56 Arcanes Mineurs
                </h2>
              </div>
              <p className="text-muted-foreground">
                Les Arcanes Mineurs reflètent les situations quotidiennes et les défis pratiques de la vie.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {minorCards.map((card) => (
                  <Link
                    key={card.id}
                    to={`/cartes/${card.id}`}
                    className="group p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card/80 hover:border-primary/30 transition-all text-center"
                  >
                    {card.image_url ? (
                      <img
                        src={card.image_url}
                        alt={card.nom_fr}
                        className="w-20 h-32 mx-auto rounded-lg object-cover mb-3 group-hover:scale-105 transition-transform shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-32 mx-auto rounded-lg bg-gradient-to-br from-secondary/50 to-secondary/20 flex items-center justify-center mb-3 border border-border/30">
                        <span className="text-3xl">🎴</span>
                      </div>
                    )}
                    <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {card.nom_fr}
                    </h3>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="text-center pt-8 border-t border-border/30">
            <h2 className="font-serif text-2xl font-semibold mb-4">
              Prêt à découvrir votre tirage ?
            </h2>
            <Button asChild className="btn-mystic" size="lg">
              <Link to="/tirages">
                <Sparkles className="h-5 w-5 mr-2" />
                Choisir un tirage
              </Link>
            </Button>
          </section>

          {/* SEO Content */}
          <footer className="prose prose-sm dark:prose-invert max-w-3xl mx-auto text-center text-muted-foreground">
            <h2 className="font-serif text-xl font-semibold text-foreground">Comprendre les Cartes du Tarot</h2>
            <p>
              Le Tarot se compose de 78 cartes divisées en deux groupes : les 22 Arcanes Majeurs 
              et les 56 Arcanes Mineurs. Chaque carte possède une signification unique qui varie 
              selon son orientation (endroit ou renversé) et sa position dans le tirage.
            </p>
          </footer>
        </div>
      </div>
    </Layout>
  );
}
