import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TarotCardPlaceholder } from '@/components/tarot/TarotCardPlaceholder';
import { InterpretationDisplay } from '@/components/tarot/InterpretationDisplay';
import { useTarotCards, useRandomCard } from '@/hooks/useTarotCards';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Sparkles, Loader2, RefreshCw, Wand2 } from 'lucide-react';
import { z } from 'zod';
import type { TarotCard, DrawnCard, TarotInterpretation } from '@/types/tarot';

const questionSchema = z.string().max(240, 'La question ne doit pas dépasser 240 caractères').optional();

type Step = 'question' | 'draw' | 'interpretation';

export default function NewReading() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: cards, isLoading: cardsLoading } = useTarotCards();
  const { drawCard } = useRandomCard(cards);
  
  const [step, setStep] = useState<Step>('question');
  const [question, setQuestion] = useState('');
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [drawnCard, setDrawnCard] = useState<{ card: TarotCard; drawnCard: DrawnCard } | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [interpretation, setInterpretation] = useState<TarotInterpretation | null>(null);
  const [isLoadingInterpretation, setIsLoadingInterpretation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const validateQuestion = () => {
    const result = questionSchema.safeParse(question);
    if (!result.success) {
      setQuestionError(result.error.errors[0]?.message || 'Question invalide');
      return false;
    }
    setQuestionError(null);
    return true;
  };

  const handleStartDrawing = () => {
    if (!validateQuestion()) return;
    setStep('draw');
  };

  const handleDrawCard = async () => {
    if (!cards || cards.length === 0) {
      toast.error('Impossible de charger les cartes');
      return;
    }

    setIsShuffling(true);
    setIsRevealed(false);

    // Simulate shuffle animation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = drawCard();
    if (result) {
      setDrawnCard(result);
      setIsShuffling(false);
      
      // Reveal after a short delay
      await new Promise(resolve => setTimeout(resolve, 300));
      setIsRevealed(true);
    }
  };

  const handleGetInterpretation = async () => {
    if (!drawnCard || !user) return;

    setIsLoadingInterpretation(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        navigate('/auth');
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
            spread_id: 'one_card',
            question: question || null,
            cards: [drawnCard.drawnCard],
          }),
        }
      );

      if (response.status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        navigate('/auth');
        return;
      }

      if (response.status === 429) {
        toast.error('Limite quotidienne atteinte (bêta gratuite). Réessaie demain.', {
          duration: 6000,
        });
        setIsLoadingInterpretation(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur lors de l\'interprétation');
      }

      const data = await response.json();
      // The edge function now returns the interpretation directly (not wrapped)
      setInterpretation(data);
      setStep('interpretation');
    } catch (error) {
      console.error('Interpretation error:', error);
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setIsLoadingInterpretation(false);
    }
  };

  const handleSaveReading = async () => {
    if (!drawnCard || !interpretation || !user) return;

    setIsSaving(true);

    try {
      const { data, error } = await supabase
        .from('tarot_readings')
        .insert([{
          user_id: user.id,
          spread_id: 'one_card',
          question: question || null,
          cards: JSON.parse(JSON.stringify([drawnCard.drawnCard])),
          ai_interpretation: JSON.parse(JSON.stringify(interpretation)),
          is_favorite: false,
        }])
        .select('id')
        .single();

      if (error) throw error;

      toast.success('Tirage sauvegardé');
      navigate(`/app/reading/${data.id}`);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setStep('question');
    setQuestion('');
    setDrawnCard(null);
    setIsRevealed(false);
    setInterpretation(null);
  };

  if (cardsLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-8 w-8" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold">
              Nouveau Tirage
            </h1>
            <p className="text-muted-foreground">
              Concentrez-vous sur votre question et laissez les cartes vous guider.
            </p>
          </div>

          {/* Step 1: Question */}
          {step === 'question' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="p-6 rounded-2xl glass-mystic shadow-soft space-y-4">
                <label className="block text-sm font-medium text-foreground">
                  Votre question ou intention (optionnel)
                </label>
                <Textarea
                  placeholder="Formulez votre question ou laissez vide pour une guidance générale..."
                  value={question}
                  onChange={(e) => {
                    setQuestion(e.target.value);
                    if (questionError) validateQuestion();
                  }}
                  className="min-h-[100px] resize-none"
                  maxLength={240}
                />
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{questionError && <span className="text-destructive">{questionError}</span>}</span>
                  <span>{question.length}/240</span>
                </div>
              </div>

              <Button
                onClick={handleStartDrawing}
                size="lg"
                className="w-full"
              >
                <Wand2 className="mr-2 h-5 w-5" />
                Procéder au tirage
              </Button>
            </div>
          )}

          {/* Step 2: Draw Card */}
          {step === 'draw' && (
            <div className="space-y-8 animate-fade-in-up">
              {question && (
                <div className="p-4 rounded-xl bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">Votre question :</p>
                  <p className="font-medium mt-1">{question}</p>
                </div>
              )}

              <div className="flex flex-col items-center space-y-6">
                {/* Card Display */}
                <div className="relative">
                  {!drawnCard ? (
                    <div className={`transition-transform duration-500 ${isShuffling ? 'animate-pulse' : ''}`}>
                      <TarotCardPlaceholder
                        size="lg"
                        isRevealed={false}
                        isShuffling={isShuffling}
                      />
                    </div>
                  ) : (
                    <div className="transition-all duration-700">
                      <TarotCardPlaceholder
                        card={drawnCard.card}
                        orientation={drawnCard.drawnCard.orientation}
                        size="lg"
                        isRevealed={isRevealed}
                      />
                    </div>
                  )}
                </div>

                {/* Card Name & Orientation */}
                {drawnCard && isRevealed && (
                  <div className="text-center space-y-2 animate-fade-in-up">
                    <h2 className="font-serif text-2xl font-semibold">
                      {drawnCard.card.nom_fr}
                    </h2>
                    <p className="text-muted-foreground">
                      {drawnCard.drawnCard.orientation === 'upright' ? 'À l\'endroit' : 'Renversée'}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  {!drawnCard && (
                    <Button
                      onClick={handleDrawCard}
                      size="lg"
                      disabled={isShuffling}
                      className="w-full"
                    >
                      {isShuffling ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Mélange...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Tirer une carte
                        </>
                      )}
                    </Button>
                  )}

                  {drawnCard && isRevealed && (
                    <>
                      <Button
                        onClick={handleGetInterpretation}
                        size="lg"
                        disabled={isLoadingInterpretation}
                        className="w-full"
                      >
                        {isLoadingInterpretation ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Interprétation en cours...
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-2 h-5 w-5" />
                            Recevoir l'interprétation
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleReset}
                        disabled={isLoadingInterpretation}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Nouveau tirage
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Interpretation */}
          {step === 'interpretation' && interpretation && drawnCard && (
            <div className="space-y-8">
              {/* Card Display */}
              <div className="flex justify-center">
                <TarotCardPlaceholder
                  card={drawnCard.card}
                  orientation={drawnCard.drawnCard.orientation}
                  size="md"
                  isRevealed={true}
                />
              </div>

              {/* Interpretation */}
              <InterpretationDisplay interpretation={interpretation} />

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleSaveReading}
                  size="lg"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Sauvegarder ce tirage
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isSaving}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Nouveau tirage
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
