import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PROFILE_QUERY_KEY } from '@/hooks/useProfile';
import { Sparkles, Shield, User, ArrowRight, ArrowLeft, AlertTriangle, Star } from 'lucide-react';
import { ZODIAC_SIGNS, getZodiacSignFromDate } from '@/utils/astrologyData';

const DOMAINS = [
  { value: 'amour', label: 'Amour & Relations' },
  { value: 'carriere', label: 'Carrière & Travail' },
  { value: 'spiritualite', label: 'Spiritualité & Développement personnel' },
  { value: 'sante', label: 'Bien-être & Équilibre' },
  { value: 'finances', label: 'Finances & Abondance' },
  { value: 'general', label: 'Guidance générale' },
];

const MAX_PROFILE_RETRIES = 5;
const RETRY_DELAY = 300;

const TOTAL_STEPS = 3; // Disclaimer, Profile, Astrology

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [intention, setIntention] = useState('');
  const [preferredDomain, setPreferredDomain] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [zodiacSign, setZodiacSign] = useState('');
  const [isReady, setIsReady] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  

  // Ensure user is ready before allowing interactions
  useEffect(() => {
    if (!authLoading && user) {
      setIsReady(true);
    }
  }, [authLoading, user]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Ensure profile exists (handle race condition with trigger)
  const ensureProfileExists = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    for (let attempt = 0; attempt < MAX_PROFILE_RETRIES; attempt++) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[Onboarding] Error checking profile:', error);
        throw error;
      }

      if (data) {
        return true; // Profile exists
      }

      // Profile doesn't exist yet, wait and retry
      console.log(`[Onboarding] Profile not found, waiting... (attempt ${attempt + 1}/${MAX_PROFILE_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }

    // After all retries, try to create the profile manually as fallback
    console.log('[Onboarding] Creating profile as fallback');
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({ id: user.id })
      .single();

    if (insertError && !insertError.message.includes('duplicate')) {
      console.error('[Onboarding] Error creating fallback profile:', insertError);
      throw insertError;
    }

    return true;
  }, [user]);

  const handleComplete = async () => {
    if (!user) {
      toast.error("Session expirée. Veuillez vous reconnecter.");
      navigate('/auth', { replace: true });
      return;
    }
    
    setLoading(true);
    
    try {
      // First, ensure the profile exists
      await ensureProfileExists();

      // Then upsert the profile with onboarding data
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          onboarding_completed: true,
          display_name: displayName || null,
          intention: intention || null,
          preferred_domain: preferredDomain || null,
          birth_date: birthDate || null,
          zodiac_sign: zodiacSign || (birthDate ? getZodiacSignFromDate(new Date(birthDate))?.id ?? null : null),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      if (error) {
        console.error('[Onboarding] Supabase error:', error);
        throw error;
      }

      // Invalidate profile cache before navigation to ensure ProtectedRoute sees updated data
      await queryClient.invalidateQueries({ queryKey: [PROFILE_QUERY_KEY, user.id] });
      
      if (import.meta.env.DEV) {
        console.log('[Onboarding] Profile updated successfully, navigating to dashboard');
      }

      toast.success("Bienvenue ! Votre voyage mystique peut commencer.");
      
      // Navigate to dashboard
      navigate('/app/dashboard', { replace: true });
    } catch (error: any) {
      console.error('[Onboarding] Error completing onboarding:', error);
      
      // Show user-friendly error message
      let errorMessage = "Une erreur est survenue. Réessayez.";
      if (error?.code === '23505') {
        errorMessage = "Profil déjà configuré. Redirection...";
        navigate('/app/dashboard', { replace: true });
        return;
      } else if (error?.code === '42501' || error?.message?.includes('RLS')) {
        errorMessage = "Erreur de permissions. Veuillez vous reconnecter.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 0 && !disclaimerAccepted) {
      toast.error("Veuillez accepter les conditions pour continuer.");
      return;
    }
    
    if (step === TOTAL_STEPS - 1) {
      handleComplete();
    } else {
      setStep(step + 1);
    }
  };

  const canProceed = () => {
    if (step === 0) return disclaimerAccepted;
    return true;
  };

  // Show loading state while checking auth
  if (authLoading || !isReady) {
    return (
      <Layout showFooter={false}>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg space-y-8">
          {/* Progress */}
          <div className="flex justify-center gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-12 rounded-full transition-colors ${
                  i <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Pricing Badge */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-xs font-medium text-primary">3,90€/mois · Illimité</span>
            </div>
          </div>

          {/* Step 1: Disclaimer */}
          {step === 0 && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary">
                  <Shield className="h-10 w-10" />
                </div>
                <h1 className="font-serif text-2xl md:text-3xl font-semibold">
                  Bienvenue dans votre espace sacré
                </h1>
                <p className="text-muted-foreground">
                  Avant de commencer, prenez un instant pour comprendre notre approche.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-card border border-border/50 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-medium">Ce que nous proposons</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Le Tarot Dinatoire est un <strong>outil d'introspection et de guidance personnelle</strong>. 
                  Nos interprétations, créées avec le savoir-faire de 30 tarologues professionnels, 
                  vous accompagnent dans votre réflexion.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-destructive/5 border border-destructive/20 space-y-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Important</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ce service <strong>ne remplace pas</strong> un avis médical, juridique ou financier. 
                  Le tarot ne prédit pas l'avenir avec certitude. Vous restez seul responsable de vos décisions.
                </p>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Checkbox
                  id="disclaimer"
                  checked={disclaimerAccepted}
                  onCheckedChange={(checked) => setDisclaimerAccepted(checked === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="disclaimer" className="text-sm cursor-pointer leading-relaxed">
                  J'ai compris que ce service est destiné à la guidance et l'introspection uniquement, 
                  et ne constitue pas un conseil médical, juridique ou financier.
                </Label>
              </div>
            </div>
          )}

          {/* Step 2: Profile Setup */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary/30 text-foreground">
                  <User className="h-10 w-10" />
                </div>
                <h1 className="font-serif text-2xl md:text-3xl font-semibold">
                  Personnalisez votre expérience
                </h1>
                <p className="text-muted-foreground">
                  Ces informations nous aident à mieux vous guider (optionnel).
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Votre pseudo</Label>
                  <Input
                    id="displayName"
                    placeholder="Comment souhaitez-vous être appelé(e) ?"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-card"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intention">Votre intention</Label>
                  <Input
                    id="intention"
                    placeholder="Qu'espérez-vous trouver ici ?"
                    value={intention}
                    onChange={(e) => setIntention(e.target.value)}
                    className="bg-card"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex: clarté, guidance, compréhension de soi...
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">Domaine de prédilection</Label>
                  <Select value={preferredDomain} onValueChange={setPreferredDomain} disabled={loading}>
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Choisissez un domaine (optionnel)" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOMAINS.map((domain) => (
                        <SelectItem key={domain.value} value={domain.value}>
                          {domain.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Astrology */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary">
                  <Star className="h-10 w-10" />
                </div>
                <h1 className="font-serif text-2xl md:text-3xl font-semibold">
                  Votre Profil Astral
                </h1>
                <p className="text-muted-foreground">
                  Enrichissez vos tirages avec votre énergie zodiacale (optionnel).
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Date de naissance</Label>
                  <input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => {
                      setBirthDate(e.target.value);
                      if (e.target.value) {
                        const computed = getZodiacSignFromDate(new Date(e.target.value));
                        if (computed) setZodiacSign(computed.id);
                      }
                    }}
                    className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Votre signe sera détecté automatiquement.
                  </p>
                </div>

                {zodiacSign && (() => {
                  const sign = ZODIAC_SIGNS.find(s => s.id === zodiacSign);
                  if (!sign) return null;
                  return (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <span className="text-3xl">{sign.emoji}</span>
                      <div>
                        <p className="font-semibold">{sign.name_fr} {sign.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          {sign.element} · {sign.ruling_planet_fr} · {sign.date_range}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <div className="space-y-2">
                  <Label htmlFor="zodiacSelect">Ou choisissez votre signe</Label>
                  <Select value={zodiacSign} onValueChange={setZodiacSign} disabled={loading}>
                    <SelectTrigger className="bg-card">
                      <SelectValue placeholder="Signe astrologique (optionnel)" />
                    </SelectTrigger>
                    <SelectContent>
                      {ZODIAC_SIGNS.map((sign) => (
                        <SelectItem key={sign.id} value={sign.id}>
                          {sign.emoji} {sign.name_fr} {sign.symbol} — {sign.date_range}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              disabled={step === 0 || loading}
              className={step === 0 ? 'invisible' : ''}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Précédent
            </Button>

            <Button
              onClick={handleNext}
              disabled={loading || !canProceed()}
              className="btn-mystic"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Chargement...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {step === TOTAL_STEPS - 1 ? 'Commencer mon voyage' : 'Continuer'}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>

          {/* Skip (only on last 2 steps) */}
          {step >= 1 && (
            <div className="text-center">
              <button
                onClick={handleComplete}
                disabled={loading}
                className="text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
              >
                Passer cette étape
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
