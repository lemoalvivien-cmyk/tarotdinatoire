import { Sparkles, Check, CreditCard, Shield, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';
import { PromoCodeInput } from '@/components/subscription/PromoCodeInput';

const features = [
  'Tirages illimités',
  'Interprétations approfondies par nos tarologues',
  'Sauvegarde dans les favoris',
  'Export PDF de vos tirages',
  'Historique complet',
  'Accès à tous les spreads'
];

interface PaywallOverlayProps {
  onClose?: () => void;
  variant?: 'modal' | 'inline';
  mandatory?: boolean;
}

export function PaywallOverlay({ onClose, variant = 'modal', mandatory = true }: PaywallOverlayProps) {
  const { startCheckout, checkoutLoading } = useSubscription();
  
  const showCloseButton = !mandatory && onClose;

  const handleSubscribe = async () => {
    await startCheckout();
  };

  const content = (
    <Card className="w-full max-w-md mx-auto border-primary/20 bg-gradient-to-b from-card to-card/80">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="font-serif text-2xl">Passez à Premium</CardTitle>
        <CardDescription className="text-base">
          Débloquez l'accès complet au Tarot Divinatoire
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Promo Code Input - ABOVE the offers */}
        <div className="border border-primary/20 rounded-xl p-4 bg-primary/5">
          <PromoCodeInput />
        </div>

        <div className="text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-primary">3,90€</span>
            <span className="text-muted-foreground">/mois</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Sans engagement, annulez à tout moment</p>
        </div>

        <ul className="space-y-3">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-3 w-3 text-primary" />
              </div>
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <Button 
          onClick={handleSubscribe} 
          disabled={checkoutLoading}
          className="w-full h-12 text-base font-medium"
          size="lg"
        >
          {checkoutLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
              Connexion au portail...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              S'abonner maintenant
            </>
          )}
        </Button>

        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Paiement sécurisé
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            Satisfaction garantie
          </div>
        </div>

        {showCloseButton && (
          <Button variant="ghost" onClick={onClose} className="w-full">
            Plus tard
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (variant === 'inline') {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      {content}
    </div>
  );
}
