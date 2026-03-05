import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Lock, Sparkles, Zap, Headphones, Users, Brain, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { type PremiumFeature } from '@/hooks/useFeatureAccess';
import { cn } from '@/lib/utils';

const FEATURE_META: Record<PremiumFeature, {
  label: string;
  description: string;
  icon: React.ElementType;
  benefit: string;
}> = {
  unlimited_readings: {
    label: 'Tirages Illimités',
    description: "Effectuez autant de tirages que vous le souhaitez, sans restriction.",
    icon: BookOpen,
    benefit: 'Accès illimité à tous vos tirages',
  },
  advanced_spreads: {
    label: 'Spreads Avancés',
    description: 'Accédez à la Croix Celtique, le Chemin de Vie et d'autres spreads puissants.',
    icon: Zap,
    benefit: 'Déverrouillez la Croix Celtique & le Chemin de Vie',
  },
  ai_deep_analysis: {
    label: 'Analyse IA Profonde',
    description: 'Interprétations enrichies générées par notre Oracle IA avancé.',
    icon: Brain,
    benefit: 'Interprétations psychologiques approfondies',
  },
  audio_readings: {
    label: 'Lectures Audio',
    description: 'Voix mystique féminine qui narre vos tirages en temps réel.',
    icon: Headphones,
    benefit: 'Narration vocale mystique par ElevenLabs',
  },
  relationship_analysis: {
    label: 'Analyse Relationnelle',
    description: 'Spreads dédiés aux relations, compatibilités et dynamiques de couple.',
    icon: Users,
    benefit: 'Tirages spéciaux amour & relations',
  },
};

interface PremiumGateProps {
  /** The premium feature to gate */
  feature: PremiumFeature;
  /** Whether the user already has access (from useFeatureAccess) */
  hasAccess: boolean;
  /** Whether still loading */
  loading?: boolean;
  /** Content to show when access is granted */
  children: ReactNode;
  /** Display variant */
  variant?: 'overlay' | 'inline' | 'blur';
  /** Extra className for wrapper */
  className?: string;
}

/**
 * Wraps a premium feature. If the user lacks access, renders an upgrade prompt
 * styled to match the feature context.
 */
export function PremiumGate({
  feature,
  hasAccess,
  loading = false,
  children,
  variant = 'inline',
  className,
}: PremiumGateProps) {
  const { startCheckout, checkoutLoading } = useSubscription();
  const meta = FEATURE_META[feature];
  const Icon = meta.icon;

  if (loading) return null;
  if (hasAccess) return <>{children}</>;

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'flex flex-col items-center justify-center text-center gap-4 p-8 rounded-2xl',
        'border border-primary/20 bg-gradient-to-b from-primary/5 to-background',
        className
      )}
    >
      {/* Icon cluster */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-background border border-primary/30 flex items-center justify-center">
          <Lock className="h-3 w-3 text-primary/70" />
        </div>
      </div>

      {/* Copy */}
      <div className="space-y-1.5">
        <h3 className="font-serif text-lg font-semibold text-foreground">
          {meta.label}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          {meta.description}
        </p>
      </div>

      {/* Benefit pill */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
        <Sparkles className="h-3 w-3" />
        {meta.benefit}
      </div>

      {/* CTA */}
      <Button
        onClick={() => startCheckout()}
        disabled={checkoutLoading}
        size="sm"
        className="mt-1"
      >
        {checkoutLoading ? (
          <>
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent mr-2" />
            Connexion...
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Débloquer avec Premium — 3,90€/mois
          </>
        )}
      </Button>
    </motion.div>
  );

  if (variant === 'overlay') {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none opacity-30 blur-sm">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-4 bg-background/50 backdrop-blur-sm rounded-2xl">
          {content}
        </div>
      </div>
    );
  }

  if (variant === 'blur') {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none filter blur-md">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center p-4">
          {content}
        </div>
      </div>
    );
  }

  // 'inline' — replace content entirely
  return content;
}
