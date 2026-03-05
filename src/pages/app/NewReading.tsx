import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useTarotCards } from '@/hooks/useTarotCards';
import { useRitualMachine } from '@/hooks/useRitualMachine';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { RefreshCw, AlertTriangle, Home, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import type { TarotCard as TarotCardType } from '@/types/tarot';
import { preloadCardBack, getCardFaceUrl } from '@/utils/tarotImageHelpers';
import { preloadImages } from '@/lib/preloadImages';

// Components
import { MysticBackground, MysticButton } from '@/components/mystic';
import { OracleLoader } from '@/components/tarot-ui';
import { RitualStepper } from '@/components/tarot/RitualStepper';
import { AnimatedDeck } from '@/components/tarot/AnimatedDeck';
import { SelectedCardsDisplay } from '@/components/tarot/SelectedCardsDisplay';
import { InterpretationLoader } from '@/components/tarot/InterpretationLoader';
import { PaywallOverlay } from '@/components/subscription/PaywallOverlay';
import { Textarea } from '@/components/ui/textarea';
import { StepContainer, StepTitle, IntentionGrid, RitualPhase, INTENTIONS } from '@/components/tarot/RitualStepUI';

const questionSchema = z.string().max(240, 'La question ne doit pas dépasser 240 caractères').optional();

const PRELOAD_COUNT = 12;
const DEFAULT_SPREAD_ID = 'one_card';

// Ritual steps
const STEPS = [
  { id: 'intention', label: 'Intention' },
  { id: 'question', label: 'Question' },
  { id: 'spread', label: 'Tirage' },
  { id: 'ritual', label: 'Mélanger' },
  { id: 'selection', label: 'Choisir' },
  { id: 'reading', label: 'Lecture' },
];

type StepId = 'intention' | 'question' | 'spread' | 'ritual' | 'selection' | 'reading';

interface SpreadPosition {
  key: string;
  label: string;
  label_fr?: string;
  description?: string;
  description_fr?: string;
}

interface SpreadOption {
  id: string;
  name_fr: string;
  description_fr: string | null;
  card_count: number;
  positions: SpreadPosition[];
  layout_key: string | null;
}

export default function NewReading() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { data: cards, isLoading: cardsLoading, error: cardsError } = useTarotCards();
  const { track } = useAnalytics();
  const { status: subscription, loading: subLoading, hasCredits, isPremium, refresh: refreshSubscription } = useSubscription();

  // Check for subscription success redirect
  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      toast.success('Abonnement activé !', {
        description: 'Vous avez maintenant accès aux tirages illimités.'
      });
      refreshSubscription();
      // Remove query param
      navigate('/app/new', { replace: true });
    }
  }, [searchParams, navigate, refreshSubscription]);

  // Current step
  const [currentStep, setCurrentStep] = useState<StepId>(slug ? 'ritual' : 'intention');
  const stepIndex = STEPS.findIndex(s => s.id === currentStep);

  // Paywall state
  const [showPaywall, setShowPaywall] = useState(false);

  // User choices
  const [intention, setIntention] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [selectedSpreadId, setSelectedSpreadId] = useState<string>(slug || DEFAULT_SPREAD_ID);

  // State
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  // FIX double-clic: guard against concurrent submissions
  const isSubmittingRef = useRef(false);

  // Load spreads list
  const { data: spreads, isLoading: spreadsLoading } = useQuery({
    queryKey: ['spreads-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarot_spreads')
        .select('id, name_fr, description_fr, card_count, positions, layout_key')
        .eq('is_enabled', true)
        .order('sort_order');
      if (error) throw error;
      return (data || []) as unknown as SpreadOption[];
    },
    staleTime: 60000,
  });

  // Current spread config
  const currentSpread = useMemo(() => {
    return spreads?.find(s => s.id === selectedSpreadId) || null;
  }, [spreads, selectedSpreadId]);

  const positions: SpreadPosition[] = useMemo(() => {
    if (!currentSpread?.positions) return [{ key: 'single', label: 'La Carte' }];
    try {
      const parsed = currentSpread.positions as unknown as SpreadPosition[];
      return Array.isArray(parsed) ? parsed : [{ key: 'single', label: 'La Carte' }];
    } catch {
      return [{ key: 'single', label: 'La Carte' }];
    }
  }, [currentSpread]);

  const cardsRequired = currentSpread?.card_count ?? 1;

  // Memoize ritual positions to prevent re-renders
  const ritualPositions = useMemo(
    () => positions.map(p => ({ key: p.key, label: p.label_fr || p.label })),
    [positions]
  );

  // Initialize ritual machine
  const ritual = useRitualMachine({
    cardsRequired,
    positions: ritualPositions,
  });

  // Set initial deck when cards are loaded
  useEffect(() => {
    if (cards && cards.length > 0 && ritual.shuffledDeck.length === 0) {
      ritual.setInitialDeck(cards);
    }
  }, [cards, ritual]);

  // Preload URLs
  const preloadUrls = useMemo(() => {
    if (!cards || cards.length === 0) return [];
    return cards
      .slice(0, PRELOAD_COUNT)
      .map(card => getCardFaceUrl(card))
      .filter((url): url is string => url !== null);
  }, [cards]);

  // Preload card images
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

  // Navigation
  const goToStep = useCallback((stepId: StepId) => {
    setCurrentStep(stepId);
  }, []);

  const goNext = useCallback(() => {
    const idx = STEPS.findIndex(s => s.id === currentStep);
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1].id as StepId);
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    const idx = STEPS.findIndex(s => s.id === currentStep);
    if (idx > 0) {
      setCurrentStep(STEPS[idx - 1].id as StepId);
    }
  }, [currentStep]);

  // Validate question
  const validateQuestion = () => {
    const result = questionSchema.safeParse(question);
    if (!result.success) {
      setQuestionError(result.error.errors[0]?.message || 'Question invalide');
      return false;
    }
    setQuestionError(null);
    return true;
  };

  // Handlers
  const handleIntentionSelect = (id: string) => {
    setIntention(id);
    // Skip question step, go directly to spread selection
    goToStep('spread');
  };

  const handleQuestionSubmit = () => {
    if (!validateQuestion()) return;
    goNext();
  };

  const handleSpreadSelect = (spreadId: string) => {
    setSelectedSpreadId(spreadId);
    ritual.reset();
    goNext();
  };

  const handleShuffle = async () => {
    track('shuffle', { spread_id: selectedSpreadId });
    await ritual.startShuffle();
  };

  const handleCut = async () => {
    track('cut', { spread_id: selectedSpreadId });
    await ritual.startCut();
  };

  const handleStartSelection = () => {
    goToStep('selection');
  };

  const handleCardSelect = (card: TarotCardType) => {
    if (!ritual.currentPositionKey) return;
    track('select_card', { 
      spread_id: selectedSpreadId, 
      card_id: card.id, 
      card_index: ritual.state.selectedCards.length 
    });
    ritual.selectCard(card, ritual.currentPositionKey);
    
    // Auto-advance to reading when complete
    if (ritual.state.selectedCards.length + 1 >= cardsRequired) {
      setTimeout(() => goToStep('reading'), 500);
    }
  };

  const handleValidate = async () => {
    if (!ritual.canValidate || !user) return;
    // FIX double-clic: block concurrent submits
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    // Check credits before proceeding
    if (!hasCredits) {
      setShowPaywall(true);
      return;
    }

    track('validate', { spread_id: selectedSpreadId, cards_count: ritual.state.selectedCards.length });
    ritual.startInterpretation();
    setIsInterpreting(true);

    try {
      const cardsToSave = ritual.state.selectedCards.map(sc => ({
        card_id: sc.card.id,
        orientation: sc.drawnCard.orientation,
        position_key: sc.drawnCard.position_key,
      }));

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        navigate('/auth');
        isSubmittingRef.current = false;
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tarot-interpretation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            spread_id: selectedSpreadId,
            question: question || null,
            cards: cardsToSave,
          }),
        }
      );

      let interpretation = null;

      if (response.ok) {
        interpretation = await response.json();
      } else if (response.status === 429) {
        toast.error('Limite atteinte. Réessayez plus tard.');
      } else if (response.status === 401) {
        toast.error('Session expirée.');
        navigate('/auth');
        return;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Interpretation error:', errorData);
        toast.error(errorData.message || 'Erreur lors de l\'interprétation');
      }

      const { data: newReading, error: saveError } = await supabase
        .from('tarot_readings')
        .insert({
          user_id: user.id,
          spread_id: selectedSpreadId,
          question: question || null,
          cards: cardsToSave,
          ai_interpretation: interpretation,
        })
        .select('id')
        .single();

      if (saveError) {
        console.error('Save error:', saveError);
        toast.error('Erreur lors de la sauvegarde');
        setIsInterpreting(false);
        return;
      }

      // Decrement credit for free users after successful save
      if (!isPremium) {
        await supabase.rpc('decrement_reading_credit', { uid: user.id });
        refreshSubscription();
      }

      navigate(`/app/reading/${newReading.id}`);
    } catch (error) {
      toast.error('Une erreur est survenue. Veuillez réessayer.');
      setIsInterpreting(false);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  // Build slots for display
  const slots = useMemo(() => {
    return positions.map((pos, i) => ({
      position: {
        key: pos.key,
        label: pos.label_fr || pos.label,
        description: pos.description_fr || pos.description,
      },
      card: ritual.state.selectedCards.find(sc => sc.positionIndex === i) || null,
      index: i,
    }));
  }, [positions, ritual.state.selectedCards]);

  // Loading
  if (cardsLoading || spreadsLoading || subLoading || (!imagesPreloaded && !cardsError)) {
    return (
      <MysticBackground className="min-h-screen flex items-center justify-center">
        <OracleLoader 
          size="lg" 
          message={cardsLoading ? "Préparation des arcanes..." : "Chargement..."} 
        />
      </MysticBackground>
    );
  }

  // Error
  if (cardsError) {
    return (
      <MysticBackground className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6 p-8 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 max-w-md mx-4">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
          <h2 className="font-serif text-xl font-semibold text-white">Erreur de chargement</h2>
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

  // Interpreting
  if (isInterpreting) {
    return <InterpretationLoader question={question || undefined} />;
  }

  // Paywall
  if (showPaywall) {
    return (
      <MysticBackground className="min-h-screen flex items-center justify-center p-4">
        <PaywallOverlay 
          variant="inline" 
          onClose={() => {
            setShowPaywall(false);
            navigate('/app');
          }} 
        />
      </MysticBackground>
    );
  }

  return (
    <MysticBackground className="min-h-screen py-6 sm:py-10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Stepper */}
          <RitualStepper 
            steps={STEPS} 
            currentStep={stepIndex}
          />

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {/* Step 1: Intention */}
            {currentStep === 'intention' && (
              <StepContainer key="intention">
                <StepTitle 
                  title="Quelle est votre intention ?"
                  subtitle="Choisissez le domaine qui vous préoccupe"
                />
                <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                  {INTENTIONS.map((int) => (
                    <button
                      key={int.id}
                      onClick={() => handleIntentionSelect(int.id)}
                      className={cn(
                        'p-4 sm:p-6 rounded-2xl text-left transition-all duration-200',
                        'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400',
                        intention === int.id && 'ring-2 ring-yellow-400 bg-yellow-400/10'
                      )}
                    >
                      <int.icon className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400 mb-2 sm:mb-3" />
                      <h3 className="font-medium text-white text-sm sm:text-base">{int.label}</h3>
                      <p className="text-white/60 text-xs sm:text-sm mt-1">{int.description}</p>
                    </button>
                  ))}
                </div>
              </StepContainer>
            )}

            {/* Step 2: Question */}
            {currentStep === 'question' && (
              <StepContainer key="question">
                <StepTitle 
                  title="Formulez votre question"
                  subtitle="Ou laissez vide pour une guidance générale"
                />
                <div className="max-w-lg mx-auto space-y-4">
                  <div className="p-6 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10">
                    <Textarea
                      placeholder="Ex: Comment puis-je améliorer ma situation professionnelle ?"
                      value={question}
                      onChange={(e) => {
                        setQuestion(e.target.value);
                        if (questionError) validateQuestion();
                      }}
                      className="min-h-[100px] resize-none bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-yellow-400/50"
                      maxLength={240}
                    />
                    <div className="flex justify-between items-center mt-2 text-xs">
                      <span className="text-red-400">{questionError}</span>
                      <span className="text-white/50">{question.length}/240</span>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <MysticButton variant="outline" onClick={goBack}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Retour
                    </MysticButton>
                    <MysticButton onClick={handleQuestionSubmit}>
                      Continuer
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </MysticButton>
                  </div>
                </div>
              </StepContainer>
            )}

            {/* Step 3: Spread Selection */}
            {currentStep === 'spread' && (
              <StepContainer key="spread">
                <StepTitle 
                  title="Choisissez votre tirage"
                  subtitle="Le nombre de cartes influence la profondeur de la lecture"
                />
                <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {spreads?.slice(0, 3).map((spread) => (
                    <button
                      key={spread.id}
                      onClick={() => handleSpreadSelect(spread.id)}
                      className={cn(
                        'p-5 rounded-2xl text-center transition-all duration-200',
                        'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400',
                        selectedSpreadId === spread.id && 'ring-2 ring-yellow-400'
                      )}
                    >
                      <div className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-2">
                        {spread.card_count}
                      </div>
                      <h3 className="font-medium text-white text-sm sm:text-base">{spread.name_fr}</h3>
                      <p className="text-white/60 text-xs mt-1">{spread.description_fr}</p>
                    </button>
                  ))}
                </div>
                <div className="flex justify-center mt-6">
                  <MysticButton variant="outline" onClick={goBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                  </MysticButton>
                </div>
              </StepContainer>
            )}

            {/* Step 4: Ritual (Shuffle & Cut) */}
            {currentStep === 'ritual' && (
              <StepContainer key="ritual">
                <RitualPhase
                  phase={ritual.state.phase}
                  onShuffle={handleShuffle}
                  onCut={handleCut}
                  onStartSelection={handleStartSelection}
                  shuffledDeck={ritual.shuffledDeck}
                  cardsRequired={cardsRequired}
                  goBack={goBack}
                />
              </StepContainer>
            )}

            {/* Step 5: Selection */}
            {currentStep === 'selection' && (
              <StepContainer key="selection">
                <StepTitle 
                  title={ritual.canValidate ? "Sélection complète" : `Choisissez vos cartes`}
                  subtitle="Laissez-vous guider par votre intuition"
                />
                
                {/* Selected cards display */}
                <SelectedCardsDisplay
                  slots={slots}
                  layoutKey={currentSpread?.layout_key || 'single'}
                />

                {/* Deck for selection - now uses PremiumCardGrid internally */}
                <AnimatedDeck
                  cards={ritual.shuffledDeck}
                  phase={ritual.state.phase === 'interpreting' || ritual.state.phase === 'done' ? 'ready' : ritual.state.phase}
                  selectedCardIds={ritual.state.selectedCards.map(sc => sc.card.id)}
                  maxCards={cardsRequired}
                  currentPositionLabel={ritual.currentPositionLabel}
                  onCardSelect={handleCardSelect}
                />

                {/* Actions */}
                {ritual.canValidate && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center pt-6"
                  >
                    <MysticButton
                      size="lg"
                      onClick={() => goToStep('reading')}
                      leftIcon={<Sparkles className="w-5 h-5" />}
                    >
                      Voir mon tirage
                    </MysticButton>
                  </motion.div>
                )}
              </StepContainer>
            )}

            {/* Step 6: Reading */}
            {currentStep === 'reading' && (
              <StepContainer key="reading">
                <StepTitle 
                  title="Votre tirage est prêt"
                  subtitle={currentSpread?.name_fr}
                />

                {/* Question reminder */}
                {question && (
                  <div className="max-w-lg mx-auto p-4 rounded-xl bg-white/5 border border-white/10 text-center mb-6">
                    <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Votre question</p>
                    <p className="text-white font-medium">{question}</p>
                  </div>
                )}

                {/* Cards display */}
                <SelectedCardsDisplay
                  slots={slots}
                  layoutKey={currentSpread?.layout_key || 'single'}
                />

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                  <MysticButton
                    variant="outline"
                    onClick={() => goToStep('selection')}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Modifier
                  </MysticButton>
                  <MysticButton
                    size="lg"
                    onClick={handleValidate}
                    leftIcon={<Sparkles className="w-5 h-5" />}
                    disabled={!ritual.canValidate}
                  >
                    Recevoir l'interprétation
                  </MysticButton>
                </div>
              </StepContainer>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MysticBackground>
  );
}

// Sub-components extracted to src/components/tarot/RitualStepUI.tsx
