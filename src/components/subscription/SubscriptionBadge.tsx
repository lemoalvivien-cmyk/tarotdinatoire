import { Crown, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';

interface SubscriptionBadgeProps {
  className?: string;
  showCredits?: boolean;
}

export function SubscriptionBadge({ className, showCredits = false }: SubscriptionBadgeProps) {
  const { status, loading, isPremium } = useSubscription();

  if (loading || !status) return null;

  if (isPremium) {
    return (
      <Badge 
        variant="default" 
        className={cn(
          "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0",
          className
        )}
      >
        <Crown className="h-3 w-3 mr-1" />
        Premium
      </Badge>
    );
  }

  if (showCredits) {
    return (
      <Badge 
        variant="outline" 
        className={cn(
          status.credits_remaining === 0 ? "border-destructive text-destructive" : "",
          className
        )}
      >
        <Sparkles className="h-3 w-3 mr-1" />
        {status.credits_remaining === 0 
          ? "Aucun crédit" 
          : `${status.credits_remaining} tirage${status.credits_remaining > 1 ? 's' : ''} gratuit${status.credits_remaining > 1 ? 's' : ''}`
        }
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={className}>
      Gratuit
    </Badge>
  );
}
