import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTarotCards } from '@/hooks/useTarotCards';
import { slugToCard, nameToSlug } from '@/utils/cardSlugUtils';
import { getCardFaceUrl } from '@/utils/tarotImageHelpers';
import {
  ChevronLeft, ChevronRight, RefreshCw, Star, RotateCcw,
  Sparkles, BookOpen, Moon, Sun, ArrowLeft
} from 'lucide-react';
import type { TarotCard } from '@/types/tarot';

const SITE_URL = 'https://tarotdivinatoire.app';

// ── JSON-LD structured data for a card ──────────────────────────────────────
function buildJsonLd(card: TarotCard, slug: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${card.nom_fr} - Signification & Interpretation Tarot`,
    description: card.meaning_upright_fr ?? `Decouvrez la signification de la carte ${card.nom_fr} du tarot.`,
    url: `${SITE_URL}/tarot/${slug}`,
    author: { '@type': 'Organization', name: 'Tarot Divinatoire' },
    publisher: {
      '@type': 'Organization',
      name: 'Tarot Divinatoire',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icons/icon-192x192.png` },
    },
    image: card.image_url ?? `${SITE_URL}/og-image.png`,
    keywords: (card.keywords_fr ?? []).join(', '),
    inLanguage: 'fr',
    about: {
      '@type': 'Thing',
      name: `Carte de Tarot - ${card.nom_fr}`,
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/tarot/${slug}` },
  };
}

// ── Daily insight fetcher ─────────────────────────────────────────────────────
interface DailyInsight {
  titre: string;
  message: string;
  question: string;
  energie: string;
}

function useDailyInsight(cardId: string | undefined) {
  return useQuery({
    queryKey: ['card-insight', cardId],
    queryFn: async () => {
      if (!cardId) return null;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/card-insight?card_id=${encodeURIComponent(cardId)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch insight');
      return res.json() as Promise<{ insight: DailyInsight; orientation: string; date: string }>;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
    enabled: !!cardId,
    retry: 1,
  });
}


// ── Keyword pill ──────────────────────────────────────────────────────────────
function KeywordPill({ word }: { word: string }) {
  return (
    <Badge variant="outline" className="text-xs border-primary/30 text-primary/80 bg-primary/5">
      {word}
    </Badge>
  );
}

// ── Section block ─────────────────────────────────────────────────────────────
function Section({
  icon,
  title,
  children,
  delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h2 className="font-serif text-lg font-semibold text-foreground">{title}</h2>
      </div>
      <div className="text-muted-foreground leading-relaxed text-sm">{children}</div>
    </motion.section>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TarotCardMeaning() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: allCards, isLoading: cardsLoading } = useTarotCards();

  // Resolve card from slug
  const card = allCards && slug ? slugToCard(slug, allCards) : undefined;
  const notFound = !cardsLoading && !card;

  // Adjacent cards for prev/next navigation
  const cardIndex = allCards && card ? allCards.findIndex(c => c.id === card.id) : -1;
  const prevCard = cardIndex > 0 && allCards ? allCards[cardIndex - 1] : null;
  const nextCard = allCards && cardIndex < (allCards.length - 1) ? allCards[cardIndex + 1] : null;

  // Daily insight
  const { data: insightData, isLoading: insightLoading, refetch: refetchInsight } = useDailyInsight(card?.id);

  // Image path
  const imagePath = card ? getCardFaceUrl(card) : null;

  // Spiritual interpretation derived from meanings + keywords
  const spiritualInterpretation = card
    ? `La carte ${card.nom_fr} nous invite a explorer les profondeurs de notre etre interieur. ${
        card.type === 'major'
          ? "Appartenant aux Arcanes Majeures, elle represente une energie universelle et archetyapale qui transcende le quotidien."
          : "Issue des Arcanes Mineures, elle reflete les nuances de notre vie quotidienne et nos interactions avec le monde."
      } ${card.meaning_upright_fr ? `Sur le plan spirituel : ${card.meaning_upright_fr.split('.')[0]}.` : ''}`
    : '';

  // JSON-LD injection
  useEffect(() => {
    if (!card || !slug) return;
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'card-jsonld';
    script.textContent = JSON.stringify(buildJsonLd(card, slug));
    document.head.appendChild(script);
    return () => {
      document.getElementById('card-jsonld')?.remove();
    };
  }, [card, slug]);

  if (cardsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8">
        <h1 className="font-serif text-2xl text-foreground">Carte introuvable</h1>
        <p className="text-muted-foreground text-center">
          La carte "{slug}" n'existe pas dans notre tarot.
        </p>
        <Button variant="outline" asChild>
          <Link to="/tarot">Voir toutes les cartes</Link>
        </Button>
      </div>
    );
  }

  const pageTitle = `${card!.nom_fr} - Signification Tarot | Tarot Divinatoire`;
  const pageDesc = card!.meaning_upright_fr
    ? `${card!.nom_fr} : ${card!.meaning_upright_fr.slice(0, 150)}...`
    : `Decouvrez la signification de la carte ${card!.nom_fr} du tarot, ses interpretations droite et inversee, et la guidance spirituelle du jour.`;

  return (
    <>
      <SEOHead
        title={pageTitle}
        description={pageDesc}
        ogTitle={`${card!.nom_fr} - Tarot`}
        ogDescription={pageDesc}
        canonical={`${SITE_URL}/tarot/${slug}`}
      />

      <div className="min-h-screen bg-background">
        {/* Nav bar */}
        <nav className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tarot" className="flex items-center gap-1.5 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                Toutes les cartes
              </Link>
            </Button>
            <div className="flex items-center gap-1">
              {prevCard && (
                <Button variant="ghost" size="icon" asChild title={prevCard.nom_fr}>
                  <Link to={`/tarot/${nameToSlug(prevCard.nom_fr)}`}>
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                </Button>
              )}
              {nextCard && (
                <Button variant="ghost" size="icon" asChild title={nextCard.nom_fr}>
                  <Link to={`/tarot/${nameToSlug(nextCard.nom_fr)}`}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-4 py-10 space-y-10">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-[200px_1fr] gap-8 items-start"
          >
            {/* Card image */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-36 md:w-48 aspect-[2/3] rounded-xl overflow-hidden border border-primary/20 shadow-lg shadow-primary/10">
                {imagePath ? (
                  <img
                    src={imagePath}
                    alt={card!.nom_fr}
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-b from-primary/20 to-primary/5 flex items-center justify-center">
                    <Sparkles className="h-12 w-12 text-primary/40" />
                  </div>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                {card!.type === 'major' ? 'Arcane Majeur' : 'Arcane Mineur'}
                {card!.numero !== null ? ` • ${card!.numero}` : ''}
              </Badge>
            </div>

            {/* Title + keywords */}
            <div className="space-y-4">
              <div>
                <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground leading-tight">
                  {card!.nom_fr}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Signification & Interpretation du Tarot
                </p>
              </div>

              {card!.keywords_fr && card!.keywords_fr.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {card!.keywords_fr.map(kw => (
                    <KeywordPill key={kw} word={kw} />
                  ))}
                </div>
              )}

              <Button asChild size="sm" className="mt-2">
                <Link to="/auth">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                  Tirer cette carte maintenant
                </Link>
              </Button>
            </div>
          </motion.div>

          <Separator />

          {/* Meanings grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <Section icon={<Sun className="h-4 w-4" />} title="Signification droite" delay={0.1}>
              <p>{card!.meaning_upright_fr ?? 'Interpretation non disponible.'}</p>
            </Section>
            <Section icon={<RotateCcw className="h-4 w-4" />} title="Signification inversee" delay={0.2}>
              <p>{card!.meaning_reversed_fr ?? 'Interpretation inversee non disponible.'}</p>
            </Section>
          </div>

          <Separator />

          {/* Spiritual interpretation */}
          <Section icon={<Moon className="h-4 w-4" />} title="Interpretation spirituelle" delay={0.3}>
            <p>{spiritualInterpretation}</p>
          </Section>

          <Separator />

          {/* AI Daily Insight */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 to-background p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-serif text-lg font-semibold text-foreground">
                  Guidance IA du jour
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetchInsight()}
                disabled={insightLoading}
                title="Nouvelle guidance"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${insightLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <AnimatePresence mode="wait">
              {insightLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`h-4 bg-muted rounded animate-pulse ${i === 3 ? 'w-2/3' : 'w-full'}`} />
                  ))}
                </motion.div>
              ) : insightData?.insight ? (
                <motion.div
                  key="insight"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{insightData.insight.titre}</h3>
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                      {insightData.insight.energie}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {insightData.insight.message}
                  </p>
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground italic">
                      <Star className="h-3 w-3 inline mr-1 text-primary/60" />
                      {insightData.insight.question}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="fallback"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-muted-foreground"
                >
                  La guidance du jour sera disponible dans un instant...
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          <Separator />

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center space-y-4 py-4"
          >
            <div className="flex items-center gap-2 justify-center">
              <BookOpen className="h-4 w-4 text-primary" />
              <p className="text-sm text-muted-foreground">
                Envie d'une lecture complete avec IA ?
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link to="/auth">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Commencer mon tirage
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/tarot">Voir toutes les cartes</Link>
              </Button>
            </div>
          </motion.div>
        </main>

        {/* Footer breadcrumb */}
        <footer className="border-t border-border/50 mt-16 py-6">
          <div className="max-w-4xl mx-auto px-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
            <span>/</span>
            <Link to="/tarot" className="hover:text-foreground transition-colors">Tarot</Link>
            <span>/</span>
            <span className="text-foreground">{card!.nom_fr}</span>
          </div>
        </footer>
      </div>
    </>
  );
}
