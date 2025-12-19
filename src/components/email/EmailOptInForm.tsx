import { useState, useRef } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { MysticButton } from '@/components/mystic';
import { HoneypotField } from '@/components/forms/HoneypotField';
import { useCooldown } from '@/hooks/useCooldown';
import { Mail, Check, Loader2 } from 'lucide-react';

const CONSENT_TEXT = "J'accepte de recevoir des emails concernant mes tirages et des conseils de tarot. Je peux me désinscrire à tout moment.";

const emailLeadSchema = z.object({
  email: z.string().trim().email({ message: "Email invalide" }).max(255),
  firstName: z.string().trim().max(100).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Le consentement est requis" }) }),
});

interface EmailOptInFormProps {
  sessionId: string;
  spreadId?: string;
  onSuccess?: () => void;
}

export function EmailOptInForm({ sessionId, spreadId, onSuccess }: EmailOptInFormProps) {
  const { user } = useAuth();
  const { track } = useAnalytics();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const honeypotRef = useRef<string>('');
  const { isCoolingDown, remainingSeconds, startCooldown } = useCooldown({ cooldownMs: 3000 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Anti-spam: check honeypot
    if (honeypotRef.current) {
      console.warn('[Honeypot] Bot detected - silently blocking');
      toast.success("Merci ! Vous recevrez bientôt des conseils personnalisés.");
      setIsSubmitted(true);
      return;
    }

    // Anti-spam: cooldown check
    if (isCoolingDown) {
      toast.error(`Veuillez patienter ${remainingSeconds}s avant de réessayer.`);
      return;
    }

    // Validate with zod
    const validation = emailLeadSchema.safeParse({ email, firstName: firstName || undefined, consent });
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Critical: consent must be true
    if (!consent) {
      setErrors({ consent: "Le consentement est requis pour continuer" });
      toast.error("Veuillez accepter les conditions pour continuer.");
      return;
    }

    setIsSubmitting(true);
    startCooldown();

    try {
      const { error } = await supabase
        .from('email_leads')
        .upsert({
          email: email.trim().toLowerCase(),
          first_name: firstName.trim() || null,
          user_id: user?.id || null,
          spread_id: spreadId || null,
          session_id: sessionId,
          consent: true,
          consent_text: CONSENT_TEXT,
          consent_timestamp: new Date().toISOString(),
        }, {
          onConflict: 'email',
          ignoreDuplicates: false,
        });

      if (error) {
        // Handle duplicate email gracefully
        if (error.code === '23505') {
          toast.success("Vous êtes déjà inscrit ! Merci de votre intérêt.");
          setIsSubmitted(true);
          onSuccess?.();
          return;
        }
        throw error;
      }

      track('email_submit', { session_id: sessionId, spread_id: spreadId || '' });
      toast.success("Merci ! Vous recevrez bientôt des conseils personnalisés.");
      setIsSubmitted(true);
      onSuccess?.();
    } catch (error) {
      console.error('Email opt-in error:', error);
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="p-6 rounded-2xl mp-glass text-center space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20">
          <Check className="h-6 w-6 text-green-500" />
        </div>
        <p className="text-foreground font-medium">Inscription confirmée !</p>
        <p className="text-sm text-muted-foreground">
          Vous recevrez bientôt des conseils et insights pour vos prochains tirages.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 rounded-2xl mp-glass space-y-5">
      {/* Honeypot anti-spam */}
      <HoneypotField 
        name="website_url" 
        onBotDetected={() => { honeypotRef.current = 'bot'; }} 
      />
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-serif text-lg font-semibold text-foreground">
          Recevez vos insights
        </h3>
        <p className="text-sm text-muted-foreground">
          Des conseils personnalisés basés sur vos tirages, directement dans votre boîte mail.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? 'border-destructive' : ''}
            disabled={isSubmitting}
            required
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm font-medium">
            Prénom <span className="text-muted-foreground">(optionnel)</span>
          </Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Votre prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={isSubmitting}
            maxLength={100}
          />
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="consent"
            checked={consent}
            onCheckedChange={(checked) => setConsent(checked === true)}
            disabled={isSubmitting}
            className={errors.consent ? 'border-destructive' : ''}
          />
          <div className="space-y-1">
            <Label 
              htmlFor="consent" 
              className="text-sm leading-relaxed cursor-pointer"
            >
              {CONSENT_TEXT} <span className="text-destructive">*</span>
            </Label>
            {errors.consent && (
              <p className="text-xs text-destructive">{errors.consent}</p>
            )}
          </div>
        </div>
      </div>

      <MysticButton
        type="submit"
        disabled={isSubmitting || !consent || isCoolingDown}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Inscription...
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            S'inscrire
          </>
        )}
      </MysticButton>

      <p className="text-xs text-center text-muted-foreground">
        Vos données sont protégées. Désinscription possible à tout moment.
      </p>
    </form>
  );
}
