import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Textarea } from '@/components/ui/textarea';
import { useTarotCards } from '@/hooks/useTarotCards';
import { useRitualMachine } from '@/hooks/useRitualMachine';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { RefreshCw, Wand2, AlertTriangle, Home, Sparkles } from 'lucide-react';
import { z } from 'zod';
import type { TarotCard as TarotCardType } from '@/types/tarot';
import { preloadCardBack, getCardFaceUrl } from '@/utils/tarotImageHelpers';
import { preloadImages } from '@/lib/preloadImages';

// Mystic Premium Components
import { MysticBackground, MysticButton } from '@/components/mystic';
import { StepHeader, OracleLoader } from '@/components/tarot-ui';

// New ritual components
import { DeckView } from '@/components/tarot/DeckView';
import { CardSelectionView } from '@/components/tarot/CardSelectionView';
import { SpreadTableView } from '@/components/tarot/SpreadTableView';
import { InterpretationLoader } from '@/components/tarot/InterpretationLoader';

const questionSchema = z.string().max(240, 'La question ne doit pas dépasser 240 caractères').optional();

type PageStep = 'question' | 'ritual' | 'table';
type AIStatus = 'idle' | 'loading' | 'error';

const PRELOAD_COUNT = 12;
const DEFAULT_SPREAD_ID = 'one_card';

interface SpreadPosition {
  key: string;
  label: string;
  label_fr?: string;
}

export default function NewReading() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const { user } = useAuth();
  const { data: cards, isLoading: cardsLoading, error: cardsError } = useTarotCards();
  const { track } = useAnalytics();
  
  const spreadId = slug || DEFAULT_SPREAD_ID;
  
  // Load spread configuration
  const { data: spread, isLoading: spreadLoading } = useQuery({
    queryKey: ['spread', spreadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarot_spreads')
        .select('id, name_fr, description_fr, card_count, positions')
        .eq('id', spreadId)
        .maybeSingle();
      
      if (error) {
        console.error('[NewReading] Error loading spread:', error);
        throw error;
      }
      return data;
    },
    staleTime: 60000,
  });

  // Parse positions from spread
  const positions: SpreadPosition[] = useMemo(() => {
    if (!spread?.positions) return [{ key: 'single', label: 'Carte unique' }];
    try {
      const parsed = spread.positions as unknown as SpreadPosition[];
      return Array.isArray(parsed) ? parsed : [{ key: 'single', label: 'Carte unique' }];
    } catch {
      return [{ key: 'single', label: 'Carte unique' }];
    }
  }, [spread]);

  const cardsRequired = spread?.card_count ?? 1;
  
  // Initialize ritual machine
  const ritual = useRitualMachine({
    cardsRequired,
    positions: positions.map(p => ({ key: p.key, label: p.label_fr || p.label })),
  });

  const [pageStep, setPageStep] = useState<PageStep>('question');
  const [question, setQuestion] = useState('');
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [aiStatus, setAIStatus] = useState<AIStatus>('idle');
  const [imagesPreloaded, setImagesPreloaded] = useState(false);

  // Get URLs for preloading
  const preloadUrls = useMemo(() => {
    if (!cards || cards.length === 0) return [];
    return cards
      .slice(0, PRELOAD_COUNT)
      .map(card => getCardFaceUrl(card))
      .filter((url): url is string => url !== null);
  }, [cards]);

  // Preload card back + first N faces when cards are loaded
  useEffect(() => {
    if (cardsLoading || !cards || cards.length === 0) return;
    
    const preload = async () => {
      await preloadCardBack();
      if (preloadUrls.length > 0) {
        await preloadImages(preloadUrls, {
          concurrency: 4,
          onProgress: (loaded, total) => {
            if (loaded === total) setImagesPreloaded(true);
          },
        });
      } else {
        setImagesPreloaded(true);
      }
    };
    
    preload();
  }, [cards, cardsLoading, preloadUrls]);

  const validateQuestion = () => {
    const result = questionSchema.safeParse(question);
    if (!result.success) {
      setQuestionError(result.error.errors[0]?.message || 'Question invalide');
      return false;
    }
    setQuestionError(null);
    return true;
  };

  const handleStartRitual = () => {
    if (!validateQuestion()) return;
    track('reading_start', { spread_id: spreadId });
    setPageStep('ritual');
  };

  const handleShuffle = async () => {
    track('shuffle', { spread_id: spreadId });
    await ritual.startShuffle();
  };

  const handleCut = async () => {
    track('cut', { spread_id: spreadId });
    await ritual.startCut();
  };

  const handleStartSelection = () => {
    // Force transition to selecting phase by attempting a select/deselect
    if (cards && cards.length > 0) {
      ritual.selectCard(cards[0], ritual.currentPositionKey || 'single');
      ritual.deselectCard(cards[0].id);
    }
  };

  const handleCardSelect = (card: TarotCardType) => {
    if (!ritual.currentPositionKey) return;
    track('select_card', { spread_id: spreadId, card_id: card.id, card_index: ritual.state.selectedCards.length });
    ritual.selectCard(card, ritual.currentPositionKey);
  };

  const handleCardDeselect = (cardId: string) => {
    ritual.deselectCard(cardId);
  };

  const handleShowTable = () => {
    setPageStep('table');
  };

  const handleValidate = async () => {
    if (!ritual.canValidate || !user) return;
    
    track('validate', { spread_id: spreadId, cards_count: ritual.state.selectedCards.length });
    ritual.startInterpretation();
    setAIStatus('loading');

    try {
      // Build selected cards array for session
      const sessionCards = ritual.state.selectedCards.map(sc => ({
        card_id: sc.card.id,
        orientation: sc.drawnCard.orientation,
        position_key: sc.drawnCard.position_key,
      }));

      // Create session in database FIRST
      const { data: newSession, error: sessionError } = await supabase
        .from('reading_sessions')
        .insert({
          user_id: user.id,
          spread_id: spreadId,
          question: question || null,
          selected_cards: sessionCards,
          seed: Math.floor(Math.random() * 1000000),
        })
        .select('id')
        .single();

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        toast.error('Erreur lors de la création de la session');
        setAIStatus('error');
        return;
      }

      // Navigate to result page - interpretation will be requested there
      navigate(`/app/result/${newSession.id}`);
    } catch (error) {
      console.error('Session creation error:', error);
      toast.error('Erreur lors de la création de la session');
      setAIStatus('error');
    }
  };

  const handleReset = () => {
    setPageStep('question');
    setQuestion('');
    setAIStatus('idle');
    ritual.reset();
  };

  // Determine if we show deck/selection view
  const showDeckPhase = ritual.state.phase === 'idle' || ritual.state.phase === 'shuffling' || 
                        ritual.state.phase === 'shuffled' || ritual.state.phase === 'cutting' || 
                        ritual.state.phase === 'cut';
  const showSelectionPhase = ritual.state.phase === 'selecting' || ritual.state.phase === 'ready';

  // Loading state
  if (cardsLoading || spreadLoading || (!imagesPreloaded && !cardsError)) {
    return (
      <MysticBackground className="min-h-screen flex items-center justify-center">
        <OracleLoader 
          size="lg" 
          message={cardsLoading ? "Préparation des arcanes..." : spreadLoading ? "Chargement du tirage..." : "Chargement des cartes..."} 
        />
      </MysticBackground>
    );
  }

  // Error state
  if (cardsError) {
    return (
      <MysticBackground className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6 p-8 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 max-w-md mx-4">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20"
          >
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-xl font-semibold text-white">
              Erreur de chargement
            </h2>
            <p className="text-white/80 text-sm">
              Impossible de charger les cartes. Vérifiez votre connexion.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <MysticButton onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
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

  // AI Loading state - full page cosmic loader
  if (aiStatus === 'loading') {
    return <InterpretationLoader question={question || undefined} />;
  }

  return (
    <Layout>
      <MysticBackground className="min-h-screen py-8 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Page Header */}
            <StepHeader
              title={
                pageStep === 'question' ? (spread?.name_fr || 'Nouveau Tirage') :
                pageStep === 'table' ? 'Votre Tirage' :
                'Rituel du Tirage'
              }
              subtitle={
                pageStep === 'question' ? 'Concentrez-vous sur votre question et laissez les cartes vous guider.' :
                pageStep === 'ritual' ? `Tirage ${cardsRequired} carte${cardsRequired > 1 ? 's' : ''}` :
                undefined
              }
              currentStep={pageStep === 'question' ? 1 : pageStep === 'ritual' ? 2 : 3}
              totalSteps={3}
            />

            {/* Step 1: Question */}
            {pageStep === 'question' && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="p-6 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 space-y-4">
                  <label className="block text-sm font-medium text-white">
                    Votre question ou intention (optionnel)
                  </label>
                  <Textarea
                    placeholder="Formulez votre question ou laissez vide pour une guidance générale..."
                    value={question}
                    onChange={(e) => {
                      setQuestion(e.target.value);
                      if (questionError) validateQuestion();
                    }}
                    className="min-h-[100px] resize-none bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-white/40"
                    maxLength={240}
                  />
                  <div className="flex justify-between items-center text-xs text-white/60">
                    <span>{questionError && <span className="text-red-400">{questionError}</span>}</span>
                    <span>{question.length}/240</span>
                  </div>
                </div>

                <MysticButton
                  onClick={handleStartRitual}
                  size="lg"
                  className="w-full"
                  leftIcon={<Wand2 className="h-5 w-5" />}
                >
                  Procéder au tirage
                </MysticButton>
              </div>
            )}

            {/* Step 2: Ritual */}
            {pageStep === 'ritual' && (
              <div className="space-y-8 animate-fade-in-up">
                {/* Question reminder */}
                {question && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Votre question</p>
                    <p className="font-medium text-white">{question}</p>
                  </div>
                )}

                {/* Deck Phase: Shuffle & Cut */}
                {showDeckPhase && (
                  <DeckView
                    phase={ritual.state.phase}
                    isShuffling={ritual.state.phase === 'shuffling'}
                    isCutting={ritual.state.phase === 'cutting'}
                    onShuffle={handleShuffle}
                    onCut={handleCut}
                    onStartSelection={handleStartSelection}
                  />
                )}

                {/* Selection Phase */}
                {showSelectionPhase && cards && (
                  <div className="space-y-6">
                    <CardSelectionView
                      cards={cards}
                      selectedCards={ritual.state.selectedCards}
                      maxSelections={cardsRequired}
                      currentPositionLabel={ritual.currentPositionLabel}
                      onSelect={handleCardSelect}
                      onDeselect={handleCardDeselect}
                    />

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                      {ritual.canValidate ? (
                        <>
                          <MysticButton
                            onClick={handleShowTable}
                            size="lg"
                            variant="outline"
                          >
                            Voir le tirage
                          </MysticButton>
                          <MysticButton
                            onClick={handleValidate}
                            size="lg"
                            leftIcon={<Sparkles className="w-5 h-5" />}
                          >
                            Valider et interpréter
                          </MysticButton>
                        </>
                      ) : (
                        <div className="text-center">
                          <p className="text-white/60 text-sm">
                            Sélectionnez {cardsRequired - ritual.selectedCount} carte{cardsRequired - ritual.selectedCount > 1 ? 's' : ''} de plus
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Table View */}
            {pageStep === 'table' && (
              <div className="space-y-8 animate-fade-in-up">
                {/* Question reminder */}
                {question && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Votre question</p>
                    <p className="font-medium text-white">{question}</p>
                  </div>
                )}

                <SpreadTableView
                  selectedCards={ritual.state.selectedCards}
                  positions={positions}
                  allCards={cards}
                  spreadName={spread?.name_fr}
                />

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                  <MysticButton
                    onClick={() => setPageStep('ritual')}
                    size="lg"
                    variant="outline"
                  >
                    Modifier la sélection
                  </MysticButton>
                  <MysticButton
                    onClick={handleValidate}
                    size="lg"
                    leftIcon={<Sparkles className="w-5 h-5" />}
                  >
                    Recevoir l'interprétation
                  </MysticButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </MysticBackground>
    </Layout>
  );
}
