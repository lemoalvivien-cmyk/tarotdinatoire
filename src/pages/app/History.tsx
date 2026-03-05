import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTarotCards, useCardMap } from '@/hooks/useTarotCards';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { STALE_DAILY, rlsSafeRetry } from '@/queries/queryConfig';
import {
  BookOpen,
  Loader2,
  Star,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import type { TarotReading, TarotInterpretation, DrawnCard } from '@/types/tarot';

const PAGE_SIZE = 20;

interface SessionCard {
  card_id: string;
  orientation: 'upright' | 'reversed';
  position_key: string;
}

interface ReadingSession {
  id: string;
  spread_id: string;
  question: string | null;
  selected_cards: SessionCard[];
  created_at: string;
  reading_results: Array<{
    id: string;
    interpretation: TarotInterpretation | null;
  }>;
}

interface HistoryItem {
  id: string;
  type: 'session' | 'legacy';
  created_at: string;
  question: string | null;
  first_card_id: string | null;
  first_card_orientation: 'upright' | 'reversed' | null;
  summary: string | null;
  is_favorite: boolean;
}

export default function History() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: allCards } = useTarotCards();

  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Queries ───────────────────────────────────────────────────────────────
  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    error: sessionsError,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ['reading-sessions', page],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await supabase
        .from('reading_sessions')
        .select(
          'id, spread_id, question, selected_cards, created_at, reading_results(id, interpretation)',
          { count: 'exact' },
        )
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { sessions: (data || []) as unknown as ReadingSession[], total: count || 0 };
    },
  });

  const {
    data: legacyData,
    isLoading: legacyLoading,
    error: legacyError,
    refetch: refetchLegacy,
  } = useQuery({
    queryKey: ['readings', page],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await supabase
        .from('tarot_readings')
        .select(
          'id, user_id, spread_id, question, cards, ai_interpretation, user_notes, is_favorite, created_at',
          { count: 'exact' },
        )
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

  const isLoading = sessionsLoading || legacyLoading;
  const hasError = sessionsError || legacyError;

  // ─── O(1) card lookup map — eliminates O(n²) in filter ────────────────────
  const cardMap = useMemo<Map<string, (typeof allCards)[number]>>(() => {
    if (!allCards) return new Map();
    return new Map(allCards.map(c => [c.id, c]));
  }, [allCards]);

  // ─── Combine + sort — O(n log n) ──────────────────────────────────────────
  const historyItems: HistoryItem[] = useMemo(() => {
    const items: HistoryItem[] = [];

    if (sessionsData?.sessions) {
      for (const session of sessionsData.sessions) {
        const cards = session.selected_cards as unknown as SessionCard[];
        const firstCard = Array.isArray(cards) ? cards[0] : null;
        const result = session.reading_results?.[0];
        const interpretation = result?.interpretation as TarotInterpretation | null;
        items.push({
          id: session.id,
          type: 'session',
          created_at: session.created_at,
          question: session.question,
          first_card_id: firstCard?.card_id || null,
          first_card_orientation: firstCard?.orientation || null,
          summary: interpretation?.summary || null,
          is_favorite: false,
        });
      }
    }

    if (legacyData?.readings) {
      for (const reading of legacyData.readings) {
        const firstCard = reading.cards?.[0];
        items.push({
          id: reading.id,
          type: 'legacy',
          created_at: reading.created_at,
          question: reading.question,
          first_card_id: firstCard?.card_id || null,
          first_card_orientation: firstCard?.orientation || null,
          summary: reading.ai_interpretation?.summary || null,
          is_favorite: reading.is_favorite,
        });
      }
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return items;
  }, [sessionsData, legacyData]);

  // ─── O(n) filtered list using O(1) map lookup ─────────────────────────────
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return historyItems;
    const q = searchQuery.toLowerCase();
    return historyItems.filter(item => {
      const card = item.first_card_id ? cardMap.get(item.first_card_id) : null;
      return (
        card?.nom_fr.toLowerCase().includes(q) ||
        card?.keywords_fr?.some(k => k.toLowerCase().includes(q)) ||
        item.summary?.toLowerCase().includes(q) ||
              item.question?.toLowerCase().includes(q)
      );
    });
  }, [historyItems, searchQuery, cardMap]);


  // ─── Mutations ────────────────────────────────────────────────────────────
  const toggleFavorite = useMutation({
    mutationFn: async ({ readingId, currentValue }: { readingId: string; currentValue: boolean }) => {
      const { error } = await supabase
        .from('tarot_readings')
        .update({ is_favorite: !currentValue })
        .eq('id', readingId);
      if (error) throw error;
      return { readingId, newValue: !currentValue };
    },
    onMutate: async ({ readingId, currentValue }) => {
      await queryClient.cancelQueries({ queryKey: ['readings', page] });
      const previous = queryClient.getQueryData(['readings', page]);
      queryClient.setQueryData(
        ['readings', page],
        (old: { readings: TarotReading[]; total: number } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            readings: old.readings.map(r =>
              r.id === readingId ? { ...r, is_favorite: !currentValue } : r,
            ),
          };
        },
      );
      return { previous };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(['readings', page], context?.previous);
      toast.error('Impossible de mettre à jour le favori');
    },
    onSuccess: ({ newValue }) => {
      toast.success(newValue ? 'Ajouté aux favoris ✨' : 'Retiré des favoris');
    },
  });

  const totalItems = (sessionsData?.total || 0) + (legacyData?.total || 0);
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const handleItemClick = (item: HistoryItem) => {
    if (item.type === 'session') navigate(`/app/result/${item.id}`);
    else navigate(`/app/reading/${item.id}`);
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium animate-pulse">
              Consultation du journal…
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (hasError) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-4">
            <p className="text-muted-foreground">Les énergies sont troubles, réessayez…</p>
            <Button
              onClick={() => { refetchSessions(); refetchLegacy(); }}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-14">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-3 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary">
              <BookOpen className="h-7 w-7" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
              Journal des Tirages
            </h1>
            <p className="text-muted-foreground text-sm">
              {totalItems} tirage{totalItems !== 1 ? 's' : ''} au total
            </p>
          </div>

          {/* Search */}
          {totalItems > 0 && (
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
          {filteredItems.length === 0 ? (
            <div className="p-12 rounded-2xl glass-mystic text-center space-y-4 animate-scale-in">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-7 w-7" />
              </div>
              <p className="text-foreground/80 font-medium">
                {searchQuery
                  ? `Aucun résultat pour « ${searchQuery} »`
                  : "Votre journal est vide pour l'instant"}
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
              {filteredItems.map(item => {
                const card = item.first_card_id ? cardMap.get(item.first_card_id) : null;
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="group p-4 sm:p-5 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {new Date(item.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          {card && (
                            <>
                              <span>·</span>
                              <span className="font-medium text-foreground">{card.nom_fr}</span>
                              <span className="text-muted-foreground">
                                ({item.first_card_orientation === 'upright' ? 'Endroit' : 'Renversée'})
                              </span>
                            </>
                          )}
                        </div>
                        {item.question && (
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.question}
                          </p>
                        )}
                        {item.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.summary}
                          </p>
                        )}
                      </div>

                      {item.type === 'legacy' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={e => {
                            e.stopPropagation();
                            toggleFavorite.mutate({
                              readingId: item.id,
                              currentValue: item.is_favorite,
                            });
                          }}
                          disabled={toggleFavorite.isPending}
                        >
                          <Star
                            className={`h-4 w-4 transition-colors ${
                              item.is_favorite
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground group-hover:text-yellow-400'
                            }`}
                          />
                        </Button>
                      )}
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
