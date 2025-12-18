import type { TarotInterpretation } from '@/types/tarot';
import { Sparkles, Lightbulb, HelpCircle, AlertTriangle, Heart, Info } from 'lucide-react';

interface InterpretationDisplayProps {
  interpretation: TarotInterpretation;
}

export function InterpretationDisplay({ interpretation }: InterpretationDisplayProps) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Title & Summary */}
      <div className="text-center space-y-3">
        <h2 className="font-serif text-2xl md:text-3xl font-semibold text-foreground">
          {interpretation.title}
        </h2>
        <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          {interpretation.summary}
        </p>
      </div>

      {/* Card Focus */}
      {interpretation.card_focus.map((card, index) => (
        <div 
          key={card.card_id || index} 
          className="p-6 rounded-xl bg-card border border-border/50 shadow-soft space-y-4"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-serif text-xl font-semibold">
              {card.name_fr}
              <span className="text-muted-foreground font-normal ml-2">
                ({card.orientation === 'upright' ? 'À l\'endroit' : 'Renversée'})
              </span>
            </h3>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {card.meaning}
          </p>
          {card.keywords && card.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {card.keywords.map((keyword, i) => (
                <span 
                  key={i} 
                  className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Guidance */}
      <div className="p-6 rounded-xl glass-mystic space-y-5">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-secondary" />
          <h3 className="font-serif text-lg font-semibold">Message de guidance</h3>
        </div>
        <p className="text-foreground leading-relaxed">
          {interpretation.guidance.message}
        </p>

        {interpretation.guidance.actions && interpretation.guidance.actions.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Actions suggérées :</p>
            <ul className="space-y-2">
              {interpretation.guidance.actions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-foreground">
                  <span className="text-primary mt-1">•</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        {interpretation.guidance.questions_to_reflect && interpretation.guidance.questions_to_reflect.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Questions de réflexion :</p>
            </div>
            <ul className="space-y-2">
              {interpretation.guidance.questions_to_reflect.map((question, i) => (
                <li key={i} className="text-foreground italic">
                  "{question}"
                </li>
              ))}
            </ul>
          </div>
        )}

        {interpretation.guidance.warning && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {interpretation.guidance.warning}
            </p>
          </div>
        )}
      </div>

      {/* Affirmation */}
      {interpretation.affirmation && (
        <div className="p-6 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Heart className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Affirmation à méditer</span>
          </div>
          <p className="font-serif text-xl text-foreground italic">
            "{interpretation.affirmation}"
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2 p-4 rounded-lg bg-muted/50 border border-border/50">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">
          {interpretation.disclaimer}
        </p>
      </div>
    </div>
  );
}
