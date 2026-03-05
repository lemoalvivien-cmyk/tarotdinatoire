import { forwardRef, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Stars, Moon, Sparkles, Shield, Lock, ChevronDown, Flame, BookOpen, Eye, Zap, Heart, TrendingUp } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { MysticButton, SiteHeader, SiteFooter } from '@/components/mystic';
import { motion, useReducedMotion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

// ─── Animated Starfield Canvas ────────────────────────────────────────────────
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
      for (let i = 0; i < 180; i++) {
        stars.push({
          x: Math.random() * (canvas?.width ?? window.innerWidth),
          y: Math.random() * (canvas?.height ?? window.innerHeight),
          r: Math.random() * 1.4 + 0.2,
          alpha: Math.random() * 0.7 + 0.15,
          speed: Math.random() * 0.3 + 0.05,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    function draw(t: number) {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        const twinkle = s.alpha + 0.3 * Math.sin(t * s.speed + s.phase);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 200, 255, ${Math.max(0, Math.min(1, twinkle))})`;
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    }

    resize();
    init();
    animId = requestAnimationFrame(draw);
    window.addEventListener('resize', () => { resize(); init(); });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', () => { resize(); init(); });
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
      aria-hidden="true"
    />
  );
}

// ─── Floating Orb ─────────────────────────────────────────────────────────────
function FloatingOrb({ size, color, x, y, delay = 0 }: { size: number; color: string; x: string; y: string; delay?: number }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, left: x, top: y, background: color, filter: 'blur(60px)' }}
      animate={{ y: [-20, 20, -20], scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
      transition={{ duration: 8 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    />
  );
}

// ─── Oracle Card Preview ───────────────────────────────────────────────────────
function OracleCardPreview() {
  const cards = [
    { name: 'Le Soleil', label: 'Clarté', color: 'from-yellow-500/20 to-amber-600/20', symbol: '☀' },
    { name: 'La Lune', label: 'Intuition', color: 'from-indigo-500/20 to-violet-600/20', symbol: '☽' },
    { name: "L'Étoile", label: 'Espoir', color: 'from-blue-400/20 to-cyan-500/20', symbol: '✦' },
  ];
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive(i => (i + 1) % 3), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative w-72 h-96 mx-auto">
      {cards.map((card, i) => {
        const offset = (i - active + 3) % 3;
        const isActive = i === active;
        const x = offset === 1 ? 32 : offset === 2 ? -32 : 0;
        const scale = isActive ? 1 : 0.88;
        const zIndex = isActive ? 10 : offset === 1 ? 5 : 1;
        const opacity = isActive ? 1 : 0.5;

        return (
          <motion.div
            key={card.name}
            className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${card.color} border border-white/10 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer`}
            animate={{ x, scale, zIndex, opacity }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ boxShadow: isActive ? '0 20px 60px rgba(139, 92, 246, 0.3)' : 'none' }}
            onClick={() => setActive(i)}
          >
            <div className="text-6xl mb-4 opacity-70" style={{ fontFamily: 'serif' }}>{card.symbol}</div>
            <div className="w-16 h-px bg-white/20 mb-4" />
            <p className="font-serif text-2xl text-white font-medium">{card.name}</p>
            <p className="text-white/50 text-sm mt-1 tracking-widest uppercase">{card.label}</p>
            {isActive && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 px-4 text-center"
              >
                <p className="text-white/70 text-xs leading-relaxed italic">
                  "Votre tirage du jour révèle une période de profonde transformation..."
                </p>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ end, suffix = '', label }: { end: number; suffix?: string; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) setStarted(true);
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 1800;
    const steps = 50;
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
      <p className="font-serif text-4xl md:text-5xl font-bold text-white">
        {count.toLocaleString('fr-FR')}{suffix}
      </p>
      <p className="text-white/50 text-sm mt-2 tracking-wide uppercase">{label}</p>
    </div>
  );
}

// ─── Testimonial ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    text: "Depuis que j'utilise L'Œil du Tarot chaque matin, j'ai l'impression que le système me comprend vraiment. Les interprétations touchent exactement ce que je vis.",
    name: "Sophie M.",
    sign: "♏ Scorpion",
    days: "127 jours consécutifs",
  },
  {
    text: "Ce n'est pas de la divination. C'est un miroir. Chaque tirage m'aide à voir plus clairement ce que je ressens déjà.",
    name: "Thomas R.",
    sign: "♒ Verseau",
    days: "89 jours consécutifs",
  },
  {
    text: "L'oracle narratif est bluffant. Il a retracé les thèmes de mes 3 derniers mois avec une précision qui m'a laissée sans voix.",
    name: "Isabelle D.",
    sign: "♓ Poissons",
    days: "203 jours consécutifs",
  },
];

// ─── Feature Pill ─────────────────────────────────────────────────────────────
function FeaturePill({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
      <Icon className="h-3.5 w-3.5" style={{ color: 'hsl(var(--mp-brand-gold))' }} />
      <span className="text-white/70 text-xs">{label}</span>
    </div>
  );
}

// ─── Main Landing Component ───────────────────────────────────────────────────
const Landing = forwardRef<HTMLDivElement>((_, ref) => {
  const { user } = useAuth();
  const shouldReduce = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTestimonialIndex(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const ctaHref = user ? '/app' : '/auth';
  const ctaLabel = user ? 'Accéder à mon oracle' : 'Commencer gratuitement';

  return (
    <div
      ref={ref}
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, hsl(260 35% 5%) 0%, hsl(260 32% 8%) 50%, hsl(260 30% 6%) 100%)' }}
    >
      <SEOHead
        title="L'Œil du Tarot | Votre Oracle Personnel Quotidien"
        description="Découvrez un oracle personnel unique qui apprend à vous connaître. Tirage quotidien, analyse psychologique, récit narratif de votre parcours de vie. Rejoignez des milliers de voyageurs."
        ogTitle="L'Œil du Tarot - Votre Oracle Personnel"
        ogDescription="Un oracle qui vous connaît. Tirage quotidien · Analyse psychologique · Récit de vie IA · Synchronicités."
      />

      <SiteHeader />

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <StarfieldCanvas />

        {/* Orbs */}
        <FloatingOrb size={400} color="radial-gradient(circle, hsl(265 55% 45% / 0.4), transparent)" x="10%" y="10%" delay={0} />
        <FloatingOrb size={300} color="radial-gradient(circle, hsl(42 70% 45% / 0.25), transparent)" x="65%" y="55%" delay={2} />
        <FloatingOrb size={250} color="radial-gradient(circle, hsl(220 60% 50% / 0.2), transparent)" x="20%" y="60%" delay={4} />

        <motion.div
          style={shouldReduce ? {} : { y: heroY, opacity: heroOpacity }}
          className="relative z-10 container mx-auto px-4 py-24 flex flex-col lg:flex-row items-center gap-16 lg:gap-24"
        >
          {/* Left — Copy */}
          <div className="flex-1 max-w-xl text-center lg:text-left space-y-8">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-medium tracking-widest uppercase"
              style={{ borderColor: 'hsl(var(--mp-brand-gold) / 0.3)', color: 'hsl(var(--mp-brand-gold))', backgroundColor: 'hsl(var(--mp-brand-gold) / 0.08)' }}
            >
              <Sparkles className="h-3 w-3" />
              Votre oracle personnel
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="font-serif text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.1] text-white"
            >
              L'oracle qui{' '}
              <span style={{ background: 'linear-gradient(135deg, hsl(var(--mp-brand-gold)), hsl(265 55% 70%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                apprend<br />à vous connaître
              </span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-lg text-white/65 leading-relaxed"
            >
              Chaque jour, un tirage. Chaque semaine, votre récit de vie se précise.
              L'oracle détecte vos patterns émotionnels, vos synchronicités,
              votre arc psychologique — et vous parle vraiment.
            </motion.p>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-wrap gap-2 justify-center lg:justify-start"
            >
              <FeaturePill icon={Flame} label="Rituel quotidien" />
              <FeaturePill icon={Eye} label="Oracle narratif IA" />
              <FeaturePill icon={Zap} label="Synchronicités" />
              <FeaturePill icon={BookOpen} label="Journal de vie" />
              <FeaturePill icon={TrendingUp} label="Profil énergétique" />
              <FeaturePill icon={Heart} label="Astrologie intégrée" />
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link to={ctaHref}>
                <MysticButton size="lg" rightIcon={<ArrowRight className="h-5 w-5" />} className="text-base px-8">
                  {ctaLabel}
                </MysticButton>
              </Link>
              <Link to="/tirages">
                <MysticButton variant="outline" size="lg" className="text-base px-8">
                  Voir les tirages
                </MysticButton>
              </Link>
            </motion.div>

            {/* Micro trust */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex items-center gap-6 justify-center lg:justify-start text-xs text-white/40"
            >
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                <span>Données chiffrées</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                <span>Sans engagement</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Stars className="h-3.5 w-3.5" />
                <span>3,90€/mois</span>
              </div>
            </motion.div>
          </div>

          {/* Right — Card Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex-shrink-0"
          >
            <OracleCardPreview />
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          animate={shouldReduce ? {} : { y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="h-6 w-6 text-white/25" />
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent, hsl(260 32% 8%), transparent)' }} />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'hsl(var(--mp-brand-gold))' }}>Comment ça marche</p>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold text-white leading-tight">
              Un compagnon qui évolue<br />avec votre vie
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                icon: Moon,
                title: 'Rituel du matin',
                desc: 'Chaque jour, l\'oracle tire une carte pour vous. Le rituel crée un espace sacré de réflexion.',
              },
              {
                step: '02',
                icon: Eye,
                title: 'Interprétation profonde',
                desc: 'L\'IA génère une lecture psychologique ancrée dans votre contexte de vie réel.',
              },
              {
                step: '03',
                icon: BookOpen,
                title: 'Journal de vie',
                desc: 'Notez vos ressentis. L\'oracle mémorise chaque entrée pour affiner votre profil.',
              },
              {
                step: '04',
                icon: Sparkles,
                title: 'Récit qui se tisse',
                desc: 'Semaine après semaine, votre arc narratif se révèle. L\'oracle vous parle de vous.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative p-6 rounded-2xl border"
                style={{ borderColor: 'hsl(var(--mp-surface-border))', backgroundColor: 'hsl(var(--mp-surface-glass))' }}
              >
                <p className="font-serif text-5xl font-bold mb-4 leading-none" style={{ color: 'hsl(var(--mp-brand-gold) / 0.15)' }}>{item.step}</p>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: 'hsl(var(--mp-brand-violet) / 0.15)' }}
                >
                  <item.icon className="h-5 w-5" style={{ color: 'hsl(var(--mp-brand-violet2))' }} />
                </div>
                <h3 className="font-serif text-lg text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-white/55 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ORACLE FEATURES ── */}
      <section className="py-28 relative overflow-hidden">
        <FloatingOrb size={500} color="radial-gradient(circle, hsl(265 55% 35% / 0.15), transparent)" x="50%" y="50%" delay={1} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            {/* Left visual */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div
                className="rounded-3xl p-8 border"
                style={{ borderColor: 'hsl(var(--mp-surface-border))', background: 'linear-gradient(135deg, hsl(265 35% 12%), hsl(260 30% 8%))' }}
              >
                <p className="text-xs text-white/40 uppercase tracking-widest mb-6">Oracle Narratif — Votre récit des 30 derniers jours</p>
                <div className="space-y-5">
                  {[
                    { card: 'L\'Hermite', count: 3, text: 'Apparaît pour la 3ème fois. Une phase d\'introspection profonde est à l\'œuvre.' },
                    { card: 'La Lune', count: 2, text: 'Récurrent depuis 2 semaines. Vos intuitions cherchent à s\'exprimer.' },
                    { card: 'L\'Étoile', count: 4, text: 'Carte dominante de votre mois. Un horizon d\'espoir se dessine clairement.' },
                  ].map((insight, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.15 }}
                      className="flex gap-4 p-4 rounded-xl"
                      style={{ backgroundColor: 'hsl(265 30% 15%)' }}
                    >
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: 'hsl(var(--mp-brand-gold) / 0.2)', color: 'hsl(var(--mp-brand-gold))' }}
                      >
                        {insight.count}×
                      </div>
                      <div>
                        <p className="text-white text-sm font-semibold mb-1">{insight.card}</p>
                        <p className="text-white/55 text-xs leading-relaxed">{insight.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t" style={{ borderColor: 'hsl(var(--mp-surface-border))' }}>
                  <p className="text-white/40 text-xs italic leading-relaxed">
                    "Votre arcane dominant ce mois est L'Étoile — une phase de reconstruction guidée par la foi intérieure et la clarté retrouvée après une période de doute."
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right copy */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8"
            >
              <div>
                <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'hsl(var(--mp-brand-gold))' }}>Oracle Narratif</p>
                <h2 className="font-serif text-4xl md:text-5xl font-semibold text-white leading-tight mb-6">
                  L'oracle lit<br />votre histoire
                </h2>
                <p className="text-white/60 text-lg leading-relaxed">
                  Contrairement à un tirage isolé, L'Œil du Tarot mémorise chaque lecture.
                  Il détecte les cartes récurrentes, les thèmes de vie qui reviennent,
                  votre arc émotionnel — et génère une synthèse narrative unique.
                </p>
              </div>
              <div className="space-y-4">
                {[
                  { icon: TrendingUp, text: 'Détection des patterns émotionnels sur 90 jours' },
                  { icon: Zap, text: 'Synchronicités et coïncidences significatives' },
                  { icon: Heart, text: 'Profil psychologique évolutif' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: 'hsl(var(--mp-brand-gold) / 0.15)' }}
                    >
                      <item.icon className="h-4 w-4" style={{ color: 'hsl(var(--mp-brand-gold))' }} />
                    </div>
                    <p className="text-white/75 text-sm">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF COUNTER ── */}
      <section className="py-20 relative">
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, transparent, hsl(265 40% 8%), transparent)' }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto grid grid-cols-3 gap-8 md:gap-16">
            <AnimatedCounter end={12400} suffix="+" label="Voyageurs actifs" />
            <AnimatedCounter end={340000} suffix="+" label="Tirages réalisés" />
            <AnimatedCounter end={94} suffix="%" label="Ressentent une transformation" />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-28 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs tracking-widest uppercase mb-4" style={{ color: 'hsl(var(--mp-brand-gold))' }}>Ce qu'ils vivent</p>
            <h2 className="font-serif text-4xl font-semibold text-white">
              L'oracle parle pour eux
            </h2>
          </motion.div>

          <div className="max-w-2xl mx-auto relative min-h-[220px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={testimonialIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="p-8 rounded-3xl border text-center"
                style={{ borderColor: 'hsl(var(--mp-surface-border))', backgroundColor: 'hsl(var(--mp-surface-glass))' }}
              >
                <p className="font-serif text-xl text-white/85 italic leading-relaxed mb-8">
                  "{TESTIMONIALS[testimonialIndex].text}"
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-serif text-lg" style={{ background: 'linear-gradient(135deg, hsl(var(--mp-brand-violet)), hsl(var(--mp-brand-gold)))' }}>
                    {TESTIMONIALS[testimonialIndex].name[0]}
                  </div>
                  <div className="text-left">
                    <p className="text-white text-sm font-semibold">{TESTIMONIALS[testimonialIndex].name}</p>
                    <p className="text-white/40 text-xs">{TESTIMONIALS[testimonialIndex].sign} · {TESTIMONIALS[testimonialIndex].days}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIndex(i)}
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{ backgroundColor: i === testimonialIndex ? 'hsl(var(--mp-brand-gold))' : 'hsl(255 20% 40%)' }}
                  aria-label={`Témoignage ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING CTA ── */}
      <section className="py-28 relative overflow-hidden">
        <FloatingOrb size={600} color="radial-gradient(circle, hsl(265 55% 40% / 0.2), transparent)" x="50%" y="50%" delay={0} />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-lg mx-auto text-center"
          >
            <p className="text-xs tracking-widest uppercase mb-6" style={{ color: 'hsl(var(--mp-brand-gold))' }}>Commencer votre voyage</p>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold text-white mb-4">
              Votre oracle personnel
            </h2>
            <p className="text-white/55 mb-10 leading-relaxed">
              Un abonnement simple. Un rituel quotidien. Une relation qui dure.
            </p>

            <div
              className="p-8 rounded-3xl border mb-8"
              style={{ borderColor: 'hsl(var(--mp-brand-gold) / 0.2)', background: 'linear-gradient(135deg, hsl(265 35% 10%), hsl(260 30% 7%))' }}
            >
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="font-serif text-6xl font-bold text-white">3,90€</span>
                <span className="text-white/50">/mois</span>
              </div>
              <p className="text-white/40 text-sm mb-8">TTC · Sans engagement · Annulation en 1 clic</p>

              <div className="grid grid-cols-2 gap-3 mb-8 text-left">
                {[
                  'Rituel quotidien illimité',
                  'Oracle narratif IA',
                  'Tous les spreads avancés',
                  'Journal de vie',
                  'Profil énergétique',
                  'Analyse astrologique',
                  'Détection synchronicités',
                  'Partage mystique',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-white/70">
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: 'hsl(var(--mp-brand-gold))' }}
                    />
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

            <div className="flex items-center justify-center gap-6 text-xs text-white/35">
              <div className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Paiement Stripe sécurisé</div>
              <div className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> RGPD · Données protégées</div>
            </div>
          </motion.div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
});

Landing.displayName = 'Landing';
export default Landing;
