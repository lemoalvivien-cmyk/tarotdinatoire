import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTarotCards } from '@/hooks/useTarotCards';
import { SEOHead } from '@/components/seo/SEOHead';
import { nameToSlug } from '@/utils/cardSlugUtils';
import { getTarotImagePath } from '@/utils/tarotImageHelpers';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Search } from 'lucide-react';
import { useState } from 'react';
import type { TarotCard } from '@/types/tarot';

const SITE_URL = 'https://tarotdivinatoire.app';

const ARCANA_LABELS: Record<string, string> = {
  major: 'Arcanes Majeures',
  minor: 'Arcanes Mineures',
};

function CardThumb({ card }: { card: TarotCard }) {
  const slug = nameToSlug(card.nom_fr);
  const img = getTarotImagePath(card.id, card.image_url);

  return (
    <Link
      to={`/tarot/${slug}`}
      className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
    >
      <div className="w-full aspect-[2/3] rounded-lg overflow-hidden bg-gradient-to-b from-primary/10 to-primary/5">
        {img ? (
          <img
            src={img}
            alt={card.nom_fr}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary/30" />
          </div>
        )}
      </div>
      <p className="text-xs text-center text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
        {card.nom_fr}
      </p>
    </Link>
  );
}

export default function TarotCardsIndex() {
  const { data: cards, isLoading } = useTarotCards();
  const [search, setSearch] = useState('');

  const groups = useMemo(() => {
    if (!cards) return { major: [], minor: [] };
    const q = search.toLowerCase();
    const filtered = q
      ? cards.filter(c => c.nom_fr.toLowerCase().includes(q) || (c.keywords_fr ?? []).some(k => k.toLowerCase().includes(q)))
      : cards;
    return {
      major: filtered.filter(c => c.type === 'major'),
      minor: filtered.filter(c => c.type === 'minor'),
    };
  }, [cards, search]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Signification des 78 Cartes de Tarot',
    description: 'Guide complet des 78 cartes de tarot : Arcanes Majeures et Mineures, significations droite et inversee, interpretations spirituelles.',
    url: `${SITE_URL}/tarot`,
    publisher: { '@type': 'Organization', name: 'Tarot Divinatoire' },
    numberOfItems: cards?.length ?? 78,
  };

  return (
    <>
      <SEOHead
        title="Signification des 78 Cartes de Tarot | Guide Complet"
        description="Decouvrez la signification des 78 cartes de tarot : Arcanes Majeures (Le Fou, Le Monde...) et Mineures. Interpretations droite, inversee et spirituelle avec guidance IA."
        ogTitle="Guide des 78 Cartes de Tarot"
        ogDescription="Signification complete des Arcanes Majeures et Mineures du Tarot Rider-Waite."
        canonical={`${SITE_URL}/tarot`}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <header className="border-b border-border/50 bg-gradient-to-b from-primary/5 to-background py-12 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <Badge variant="outline" className="border-primary/30 text-primary text-xs">
              Guide complet
            </Badge>
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground">
              Les 78 Cartes du Tarot
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
              Explorez la signification des Arcanes Majeures et Mineures. Chaque carte vous revele ses secrets, interpretations droite & inversee, et une guidance IA personnalisee du jour.
            </p>
            <Button asChild size="sm" className="mt-2">
              <Link to="/auth">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Faire mon tirage gratuit
              </Link>
            </Button>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-10 space-y-10">
          {/* Search */}
          <div className="relative max-w-xs mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Chercher une carte..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-11 gap-3">
              {Array.from({ length: 22 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Major arcana */}
              {groups.major.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="font-serif text-xl font-semibold text-foreground">
                      {ARCANA_LABELS.major}
                    </h2>
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {groups.major.length} cartes
                    </Badge>
                  </div>
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: 0.02 } },
                    }}
                    className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-11 gap-2"
                  >
                    {groups.major.map(card => (
                      <motion.div
                        key={card.id}
                        variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                      >
                        <CardThumb card={card} />
                      </motion.div>
                    ))}
                  </motion.div>
                </section>
              )}

              {/* Minor arcana */}
              {groups.minor.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="font-serif text-xl font-semibold text-foreground">
                      {ARCANA_LABELS.minor}
                    </h2>
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {groups.minor.length} cartes
                    </Badge>
                  </div>
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: 0.015 } },
                    }}
                    className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-11 gap-2"
                  >
                    {groups.minor.map(card => (
                      <motion.div
                        key={card.id}
                        variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                      >
                        <CardThumb card={card} />
                      </motion.div>
                    ))}
                  </motion.div>
                </section>
              )}

              {groups.major.length === 0 && groups.minor.length === 0 && (
                <p className="text-center text-muted-foreground py-12">
                  Aucune carte trouvee pour "{search}"
                </p>
              )}
            </>
          )}
        </main>

        {/* Footer breadcrumb */}
        <footer className="border-t border-border/50 mt-10 py-6">
          <div className="max-w-4xl mx-auto px-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
            <span>/</span>
            <span className="text-foreground">Tarot</span>
          </div>
        </footer>
      </div>
    </>
  );
}
