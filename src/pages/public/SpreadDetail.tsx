import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, ArrowRight, ArrowLeft, Loader2, Clock, Target, Heart } from 'lucide-react';

interface SpreadPosition {
  key: string;
  name: string;
  description?: string;
}

interface TarotSpread {
  id: string;
  name: string;
  name_fr: string;
  description: string | null;
  description_fr: string | null;
  card_count: number;
  icon: string | null;
  positions: SpreadPosition[];
}

export default function SpreadDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: spread, isLoading, error } = useQuery({
    queryKey: ['spread-detail', slug],
    queryFn: async (): Promise<TarotSpread | null> => {
      const { data, error } = await supabase
        .from('tarot_spreads')
        .select('*')
        .eq('id', slug)
        .single();

      if (error) {
        console.error('[SpreadDetail] Error:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        name_fr: data.name_fr,
        description: data.description,
        description_fr: data.description_fr,
        card_count: data.card_count,
        icon: data.icon,
        positions: Array.isArray(data.positions) ? (data.positions as unknown as SpreadPosition[]) : [],
      };
    },
    staleTime: 60000,
    enabled: !!slug,
  });

  const handleStartReading = () => {
    if (user) {
      navigate(`/app/tirage/${slug}`);
    } else {
      navigate('/auth', { state: { from: `/app/tirage/${slug}` } });
    }
  };

  // SEO content based on spread type
  const getSEOContent = (spreadId: string) => {
    const content: Record<string, { tips: string[]; ideal: string[] }> = {
      'croix-celtique': {
        tips: [
          'Prenez le temps de formuler clairement votre question avant le tirage',
          'Observez les liens entre les cartes qui se font face',
          'La carte finale représente l\'aboutissement probable de la situation',
        ],
        ideal: [
          'Questions complexes nécessitant une vue d\'ensemble',
          'Situations avec de nombreux facteurs à considérer',
          'Projets à long terme',
        ],
      },
      'tirage-3-cartes': {
        tips: [
          'Idéal pour une première consultation quotidienne',
          'Observez la progression temporelle entre les cartes',
          'Notez vos impressions immédiates avant l\'analyse',
        ],
        ideal: [
          'Questions simples et directes',
          'Guidance quotidienne',
          'Prise de décision rapide',
        ],
      },
      'oui-non': {
        tips: [
          'Formulez votre question de manière à obtenir une réponse binaire',
          'Évitez les questions multiples',
          'Faites confiance à votre première intuition',
        ],
        ideal: [
          'Décisions à prendre rapidement',
          'Confirmation d\'une intuition',
          'Questions fermées',
        ],
      },
    };
    return content[spreadId] || {
      tips: [
        'Centrez-vous avant de commencer le tirage',
        'Posez une question claire et précise',
        'Prenez le temps d\'observer chaque carte',
      ],
      ideal: [
        'Exploration personnelle',
        'Guidance spirituelle',
        'Réflexion sur une situation',
      ],
    };
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !spread) {
    return (
      <Layout>
        <SEOHead title="Tirage non trouvé" description="Ce tirage n'existe pas." />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Ce tirage n'existe pas ou n'est plus disponible.</p>
          <Button variant="outline" asChild>
            <Link to="/tirages">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voir tous les tirages
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const seoContent = getSEOContent(spread.id);

  return (
    <Layout>
      <SEOHead
        title={`${spread.name_fr} - Tirage de Tarot Gratuit | Interprétation Personnalisée`}
        description={`Découvrez le ${spread.name_fr} : ${spread.description_fr || `tirage de ${spread.card_count} cartes`}. Obtenez une interprétation personnalisée et des conseils pour votre lecture.`}
      />

      <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/tirages" className="hover:text-primary transition-colors">
              Tirages
            </Link>
            <span>/</span>
            <span className="text-foreground">{spread.name_fr}</span>
          </nav>

          {/* Header */}
          <header className="text-center space-y-6">
            <div className="text-6xl">{spread.icon || '🔮'}</div>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              {spread.name_fr}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {spread.description_fr || 'Un tirage unique pour explorer votre chemin.'}
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium">
                <Target className="h-4 w-4" />
                {spread.card_count} cartes
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                <Clock className="h-4 w-4" />
                ~5 min
              </span>
            </div>
          </header>

          {/* CTA Primary */}
          <div className="text-center">
            <Button size="lg" onClick={handleStartReading} className="btn-mystic text-lg px-8 py-6">
              <Sparkles className="h-5 w-5 mr-2" />
              Commencer ce tirage
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            {!user && (
              <p className="text-sm text-muted-foreground mt-3">
                Connexion requise pour sauvegarder votre tirage
              </p>
            )}
          </div>

          {/* Positions */}
          {spread.positions && spread.positions.length > 0 && (
            <section className="space-y-6">
              <h2 className="font-serif text-2xl font-semibold text-center">
                Les {spread.card_count} positions du tirage
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {spread.positions.map((position, index) => (
                  <div
                    key={position.key}
                    className="p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-sm">
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-medium text-foreground">{position.name}</h3>
                        {position.description && (
                          <p className="text-sm text-muted-foreground mt-1">{position.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tips Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm space-y-4">
              <h3 className="font-serif text-xl font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Conseils pour ce tirage
              </h3>
              <ul className="space-y-3">
                {seoContent.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm space-y-4">
              <h3 className="font-serif text-xl font-semibold flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Idéal pour
              </h3>
              <ul className="space-y-3">
                {seoContent.ideal.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* CTA Secondary */}
          <div className="text-center pt-8 border-t border-border/30">
            <h2 className="font-serif text-2xl font-semibold mb-4">
              Prêt à découvrir votre tirage ?
            </h2>
            <Button size="lg" onClick={handleStartReading} className="btn-mystic">
              <Sparkles className="h-5 w-5 mr-2" />
              Lancer le {spread.name_fr}
            </Button>
          </div>

          {/* SEO Footer */}
          <footer className="prose prose-sm dark:prose-invert max-w-none text-center text-muted-foreground">
            <p>
              Le {spread.name_fr} est l'un des tirages les plus populaires du tarot. 
              Avec ses {spread.card_count} cartes, il offre une vision complète de votre situation 
              et vous guide vers les meilleures décisions. Nos interprétations combinent la sagesse 
              traditionnelle du tarot avec une analyse personnalisée de votre question.
            </p>
          </footer>
        </div>
      </div>
    </Layout>
  );
}
