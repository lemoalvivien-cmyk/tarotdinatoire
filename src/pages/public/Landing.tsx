import { useEffect, useRef, useState, forwardRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowRight, Sparkles, Shield, Lock, Stars,
  ChevronDown, BookOpen, Eye, Heart, TrendingUp,
  Check, Star, CreditCard, Moon, Zap, X, Minus, Plus
} from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { MysticButton } from '@/components/mystic';
import { motion, useReducedMotion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

// ─── Design Tokens helpers ────────────────────────────────────────────────────
const gold = 'hsl(var(--mp-brand-gold))';
const goldSoft = 'hsl(var(--mp-brand-gold) / 0.15)';
const violet = 'hsl(var(--mp-brand-violet))';
const violet2 = 'hsl(var(--mp-brand-violet2))';
const surfaceBorder = 'hsl(var(--mp-surface-border))';
const surfaceGlass = 'hsl(var(--mp-bg-800) / 0.9)';

// ─── Starfield ────────────────────────────────────────────────────────────────
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
      if (!canvas) return;
      stars.length = 0;
      for (let i = 0; i < 180; i++) {
        stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: Math.random() * 1.2 + 0.2, alpha: Math.random() * 0.5 + 0.1, speed: Math.random() * 0.2 + 0.04, phase: Math.random() * Math.PI * 2 });
      }
    }
    function draw(t: number) {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        const twinkle = s.alpha + 0.25 * Math.sin(t * 0.0008 * s.speed + s.phase);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210,195,255,${Math.max(0, Math.min(1, twinkle))})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    }
    resize(); init(); animId = requestAnimationFrame(draw);
    const onResize = () => { resize(); init(); };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.45 }} aria-hidden="true" />;
}

// ─── Floating Orb ─────────────────────────────────────────────────────────────
function Orb({ size, color, x, y, delay = 0 }: { size: number; color: string; x: string; y: string; delay?: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      aria-hidden="true"
      style={{ width: size, height: size, left: x, top: y, background: color, filter: 'blur(80px)' }}
      animate={{ y: [-20, 20, -20], scale: [1, 1.06, 1], opacity: [0.2, 0.38, 0.2] }}
      transition={{ duration: 10 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  );
}

// ─── Horizontal gold divider ──────────────────────────────────────────────────
function GoldDivider() {
  return (
    <div className="flex items-center justify-center my-4" aria-hidden="true">
      <div className="h-px w-16 opacity-30" style={{ background: `linear-gradient(90deg, transparent, ${gold})` }} />
      <Sparkles className="mx-3 h-3 w-3 opacity-50" style={{ color: gold }} />
      <div className="h-px w-16 opacity-30" style={{ background: `linear-gradient(90deg, ${gold}, transparent)` }} />
    </div>
  );
}

// ─── Section wrapper with fade-in ────────────────────────────────────────────
const SectionReveal = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  ({ children, className = '' }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
);
SectionReveal.displayName = 'SectionReveal';

// ─── Eyebrow label ────────────────────────────────────────────────────────────
const Eyebrow = forwardRef<HTMLParagraphElement, { children: React.ReactNode }>(
  ({ children }, ref) => (
    <p ref={ref} className="text-xs font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: gold }}>
      {children}
    </p>
  )
);
Eyebrow.displayName = 'Eyebrow';

// ─── Card Preview (hero) ──────────────────────────────────────────────────────
function OracleCardPreview() {
  const cards = [
    { name: 'Le Soleil', label: 'Clarté · Joie · Vitalité', symbol: '☀', grad: 'from-amber-900/50 to-yellow-900/30', glow: '255,170,40' },
    { name: 'La Lune', label: 'Intuition · Mystère · Rêves', symbol: '☽', grad: 'from-indigo-900/50 to-violet-900/30', glow: '139,92,246' },
    { name: "L'Étoile", label: 'Espoir · Renouveau · Confiance', symbol: '✦', grad: 'from-cyan-900/50 to-blue-900/30', glow: '56,189,248' },
  ];
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % 3), 4000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative w-56 sm:w-60 h-80 sm:h-[22rem] mx-auto select-none" aria-label="Aperçu des cartes tarot" role="region">
      {cards.map((card, i) => {
        const offset = (i - active + 3) % 3;
        const isActive = i === active;
        const x = offset === 1 ? 28 : offset === 2 ? -28 : 0;
        return (
          <motion.div
            key={card.name}
            className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${card.grad} border border-white/10 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer`}
            animate={{ x, scale: isActive ? 1 : 0.84, zIndex: isActive ? 10 : offset === 1 ? 5 : 1, opacity: isActive ? 1 : 0.4 }}
            transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ boxShadow: isActive ? `0 30px 80px rgba(${card.glow},0.3)` : 'none' }}
            onClick={() => setActive(i)}
            role="button" tabIndex={0} aria-label={`Voir la carte ${card.name}`}
            onKeyDown={(e) => e.key === 'Enter' && setActive(i)}
          >
            <div className="text-5xl mb-4 opacity-70" style={{ fontFamily: 'serif' }} aria-hidden="true">{card.symbol}</div>
            <div className="w-10 h-px mb-4 opacity-20" style={{ backgroundColor: gold }} aria-hidden="true" />
            <p className="font-serif text-xl text-white font-medium tracking-wide">{card.name}</p>
            <p className="text-white/40 text-[10px] mt-1 tracking-[0.2em] uppercase">{card.label}</p>
            {isActive && (
              <motion.p
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="mt-5 px-5 text-center text-white/50 text-xs leading-relaxed italic"
              >
                "Ce n'est pas une prédiction. C'est un miroir. Et il vous voit."
              </motion.p>
            )}
          </motion.div>
        );
      })}
      <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex gap-2" role="tablist" aria-label="Navigation cartes">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            role="tab"
            aria-selected={i === active}
            className="rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            style={{ width: i === active ? 18 : 6, height: 6, backgroundColor: i === active ? gold : 'rgba(255,255,255,0.18)' }}
            aria-label={`Carte ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
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
    const steps = 60; const duration = 1800;
    let current = 0;
    const increment = end / steps;
    const t = setInterval(() => {
      current = Math.min(current + increment, end);
      setCount(Math.floor(current));
      if (current >= end) clearInterval(t);
    }, duration / steps);
    return () => clearInterval(t);
  }, [started, end]);
  return (
    <div ref={ref} className="text-center">
      <p className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white" aria-live="polite">{count.toLocaleString('fr-FR')}{suffix}</p>
      <p className="text-white/50 text-xs mt-2 tracking-widest uppercase">{label}</p>
    </div>
  );
}

// ─── Ritual Step Card ─────────────────────────────────────────────────────────
function RitualStepCard({ num, icon: Icon, title, desc, delay }: { num: string; icon: React.ElementType; title: string; desc: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group relative p-6 rounded-2xl border transition-all duration-500 hover:border-white/20"
      style={{ borderColor: surfaceBorder, backgroundColor: surfaceGlass }}
    >
      <p className="font-serif text-6xl font-bold leading-none select-none mb-3" aria-hidden="true" style={{ color: `hsl(var(--mp-brand-gold) / 0.08)` }}>{num}</p>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `hsl(var(--mp-brand-violet) / 0.15)` }}>
        <Icon className="h-5 w-5" style={{ color: violet2 }} aria-hidden="true" />
      </div>
      <h3 className="font-serif text-lg text-white font-semibold mb-2">{title}</h3>
      <p className="text-white/55 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// ─── Benefit row ─────────────────────────────────────────────────────────────
function BenefitRow({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: goldSoft }}>
        <Icon className="h-5 w-5" style={{ color: gold }} aria-hidden="true" />
      </div>
      <div>
        <p className="text-white text-sm font-semibold mb-0.5">{title}</p>
        <p className="text-white/55 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─── Testimonial Card ─────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { q: "Je n'attendais pas ça.", text: "En trois semaines, j'ai compris des patterns dans ma vie que je ne voyais plus. L'oracle ne me donnait pas des réponses — il me posait les bonnes questions.", name: "Sophie M.", sign: "♏ Scorpion", streak: "127 jours", stars: 5 },
  { q: "Ce n'est pas du tarot. C'est un révélateur.", text: "L'oracle narratif a analysé mes 30 derniers jours et m'a dit exactement ce que je traversais. Pas en termes vagues. Précisément. Je n'avais rien dit de tel à personne.", name: "Thomas R.", sign: "♒ Verseau", streak: "89 jours", stars: 5 },
  { q: "Troublant de justesse.", text: "Une même carte est apparue 4 fois en trois semaines. L'oracle l'a signalé, l'a analysé, et a nommé quelque chose que je n'arrivais pas à formuler moi-même.", name: "Isabelle D.", sign: "♓ Poissons", streak: "203 jours", stars: 5 },
  { q: "J'ai essayé tout le reste. Rien ne fait ça.", text: "Des dizaines d'applications de bien-être. Tarot Dinatoire est la seule qui se souvient de moi d'un jour à l'autre. La seule qui apprend.", name: "Marie-Claire B.", sign: "♋ Cancer", streak: "44 jours", stars: 5 },
];

// ─── FAQ item ─────────────────────────────────────────────────────────────────
function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  const id = `faq-${index}`;
  return (
    <div className="border-b last:border-0" style={{ borderColor: surfaceBorder }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-5 text-left group"
        aria-expanded={open}
        aria-controls={id}
        id={`${id}-btn`}
      >
        <span className="text-white/85 text-sm font-medium group-hover:text-white transition-colors leading-snug pr-4">{q}</span>
        <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border border-white/10 group-hover:border-white/20 transition-colors" aria-hidden="true">
          {open ? <Minus className="h-3 w-3" style={{ color: gold }} /> : <Plus className="h-3 w-3 text-white/50" />}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id={id}
            role="region"
            aria-labelledby={`${id}-btn`}
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-white/60 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sticky Mobile CTA ────────────────────────────────────────────────────────
function StickyMobileCTA({ href, label }: { href: string; label: string }) {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const h = () => setShow(window.scrollY > 600);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-[env(safe-area-inset-bottom,1rem)] md:hidden"
          style={{ background: 'linear-gradient(to top, hsl(var(--mp-bg-900)), hsl(var(--mp-bg-900) / 0.95) 80%, transparent)' }}
        >
          <button
            onClick={() => navigate(href)}
            className="w-full h-14 rounded-xl text-base font-semibold text-white transition-all duration-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            style={{ background: `linear-gradient(135deg, ${violet}, ${violet2})`, boxShadow: `0 8px 30px hsl(var(--mp-brand-violet) / 0.4)` }}
            aria-label={label}
          >
            {label}
          </button>
          <p className="text-center text-xs text-white/35 mt-2">3,90€/mois · Sans engagement · Annulation en 1 clic</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function LandingHeader({ ctaHref }: { ctaHref: string }) {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'backdrop-blur-2xl border-b bg-black/30' : 'bg-transparent'}`}
      style={{ borderColor: scrolled ? 'hsl(var(--mp-surface-border))' : 'transparent' }}
      role="banner"
    >
      <div className="container mx-auto px-5">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="Tarot Dinatoire — Accueil">
            <Sparkles className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" style={{ color: gold }} aria-hidden="true" />
            <span className="font-serif text-lg font-semibold tracking-tight text-white">Tarot Dinatoire</span>
          </Link>
          <nav className="flex items-center gap-3" aria-label="Navigation principale">
            <Link
              to="/auth"
              className="hidden sm:block text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              Connexion
            </Link>
            <button
              onClick={() => navigate(ctaHref)}
              className="text-sm font-semibold text-white px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              style={{ background: `linear-gradient(135deg, ${violet}, ${violet2})`, boxShadow: `0 4px 20px hsl(var(--mp-brand-violet) / 0.3)` }}
              aria-label="Vivre l'expérience Tarot Dinatoire"
            >
              Vivre l'expérience
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
const LandingFooter = forwardRef<HTMLElement>(function LandingFooter(_, ref) {
  const year = new Date().getFullYear();
  return (
    <footer
      ref={ref}
      className="relative z-10 border-t"
      style={{ borderColor: 'hsl(var(--mp-surface-border))', backgroundColor: 'hsl(var(--mp-bg-900))' }}
      role="contentinfo"
    >
      <div className="container mx-auto px-5 py-10">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" style={{ color: gold }} aria-hidden="true" />
            <span className="font-serif text-base text-white/70">Tarot Dinatoire</span>
          </div>
          <div className="flex flex-wrap justify-center gap-3" role="list" aria-label="Garanties">
            {[
              { icon: CreditCard, label: 'Paiement sécurisé Stripe' },
              { icon: Shield, label: 'RGPD · Données protégées' },
              { icon: Lock, label: 'Sans engagement' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} role="listitem" className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border" style={{ borderColor: surfaceBorder }}>
                <Icon className="h-3.5 w-3.5" style={{ color: gold }} aria-hidden="true" />
                <span className="text-xs text-white/60">{label}</span>
              </div>
            ))}
          </div>
          <nav aria-label="Liens légaux" className="flex flex-wrap justify-center gap-4 md:gap-6">
            {[
              { to: '/legal/terms', label: 'CGV' },
              { to: '/legal/privacy', label: 'Confidentialité' },
              { to: '/legal/imprint', label: 'Mentions légales' },
              { to: '/disclaimer', label: 'Avertissement' },
            ].map(l => (
              <Link key={l.to} to={l.to} className="text-xs text-white/40 hover:text-white/70 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 rounded">{l.label}</Link>
            ))}
          </nav>
          <p className="text-xs text-white/25">© {year} Tarot Dinatoire. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
});

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const shouldReduce = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTestimonialIndex(i => (i + 1) % TESTIMONIALS.length), 5500);
    return () => clearInterval(t);
  }, []);

  const ctaHref = user ? '/app' : '/auth';
  const ctaLabel = user ? 'Accéder à mon oracle' : 'Vivre l\'expérience';

  const FAQ_ITEMS = [
    { q: "Est-ce vraiment différent d'une application de tarot classique ?", a: "Oui. Tarot Dinatoire mémorise chaque tirage pour construire votre profil unique. L'oracle analyse vos récurrences, détecte vos patterns émotionnels et génère un récit narratif sur vos 30-90 derniers jours. Aucune app de tarot ne fait ça." },
    { q: "Il faut croire au tarot pour en bénéficier ?", a: "Non. Beaucoup d'utilisateurs abordent le tarot comme un outil de réflexion psychologique, pas de divination. Les cartes sont un miroir symbolique : elles révèlent ce que vous projetez sur elles. C'est une pratique de connaissance de soi." },
    { q: "Comment fonctionne l'abonnement ?", a: "3,90€/mois, sans engagement. Vous pouvez résilier à tout moment en un clic depuis votre profil. Aucune reconduction cachée, aucun frais supplémentaire. Paiement sécurisé via Stripe." },
    { q: "Mes données personnelles sont-elles protégées ?", a: "Vos données sont chiffrées, hébergées en Europe et jamais revendues. Conformité RGPD complète. Vous pouvez demander leur suppression à tout moment depuis votre profil." },
    { q: "Puis-je tester avant de payer ?", a: "Votre premier tirage est accessible dès la création de votre compte, sans carte bancaire. L'abonnement premium débloque le rituel quotidien illimité, l'oracle narratif et tous les tirages avancés." },
  ];

  const PRICING_FEATURES = [
    'Rituel quotidien — illimité',
    'Oracle narratif IA personnalisé',
    '10+ tirages avancés inclus',
    'Journal de vie avec mémoire',
    'Profil énergétique dynamique',
    'Détection de synchronicités',
    'Analyse astrologique intégrée',
    'Accès prioritaire aux nouveautés',
  ];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, hsl(260 38% 5%) 0%, hsl(260 33% 7%) 60%, hsl(260 28% 6%) 100%)' }}
    >
      <SEOHead
        title="Tarot Dinatoire | Oracle Personnel IA — 3,90€/mois"
        description="L'oracle tarot qui apprend à vous connaître. Tirage quotidien, analyse psychologique et récit narratif de votre vie intérieure. Sans engagement."
        ogTitle="Tarot Dinatoire — Ce n'est pas un tirage. C'est un miroir qui se souvient."
        ogDescription="Plus qu'un tirage. Une expérience immersive qui détecte vos patterns et construit votre récit intérieur. 3,90€/mois · Sans engagement."
        canonical="https://tarotdinatoire.lovable.app/"
      />

      <LandingHeader ctaHref={ctaHref} />
      <StickyMobileCTA href={ctaHref} label={ctaLabel} />

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16" aria-label="Présentation de Tarot Dinatoire" style={{ position: 'relative' }}>
        <StarfieldCanvas />
        <Orb size={600} color="radial-gradient(circle, hsl(265 55% 40% / 0.35), transparent)" x="0%" y="-5%" delay={0} />
        <Orb size={400} color="radial-gradient(circle, hsl(42 70% 45% / 0.15), transparent)" x="60%" y="55%" delay={3} />
        <Orb size={300} color="radial-gradient(circle, hsl(220 60% 50% / 0.12), transparent)" x="15%" y="60%" delay={6} />

        <motion.div
          style={shouldReduce ? {} : { y: heroY, opacity: heroOpacity }}
          className="relative z-10 container mx-auto px-5 py-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-24"
        >
          {/* Left — Copy */}
          <div className="flex-1 max-w-2xl text-center lg:text-left space-y-7">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold tracking-widest uppercase"
              style={{ borderColor: 'hsl(var(--mp-brand-gold) / 0.3)', color: gold, backgroundColor: goldSoft }}
              aria-label="Expérience tarot premium"
            >
              <Stars className="h-3.5 w-3.5" aria-hidden="true" />
              Expérience tarot premium
            </motion.div>

            {/* H1 */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
              className="font-serif text-[2.6rem] leading-[1.08] sm:text-6xl lg:text-7xl font-semibold text-white"
            >
              Ce n'est pas un tirage.{' '}
              <span
                className="block mt-1"
                style={{ background: `linear-gradient(135deg, ${gold}, hsl(265 60% 72%))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
              >
                C'est un miroir qui se souvient.
              </span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.22 }}
              className="text-base sm:text-lg text-white/60 leading-relaxed max-w-xl mx-auto lg:mx-0"
            >
              Chaque jour, une carte tirée pour vous seul.{' '}
              <span className="text-white/85">L'oracle se souvient de tout.</span>{' '}
              Jour après jour, il détecte vos patterns, lit votre arc émotionnel et vous dit ce que vous ne voyez plus — parce que vous êtes dedans.
            </motion.p>

            {/* Social proof inline */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              className="flex items-center gap-3 justify-center lg:justify-start"
              aria-label="12 437 utilisateurs actifs, 5 étoiles"
            >
              <div className="flex -space-x-2" aria-hidden="true">
                {['S', 'T', 'I', 'M'].map((l, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white/10 flex items-center justify-center text-xs font-bold text-white/90"
                    style={{ background: `hsl(${262 + i * 18} 50% ${38 + i * 5}%)` }}>
                    {l}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5 mb-0.5" aria-hidden="true">
                  {[0, 1, 2, 3, 4].map(i => <Star key={i} className="h-3 w-3 fill-current" style={{ color: gold }} />)}
                </div>
                <p className="text-white/50 text-xs">12 437 personnes utilisent l'oracle aujourd'hui</p>
              </div>
            </motion.div>

            {/* CTA block */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-center"
            >
              <MysticButton
                  size="lg"
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                  className="text-base px-8 w-full sm:w-auto"
                  onClick={() => navigate(ctaHref)}
                >
                  {ctaLabel}
                </MysticButton>
              <a
                href="#rituel"
                className="text-sm text-white/50 hover:text-white/80 transition-colors underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 rounded"
              >
                Voir comment ça fonctionne
              </a>
            </motion.div>

            {/* Trust micro-signals */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="flex flex-wrap items-center gap-4 justify-center lg:justify-start text-xs text-white/35"
              aria-label="Garanties"
            >
              <div className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" aria-hidden="true" />Données chiffrées</div>
              <div className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" aria-hidden="true" />Sans engagement</div>
              <div className="flex items-center gap-1.5"><Stars className="h-3.5 w-3.5" aria-hidden="true" />Annulation en 1 clic</div>
            </motion.div>
          </div>

          {/* Right — Card Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 30 }} animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex-shrink-0 pb-10"
          >
            <OracleCardPreview />
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1"
          animate={shouldReduce ? {} : { y: [0, 7, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        >
          <span className="text-white/25 text-xs tracking-widest uppercase">Découvrir</span>
          <ChevronDown className="h-5 w-5 text-white/20" />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — RUPTURE DE CATÉGORIE
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 overflow-hidden" aria-label="Ce qui nous différencie">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{ background: 'linear-gradient(180deg, transparent, hsl(265 40% 8% / 0.7), transparent)' }} />
        <div className="container mx-auto px-5 relative z-10">
          <SectionReveal className="max-w-3xl mx-auto text-center">
            <Eyebrow>Rupture de catégorie</Eyebrow>
            <h2 className="font-serif text-3xl md:text-5xl font-semibold text-white leading-tight mb-8">
              Le marché du tarot est saturé<br className="hidden sm:block" /> de médiocrité. Pas ici.
            </h2>
            <GoldDivider />
            <p className="text-white/60 text-base sm:text-lg leading-relaxed mt-6 max-w-xl mx-auto">
              Tirages génériques, interprétations recyclées, ésotérisme de supermarché.
              Tarot Dinatoire n'est pas dans cette catégorie.{' '}
              <span className="text-white/85">Il construit une relation avec vous</span> — une véritable mémoire de qui vous êtes, tirage après tirage.
            </p>
          </SectionReveal>

          {/* Comparison grid */}
          <div className="mt-14 max-w-3xl mx-auto grid sm:grid-cols-2 gap-4">
            {[
              { icon: X, label: 'Tirages génériques et impersonnels', neg: true },
              { icon: Check, label: 'Oracle qui apprend votre histoire unique', neg: false },
              { icon: X, label: 'Interprétations copiées-collées', neg: true },
              { icon: Check, label: 'Analyse psychologique contextuelle', neg: false },
              { icon: X, label: 'Expérience jetable après 5 minutes', neg: true },
              { icon: Check, label: 'Récit narratif qui se construit sur des mois', neg: false },
              { icon: X, label: 'Aucune mémoire de votre parcours', neg: true },
              { icon: Check, label: 'Patterns et synchronicités mémorisées', neg: false },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: item.neg ? -16 : 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.45 }}
                className="flex items-center gap-3 p-4 rounded-xl border"
                style={{
                  borderColor: item.neg ? 'hsl(var(--mp-surface-border))' : 'hsl(var(--mp-brand-gold) / 0.2)',
                  backgroundColor: item.neg ? 'transparent' : goldSoft,
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={item.neg ? { backgroundColor: 'rgba(255,255,255,0.05)' } : { backgroundColor: goldSoft }}
                  aria-hidden="true"
                >
                  <item.icon className="h-3.5 w-3.5" style={{ color: item.neg ? 'hsl(0 0% 40%)' : gold }} />
                </div>
                <span className="text-sm" style={{ color: item.neg ? 'hsl(0 0% 45%)' : 'hsl(0 0% 85%)' }}>{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — PROJECTION ÉMOTIONNELLE
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 overflow-hidden" aria-label="Votre progression avec l'oracle">
        <Orb size={500} color="radial-gradient(circle, hsl(42 70% 40% / 0.08), transparent)" x="70%" y="20%" delay={2} />
        <div className="container mx-auto px-5 relative z-10">
          <SectionReveal className="text-center mb-14">
            <Eyebrow>Ce que vous allez vivre</Eyebrow>
            <h2 className="font-serif text-3xl md:text-5xl font-semibold text-white leading-tight">
              Une expérience troublante<br className="hidden sm:block" /> de précision
            </h2>
          </SectionReveal>

          <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-6">
            {[
              { sym: '◐', title: 'Dès le premier tirage', body: "Une carte. Une interprétation qui vous concerne vraiment. Pas un texte générique — une lecture ancrée dans votre contexte et votre profil." },
              { sym: '◑', title: 'Après deux semaines', body: "L'oracle commence à voir vos patterns. Les cartes récurrentes révèlent les thèmes de votre vie. Vous commencez à voir quelque chose." },
              { sym: '●', title: 'Après un mois', body: "Votre arc narratif prend forme. L'oracle génère une synthèse de votre mois — vos évolutions, vos axes de travail, vos forces émergentes." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="p-7 rounded-2xl border text-center"
                style={{ borderColor: surfaceBorder, backgroundColor: 'hsl(var(--mp-bg-800) / 0.6)' }}
              >
                <div className="font-serif text-4xl mb-5 opacity-60" style={{ color: gold }} aria-hidden="true">{item.sym}</div>
                <h3 className="font-serif text-lg text-white font-semibold mb-3">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — LE RITUEL EN 4 ÉTAPES
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="rituel" className="relative py-24 overflow-hidden" aria-label="Le rituel quotidien en 4 étapes">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{ background: 'linear-gradient(180deg, transparent, hsl(265 35% 8% / 0.5), transparent)' }} />
        <div className="container mx-auto px-5 relative z-10">
          <SectionReveal className="text-center mb-14">
            <Eyebrow>Votre rituel quotidien</Eyebrow>
            <h2 className="font-serif text-3xl md:text-5xl font-semibold text-white leading-tight">
              Simple. Profond.<br className="hidden sm:block" /> Inoubliable.
            </h2>
          </SectionReveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            <RitualStepCard num="01" icon={Moon} title="La carte du jour" desc="Chaque matin, une carte tirée pour vous seul. Pas un horoscope recyclé — une lecture qui vous appartient." delay={0} />
            <RitualStepCard num="02" icon={Eye} title="Une interprétation vivante" desc="L'oracle génère une analyse ancrée dans votre profil exact. Il sait qui vous êtes, vous." delay={0.1} />
            <RitualStepCard num="03" icon={BookOpen} title="Le journal se souvient" desc="Notez ce que vous ressentez. L'oracle le mémorise. Votre profil se précise à chaque entrée." delay={0.2} />
            <RitualStepCard num="04" icon={Sparkles} title="L'histoire se révèle" desc="Après 30 jours, votre arc narratif prend forme. L'oracle vous montre ce que vous ne voyiez plus." delay={0.3} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5 — BÉNÉFICES
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 overflow-hidden" aria-label="Les bénéfices de l'oracle">
        <Orb size={500} color="radial-gradient(circle, hsl(265 55% 35% / 0.12), transparent)" x="40%" y="40%" delay={1} />
        <div className="container mx-auto px-5 relative z-10">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Visual mock — Oracle Narratif */}
            <motion.div
              initial={{ opacity: 0, x: -32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              aria-label="Exemple de l'Oracle Narratif sur 30 jours"
            >
              <div className="rounded-3xl p-6 sm:p-7 border" style={{ borderColor: surfaceBorder, background: 'linear-gradient(145deg, hsl(265 35% 10%), hsl(260 30% 7%))' }}>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 rounded-full bg-green-400/60" aria-hidden="true" />
                  <p className="text-xs text-white/40 uppercase tracking-widest">Oracle Narratif · 30 derniers jours</p>
                </div>
                <div className="space-y-3">
                  {[
                    { card: "L'Hermite", count: 3, color: '139,92,246', text: "3ème apparition. Une phase d'introspection profonde est à l'œuvre en vous." },
                    { card: 'La Lune', count: 2, color: '56,189,248', text: "Récurrente depuis 2 semaines. Vos intuitions cherchent à s'exprimer." },
                    { card: "L'Étoile", count: 4, color: '255,180,50', text: "Carte dominante. Un horizon d'espoir se dessine avec clarté." },
                  ].map((insight, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.12 }}
                      className="flex gap-3 p-4 rounded-xl"
                      style={{ backgroundColor: 'hsl(265 28% 13%)' }}
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-serif"
                        style={{ backgroundColor: `rgba(${insight.color},0.12)`, color: `rgb(${insight.color})` }}
                        aria-hidden="true">
                        {insight.count}×
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold mb-0.5">{insight.card}</p>
                        <p className="text-white/55 text-xs leading-relaxed">{insight.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 pt-5 border-t" style={{ borderColor: surfaceBorder }}>
                  <p className="text-white/40 text-xs italic leading-relaxed">
                    "Votre arcane dominant ce mois : L'Étoile — une phase de reconstruction guidée par la foi intérieure et la clarté retrouvée."
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Copy block */}
            <motion.div
              initial={{ opacity: 0, x: 32 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-8"
            >
              <div>
                <Eyebrow>La différence qui change tout</Eyebrow>
                <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white leading-tight mb-5">
                  Il ne lit pas les cartes.<br />Il vous lit, vous.
                </h2>
                <p className="text-white/60 text-base leading-relaxed">
                  Tarot Dinatoire mémorise chaque tirage, chaque journal, chaque récurrence.
                  Au bout d'un mois, il génère une synthèse narrative de votre vie intérieure —{' '}
                  <strong className="text-white/85 font-medium">que vous n'auriez pas écrite vous-même</strong>.
                </p>
              </div>
              <div className="space-y-5">
                <BenefitRow icon={TrendingUp} title="Il voit ce que vous ne voyez plus" desc="Vos patterns émotionnels sur 90 jours, identifiés et nommés — parce que vous êtes dedans." />
                <BenefitRow icon={Zap} title="Il relie les coïncidences" desc="Ces cartes qui reviennent. Ces thèmes qui persistent. L'oracle les nomme avant vous." />
                <BenefitRow icon={Heart} title="Il se souvient de tout" desc="Votre profil psychologique évolue à chaque session. Il est unique. Il est vôtre." />
                <BenefitRow icon={BookOpen} title="Il s'affine avec le temps" desc="Chaque journal lui donne plus de précision. La seule app qui s'améliore en vous connaissant mieux." />
              </div>
              <MysticButton size="md" rightIcon={<ArrowRight className="h-4 w-4" />} onClick={() => navigate(ctaHref)}>
                  Commencer maintenant
                </MysticButton>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 6 — STATS + PREUVES SOCIALES
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 overflow-hidden" aria-label="Témoignages et chiffres clés">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true" style={{ background: 'linear-gradient(180deg, transparent, hsl(265 38% 7%), transparent)' }} />
        <div className="container mx-auto px-5 relative z-10">
          {/* Counters */}
          <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 sm:gap-16 mb-20">
            <AnimatedCounter end={12400} suffix="+" label="Voyageurs actifs" />
            <AnimatedCounter end={340000} suffix="+" label="Tirages réalisés" />
            <AnimatedCounter end={94} suffix="%" label="Reviennent chaque jour" />
          </div>

          {/* Testimonials carousel */}
          <SectionReveal className="text-center mb-10">
            <Eyebrow>Ils l'utilisent. Ils reviennent.</Eyebrow>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white">Pas des avis. Des expériences.</h2>
          </SectionReveal>

          <div className="max-w-xl mx-auto relative min-h-[320px] sm:min-h-[280px]" aria-live="polite" aria-atomic="true">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialIndex}
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="p-6 sm:p-8 rounded-3xl border text-center"
                style={{ borderColor: surfaceBorder, backgroundColor: surfaceGlass }}
                role="article"
                aria-label={`Témoignage de ${TESTIMONIALS[testimonialIndex].name}`}
              >
                <div className="flex justify-center gap-0.5 mb-5" aria-label="5 étoiles">
                  {[0, 1, 2, 3, 4].map(i => <Star key={i} className="h-4 w-4 fill-current" style={{ color: gold }} aria-hidden="true" />)}
                </div>
                <p className="font-serif text-base md:text-lg text-white/55 mb-2 tracking-wide italic">"{TESTIMONIALS[testimonialIndex].q}"</p>
                <p className="font-serif text-base text-white/75 italic leading-relaxed mb-7">
                  {TESTIMONIALS[testimonialIndex].text}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-serif text-lg font-semibold" aria-hidden="true"
                    style={{ background: `linear-gradient(135deg, ${violet}, ${gold})` }}>
                    {TESTIMONIALS[testimonialIndex].name[0]}
                  </div>
                  <div className="text-left">
                    <p className="text-white text-sm font-semibold">{TESTIMONIALS[testimonialIndex].name}</p>
                    <p className="text-white/40 text-xs">{TESTIMONIALS[testimonialIndex].sign} · {TESTIMONIALS[testimonialIndex].streak} consécutifs</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex justify-center gap-2 mt-5" role="tablist" aria-label="Navigation témoignages">
              {TESTIMONIALS.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIndex(i)}
                  role="tab"
                  aria-selected={i === testimonialIndex}
                  aria-label={`Témoignage de ${t.name}`}
                  className="rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                  style={{ width: i === testimonialIndex ? 22 : 8, height: 8, backgroundColor: i === testimonialIndex ? gold : 'hsl(255 20% 30%)' }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 7 — TRAITEMENT DES OBJECTIONS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 overflow-hidden" aria-label="Réponses aux questions fréquentes">
        <Orb size={400} color="radial-gradient(circle, hsl(42 70% 40% / 0.07), transparent)" x="80%" y="50%" delay={1} />
        <div className="container mx-auto px-5 relative z-10">
          <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-6">
            {[
              { title: "Je ne crois pas au tarot", body: "Bien. Vous n'avez pas à croire. Tarot Dinatoire n'est pas un outil de divination — c'est un miroir psychologique. Les cartes révèlent ce que vous projetez. L'oracle l'organise. Résultat : une clarté que vous ne trouverez pas ailleurs." },
              { title: "J'ai déjà essayé. Ça ne m'a rien apporté.", body: "Vous avez essayé du tarot générique — une carte, un texte recyclé, oubli le lendemain. Tarot Dinatoire ne fonctionne pas comme ça. L'oracle apprend à vous connaître. Au bout de 10 jours, la comparaison n'existe plus." },
              { title: "3,90€, c'est un abonnement de plus", body: "Un café par semaine. Résiliation en 30 secondes, sans conditions. Et franchement : si après un mois vous ne ressentez rien, vous aurez perdu moins que le café." },
            ].map((item, i) => (
              <SectionReveal key={i}>
                <div className="p-6 rounded-2xl border h-full" style={{ borderColor: surfaceBorder, backgroundColor: 'hsl(var(--mp-bg-800) / 0.5)' }}>
                  <p className="text-white/30 text-xs font-semibold tracking-widest uppercase mb-3" aria-hidden="true">Objection {i + 1}</p>
                  <h3 className="font-serif text-base text-white/85 font-semibold mb-3 leading-snug">"{item.title}"</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{item.body}</p>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 8 — OFFRE / PRICING
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="offre" className="relative py-24 sm:py-28 overflow-hidden" aria-label="Offre et tarifs">
        <Orb size={700} color="radial-gradient(circle, hsl(265 55% 38% / 0.18), transparent)" x="50%" y="50%" delay={0} />
        <div className="container mx-auto px-5 relative z-10">
          <SectionReveal className="max-w-lg mx-auto text-center">
            <Eyebrow>L'offre de lancement</Eyebrow>
            <h2 className="font-serif text-3xl md:text-5xl font-semibold text-white mb-3 leading-tight">
              Tout l'oracle.<br />Pour moins que rien.
            </h2>
            <p className="text-white/50 mb-10 leading-relaxed">
              3,90€ par mois. Sans engagement. L'intégralité de l'expérience — dès le premier jour.
            </p>

            <div
              className="relative p-6 sm:p-8 rounded-3xl border mb-7"
              style={{ borderColor: 'hsl(var(--mp-brand-gold) / 0.3)', background: 'linear-gradient(155deg, hsl(265 35% 10%), hsl(260 30% 7%))' }}
            >
              {/* Badge */}
              <div
                className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase whitespace-nowrap"
                style={{ background: `linear-gradient(90deg, ${violet}, hsl(var(--mp-brand-gold) / 0.9))`, color: 'white' }}
                aria-label="Offre de lancement"
              >
                Offre de lancement
              </div>

              {/* Price */}
              <div className="flex items-baseline justify-center gap-1 mb-1.5 mt-3">
                <span className="font-serif text-5xl sm:text-6xl font-bold text-white">3,90€</span>
                <span className="text-white/40 text-lg">/mois</span>
              </div>
              <p className="text-white/35 text-sm mb-8">TTC · Sans engagement · Annulation en 1 clic</p>

              {/* Features */}
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8 text-left" aria-label="Fonctionnalités incluses">
                {PRICING_FEATURES.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-white/70">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: goldSoft }} aria-hidden="true">
                      <Check className="h-3 w-3" style={{ color: gold }} />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <MysticButton size="lg" className="w-full text-base" rightIcon={<ArrowRight className="h-5 w-5" />} onClick={() => navigate(ctaHref)}>
                  {ctaLabel}
                </MysticButton>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5 text-xs text-white/40">
              <div className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" aria-hidden="true" />Paiement Stripe sécurisé</div>
              <div className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" aria-hidden="true" />RGPD · Données protégées</div>
              <div className="flex items-center gap-1.5"><Stars className="h-3.5 w-3.5" aria-hidden="true" />+12 000 voyageurs</div>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 9 — FAQ
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 overflow-hidden" aria-label="Questions fréquentes">
        <div className="container mx-auto px-5 relative z-10">
          <SectionReveal className="text-center mb-12">
            <Eyebrow>Avant de vous lancer</Eyebrow>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white">Les vraies questions.<br className="sm:hidden" /> Les vraies réponses.</h2>
          </SectionReveal>

          <div
            className="max-w-2xl mx-auto rounded-2xl border overflow-hidden"
            style={{ borderColor: surfaceBorder, backgroundColor: 'hsl(var(--mp-bg-800) / 0.6)' }}
            role="region"
            aria-label="FAQ"
          >
            <div className="px-6" style={{ borderColor: surfaceBorder }}>
              {FAQ_ITEMS.map((item, i) => <FAQItem key={i} q={item.q} a={item.a} index={i} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 10 — DERNIER CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-24 sm:py-28 overflow-hidden" aria-label="Commencer l'expérience">
        <Orb size={700} color="radial-gradient(circle, hsl(265 55% 40% / 0.22), transparent)" x="50%" y="50%" delay={0} />
        <div className="container mx-auto px-5 relative z-10">
          <SectionReveal className="max-w-2xl mx-auto text-center">
            <div className="font-serif text-5xl mb-6 opacity-40" style={{ color: gold }} aria-hidden="true">✦</div>
            <h2 className="font-serif text-4xl md:text-6xl font-semibold text-white leading-tight mb-6">
              Il y a des choses<br />que vous savez déjà.
            </h2>
            <p className="text-white/60 text-base sm:text-lg leading-relaxed mb-3 max-w-lg mx-auto">
              Vous les sentez. Vous les portez. Vous n'arrivez pas encore à les formuler.
            </p>
            <p className="text-white/40 text-sm sm:text-base leading-relaxed mb-10 max-w-md mx-auto">
              C'est exactement là que Tarot Dinatoire entre en jeu.
            </p>
            <MysticButton size="lg" rightIcon={<ArrowRight className="h-5 w-5" />} className="text-base sm:text-lg px-10 sm:px-12" onClick={() => navigate(ctaHref)}>
              Commencer mon premier rituel
            </MysticButton>
            <p className="text-white/25 text-xs mt-5">3,90€/mois · Sans engagement · Annulation en 1 clic</p>
          </SectionReveal>
        </div>
      </section>

      <LandingFooter />

      {/* Spacer for mobile sticky CTA */}
      <div className="h-24 md:hidden" aria-hidden="true" />
    </div>
  );
}
