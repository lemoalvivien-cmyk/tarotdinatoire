import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowUp, ArrowDown, Loader2, Sparkles, Tag } from 'lucide-react';
import type { TarotCard } from '@/types/tarot';

export default function CardDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: card, isLoading, error } = useQuery({
    queryKey: ['card-detail', id],
    queryFn: async (): Promise<TarotCard | null> => {
      const { data, error } = await supabase
        .from('tarot_cards')
        .select('id, nom_fr, type, numero, meaning_upright_fr, meaning_reversed_fr, keywords_fr, image_url')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[CardDetail] Error:', error);
        return null;
      }

      return {
        ...data,
        type: data.type as 'major' | 'minor',
      };
    },
    staleTime: 60000,
    enabled: !!id,
  });

  // Get related cards (same type, different card)
  const { data: relatedCards } = useQuery({
    queryKey: ['related-cards', card?.type, card?.id],
    queryFn: async (): Promise<TarotCard[]> => {
      if (!card) return [];
      
      const { data, error } = await supabase
        .from('tarot_cards')
        .select('id, nom_fr, type, numero, meaning_upright_fr, meaning_reversed_fr, keywords_fr, image_url')
        .eq('type', card.type)
        .neq('id', card.id)
        .limit(4);

      if (error) return [];

      return data.map(c => ({
        ...c,
        type: c.type as 'major' | 'minor',
      }));
    },
    enabled: !!card,
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !card) {
    return (
      <Layout>
        <SEOHead title="Carte non trouvée" description="Cette carte n'existe pas." />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Cette carte n'existe pas.</p>
          <Button variant="outline" asChild>
            <Link to="/cartes">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Toutes les cartes
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const isArcane = card.type === 'major';
  const arcaneLabel = isArcane ? 'Arcane Majeur' : 'Arcane Mineur';
  const numeroDisplay = card.numero !== null ? (isArcane ? `${card.numero}` : `${card.numero}`) : '';

  return (
    <Layout>
      <SEOHead
        title={`${card.nom_fr} - Signification Tarot | Sens Endroit & Renversé`}
        description={`Découvrez la signification de ${card.nom_fr} dans le tarot. Interprétation à l'endroit et renversé, mots-clés et conseils de lecture.`}
      />

      <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/cartes" className="hover:text-primary transition-colors">
              Cartes
            </Link>
            <span>/</span>
            <span className="text-foreground">{card.nom_fr}</span>
          </nav>

          {/* Header */}
          <header className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* Card Image */}
            <div className="md:col-span-1 flex justify-center">
              <div className="relative group">
                {card.image_url ? (
                  <img
                    src={card.image_url}
                    alt={card.nom_fr}
                    className="w-48 md:w-56 rounded-xl shadow-2xl border border-border/50 transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-48 md:w-56 h-80 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-border/50 flex items-center justify-center">
                    <span className="text-6xl">🎴</span>
                  </div>
                )}
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-lg">
                  {arcaneLabel}
                </div>
              </div>
            </div>

            {/* Card Info */}
            <div className="md:col-span-2 space-y-6">
              <div>
                {numeroDisplay && (
                  <span className="text-sm text-muted-foreground font-medium">
                    {isArcane ? `N° ${numeroDisplay}` : `Carte ${numeroDisplay}`}
                  </span>
                )}
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-1">
                  {card.nom_fr}
                </h1>
              </div>

              {/* Keywords */}
              {card.keywords_fr && card.keywords_fr.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <Tag className="h-4 w-4" />
                    Mots-clés
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {card.keywords_fr.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="pt-4">
                <Button asChild className="btn-mystic">
                  <Link to="/tirages">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Faire un tirage avec cette carte
                  </Link>
                </Button>
              </div>
            </div>
          </header>

          {/* Meanings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Upright */}
            <section className="p-6 rounded-2xl border border-border/50 bg-gradient-to-br from-emerald-500/5 to-transparent space-y-4">
              <h2 className="font-serif text-xl font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <ArrowUp className="h-5 w-5" />
                Sens Endroit
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {card.meaning_upright_fr || 'Signification à l\'endroit non disponible.'}
              </p>
            </section>

            {/* Reversed */}
            <section className="p-6 rounded-2xl border border-border/50 bg-gradient-to-br from-rose-500/5 to-transparent space-y-4">
              <h2 className="font-serif text-xl font-semibold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <ArrowDown className="h-5 w-5" />
                Sens Renversé
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {card.meaning_reversed_fr || 'Signification renversée non disponible.'}
              </p>
            </section>
          </div>

          {/* Reading Tips */}
          <section className="p-6 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm space-y-4">
            <h2 className="font-serif text-xl font-semibold">Conseils de lecture</h2>
            <div className="text-muted-foreground space-y-3">
              <p>
                <strong>{card.nom_fr}</strong> est {isArcane ? 'un Arcane Majeur' : 'un Arcane Mineur'}, 
                ce qui signifie {isArcane 
                  ? 'qu\'elle représente des forces majeures et des leçons de vie importantes' 
                  : 'qu\'elle concerne les aspects quotidiens et pratiques de la vie'
                }.
              </p>
              <p>
                Lors de votre tirage, observez les cartes environnantes pour nuancer l'interprétation. 
                L'orientation (endroit ou renversé) modifie significativement le message de la carte.
              </p>
            </div>
          </section>

          {/* Related Cards */}
          {relatedCards && relatedCards.length > 0 && (
            <section className="space-y-6">
              <h2 className="font-serif text-2xl font-semibold text-center">
                Autres {isArcane ? 'Arcanes Majeurs' : 'Arcanes Mineurs'}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedCards.map((relCard) => (
                  <Link
                    key={relCard.id}
                    to={`/cartes/${relCard.id}`}
                    className="group p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card/80 hover:border-primary/30 transition-all text-center"
                  >
                    {relCard.image_url ? (
                      <img
                        src={relCard.image_url}
                        alt={relCard.nom_fr}
                        className="w-16 h-24 mx-auto rounded-lg object-cover mb-3 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-16 h-24 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                        <span className="text-2xl">🎴</span>
                      </div>
                    )}
                    <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {relCard.nom_fr}
                    </h3>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* CTA Footer */}
          <div className="text-center pt-8 border-t border-border/30">
            <h2 className="font-serif text-2xl font-semibold mb-4">
              Découvrez {card.nom_fr} dans votre tirage
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild className="btn-mystic">
                <Link to="/tirages">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Choisir un tirage
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/cartes">
                  Voir toutes les cartes
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
