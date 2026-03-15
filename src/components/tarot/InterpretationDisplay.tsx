import { useMemo, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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
  RefreshCw,
  Eye,
  Zap,
  BookOpen,
  Users,
} from 'lucide-react';
import { normalizeInterpretation, type NormalizedInterpretation } from '@/utils/interpretationNormalizer';
import { Button } from '@/components/ui/button';

interface InterpretationDisplayProps {
  interpretation: unknown;
  onRetry?: () => void;
  isRetrying?: boolean;
}

/** Gold shimmer reveal animation for storytelling sections */
function SectionReveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const shouldReduce = useReducedMotion();
  return (
    <motion.div
      initial={shouldReduce ? { opacity: 1 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Gold shimmer bar shown at top of storytelling card */
function GoldShimmerBar() {
  return (
    <div className="relative h-0.5 w-full overflow-hidden rounded-full mb-4">
      <div className="absolute inset-0" style={{ background: 'hsl(var(--border))' }} />
      <motion.div
        className="absolute inset-y-0 w-1/3"
        style={{
          background:
            'linear-gradient(90deg, transparent, hsl(var(--mp-brand-gold) / 0.8), transparent)',
        }}
        animate={{ x: ['-100%', '400%'] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'linear', delay: 0.5 }}
      />
    </div>
  );
}

/** Section card with luxury styling */
function StorySection({
  icon,
  title,
  accentColor = 'primary',
  children,
  delay = 0,
  variant = 'default',
}: {
  icon: React.ReactNode;
  title: string;
  accentColor?: string;
  children: React.ReactNode;
  delay?: number;
  variant?: 'default' | 'gold' | 'violet' | 'muted';
}) {
  const variantStyles: Record<string, string> = {
    default: 'bg-card border-border/50',
    gold: 'border-mp-brand-gold/30',
    violet: 'border-primary/25',
    muted: 'bg-muted/40 border-border/30',
  };
  const variantBg: Record<string, React.CSSProperties> = {
    default: {},
    gold: { background: 'hsl(var(--mp-brand-gold) / 0.06)' },
    violet: { background: 'hsl(var(--primary) / 0.06)' },
    muted: {},
  };

  return (
    <SectionReveal delay={delay}>
      <div
        className={`p-5 rounded-xl border shadow-soft space-y-3 ${variantStyles[variant]}`}
        style={variantBg[variant]}
      >
        <GoldShimmerBar />
        <div className="flex items-center gap-2">
          <span style={{ color: accentColor.startsWith('hsl') ? accentColor : undefined }}
            className={accentColor.startsWith('hsl') ? '' : `text-${accentColor}`}>
            {icon}
          </span>
          <h3 className="font-serif text-lg font-semibold text-foreground">{title}</h3>
        </div>
        {children}
      </div>
    </SectionReveal>
  );
}

export function InterpretationDisplay({
  interpretation,
  onRetry,
  isRetrying = false,
}: InterpretationDisplayProps) {
  const shouldReduce = useReducedMotion();

  // Live region for screen readers
  const liveRef = useRef<HTMLDivElement>(null);

  const data: NormalizedInterpretation = useMemo(
    () => normalizeInterpretation(interpretation),
    [interpretation]
  );

  // Announce card name to screen readers on mount
  useEffect(() => {
    if (data.title && liveRef.current) {
      liveRef.current.textContent = `Interprétation chargée : ${data.title}`;
    }
  }, [data.title]);

  // Error state
  if (data.hasError) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 space-y-6 text-center"
        role="alert"
        aria-live="assertive"
      >
        <div className="p-4 rounded-full bg-amber-500/10" aria-hidden="true">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-xl font-semibold text-foreground">
            Interprétation indisponible
          </h3>
          <p className="text-muted-foreground max-w-md">
            {data.errorMessage || "L'interprétation n'a pas pu être réalisée. Veuillez réessayer."}
          </p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} disabled={isRetrying} className="gap-2" aria-label="Réessayer l'interprétation">
            <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} aria-hidden="true" />
            {isRetrying ? 'Nouvelle tentative...' : 'Réessayer'}
          </Button>
        )}
      </div>
    );
  }

  const hasPositionInterpretations = data.positionInterpretations.length > 0;
  const hasDomainInterpretations =
    data.love !== 'Interprétation non disponible.' ||
    data.work !== 'Interprétation non disponible.' ||
    data.money !== 'Interprétation non disponible.';

  return (
    <article
      className="space-y-5 animate-fade-in-up"
      aria-label={`Interprétation : ${data.title}`}
    >
      {/* Hidden live region for screen readers */}
      <div
        ref={liveRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* ── Title & résumé court ─────────────────────────────────── */}
      <SectionReveal delay={0}>
        <div className="text-center space-y-3 pb-1">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-foreground heading-glow">
            {data.title}
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto text-sm md:text-base">
            {data.summary}
          </p>
        </div>
      </SectionReveal>

      {/* ── Section 1 · Position Interpretations ─────────────────── */}
      {hasPositionInterpretations && (
        <SectionReveal delay={0.08}>
          <section aria-label="Interprétations par position" className="space-y-3">
            {data.positionInterpretations.map((pos, index) => (
              <div
                key={index}
                className="p-5 rounded-xl border shadow-soft space-y-3"
                style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border) / 0.5)' }}
              >
                <GoldShimmerBar />
                <div className="flex items-center gap-2 flex-wrap">
                  <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span className="text-xs font-medium uppercase tracking-wider text-primary">
                    {pos.position}
                  </span>
                  <span className="text-muted-foreground" aria-hidden="true">•</span>
                  <span className="font-serif text-lg font-semibold text-foreground">{pos.cardName}</span>
                  <span className="text-xs text-muted-foreground">
                    ({pos.orientation === 'upright' ? 'À l\'endroit' : 'Renversée'})
                  </span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{pos.message}</p>
              </div>
            ))}
          </section>
        </SectionReveal>
      )}

      {/* ── Section 2 · Réflexion personnelle (General / Global) ─── */}
      <StorySection
        icon={<Eye className="h-5 w-5" aria-hidden="true" />}
        title="Réflexion personnelle"
        accentColor="primary"
        variant="violet"
        delay={0.12}
      >
        <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
          {data.general}
        </p>
      </StorySection>

      {/* ── Section 3 · Synchronicité du jour ───────────────────── */}
      {(data.synchroniciteQuestions.length > 0 || data.reflectionQuestions.length > 0) && (
        <StorySection
          icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
          title="Synchronicité du jour"
          accentColor="hsl(var(--mp-brand-gold))"
          variant="gold"
          delay={0.18}
        >
          <p className="text-muted-foreground text-xs italic mb-3 leading-relaxed">
            Les questions que les étoiles vous posent en retour…
          </p>
          <ul className="space-y-3" role="list">
            {(data.synchroniciteQuestions.length > 0 ? data.synchroniciteQuestions : data.reflectionQuestions).map((q, i) => (
              <li key={i} className="flex items-start gap-3 text-foreground">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold mt-0.5 bg-mp-brand-gold/15 text-mp-brand-gold"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className="italic text-sm leading-relaxed">"{q}"</span>
              </li>
            ))}
          </ul>
        </StorySection>
      )}

      {/* ── Section 4 · Action guidée ────────────────────────────── */}
      {data.advice.length > 0 && (
        <StorySection
          icon={<Zap className="h-5 w-5" aria-hidden="true" />}
          title="Action guidée"
          accentColor="hsl(var(--color-success))"
          variant="default"
          delay={0.24}
        >
          <ul className="space-y-2" role="list">
            {data.advice.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-foreground">
                <span className="text-primary mt-1 font-bold text-xs" aria-hidden="true">→</span>
                <span className="text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </StorySection>
      )}

      {/* ── Section 5 · Domaines (legacy love/work/money) ───────── */}
      {hasDomainInterpretations && (
        <SectionReveal delay={0.28}>
          <section aria-label="Interprétations par domaine">
            <div className="grid gap-4 md:grid-cols-3">
              {data.love !== 'Interprétation non disponible.' && (
                <div className="p-5 rounded-xl bg-card border border-border/50 shadow-soft space-y-3">
                  <GoldShimmerBar />
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-aurora-pink" aria-hidden="true" />
                    <h3 className="font-serif text-lg font-semibold text-foreground">Amour</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{data.love}</p>
                </div>
              )}
              {data.work !== 'Interprétation non disponible.' && (
                <div className="p-5 rounded-xl bg-card border border-border/50 shadow-soft space-y-3">
                  <GoldShimmerBar />
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-celestial-blue" aria-hidden="true" />
                    <h3 className="font-serif text-lg font-semibold text-foreground">Travail</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{data.work}</p>
                </div>
              )}
              {data.money !== 'Interprétation non disponible.' && (
                <div className="p-5 rounded-xl bg-card border border-border/50 shadow-soft space-y-3">
                  <GoldShimmerBar />
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-mystic-gold" aria-hidden="true" />
                    <h3 className="font-serif text-lg font-semibold text-foreground">Finances</h3>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{data.money}</p>
                </div>
              )}
            </div>
          </section>
        </SectionReveal>
      )}

      {/* ── Section 6 · Message des tarologues ──────────────────── */}
      <StorySection
        icon={<Users className="h-5 w-5" aria-hidden="true" />}
        title="Message des tarologues"
        accentColor="hsl(var(--mp-brand-violet2))"
        variant="violet"
        delay={0.32}
      >
        <blockquote className="relative pl-4 border-l-2 space-y-2" style={{ borderColor: 'hsl(var(--mp-brand-gold) / 0.5)' }}>
          <p className="text-muted-foreground text-sm leading-relaxed italic">
            {data.isTemplate
              ? "Cette lecture s'inscrit dans la tradition des arcanes millénaires. Les maîtres du tarot nous enseignent que chaque carte est un miroir de l'âme : elle révèle non pas votre destin figé, mais le potentiel vivant en vous. Faites confiance à votre intuition profonde — c'est votre boussole intérieure."
              : `Les 30 traditions tarologiques — de l'École de Marseille à l'approche jungienne — convergent sur un point essentiel : ${data.summary} Votre lecture d'aujourd'hui est une invitation à vous faire confiance.`}
          </p>
          <footer className="text-xs" style={{ color: 'hsl(var(--mp-brand-gold) / 0.8)' }}>
            — Sagesse des 30 écoles du tarot
          </footer>
        </blockquote>
      </StorySection>

      {/* ── Section 7 · Lecture approfondie (BookOpen) ───────────── */}
      <StorySection
        icon={<BookOpen className="h-5 w-5" aria-hidden="true" />}
        title="Pour aller plus loin"
        accentColor="hsl(var(--muted-foreground))"
        variant="muted"
        delay={0.36}
      >
        <p className="text-muted-foreground text-xs leading-relaxed">
          Ce tirage est une porte d'entrée. Pour une lecture plus profonde — tirage en Croix Celtique, 
          analyse de votre chemin de vie ou guidance relationnelle — créez votre espace personnel 
          et accédez à votre journal de bord intuitif.
        </p>
      </StorySection>

      {/* ── Safety Disclaimers ────────────────────────────────────── */}
      <SectionReveal delay={0.4}>
        <div
          className="p-5 rounded-xl bg-muted/40 border border-border/30 space-y-4"
          role="note"
          aria-label="Rappels importants"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <h3 className="font-serif text-base font-semibold text-muted-foreground">
              Rappels importants
            </h3>
          </div>
          <div className="grid gap-3 text-xs text-muted-foreground">
            {data.safetyMedical && (
              <div className="flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>{data.safetyMedical}</span>
              </div>
            )}
            {data.safetyLegal && (
              <div className="flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span><strong>Juridique :</strong> {data.safetyLegal}</span>
              </div>
            )}
            {data.safetyFinancial && (
              <div className="flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span><strong>Financier :</strong> {data.safetyFinancial}</span>
              </div>
            )}
            {!data.safetyMedical && !data.safetyLegal && !data.safetyFinancial && (
              <div className="flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <span>
                  Le tarot est un outil d'introspection et de guidance personnelle. Il ne remplace pas
                  l'avis de professionnels qualifiés (médecins, avocats, conseillers financiers) pour
                  les décisions importantes de votre vie.
                </span>
              </div>
            )}
          </div>
        </div>
      </SectionReveal>

      {/* Template badge */}
      {data.isTemplate && data.templateReason && (
        <SectionReveal delay={0.44}>
          <p className="text-center text-xs text-muted-foreground/60">
            Interprétation basée sur les arcanes traditionnels
          </p>
        </SectionReveal>
      )}
    </article>
  );
}
