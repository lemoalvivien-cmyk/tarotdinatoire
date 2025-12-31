import { useMemo } from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  HelpCircle, 
  Heart, 
  Briefcase, 
  Wallet, 
  Info,
  Shield,
  MapPin,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { normalizeInterpretation, type NormalizedInterpretation } from '@/utils/interpretationNormalizer';
import { Button } from '@/components/ui/button';

interface InterpretationDisplayProps {
  interpretation: unknown;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function InterpretationDisplay({ 
  interpretation, 
  onRetry,
  isRetrying = false 
}: InterpretationDisplayProps) {
  // Normalize interpretation data - handles all formats safely, NEVER throws
  const data: NormalizedInterpretation = useMemo(
    () => normalizeInterpretation(interpretation),
    [interpretation]
  );

  // Show error state with retry option
  if (data.hasError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
        <div className="p-4 rounded-full bg-amber-500/10">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-xl font-semibold text-foreground">
            Interprétation indisponible
          </h3>
          <p className="text-muted-foreground max-w-md">
            {data.errorMessage || 'L\'interprétation n\'a pas pu être générée. Veuillez réessayer.'}
          </p>
        </div>
        {onRetry && (
          <Button 
            onClick={onRetry} 
            disabled={isRetrying}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Nouvelle tentative...' : 'Réessayer'}
          </Button>
        )}
      </div>
    );
  }

  // Check if we have position-specific interpretations (new format)
  const hasPositionInterpretations = data.positionInterpretations.length > 0;
  
  // Check if domain interpretations are meaningful (not defaults)
  const hasDomainInterpretations = 
    data.love !== 'Interprétation non disponible.' ||
    data.work !== 'Interprétation non disponible.' ||
    data.money !== 'Interprétation non disponible.';

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Title & Summary */}
      <div className="text-center space-y-3">
        <h2 className="font-serif text-2xl md:text-3xl font-semibold text-foreground">
          {data.title}
        </h2>
        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          {data.summary}
        </p>
      </div>

      {/* Position Interpretations (New Format) */}
      {hasPositionInterpretations && (
        <div className="space-y-4">
          {data.positionInterpretations.map((pos, index) => (
            <div 
              key={index} 
              className="p-5 rounded-xl bg-card border border-border/50 shadow-soft space-y-3"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium uppercase tracking-wider text-primary">
                  {pos.position}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="font-serif text-lg font-semibold">{pos.cardName}</span>
                <span className="text-xs text-muted-foreground">({pos.orientation})</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {pos.message}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* General Message (always shown) */}
      <div className="p-5 rounded-xl bg-card border border-border/50 shadow-soft space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-serif text-lg font-semibold">
            {hasPositionInterpretations ? 'Message Global' : 'Général'}
          </h3>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
          {data.general}
        </p>
      </div>

      {/* Domain Interpretations (Legacy Format) */}
      {hasDomainInterpretations && (
        <div className="grid gap-4 md:grid-cols-3">
          {/* Love */}
          {data.love !== 'Interprétation non disponible.' && (
            <div className="p-5 rounded-xl bg-card border border-border/50 shadow-soft space-y-3">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-aurora-pink" />
                <h3 className="font-serif text-lg font-semibold">Amour</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {data.love}
              </p>
            </div>
          )}

          {/* Work */}
          {data.work !== 'Interprétation non disponible.' && (
            <div className="p-5 rounded-xl bg-card border border-border/50 shadow-soft space-y-3">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-celestial-blue" />
                <h3 className="font-serif text-lg font-semibold">Travail</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {data.work}
              </p>
            </div>
          )}

          {/* Money */}
          {data.money !== 'Interprétation non disponible.' && (
            <div className="p-5 rounded-xl bg-card border border-border/50 shadow-soft space-y-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-mystic-gold" />
                <h3 className="font-serif text-lg font-semibold">Finances</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {data.money}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Advice */}
      {data.advice.length > 0 && (
        <div className="p-6 rounded-xl glass-mystic space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-secondary" />
            <h3 className="font-serif text-lg font-semibold">
              {hasPositionInterpretations ? 'Actions Concrètes' : 'Conseils'}
            </h3>
          </div>
          <ul className="space-y-2">
            {data.advice.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-foreground">
                <span className="text-primary mt-1">•</span>
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reflection Questions */}
      {data.reflectionQuestions.length > 0 && (
        <div className="p-6 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10 space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-serif text-lg font-semibold">Questions de réflexion</h3>
          </div>
          <ul className="space-y-3">
            {data.reflectionQuestions.map((question, i) => (
              <li key={i} className="text-foreground italic text-sm">
                "{question}"
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Safety Disclaimers */}
      <div className="p-5 rounded-xl bg-muted/50 border border-border/50 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-serif text-base font-semibold text-muted-foreground">
            Rappels importants
          </h3>
        </div>
        <div className="grid gap-3 text-xs text-muted-foreground">
          {data.safetyMedical && (
            <div className="flex items-start gap-2">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>
                {data.safetyLegal || data.safetyFinancial ? <strong>Santé :</strong> : null} {data.safetyMedical}
              </span>
            </div>
          )}
          {data.safetyLegal && (
            <div className="flex items-start gap-2">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span><strong>Juridique :</strong> {data.safetyLegal}</span>
            </div>
          )}
          {data.safetyFinancial && (
            <div className="flex items-start gap-2">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span><strong>Financier :</strong> {data.safetyFinancial}</span>
            </div>
          )}
        </div>
      </div>

      {/* Template indicator (if applicable) */}
      {data.isTemplate && data.templateReason && (
        <p className="text-center text-xs text-muted-foreground/60">
          Interprétation basée sur les arcanes traditionnels
        </p>
      )}
    </div>
  );
}
