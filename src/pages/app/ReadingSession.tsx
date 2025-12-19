import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTarotCards } from '@/hooks/useTarotCards';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { RefreshCw, AlertTriangle, Home, Star, ArrowLeft } from 'lucide-react';
import type { TarotInterpretation, DrawnCard } from '@/types/tarot';
import { generateFallbackInterpretation, createFallbackForStorage, type FallbackInterpretationData } from '@/utils/tarotFallback';
import { InterpretationDisplay } from '@/components/tarot/InterpretationDisplay';
import { MysticBackground, MysticButton } from '@/components/mystic';
import { StepHeader, TarotCard, OracleLoader } from '@/components/tarot-ui';

interface SpreadPosition {
  key: string;
  label: string;
  label_fr?: string;
}

interface SessionCard {
  card_id: string;
  orientation: 'upright' | 'reversed';
  position_key: string;
}

export default function ReadingSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: allCards } = useTarotCards();
  const queryClient = useQueryClient();

  const [interpretation, setInterpretation] = useState<TarotInterpretation | FallbackInterpretationData | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Fetch session
  const { data: session, isLoading: sessionLoading, error: sessionError } = useQuery({
    queryKey: ['reading-session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_sessions')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Session not found');
      return data;
    },
    enabled: !!sessionId,
  });

  // Fetch existing result
  const { data: existingResult, isLoading: resultLoading } = useQuery({
    queryKey: ['reading-result', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_results')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  // Fetch spread for positions
  const { data: spread } = useQuery({
    queryKey: ['spread', session?.spread_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarot_spreads')
        .select('id, name_fr, positions')
        .eq('id', session?.spread_id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!session?.spread_id,
  });

  // Parse positions
  const positions: SpreadPosition[] = useMemo(() => {
    if (!spread?.positions) return [{ key: 'single', label: 'Carte unique' }];
    try {
      const parsed = spread.positions as unknown as SpreadPosition[];
      return Array.isArray(parsed) ? parsed : [{ key: 'single', label: 'Carte unique' }];
    } catch {
      return [{ key: 'single', label: 'Carte unique' }];
    }
  }, [spread]);

  // Parse selected cards from session
  const selectedCards: SessionCard[] = useMemo(() => {
    if (!session?.selected_cards) return [];
    try {
      return session.selected_cards as unknown as SessionCard[];
    } catch {
      return [];
    }
  }, [session]);

  // Set interpretation from existing result
  useEffect(() => {
    if (existingResult?.interpretation) {
      setInterpretation(existingResult.interpretation as unknown as TarotInterpretation | FallbackInterpretationData);
    }
  }, [existingResult]);

  // Request AI interpretation if no result exists
  useEffect(() => {
    if (!session || !user || resultLoading || existingResult || interpretation || isInterpreting) return;

    const requestInterpretation = async () => {
      setIsInterpreting(true);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;

        if (!accessToken) {
          toast.error('Session expirée. Veuillez vous reconnecter.');
          navigate('/auth');
          return;
        }

        // Build cards array for API
        const drawnCards: DrawnCard[] = selectedCards.map(sc => ({
          card_id: sc.card_id,
          orientation: sc.orientation,
          position_key: sc.position_key,
        }));

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tarot-interpretation`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              spread_id: session.spread_id,
              question: session.question || null,
              cards: drawnCards,
            }),
          }
        );

        if (response.status === 401) {
          toast.error('Session expirée. Veuillez vous reconnecter.');
          navigate('/auth');
          return;
        }

        let interpretationData: TarotInterpretation | FallbackInterpretationData;

        // Handle 402 - Credits exhausted
        if (response.status === 402 || response.status === 429) {
          const firstCard = selectedCards[0];
          const cardDetails = allCards?.find(c => c.id === firstCard?.card_id);
          if (cardDetails && firstCard) {
            const fallbackInterp = generateFallbackInterpretation(
              cardDetails,
              firstCard.orientation,
              session.question || undefined
            );
            interpretationData = createFallbackForStorage(
              fallbackInterp,
              response.status === 402 ? 'INSUFFICIENT_BALANCE' : 'RATE_LIMITED'
            );
            toast.warning(
              response.status === 402
                ? 'Crédits IA épuisés. Une interprétation simplifiée a été générée.'
                : 'Limite quotidienne atteinte. Une interprétation simplifiée a été générée.',
              { duration: 6000 }
            );
          } else {
            throw new Error('Cannot generate fallback');
          }
        } else if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Erreur lors de l\'interprétation');
        } else {
          interpretationData = await response.json();
        }

        // Save result to database
        const { error: insertError } = await supabase
          .from('reading_results')
          .insert({
            session_id: sessionId,
            interpretation: JSON.parse(JSON.stringify(interpretationData)),
          });

        if (insertError) {
          console.error('Error saving result:', insertError);
        }

        setInterpretation(interpretationData);
      } catch (error) {
        console.error('Interpretation error:', error);
        
        // Generate fallback
        const firstCard = selectedCards[0];
        const cardDetails = allCards?.find(c => c.id === firstCard?.card_id);
        if (cardDetails && firstCard) {
          const fallbackInterp = generateFallbackInterpretation(
            cardDetails,
            firstCard.orientation,
            session.question || undefined
          );
          const fallbackData = createFallbackForStorage(fallbackInterp, 'AI_ERROR');
          
          // Try to save fallback
          await supabase
            .from('reading_results')
            .insert({
              session_id: sessionId,
              interpretation: JSON.parse(JSON.stringify(fallbackData)),
            });

          setInterpretation(fallbackData);
        }
        toast.error('Erreur IA. Une interprétation simplifiée a été générée.');
      } finally {
        setIsInterpreting(false);
      }
    };

    requestInterpretation();
  }, [session, user, resultLoading, existingResult, interpretation, isInterpreting, selectedCards, allCards, sessionId, navigate]);

  // Toggle favorite
  const handleToggleFavorite = async () => {
    setIsFavorite(!isFavorite);
    // Note: We could add a favorites column to reading_sessions or reading_results
    toast.success(isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris');
  };

  const handleNewReading = () => {
    navigate('/app/new');
  };

  const isFallbackInterpretation = interpretation && '_meta' in interpretation;

  // Loading state
  if (sessionLoading || resultLoading) {
    return (
      <MysticBackground className="min-h-screen flex items-center justify-center">
        <OracleLoader size="lg" message="Chargement de votre tirage..." />
      </MysticBackground>
    );
  }

  // Error state
  if (sessionError || !session) {
    return (
      <MysticBackground className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6 p-8 mp-glass rounded-2xl max-w-md mx-4">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-full"
            style={{ backgroundColor: 'hsl(var(--destructive) / 0.1)' }}
          >
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Tirage non trouvé
            </h2>
            <p className="text-muted-foreground text-sm">
              Cette session n'existe pas ou a été supprimée.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <MysticButton onClick={() => navigate('/app/history')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voir l'historique
            </MysticButton>
            <MysticButton variant="outline" onClick={() => navigate('/app')}>
              <Home className="mr-2 h-4 w-4" />
              Retour
            </MysticButton>
          </div>
        </div>
      </MysticBackground>
    );
  }

  // AI Loading state
  if (isInterpreting) {
    return (
      <MysticBackground className="min-h-screen flex items-center justify-center">
        <OracleLoader size="lg" message="L'oracle médite sur votre tirage..." />
      </MysticBackground>
    );
  }

  return (
    <Layout>
      <MysticBackground className="min-h-screen py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <MysticButton 
                variant="ghost" 
                onClick={() => navigate('/app/history')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Historique
              </MysticButton>
              
              <MysticButton
                variant="ghost"
                onClick={handleToggleFavorite}
              >
                <Star 
                  className={`h-5 w-5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                />
              </MysticButton>
            </div>

            {/* Page Header */}
            <StepHeader
              title={spread?.name_fr || 'Votre Tirage'}
              subtitle={new Date(session.created_at).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            />

            {/* Question */}
            {session.question && (
              <div className="p-4 rounded-xl mp-glass text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Votre question</p>
                <p className="font-medium text-foreground">{session.question}</p>
              </div>
            )}

            {/* Fallback Warning Banner */}
            {isFallbackInterpretation && (
              <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-700 dark:text-amber-300">
                  <strong>Interprétation simplifiée</strong> – L'IA était temporairement indisponible 
                  {(interpretation as FallbackInterpretationData)._meta.reason === 'INSUFFICIENT_BALANCE' && ' (crédits épuisés)'}
                  {(interpretation as FallbackInterpretationData)._meta.reason === 'RATE_LIMITED' && ' (limite quotidienne atteinte)'}
                  . Cette interprétation est générée à partir des données de la carte.
                </AlertDescription>
              </Alert>
            )}

            {/* Selected Cards Display */}
            <div className="flex flex-wrap justify-center gap-4">
              {selectedCards.map((sc, index) => {
                const cardDetails = allCards?.find(c => c.id === sc.card_id);
                if (!cardDetails) return null;

                return (
                  <div key={sc.card_id} className="w-28 md:w-36">
                    <div className="text-center text-xs text-muted-foreground mb-2">
                      {positions[index]?.label_fr || positions[index]?.label || `Position ${index + 1}`}
                    </div>
                    <TarotCard
                      id={cardDetails.id}
                      name={cardDetails.nom_fr}
                      imageUrl={cardDetails.image_url || undefined}
                      isRevealed={true}
                      isSelected={true}
                    />
                    <div className="text-center text-xs text-muted-foreground mt-2">
                      {sc.orientation === 'upright' ? 'À l\'endroit' : 'Renversée'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interpretation */}
            {interpretation && (
              <div className="mp-glass rounded-2xl p-6">
                <InterpretationDisplay interpretation={interpretation} />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <MysticButton
                onClick={handleNewReading}
                size="lg"
                leftIcon={<RefreshCw className="h-5 w-5" />}
              >
                Nouveau tirage
              </MysticButton>
            </div>
          </div>
        </div>
      </MysticBackground>
    </Layout>
  );
}
