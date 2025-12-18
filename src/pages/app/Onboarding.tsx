import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Moon, Star, Heart, ArrowRight, ArrowLeft } from 'lucide-react';

const STEPS = [
  {
    title: "Bienvenue dans votre espace sacré",
    description: "Le tarot est un miroir de l'âme, un outil d'introspection qui révèle ce que vous portez déjà en vous.",
    icon: Sparkles,
  },
  {
    title: "Comment ça fonctionne",
    description: "Concentrez-vous sur une question ou un domaine de votre vie. Les cartes vous offriront des perspectives pour guider votre réflexion.",
    icon: Moon,
  },
  {
    title: "Ce que le tarot peut vous apporter",
    description: "Clarté, introspection, nouvelles perspectives. Le tarot ne prédit pas l'avenir, il éclaire le présent.",
    icon: Star,
  },
  {
    title: "Notre engagement",
    description: "Des interprétations bienveillantes, éthiques et respectueuses. Jamais de conseils médicaux, juridiques ou financiers.",
    icon: Heart,
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = currentStep.icon;

  const handleComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Bienvenue !",
        description: "Votre voyage mystique peut commencer.",
      });
      navigate('/app');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <Layout showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg space-y-8">
          {/* Progress */}
          <div className="flex justify-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-12 rounded-full transition-colors ${
                  i <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="text-center space-y-6 animate-fade-in-up" key={step}>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary">
              <Icon className="h-10 w-10" />
            </div>
            
            <div className="space-y-4">
              <h1 className="font-serif text-2xl md:text-3xl font-semibold">
                {currentStep.title}
              </h1>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
                {currentStep.description}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-8">
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
              disabled={loading}
              className="btn-mystic"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Chargement...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isLast ? 'Commencer mon voyage' : 'Suivant'}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>

          {/* Skip */}
          {!isLast && (
            <div className="text-center">
              <button
                onClick={handleComplete}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Passer l'introduction
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
