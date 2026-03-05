import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTarotCards } from '@/hooks/useTarotCards';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { RefreshCw, AlertTriangle, Home, Star, ArrowLeft, Info } from 'lucide-react';
import type { TarotInterpretation, DrawnCard } from '@/types/tarot';
import { 
  generateTemplateInterpretation, 
  createTemplateForStorage, 
  type TemplateInterpretationData 
} from '@/utils/tarotTemplateEngine';
import { InterpretationDisplay } from '@/components/tarot/InterpretationDisplay';
import { SpreadInterpretationDisplay } from '@/components/tarot/SpreadInterpretationDisplay';
import { EmailOptInForm } from '@/components/email/EmailOptInForm';
import { MysticBackground, MysticButton } from '@/components/mystic';
import { StepHeader, TarotCard, OracleLoader } from '@/components/tarot-ui';
import { TarotVoicePlayer } from '@/components/audio/TarotVoicePlayer';
import { AstroInsightPanel } from '@/components/astrology';
import { useAstrology } from '@/hooks/useAstrology';

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
  const { track } = useAnalytics();

  const [interpretation, setInterpretation] = useState<TarotInterpretation | TemplateInterpretationData | null>(null);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);

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
      setInterpretation(existingResult.interpretation as unknown as TarotInterpretation | TemplateInterpretationData);
    }
  }, [existingResult]);

  // Track result view once
  useEffect(() => {
    if (interpretation && !hasTrackedView && sessionId) {
      track('result_view', { session_id: sessionId, spread_id: session?.spread_id || '' });
      setHasTrackedView(true);
    }
  }, [interpretation, hasTrackedView, sessionId, session?.spread_id, track]);

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

        let interpretationData: TarotInterpretation | TemplateInterpretationData;

        // Handle 402/429/500 - Generate template interpretation (hybrid fallback)
        if (response.status === 402 || response.status === 429 || response.status >= 500) {
          // Build rich template interpretation from all cards
          const cardsWithDetails = selectedCards
            .map((sc, index) => {
              const cardDetails = allCards?.find(c => c.id === sc.card_id);
              if (!cardDetails) return null;
              return {
                card: cardDetails,
                drawnCard: sc as DrawnCard,
                positionLabel: positions[index]?.label_fr || positions[index]?.label || `Position ${index + 1}`,
              };
            })
            .filter((c): c is NonNullable<typeof c> => c !== null);

          if (cardsWithDetails.length > 0) {
            const templateInterp = generateTemplateInterpretation(
              cardsWithDetails,
              spread?.name_fr || 'Tirage',
              session.question || undefined
            );
            
            const reason = response.status === 402 ? 'INSUFFICIENT_BALANCE' 
              : response.status === 429 ? 'RATE_LIMITED' 
              : 'AI_UNAVAILABLE';
            
            interpretationData = createTemplateForStorage(templateInterp, reason, cardsWithDetails.length);
            
            // Discreet toast - don't alarm the user
            toast.info('Interprétation basée sur les arcanes traditionnels.', { 
              duration: 4000,
              icon: <Info className="h-4 w-4" />,
            });
          } else {
            throw new Error('Cannot generate template interpretation');
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
        
        // Generate template fallback for any error
        const cardsWithDetails = selectedCards
          .map((sc, index) => {
            const cardDetails = allCards?.find(c => c.id === sc.card_id);
            if (!cardDetails) return null;
            return {
              card: cardDetails,
              drawnCard: sc as DrawnCard,
              positionLabel: positions[index]?.label_fr || positions[index]?.label || `Position ${index + 1}`,
            };
          })
          .filter((c): c is NonNullable<typeof c> => c !== null);

        if (cardsWithDetails.length > 0) {
          const templateInterp = generateTemplateInterpretation(
            cardsWithDetails,
            spread?.name_fr || 'Tirage',
            session.question || undefined
          );
          const templateData = createTemplateForStorage(templateInterp, 'AI_ERROR', cardsWithDetails.length);
          
          // Try to save template
          await supabase
            .from('reading_results')
            .insert({
              session_id: sessionId,
              interpretation: JSON.parse(JSON.stringify(templateData)),
            });

          setInterpretation(templateData);
          toast.info('Interprétation basée sur les arcanes traditionnels.', { duration: 4000 });
        } else {
          toast.error('Impossible de générer l\'interprétation.');
        }
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

            {/* Template/Fallback Info Banner - Discreet */}
            {isFallbackInterpretation && (
              <Alert variant="default" className="border-muted bg-muted/30">
                <Info className="h-4 w-4 text-muted-foreground" />
                <AlertDescription className="text-muted-foreground text-sm">
                  Interprétation basée sur les arcanes traditionnels.
                  {(interpretation as TemplateInterpretationData)._meta?.reason === 'INSUFFICIENT_BALANCE' && ' L\'interprétation avancée n\'est pas disponible actuellement.'}
                  {(interpretation as TemplateInterpretationData)._meta?.reason === 'RATE_LIMITED' && ' L\'interprétation avancée sera disponible prochainement.'}
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
                <SpreadInterpretationDisplay
                  interpretation={interpretation}
                  spreadId={session?.spread_id}
                  cards={selectedCards}
                  spreadPositions={positions}
                />
              </div>
            )}

            {/* Voice narration — plays the synthesis/summary */}
            {interpretation && (() => {
              const interp = interpretation as unknown as Record<string, unknown>;
              const summary = (interp.synthesis as string)
                || (interp.summary as string)
                || (interp.general_interpretation as string)
                || '';
              const title = (interp.title as string) || spread?.name_fr || '';
              const narrationText = [title, summary].filter(Boolean).join('. ');
              return narrationText ? (
                <TarotVoicePlayer
                  text={narrationText}
                  context="reading"
                  autoPlay={true}
                />
              ) : null;
            })()}

            {/* Email Opt-In Form - Post-Result */}
            {interpretation && session && (
              <EmailOptInForm 
                sessionId={session.id}
                spreadId={session.spread_id}
              />
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
