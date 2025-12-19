import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MysticBackground, MysticButton } from '@/components/mystic';
import { Check, X, Loader2, Home } from 'lucide-react';

type UnsubStatus = 'loading' | 'success' | 'error' | 'already';

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<UnsubStatus>('loading');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    const processUnsubscribe = async () => {
      try {
        // Find lead by unsubscribe token
        const { data: lead, error: fetchError } = await supabase
          .from('email_leads')
          .select('id, unsubscribed_at')
          .eq('unsubscribe_token', token)
          .maybeSingle();

        if (fetchError || !lead) {
          setStatus('error');
          return;
        }

        // Already unsubscribed
        if (lead.unsubscribed_at) {
          setStatus('already');
          return;
        }

        // Update to unsubscribed
        const { error: updateError } = await supabase
          .from('email_leads')
          .update({ 
            unsubscribed_at: new Date().toISOString(),
            consent: false,
          })
          .eq('id', lead.id);

        if (updateError) {
          throw updateError;
        }

        setStatus('success');
      } catch (error) {
        console.error('Unsubscribe error:', error);
        setStatus('error');
      }
    };

    processUnsubscribe();
  }, [token]);

  return (
    <MysticBackground className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 mp-glass rounded-2xl text-center space-y-6">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Traitement en cours...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-2xl font-semibold text-foreground">
                Désinscription confirmée
              </h1>
              <p className="text-muted-foreground">
                Vous ne recevrez plus d'emails de notre part. 
                Nous respectons votre choix.
              </p>
            </div>
            <MysticButton onClick={() => navigate('/')} className="mt-4">
              <Home className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </MysticButton>
          </>
        )}

        {status === 'already' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20">
              <Check className="h-8 w-8 text-amber-500" />
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-2xl font-semibold text-foreground">
                Déjà désinscrit
              </h1>
              <p className="text-muted-foreground">
                Vous êtes déjà désinscrit de notre liste d'envoi.
              </p>
            </div>
            <MysticButton onClick={() => navigate('/')} className="mt-4">
              <Home className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </MysticButton>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/20">
              <X className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-2xl font-semibold text-foreground">
                Lien invalide
              </h1>
              <p className="text-muted-foreground">
                Ce lien de désinscription est invalide ou a expiré.
                Contactez-nous si vous avez besoin d'aide.
              </p>
            </div>
            <MysticButton onClick={() => navigate('/')} className="mt-4">
              <Home className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </MysticButton>
          </>
        )}
      </div>
    </MysticBackground>
  );
}
