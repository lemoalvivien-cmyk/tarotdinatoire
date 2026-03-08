import { forwardRef, useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowRight, Stars, Moon, Sparkles, Shield, Lock,
  ChevronDown, Flame, BookOpen, Eye, Zap, Heart, TrendingUp,
  Check, Star, CreditCard, Play, X
} from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { MysticButton } from '@/components/mystic';
import { Link as RouterLink } from 'react-router-dom';
import { motion, useReducedMotion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

// ─── Standalone Header ─────────────────────────────────────────────────────────
function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'backdrop-blur-xl border-b border-white/10 bg-black/40' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <RouterLink to="/" className="flex items-center gap-2 group">
            <Sparkles className="h-7 w-7 transition-all duration-300 group-hover:scale-110" style={{ color: 'hsl(var(--mp-brand-gold))' }} />
            <span className="font-serif text-xl font-semibold tracking-tight text-white">L'Œil du Tarot</span>
          </RouterLink>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <span className="text-xs font-medium" style={{ color: 'hsl(var(--mp-brand-gold))' }}>3,90€/mois · Illimité</span>
            </div>
            <RouterLink to="/auth">
              <button className="text-sm text-white/70 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">
                Connexion
              </button>
            </RouterLink>
          </div>
        </div>
      </div>
    </header>
  );
}

function LandingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <CreditCard className="h-4 w-4" style={{ color: 'hsl(var(--mp-brand-gold))' }} />
              <span className="text-xs text-white/90">3,90€/mois · Sans engagement</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <Shield className="h-4 w-4" style={{ color: 'hsl(var(--mp-brand-gold))' }} />
              <span className="text-xs text-white/90">Paiement sécurisé Stripe</span>
            </div>
          </div>
          <nav className="flex flex-wrap justify-center gap-4 md:gap-6">
            {[
              { href: '/legal/terms', label: 'CGV' },
              { href: '/legal/privacy', label: 'Confidentialité' },
              { href: '/legal/imprint', label: 'Mentions légales' },
              { href: '/disclaimer', label: 'Avertissement' },
            ].map(l => (
              <RouterLink key={l.href} to={l.href} className="text-sm text-white/70 hover:text-white transition-colors focus:outline-none focus-visible:underline">
                {l.label}
              </RouterLink>
            ))}
          </nav>
          <p className="text-xs text-white/50">© {year} VLM Consulting · L'Œil du Tarot. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Starfield ─────────────────────────────────────────────────────────────────
function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    const stars: { x: number; y: number; r: number; alpha: number; speed: number; phase: number }[] = [];

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    function init() {
      stars.length = 0;
      for (let i = 0; i < 200; i++) {
        stars.push({ x: Math.random() * (canvas?.width ?? 1920), y: Math.random() * (canvas?.height ?? 1080), r: Math.random() * 1.5 + 0.2, alpha: Math.random() * 0.7 + 0.15, speed: Math.random() * 0.25 + 0.05, phase: Math.random() * Math.PI * 2 });
      }
    }
    function draw(t: number) {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        const twinkle = s.alpha + 0.3 * Math.sin(t * 0.001 * s.speed + s.phase);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,200,255,${Math.max(0, Math.min(1, twinkle))})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    }
    resize(); init(); animId = requestAnimationFrame(draw);
    const onResize = () => { resize(); init(); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.55 }} aria-hidden="true" />;
}

// ─── Floating Orb ──────────────────────────────────────────────────────────────
function FloatingOrb({ size, color, x, y, delay = 0 }: { size: number; color: string; x: string; y: string; delay?: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, left: x, top: y, background: color, filter: 'blur(70px)' }}
      animate={{ y: [-18, 18, -18], scale: [1, 1.08, 1], opacity: [0.25, 0.45, 0.25] }}
      transition={{ duration: 9 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  );
}

// ─── Animated Card Preview ──────────────────────────────────────────────────────
function OracleCardPreview() {
  const cards = [
    { name: 'Le Soleil', label: 'Clarté · Joie', color: 'from-amber-600/30 to-yellow-500/20', symbol: '☀', glow: '255,180,50' },
    { name: 'La Lune', label: 'Intuition · Mystère', color: 'from-indigo-600/30 to-violet-600/20', symbol: '☽', glow: '139,92,246' },
    { name: "L'Étoile", label: 'Espoir · Renouveau', color: 'from-cyan-500/25 to-blue-600/20', symbol: '✦', glow: '56,189,248' },
  ];
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % 3), 3500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative w-64 h-96 mx-auto select-none">
      {cards.map((card, i) => {
        const offset = (i - active + 3) % 3;
        const isActive = i === active;
        const x = offset === 1 ? 28 : offset === 2 ? -28 : 0;
        const scale = isActive ? 1 : 0.85;
        const zIndex = isActive ? 10 : offset === 1 ? 5 : 1;
        const opacity = isActive ? 1 : 0.45;
        return (
          <motion.div
            key={card.name}
            className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${card.color} border border-white/10 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer`}
            animate={{ x, scale, zIndex, opacity }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ boxShadow: isActive ? `0 25px 70px rgba(${card.glow},0.35)` : 'none' }}
            onClick={() => setActive(i)}
            role="button"
            tabIndex={0}
            aria-label={card.name}
          >
            <div className="text-6xl mb-4 opacity-75" style={{ fontFamily: 'serif' }}>{card.symbol}</div>
            <div className="w-12 h-px bg-white/25 mb-4" />
            <p className="font-serif text-2xl text-white font-medium">{card.name}</p>
            <p className="text-white/50 text-xs mt-1 tracking-widest uppercase">{card.label}</p>
            {isActive && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 px-5 text-center">
                <p className="text-white/65 text-xs leading-relaxed italic">
                  "Votre tirage révèle une période de profonde transformation intérieure..."
                </p>
              </motion.div>
            )}
          </motion.div>
        );
      })}
      {/* Dot indicators */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {cards.map((_, i) => (
          <button key={i} onClick={() => setActive(i)}
            className="w-1.5 h-1.5 rounded-full transition-all duration-300"
            style={{ backgroundColor: i === active ? 'hsl(var(--mp-brand-gold))' : 'rgba(255,255,255,0.2)' }}
            aria-label={`Carte ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Animated Counter ──────────────────────────────────────────────────────────
function AnimatedCounter({ end, suffix = '', label }: { end: number; suffix?: string; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) setStarted(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [started]);
  useEffect(() => {
    if (!started) return;
    const steps = 55; const duration = 2000;
    const increment = end / steps;
    let current = 0;
    const t = setInterval(() => {
      current = Math.min(current + increment, end);
      setCount(Math.floor(current));
      if (current >= end) clearInterval(t);
    }, duration / steps);
    return () => clearInterval(t);
  }, [started, end]);
  return (
    <div ref={ref} className="text-center">
      <p className="font-serif text-4xl md:text-5xl font-bold text-white">{count.toLocaleString('fr-FR')}{suffix}</p>
      <p className="text-white/45 text-sm mt-2 tracking-wide uppercase">{label}</p>
    </div>
  );
}

// ─── Feature Pill ──────────────────────────────────────────────────────────────
function FeaturePill({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
      <Icon className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'hsl(var(--mp-brand-gold))' }} />
      <span className="text-white/65 text-xs whitespace-nowrap">{label}</span>
    </div>
  );
}

// ─── Testimonials ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { text: "L'interprétation quotidienne est troublante de précision. En trois semaines, j'ai compris des patterns dans ma vie que je n'arrivais pas à voir depuis des années.", name: "Sophie M.", sign: "♏ Scorpion", days: "127 jours consécutifs", stars: 5 },
  { text: "Ce n'est pas de la divination. C'est un miroir. Chaque tirage m'aide à voir plus clairement ce que je ressens déjà. L'oracle narratif est bluffant.", name: "Thomas R.", sign: "♒ Verseau", days: "89 jours consécutifs", stars: 5 },
  { text: "La récurrence de certaines cartes sur plusieurs semaines, analysée par l'oracle... c'est une précision qui m'a laissée sans voix.", name: "Isabelle D.", sign: "♓ Poissons", days: "203 jours consécutifs", stars: 5 },
  { text: "3,90€ par mois pour quelque chose d'aussi puissant, c'est le meilleur investissement bien-être que j'aie fait de ma vie.", name: "Marie-Claire B.", sign: "♋ Cancer", days: "44 jours consécutifs", stars: 5 },
];

// ─── Urgency Banner ────────────────────────────────────────────────────────────
function UrgencyBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-[60] text-center py-2 px-4 text-sm font-medium"
      style={{ background: 'linear-gradient(90deg, hsl(var(--mp-brand-violet)), hsl(265 55% 40%), hsl(var(--mp-brand-gold) / 0.8))' }}
    >
      <span className="text-white/95">✦ Offre de lancement — 3,90€/mois · Annulation à tout moment</span>
      <button onClick={() => setVisible(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// ─── How It Works Step ─────────────────────────────────────────────────────────
const HOW_STEPS = [
  { step: '01', icon: Moon, title: 'Rituel du matin', desc: "Chaque jour, l'oracle tire une carte pour vous. Un espace sacré de réflexion quotidienne." },
  { step: '02', icon: Eye, title: 'Lecture psychologique', desc: "L'IA génère une interprétation ancrée dans votre profil et votre contexte émotionnel." },
  { step: '03', icon: BookOpen, title: 'Journal de vie', desc: "Notez vos ressentis. L'oracle mémorise chaque entrée pour affiner votre profil unique." },
  { step: '04', icon: Sparkles, title: 'Récit qui se tisse', desc: "Semaine après semaine, votre arc narratif se révèle. L'oracle vous parle de vous." },
];

// ─── Pricing features ──────────────────────────────────────────────────────────
const PRICING_FEATURES = [
  'Rituel quotidien illimité',
  'Oracle narratif IA personnalisé',
  'Tous les tirages avancés (10+)',
  'Journal de vie avec mémoire',
  'Profil énergétique dynamique',
  'Analyse astrologique intégrée',
  'Détection de synchronicités',
  'Partage mystique',
];

// ─── Main Landing ──────────────────────────────────────────────────────────────
const Landing = forwardRef<HTMLDivElement>((_, ref) => {
  const { user } = useAuth();
  const shouldReduce = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTestimonialIndex(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const ctaHref = user ? '/app' : '/auth';
  const ctaLabel = user ? 'Accéder à mon oracle' : 'Commencer — 3,90€/mois';

  const sectionVariants = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65 } },
  };

  return (
    <div
      ref={ref}
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, hsl(260 38% 5%) 0%, hsl(260 32% 7%) 50%, hsl(260 28% 5%) 100%)' }}
    >
      <SEOHead
        title="L'Œil du Tarot | Oracle Personnel Quotidien — 3,90€/mois"
        description="Un oracle personnel IA qui apprend à vous connaître. Tirage quotidien, analyse psychologique profonde, récit narratif de votre vie. Rejoignez 12 000+ voyageurs. Sans engagement."
        ogTitle="L'Œil du Tarot — Votre Oracle Personnel"
        ogDescription="Un oracle qui vous connaît. Tirage quotidien · Analyse psychologique · Récit narratif IA · Synchronicités. 3,90€/mois."
      />

      <UrgencyBanner />
      <LandingHeader />

      {/* ══ HERO ══════════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
        <StarfieldCanvas />
        <FloatingOrb size={500} color="radial-gradient(circle, hsl(265 55% 45% / 0.4), transparent)" x="5%" y="5%" delay={0} />
        <FloatingOrb size={350} color="radial-gradient(circle, hsl(42 70% 45% / 0.22), transparent)" x="62%" y="52%" delay={2.5} />
        <FloatingOrb size={280} color="radial-gradient(circle, hsl(220 60% 50% / 0.18), transparent)" x="18%" y="58%" delay={5} />

        <motion.div
          style={shouldReduce ? {} : { y: heroY, opacity: heroOpacity }}
          className="relative z-10 container mx-auto px-4 py-16 flex flex-col lg:flex-row items-center gap-14 lg:gap-20"
        >
          {/* Left — Copy */}
          <div className="flex-1 max-w-2xl text-center lg:text-left space-y-7">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase"
              style={{ borderColor: 'hsl(var(--mp-brand-gold) / 0.35)', color: 'hsl(var(--mp-brand-gold))', backgroundColor: 'hsl(var(--mp-brand-gold) / 0.08)' }}
            >
              <Sparkles className="h-3 w-3" />
              Votre oracle personnel IA
            </motion.div>

            {/* H1 */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
              className="font-serif text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.08] text-white"
            >
              L'oracle qui{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(var(--mp-brand-gold)), hsl(265 60% 72%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                vous comprend<br className="hidden sm:block" /> vraiment
              </span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.22 }}
              className="text-lg md:text-xl text-white/60 leading-relaxed"
            >
              Chaque jour, un tirage personnalisé. Chaque semaine, votre récit de vie se précise.
              L'oracle détecte vos patterns émotionnels et vous parle <em className="text-white/80 not-italic font-medium">vraiment</em>.
            </motion.p>

            {/* Social proof inline */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
              className="flex items-center gap-3 justify-center lg:justify-start"
            >
              <div className="flex -space-x-2">
                {['S','T','I','M'].map((l, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white/10 flex items-center justify-center text-xs font-bold text-white/90 flex-shrink-0"
                    style={{ background: `hsl(${265 + i * 15} 55% ${35 + i * 5}%)` }}>
                    {l}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5 mb-0.5">
                  {[0,1,2,3,4].map(i => <Star key={i} className="h-3 w-3 fill-current" style={{ color: 'hsl(var(--mp-brand-gold))' }} />)}
                </div>
                <p className="text-white/50 text-xs">12 000+ voyageurs actifs</p>
              </div>
            </motion.div>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-wrap gap-2 justify-center lg:justify-start"
            >
              <FeaturePill icon={Flame} label="Rituel quotidien" />
              <FeaturePill icon={Eye} label="Oracle narratif IA" />
              <FeaturePill icon={Zap} label="Synchronicités" />
              <FeaturePill icon={BookOpen} label="Journal de vie" />
              <FeaturePill icon={TrendingUp} label="Profil énergétique" />
              <FeaturePill icon={Heart} label="Astrologie" />
            </motion.div>

            {/* CTA Row */}
            <motion.div
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
            >
              <Link to={ctaHref}>
                <MysticButton size="lg" rightIcon={<ArrowRight className="h-5 w-5" />} className="text-base px-8 w-full sm:w-auto">
                  {ctaLabel}
                </MysticButton>
              </Link>
              <button
                onClick={() => setShowVideo(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/15 text-white/70 hover:text-white hover:border-white/25 transition-all text-sm"
              >
                <Play className="h-4 w-4 fill-current" />
                Voir en action
              </button>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap items-center gap-5 justify-center lg:justify-start text-xs text-white/35"
            >
              <div className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /><span>Données chiffrées</span></div>
              <div className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /><span>Sans engagement</span></div>
              <div className="flex items-center gap-1.5"><Stars className="h-3.5 w-3.5" /><span>Annulation en 1 clic</span></div>
            </motion.div>
          </div>

          {/* Right — Card Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, x: 40 }} animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex-shrink-0 pb-10"
          >
            <OracleCardPreview />
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1"
          animate={shouldReduce ? {} : { y: [0, 8, 0] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        >
          <span className="text-white/25 text-xs tracking-widest uppercase">Découvrir</span>
          <ChevronDown className="h-5 w-5 text-white/20" />
        </motion.div>
      </section>

      {/* ══ SOCIAL PROOF BAR ══════════════════════════════════════════════════════ */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent, hsl(265 40% 8%), transparent)' }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto grid grid-cols-3 gap-6 md:gap-14">
            <AnimatedCounter end={12400} suffix="+" label="Voyageurs actifs" />
            <AnimatedCounter end={340000} suffix="+" label="Tirages réalisés" />
            <AnimatedCounter end={94} suffix="%" label="Transformation ressentie" />
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════════════════════ */}
      <section className="relative py-28 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'hsl(var(--mp-brand-gold))' }}>Comment ça marche</p>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold text-white leading-tight">
              Un compagnon qui évolue<br />avec votre vie
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {HOW_STEPS.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative p-6 rounded-2xl border group hover:border-white/20 transition-colors"
                style={{ borderColor: 'hsl(var(--mp-surface-border))', backgroundColor: 'hsl(var(--mp-surface-glass))' }}
              >
                <p className="font-serif text-5xl font-bold mb-4 leading-none select-none" style={{ color: 'hsl(var(--mp-brand-gold) / 0.12)' }}>{item.step}</p>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: 'hsl(var(--mp-brand-violet) / 0.15)' }}>
                  <item.icon className="h-5 w-5" style={{ color: 'hsl(var(--mp-brand-violet2))' }} />
                </div>
                <h3 className="font-serif text-lg text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ORACLE NARRATIVE FEATURE ══════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden">
        <FloatingOrb size={500} color="radial-gradient(circle, hsl(265 55% 35% / 0.12), transparent)" x="50%" y="50%" delay={1} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
            {/* Left visual — mock oracle narrative UI */}
            <motion.div
              initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            >
              <div className="rounded-3xl p-7 border" style={{ borderColor: 'hsl(var(--mp-surface-border))', background: 'linear-gradient(135deg, hsl(265 35% 11%), hsl(260 30% 7%))' }}>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 rounded-full bg-green-400/70" />
                  <p className="text-xs text-white/35 uppercase tracking-widest">Oracle Narratif — 30 derniers jours</p>
                </div>
                <div className="space-y-4">
                  {[
                    { card: "L'Hermite", count: 3, text: 'Apparaît pour la 3ème fois. Une phase d\'introspection profonde est à l\'œuvre en vous.' },
                    { card: 'La Lune', count: 2, text: 'Récurrente depuis 2 semaines. Vos intuitions cherchent à s\'exprimer librement.' },
                    { card: "L'Étoile", count: 4, text: 'Carte dominante ce mois. Un horizon d\'espoir se dessine avec une clarté nouvelle.' },
                  ].map((insight, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.25 + i * 0.15 }}
                      className="flex gap-3.5 p-4 rounded-xl" style={{ backgroundColor: 'hsl(265 28% 14%)' }}>
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: 'hsl(var(--mp-brand-gold) / 0.18)', color: 'hsl(var(--mp-brand-gold))' }}>
                        {insight.count}×
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold mb-1">{insight.card}</p>
                        <p className="text-white/50 text-xs leading-relaxed">{insight.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 pt-5 border-t" style={{ borderColor: 'hsl(var(--mp-surface-border))' }}>
                  <p className="text-white/35 text-xs italic leading-relaxed">
                    "Votre arcane dominant ce mois est L'Étoile — une phase de reconstruction guidée par la foi intérieure et la clarté retrouvée."
                  </p>
                </div>
              </div>
            </motion.div>
            {/* Right copy */}
            <motion.div
              initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-7"
            >
              <div>
                <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'hsl(var(--mp-brand-gold))' }}>Oracle Narratif Unique</p>
                <h2 className="font-serif text-4xl md:text-5xl font-semibold text-white leading-tight mb-5">
                  L'oracle qui lit<br />votre histoire
                </h2>
                <p className="text-white/55 text-lg leading-relaxed">
                  Contrairement à un tirage isolé, L'Œil du Tarot mémorise chaque lecture.
                  Il détecte les cartes récurrentes, vos thèmes de vie, votre arc émotionnel —
                  et génère une synthèse narrative <strong className="text-white/80 font-medium">entièrement personnalisée</strong>.
                </p>
              </div>
              <div className="space-y-3.5">
                {[
                  { icon: TrendingUp, text: 'Détection des patterns émotionnels sur 90 jours' },
                  { icon: Zap, text: 'Synchronicités et coïncidences significatives révélées' },
                  { icon: Heart, text: 'Profil psychologique évolutif et précis' },
                  { icon: BookOpen, text: 'Journal mémorisé pour affiner l\'oracle' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'hsl(var(--mp-brand-gold) / 0.12)' }}>
                      <item.icon className="h-4 w-4" style={{ color: 'hsl(var(--mp-brand-gold))' }} />
                    </div>
                    <p className="text-white/70 text-sm">{item.text}</p>
                  </div>
                ))}
              </div>
              <Link to={ctaHref}>
                <MysticButton size="md" rightIcon={<ArrowRight className="h-4 w-4" />} className="mt-2">
                  Découvrir mon oracle
                </MysticButton>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══════════════════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent, hsl(265 38% 7%), transparent)' }} />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'hsl(var(--mp-brand-gold))' }}>Ce qu'ils vivent</p>
            <h2 className="font-serif text-4xl font-semibold text-white">L'oracle parle pour eux</h2>
          </motion.div>

          {/* Testimonial carousel */}
          <div className="max-w-2xl mx-auto relative min-h-[240px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialIndex}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.45 }}
                className="p-8 rounded-3xl border text-center"
                style={{ borderColor: 'hsl(var(--mp-surface-border))', backgroundColor: 'hsl(var(--mp-surface-glass))' }}
              >
                {/* Stars */}
                <div className="flex justify-center gap-0.5 mb-5">
                  {[0,1,2,3,4].map(i => <Star key={i} className="h-4 w-4 fill-current" style={{ color: 'hsl(var(--mp-brand-gold))' }} />)}
                </div>
                <p className="font-serif text-lg md:text-xl text-white/80 italic leading-relaxed mb-7">
                  "{TESTIMONIALS[testimonialIndex].text}"
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-serif text-lg"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--mp-brand-violet)), hsl(var(--mp-brand-gold)))' }}>
                    {TESTIMONIALS[testimonialIndex].name[0]}
                  </div>
                  <div className="text-left">
                    <p className="text-white text-sm font-semibold">{TESTIMONIALS[testimonialIndex].name}</p>
                    <p className="text-white/40 text-xs">{TESTIMONIALS[testimonialIndex].sign} · {TESTIMONIALS[testimonialIndex].days}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex justify-center gap-2 mt-5">
              {TESTIMONIALS.map((_, i) => (
                <button key={i} onClick={() => setTestimonialIndex(i)}
                  className="transition-all duration-300 rounded-full"
                  style={{ width: i === testimonialIndex ? 20 : 8, height: 8, backgroundColor: i === testimonialIndex ? 'hsl(var(--mp-brand-gold))' : 'hsl(255 20% 35%)' }}
                  aria-label={`Témoignage ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ PRICING CTA ═══════════════════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden" id="pricing">
        <FloatingOrb size={700} color="radial-gradient(circle, hsl(265 55% 40% / 0.18), transparent)" x="50%" y="50%" delay={0} />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            variants={sectionVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="max-w-lg mx-auto text-center"
          >
            <p className="text-xs tracking-widest uppercase mb-5" style={{ color: 'hsl(var(--mp-brand-gold))' }}>Commencer votre voyage</p>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold text-white mb-3">
              Votre oracle personnel
            </h2>
            <p className="text-white/45 mb-10 leading-relaxed">
              Un abonnement simple. Un rituel quotidien. Une relation qui dure.
            </p>

            <div className="relative p-8 rounded-3xl border mb-7"
              style={{ borderColor: 'hsl(var(--mp-brand-gold) / 0.25)', background: 'linear-gradient(155deg, hsl(265 35% 10%), hsl(260 30% 7%))' }}>
              {/* Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold tracking-wide"
                style={{ background: 'linear-gradient(90deg, hsl(var(--mp-brand-violet)), hsl(var(--mp-brand-gold) / 0.8))', color: 'white' }}>
                OFFRE DE LANCEMENT
              </div>

              {/* Price */}
              <div className="flex items-baseline justify-center gap-1 mb-1.5 mt-2">
                <span className="font-serif text-6xl font-bold text-white">3,90€</span>
                <span className="text-white/40 text-lg">/mois</span>
              </div>
              <p className="text-white/35 text-sm mb-8">TTC · Sans engagement · Annulation en 1 clic</p>

              {/* Features checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8 text-left">
                {PRICING_FEATURES.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-white/65">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'hsl(var(--mp-brand-gold) / 0.15)' }}>
                      <Check className="h-3 w-3" style={{ color: 'hsl(var(--mp-brand-gold))' }} />
                    </div>
                    {feature}
                  </div>
                ))}
              </div>

              <Link to={ctaHref} className="block">
                <MysticButton size="lg" className="w-full text-base" rightIcon={<ArrowRight className="h-5 w-5" />}>
                  {ctaLabel}
                </MysticButton>
              </Link>
            </div>

            {/* Final trust row */}
            <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-white/30">
              <div className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" />Paiement Stripe sécurisé</div>
              <div className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" />RGPD · Données protégées</div>
              <div className="flex items-center gap-1.5"><Stars className="h-3.5 w-3.5" />12 000+ voyageurs</div>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFooter />

      {/* Video Modal */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowVideo(false)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
              className="relative w-full max-w-2xl rounded-2xl overflow-hidden border border-white/10"
              style={{ backgroundColor: 'hsl(265 35% 10%)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--mp-brand-gold) / 0.15)' }}>
                  <Sparkles className="h-8 w-8" style={{ color: 'hsl(var(--mp-brand-gold))' }} />
                </div>
                <p className="font-serif text-2xl text-white mb-2">Découvrez L'Œil du Tarot</p>
                <p className="text-white/50 text-sm mb-6">Commencez dès maintenant et vivez l'expérience vous-même.</p>
                <Link to={ctaHref} onClick={() => setShowVideo(false)}>
                  <MysticButton size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Commencer — 3,90€/mois
                  </MysticButton>
                </Link>
              </div>
              <button onClick={() => setShowVideo(false)} className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

Landing.displayName = 'Landing';
export default Landing;
