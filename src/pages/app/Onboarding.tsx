import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Shield, User, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';

const DOMAINS = [
  { value: 'amour', label: 'Amour & Relations' },
  { value: 'carriere', label: 'Carrière & Travail' },
  { value: 'spiritualite', label: 'Spiritualité & Développement personnel' },
  { value: 'sante', label: 'Bien-être & Équilibre' },
  { value: 'finances', label: 'Finances & Abondance' },
  { value: 'general', label: 'Guidance générale' },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [intention, setIntention] = useState('');
  const [preferredDomain, setPreferredDomain] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleComplete = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Session expirée. Veuillez vous reconnecter.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    
    setLoading(true);
    try {
      // Use upsert to handle race condition where profile might not exist yet
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          onboarding_completed: true,
          display_name: displayName || null,
          intention: intention || null,
          preferred_domain: preferredDomain || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: "Bienvenue !",
        description: "Votre voyage mystique peut commencer.",
      });
      
      // Small delay to ensure state updates propagate
      setTimeout(() => {
        navigate('/app/dashboard', { replace: true });
      }, 100);
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 0 && !disclaimerAccepted) {
      toast({
        title: "Acceptation requise",
        description: "Veuillez accepter les conditions pour continuer.",
        variant: "destructive",
      });
      return;
    }
    
    if (step === 1) {
      handleComplete();
    } else {
      setStep(step + 1);
    }
  };

  const canProceed = () => {
    if (step === 0) return disclaimerAccepted;
    return true;
  };

  return (
    <Layout showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg space-y-8">
          {/* Progress */}
          <div className="flex justify-center gap-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className={`h-1.5 w-16 rounded-full transition-colors ${
                  i <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Beta Badge */}
          <div className="flex justify-center">
            <div className="beta-badge">
              <Sparkles className="h-3 w-3" />
              VERSION BÊTA GRATUITE
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
                  Le Tarot Divinatoire est un <strong>outil d'introspection et de guidance personnelle</strong>. 
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
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex: clarté, guidance, compréhension de soi...
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">Domaine de prédilection</Label>
                  <Select value={preferredDomain} onValueChange={setPreferredDomain}>
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

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
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
                  {step === 1 ? 'Commencer mon voyage' : 'Continuer'}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>

          {/* Skip (only on step 2) */}
          {step === 1 && (
            <div className="text-center">
              <button
                onClick={handleComplete}
                disabled={loading}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
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
