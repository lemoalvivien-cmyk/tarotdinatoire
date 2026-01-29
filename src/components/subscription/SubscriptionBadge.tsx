import { Crown, Lock } from 'lucide-react';
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

  // Non-premium users
  return (
    <Badge 
      variant="outline" 
      className={cn("border-destructive text-destructive", className)}
    >
      <Lock className="h-3 w-3 mr-1" />
      Abonnement requis
    </Badge>
  );
}
