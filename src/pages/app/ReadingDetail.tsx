/**
 * ReadingDetail — canonical detail page for /app/reading/:id
 * Reads from reading_sessions + reading_results (unified model).
 * Supports retry interpretation, notes (debounced), favorite toggle, delete.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReadingResult } from '@/components/tarot/ReadingResult';
import { useTarotCards } from '@/hooks/useTarotCards';
import { useReadingDetail } from '@/hooks/useReadingDetail';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Loader2, Star, Trash2, ArrowLeft, Calendar, Save, AlertTriangle, Sparkles,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { isEmptyInterpretation } from '@/utils/interpretationNormalizer';
import type { TarotInterpretation, DrawnCard } from '@/types/tarot';
import type { FallbackInterpretationData } from '@/utils/tarotFallback';

export default function ReadingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: allCards } = useTarotCards();
  const { query, toggleFavorite, saveNotes, deleteReading, updateInterpretation } = useReadingDetail(id);
  const reading = query.data;

  const [userNotes, setUserNotes] = useState('');
  const [isNotesModified, setIsNotesModified] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate notes once
  useEffect(() => {
    if (reading?.user_notes !== undefined) setUserNotes(reading.user_notes ?? '');
  }, [reading?.user_notes]);

  // Debounced auto-save notes
  useEffect(() => {
    if (!isNotesModified) return;
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(() => {
      saveNotes.mutate(userNotes, { onSuccess: () => setIsNotesModified(false) });
    }, 800);
    return () => { if (notesTimerRef.current) clearTimeout(notesTimerRef.current); };
  }, [userNotes, isNotesModified]); // eslint-disable-line

  // Retry interpretation
  const handleRetryInterpretation = useCallback(async () => {
    if (!reading) return;
    setIsRetrying(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) { navigate('/auth'); return; }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tarot-interpretation`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            spread_id: reading.spread_id || 'one_card',
            question: reading.question || null,
            cards: reading.selected_cards,
          }),
        },
      );

      if (response.ok) {
        const newInterp: TarotInterpretation = await response.json();
        await updateInterpretation.mutateAsync(newInterp);
        toast.success('Interprétation régénérée ✨');
      } else if (response.status === 429) {
        toast.error('Limite atteinte. Réessayez plus tard.');
      } else if (response.status === 401) {
        navigate('/auth');
      } else {
        toast.error('Erreur lors de l\'interprétation');
      }
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setIsRetrying(false);
    }
  }, [reading, navigate, updateInterpretation]);

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (query.isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium animate-pulse">Chargement du tirage…</p>
          </div>
        </div>
      </Layout>
    );
  }

  // ─── Not found / Error ──────────────────────────────────────────────────────
  if (query.error || !reading) {
    const isNotFound = (query.error as Error)?.message === 'NOT_FOUND';
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="page-header-icon mx-auto">
              <Sparkles className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-serif font-semibold text-foreground">
              {isNotFound ? 'Ce tirage s\'est dissipé dans l\'éther…' : 'Les énergies sont troubles'}
            </h2>
            <p className="text-muted-foreground text-sm">
              {isNotFound
                ? 'Ce tirage n\'existe pas ou a déjà été supprimé.'
                : 'Une erreur est survenue lors du chargement.'}
            </p>
            <Button variant="outline" onClick={() => navigate('/app/history')}>
              <ArrowLeft className="mr-2 h-4 w-4" />Retour à l'historique
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const drawnCards: DrawnCard[] = reading.selected_cards.map(sc => ({
    card_id: sc.card_id,
    orientation: sc.orientation,
    position_key: sc.position_key,
  }));

  const needsRetry = isEmptyInterpretation(reading.interpretation);
  const isFallback = reading.interpretation && '_meta' in (reading.interpretation as object);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/app/history')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />Historique
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost" size="icon"
                onClick={() => toggleFavorite.mutate(!reading.is_favorite)}
                disabled={toggleFavorite.isPending}
                title={reading.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Star className={`h-5 w-5 transition-colors ${reading.is_favorite ? 'icon-favorite' : 'text-muted-foreground'}`} />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer ce tirage ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Le tirage et son interprétation seront définitivement supprimés.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteReading.mutate(undefined, { onSuccess: () => navigate('/app/history') })}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deleteReading.isPending}
                    >
                      {deleteReading.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Supprimer'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Calendar className="h-4 w-4" />
            {new Date(reading.created_at).toLocaleDateString('fr-FR', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </div>

          {/* Question */}
          {reading.question && (
            <div className="p-4 rounded-xl bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">Question posée :</p>
              <p className="font-medium mt-1">{reading.question}</p>
            </div>
          )}

          {/* Fallback banner */}
          {isFallback && (
            <Alert variant="default" className="border-warning/50 bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning-foreground">
                <strong>Interprétation simplifiée</strong> – Ce tirage a été réalisé à partir des arcanes traditionnels.
                {(reading.interpretation as unknown as FallbackInterpretationData)?._meta?.reason === 'INSUFFICIENT_BALANCE' && ' (crédits épuisés)'}
                {(reading.interpretation as unknown as FallbackInterpretationData)?._meta?.reason === 'RATE_LIMITED' && ' (limite quotidienne atteinte)'}
              </AlertDescription>
            </Alert>
          )}

          {/* Cards + Interpretation */}
          <ReadingResult
            cards={drawnCards}
            interpretation={reading.interpretation}
            allCards={allCards}
            onRetry={needsRetry ? handleRetryInterpretation : undefined}
            isRetrying={isRetrying}
          />

          {/* Notes */}
          <div className="p-6 rounded-2xl glass-mystic shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Notes personnelles</p>
              {saveNotes.isPending && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Save className="h-3 w-3 animate-pulse" />Sauvegarde...
                </div>
              )}
            </div>
            <Textarea
              placeholder="Ajoutez vos réflexions, vos ressentis..."
              value={userNotes}
              onChange={e => { setUserNotes(e.target.value); setIsNotesModified(true); }}
              className="min-h-[120px] resize-none"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
