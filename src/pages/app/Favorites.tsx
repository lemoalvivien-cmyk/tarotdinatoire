import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTarotCards } from '@/hooks/useTarotCards';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Star,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import type { TarotReading, TarotInterpretation, DrawnCard } from '@/types/tarot';

const PAGE_SIZE = 20;

export default function Favorites() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: allCards } = useTarotCards();

  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // ─── O(1) card lookup ─────────────────────────────────────────────────────
  const cardMap = useMemo<Map<string, NonNullable<typeof allCards>[number]>>(() => {
    if (!allCards) return new Map();
    return new Map(allCards.map(c => [c.id, c]));
  }, [allCards]);

  // ─── Query ────────────────────────────────────────────────────────────────
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['readings', 'favorites', page],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await supabase
        .from('tarot_readings')
        .select(
          'id, user_id, spread_id, question, cards, ai_interpretation, user_notes, is_favorite, created_at',
          { count: 'exact' },
        )
        .eq('is_favorite', true)
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      const readings: TarotReading[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        spread_id: item.spread_id,
        question: item.question,
        cards: item.cards as unknown as DrawnCard[],
        ai_interpretation: item.ai_interpretation as unknown as TarotInterpretation | null,
        user_notes: item.user_notes,
        is_favorite: item.is_favorite ?? false,
        created_at: item.created_at,
      }));
      return { readings, total: count || 0 };
    },
  });

  // ─── Remove favorite — optimistic ────────────────────────────────────────
  const removeFavorite = useMutation({
    mutationFn: async (readingId: string) => {
      const { error } = await supabase
        .from('tarot_readings')
        .update({ is_favorite: false })
        .eq('id', readingId);
      if (error) throw error;
      return readingId;
    },
    onMutate: async readingId => {
      await queryClient.cancelQueries({ queryKey: ['readings', 'favorites', page] });
      const previous = queryClient.getQueryData(['readings', 'favorites', page]);
      queryClient.setQueryData(
        ['readings', 'favorites', page],
        (old: { readings: TarotReading[]; total: number } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            readings: old.readings.filter(r => r.id !== readingId),
            total: old.total - 1,
          };
        },
      );
      return { previous };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(['readings', 'favorites', page], context?.previous);
      toast.error('Impossible de mettre à jour le favori');
    },
    onSuccess: () => {
      toast.success('Retiré des favoris');
      queryClient.invalidateQueries({ queryKey: ['readings'] });
    },
  });

  // ─── O(n) search using O(1) map lookup ────────────────────────────────────
  const filteredReadings = useMemo(() => {
    if (!data?.readings) return [];
    if (!searchQuery.trim()) return data.readings;
    const q = searchQuery.toLowerCase();
    return data.readings.filter(reading => {
      const firstCard = reading.cards[0];
      const card = firstCard ? cardMap.get(firstCard.card_id) : null;
      return (
        card?.nom_fr.toLowerCase().includes(q) ||
        card?.keywords_fr?.some(k => k.toLowerCase().includes(q)) ||
        reading.ai_interpretation?.title?.toLowerCase().includes(q) ||
        reading.ai_interpretation?.summary?.toLowerCase().includes(q) ||
        reading.question?.toLowerCase().includes(q)
      );
    });
  }, [data?.readings, searchQuery, cardMap]);

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium animate-pulse">
              Chargement des favoris…
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-4">
            <p className="text-muted-foreground">Impossible de charger vos favoris</p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-14">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-3 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-yellow-400/10 text-yellow-500">
              <Star className="h-7 w-7 fill-yellow-400" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
              Mes Favoris
            </h1>
            <p className="text-muted-foreground text-sm">
              {data?.total ?? 0} tirage{(data?.total ?? 0) !== 1 ? 's' : ''} sauvegardé
              {(data?.total ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Search */}
          {(data?.total ?? 0) > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par carte, mot-clé, question…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {/* Empty state */}
          {filteredReadings.length === 0 ? (
            <div className="p-12 rounded-2xl glass-mystic text-center space-y-4 animate-scale-in">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-7 w-7" />
              </div>
              <p className="text-foreground/80 font-medium">
                {searchQuery
                  ? `Aucun résultat pour « ${searchQuery} »`
                  : "Aucun tirage favori pour l'instant"}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate('/app/new')} className="btn-mystic">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Faire un tirage
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReadings.map(reading => {
                const firstCard = reading.cards[0];
                const card = firstCard ? cardMap.get(firstCard.card_id) : null;
                return (
                  <div
                    key={reading.id}
                    className="group p-4 sm:p-5 rounded-xl bg-card border border-border/50 hover:border-yellow-400/30 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => navigate(`/app/reading/${reading.id}`)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {new Date(reading.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          {card && (
                            <>
                              <span>·</span>
                              <span className="font-medium text-foreground">{card.nom_fr}</span>
                              <span>
                                ({firstCard?.orientation === 'upright' ? 'Endroit' : 'Renversée'})
                              </span>
                            </>
                          )}
                        </div>
                        {reading.question && (
                          <p className="text-sm font-medium text-foreground truncate">
                            {reading.question}
                          </p>
                        )}
                        {reading.ai_interpretation?.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {reading.ai_interpretation.summary}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={e => {
                          e.stopPropagation();
                          removeFavorite.mutate(reading.id);
                        }}
                        disabled={removeFavorite.isPending && removeFavorite.variables === reading.id}
                        title="Retirer des favoris"
                      >
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
