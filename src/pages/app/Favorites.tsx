import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTarotCards, useCardMap } from '@/hooks/useTarotCards';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useReadingsQuery, PAGE_SIZE } from '@/queries/useReadingsQuery';
import { Star, Search, ChevronLeft, ChevronRight, Sparkles, RefreshCw } from 'lucide-react';
import { ListSkeleton } from '@/components/ui/skeleton';

export default function Favorites() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: allCards } = useTarotCards();
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const cardMap = useCardMap(allCards);

  const { data, isLoading, error, refetch } = useReadingsQuery({ onlyFavorites: true, page });

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  // ─── Remove favorite — optimistic ────────────────────────────────────────
  const removeFavorite = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('reading_sessions')
        .update({ is_favorite: false })
        .eq('id', sessionId);
      if (error) throw error;
      return sessionId;
    },
    onMutate: async sessionId => {
      const key = [/* qk.readings prefix */ 'readings', { onlyFavorites: true, page }];
      await queryClient.cancelQueries({ queryKey: ['readings'] });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (old: typeof data) => {
        if (!old) return old;
        return { ...old, rows: old.rows.filter(r => r.id !== sessionId), total: old.total - 1 };
      });
      return { previous };
    },
    onError: (_, __, ctx) => {
      queryClient.invalidateQueries({ queryKey: ['readings'] });
      toast.error('Impossible de mettre à jour le favori');
    },
    onSuccess: () => {
      toast.success('Retiré des favoris');
      queryClient.invalidateQueries({ queryKey: ['readings'] });
    },
  });

  // ─── O(n) search ──────────────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    const rows = data?.rows ?? [];
    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(item => {
      const cards = Array.isArray(item.selected_cards) ? item.selected_cards as Array<{ card_id: string }> : [];
      const card = cards[0] ? cardMap.get(cards[0].card_id) : null;
      const result = item.reading_results?.[0];
      return (
        card?.nom_fr.toLowerCase().includes(q) ||
        card?.keywords_fr?.some(k => k.toLowerCase().includes(q)) ||
        result?.interpretation?.summary?.toLowerCase().includes(q) ||
        item.question?.toLowerCase().includes(q)
      );
    });
  }, [data?.rows, searchQuery, cardMap]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 md:py-14">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="page-header">
              <div className="page-header-icon" style={{ background: 'hsl(var(--color-favorite) / 0.15)', color: 'hsl(var(--color-favorite))' }}>
                <Star className="h-7 w-7 icon-favorite" />
              </div>
              <h1 className="page-header-title">Mes Favoris</h1>
            </div>
            <ListSkeleton count={4} />
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-4">
            <p className="text-muted-foreground">Impossible de charger vos favoris</p>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />Réessayer
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
          <div className="page-header">
            <div className="page-header-icon" style={{ background: 'hsl(var(--color-favorite) / 0.15)', color: 'hsl(var(--color-favorite))' }}>
              <Star className="h-7 w-7 icon-favorite" />
            </div>
            <h1 className="page-header-title">Mes Favoris</h1>
            <p className="page-header-subtitle">
              {data?.total ?? 0} tirage{(data?.total ?? 0) !== 1 ? 's' : ''} sauvegardé{(data?.total ?? 0) !== 1 ? 's' : ''}
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
          {filteredItems.length === 0 ? (
            <div className="p-12 rounded-2xl glass-mystic text-center space-y-4 animate-scale-in">
              <div className="page-header-icon mx-auto"><Sparkles className="h-7 w-7" /></div>
              <p className="text-foreground/80 font-medium">
                {searchQuery ? `Aucun résultat pour « ${searchQuery} »` : "Aucun tirage favori pour l'instant"}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate('/app/new')} className="btn-mystic">
                  <Sparkles className="mr-2 h-4 w-4" />Faire un tirage
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map(item => {
                const cards = Array.isArray(item.selected_cards) ? item.selected_cards as Array<{ card_id: string; orientation: string }> : [];
                const firstCard = cards[0];
                const card = firstCard ? cardMap.get(firstCard.card_id) : null;
                const result = item.reading_results?.[0];

                return (
                  <div
                    key={item.id}
                    className="history-item group"
                    onClick={() => navigate(`/app/reading/${item.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && navigate(`/app/reading/${item.id}`)}
                    aria-label={`Voir le tirage favori du ${new Date(item.created_at).toLocaleDateString('fr-FR')}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {new Date(item.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </span>
                          {card && (
                            <>
                              <span>·</span>
                              <span className="font-medium text-foreground">{card.nom_fr}</span>
                              <span>({firstCard?.orientation === 'upright' ? 'Endroit' : 'Renversée'})</span>
                            </>
                          )}
                        </div>
                        {item.question && (
                          <p className="text-sm font-medium text-foreground truncate">{item.question}</p>
                        )}
                        {result?.interpretation?.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{result.interpretation.summary}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost" size="icon" className="shrink-0"
                        onClick={e => { e.stopPropagation(); removeFavorite.mutate(item.id); }}
                        disabled={removeFavorite.isPending && removeFavorite.variables === item.id}
                        title="Retirer des favoris"
                      >
                        <Star className="h-4 w-4 icon-favorite group-hover:scale-110 transition-transform" />
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
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" />Précédent
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums">{page + 1} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                Suivant<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
