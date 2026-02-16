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
  BookOpen, 
  Loader2, 
  Star, 
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles
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

  // Fetch reading sessions (new persistent model)
  const { data: sessionsData, isLoading: sessionsLoading, error: sessionsError } = useQuery({
    queryKey: ['reading-sessions', page],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from('reading_sessions')
        .select('*, reading_results(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { sessions: (data || []) as unknown as ReadingSession[], total: count || 0 };
    },
  });

  // Fetch legacy readings (old model - for backwards compatibility)
  const { data: legacyData, isLoading: legacyLoading, error: legacyError } = useQuery({
    queryKey: ['readings', page],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from('tarot_readings')
        .select('*', { count: 'exact' })
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

  // Combine sessions and legacy readings into unified list
  const historyItems: HistoryItem[] = useMemo(() => {
    const items: HistoryItem[] = [];

    // Add sessions
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
          is_favorite: false, // Sessions don't have favorites yet
        });
      }
    }

    // Add legacy readings
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

    // Sort by date
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return items;
  }, [sessionsData, legacyData]);

  // Toggle favorite mutation (legacy only)
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
      
      queryClient.setQueryData(['readings', page], (old: { readings: TarotReading[]; total: number } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          readings: old.readings.map(r => 
            r.id === readingId ? { ...r, is_favorite: !currentValue } : r
          ),
        };
      });
      
      return { previous };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(['readings', page], context?.previous);
      toast.error('Erreur lors de la mise à jour');
    },
  });

  // Get card details
  const getCardDetails = (cardId: string) => {
    return allCards?.find(c => c.id === cardId);
  };

  // Filter by search query
  const filteredItems = historyItems.filter(item => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const cardDetails = item.first_card_id ? getCardDetails(item.first_card_id) : null;
    
    // Search in card name
    if (cardDetails?.nom_fr.toLowerCase().includes(query)) return true;
    
    // Search in keywords
    if (cardDetails?.keywords_fr?.some(k => k.toLowerCase().includes(query))) return true;
    
    // Search in summary
    if (item.summary?.toLowerCase().includes(query)) return true;
    
    // Search in question
    if (item.question?.toLowerCase().includes(query)) return true;
    
    return false;
  });

  const totalItems = (sessionsData?.total || 0) + (legacyData?.total || 0);
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  const handleItemClick = (item: HistoryItem) => {
    if (item.type === 'session') {
      navigate(`/app/result/${item.id}`);
    } else {
      navigate(`/app/reading/${item.id}`);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium animate-pulse">Consultation du journal...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (hasError) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <p className="text-destructive">Les énergies sont troubles, réessayez...</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              <Loader2 className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
              <BookOpen className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
              Journal des Tirages
            </h1>
            <p className="text-foreground/80">
              Retrouvez l'historique de tous vos tirages.
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par carte, mot-clé, question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Readings List */}
          {filteredItems.length === 0 ? (
            <div className="p-12 rounded-2xl glass-mystic shadow-soft text-center animate-scale-in">
              <p className="text-foreground/80">
                {searchQuery ? 'Aucun tirage ne correspond à votre recherche.' : 'Vous n\'avez pas encore de tirages.'}
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => navigate('/app/new')} 
                  className="mt-4"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Faire un tirage
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const cardDetails = item.first_card_id ? getCardDetails(item.first_card_id) : null;
                
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="p-5 rounded-xl bg-card border border-border/50 shadow-soft hover:shadow-md transition-shadow animate-fade-in-up"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs text-foreground/70">
                            {new Date(item.created_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          {cardDetails && (
                            <>
                              <span className="text-foreground/60">•</span>
                              <span className="font-medium text-foreground">
                                {cardDetails.nom_fr}
                              </span>
                              <span className="text-xs text-foreground/70">
                                ({item.first_card_orientation === 'upright' ? 'Endroit' : 'Renversée'})
                              </span>
                            </>
                          )}
                        </div>
                        
                        {item.summary && (
                          <p className="text-sm text-foreground/75 line-clamp-2">
                            {item.summary}
                          </p>
                        )}
                      </div>
                      
                      {item.type === 'legacy' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite.mutate({ 
                              readingId: item.id, 
                              currentValue: item.is_favorite 
                            });
                          }}
                          disabled={toggleFavorite.isPending}
                        >
                          <Star 
                            className={`h-5 w-5 ${item.is_favorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
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
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              
              <span className="text-sm text-foreground/80">
                Page {page + 1} sur {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
