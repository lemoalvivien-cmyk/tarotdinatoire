/**
 * FreeDraw — Tirage gratuit public (sans compte requis)
 * Flux : Shuffle animé → Reveal → Interprétation IA → Capture email → Upsell
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sparkles, ArrowRight, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { UpsellModal } from './UpsellModal';
import { CARD_BACK_URL } from '@/constants/tarotAssets';

// ── Session key fingerprint (anonyme, non-persistant entre navigateurs) ──────
function getSessionKey(): string {
  // localStorage persists across tabs → prevents multi-tab bypass of 1/day limit
  const stored = localStorage.getItem('fd_sk');
  if (stored) return stored;
  const key = Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  localStorage.setItem('fd_sk', key);
  return key;
}

// ── Card back path ────────────────────────────────────────────────────────────
const CARD_BACK = CARD_BACK_URL;

// ── Phases du flux ─────────────────────────────────────────────────────────────
type Phase = 'idle' | 'shuffling' | 'choosing' | 'revealing' | 'reading' | 'email' | 'upsell';

interface DrawResult {
  id: string;
  card_id: string;
  card_nom_fr?: string;
  orientation: 'upright' | 'reversed';
  interpretation: {
    title?: string;
    message?: string;
    advice?: string;
    energy?: string;
  } | null;
  themes?: string[];
  alreadyDrawn?: boolean;
}

// ─── Shuffle card animation ───────────────────────────────────────────────────
function ShufflingDeck({ onDone }: { onDone: () => void }) {
  const shouldReduce = useReducedMotion();
  const cards = [0, 1, 2, 3, 4];

  useEffect(() => {
    const t = setTimeout(onDone, shouldReduce ? 800 : 2200);
    return () => clearTimeout(t);
  }, [onDone, shouldReduce]);

  return (
    <div className="flex flex-col items-center gap-6" aria-live="polite" aria-label="Mélange des cartes en cours">
      <div className="relative w-40 h-56">
        {cards.map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-2xl border border-white/10"
            style={{ backgroundImage: `url(${CARD_BACK})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            initial={{ rotate: 0, x: 0, y: 0, opacity: 0.6 }}
            animate={shouldReduce ? {} : {
              rotate: [0, (i - 2) * 14, 0, (i - 2) * 8, 0],
              x: [0, (i - 2) * 22, 0, (i - 2) * 12, 0],
              y: [0, -8 * Math.abs(i - 2), 0],
              opacity: [0.6, 1, 0.7, 1, 0.8],
            }}
            transition={{ duration: 1.8, delay: i * 0.06, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <motion.p
        className="text-white/60 text-sm tracking-widest uppercase"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        aria-hidden="true"
      >
        Mélange en cours…
      </motion.p>
    </div>
  );
}

// ─── Derive card image path from cardId ───────────────────────────────────────
// Complete 78-card mapping: RWS public folder for major arcana,
// gradient fallback for minor arcana (images served from storage or fallback UI)
const MAJOR_MAP: Record<string, string> = {
  major_00: '00-the-fool',
  major_01: '01-the-magician',
  major_02: '02-the-high-priestess',
  major_03: '03-the-empress',
  major_04: '04-the-emperor',
  major_05: '05-the-hierophant',
  major_06: '06-the-lovers',
  major_07: '07-the-chariot',
  major_08: '08-strength',
  major_09: '09-the-hermit',
  major_10: '10-wheel-of-fortune',
  major_11: '11-justice',
  major_12: '12-the-hanged-man',
  major_13: '13-death',
  major_14: '14-temperance',
  major_15: '15-the-devil',
  major_16: '16-the-tower',
  major_17: '17-the-star',
  major_18: '18-the-moon',
  major_19: '19-the-sun',
  major_20: '20-judgement',
  major_21: '21-the-world',
};

function getCardImageSrc(cardId: string): string {
  const slug = MAJOR_MAP[cardId];
  if (slug) return `/tarot/rws/${slug}.png`;
  // Minor arcana: try storage bucket path, fallback to '' → triggers gradient UI
  if (cardId.startsWith('minor_')) {
    return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/tarot-cards/tarot/cbd/${cardId}.jpg`;
  }
  return '';
}

// ─── Card face ────────────────────────────────────────────────────────────────
function CardFace({ cardId, cardName, orientation, revealed }: {
  cardId: string; cardName: string; orientation: string; revealed: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const imgSrc = getCardImageSrc(cardId);
  const isReversed = orientation === 'reversed';

  return (
    <motion.div
      className="relative w-44 h-64 mx-auto"
      initial={{ rotateY: 180, scale: 0.85 }}
      animate={{ rotateY: revealed ? 0 : 180, scale: revealed ? 1 : 0.85 }}
      transition={{ duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
    >
      {/* Front */}
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden border border-white/15"
        style={{ backfaceVisibility: 'hidden', transform: isReversed ? 'rotate(180deg)' : undefined,
          boxShadow: '0 20px 60px hsl(265 55% 30% / 0.5)' }}
        aria-label={`Carte ${cardName} ${isReversed ? '(renversée)' : ''}`}
      >
        {!imgError ? (
          <img
            src={imgSrc}
            alt={cardName}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, hsl(265 40% 12%), hsl(265 40% 18%))' }}>
            <div className="text-center px-4">
              <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-50" style={{ color: 'hsl(var(--mp-brand-gold))' }} />
              <p className="font-serif text-white/80 text-sm">{cardName}</p>
            </div>
          </div>
        )}
      </div>
      {/* Back */}
      <div
        className="absolute inset-0 rounded-2xl border border-white/10"
        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
          backgroundImage: `url(${CARD_BACK})`, backgroundSize: 'cover' }}
        aria-hidden="true"
      />
    </motion.div>
  );
}

// ─── Email capture mini-form ──────────────────────────────────────────────────
function EmailCapture({ drawId, onDone }: { drawId: string; onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    try {
      // Save email to daily_free_draws row
      await supabase
        .from('daily_free_draws')
        .update({ email: email.trim().toLowerCase() })
        .eq('id', drawId);
      // Also capture in email_leads for marketing
      await supabase.from('email_leads').insert({
        email: email.trim().toLowerCase(),
        consent: true,
        consent_text: "Inscription à l'insight quotidien depuis le tirage gratuit",
      });
    } catch { /* silent */ }
    setDone(true);
    setLoading(false);
    setTimeout(onDone, 1200);
  }, [email, drawId, loading, onDone]);

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="text-center py-4"
      >
        <Sparkles className="h-6 w-6 mx-auto mb-2" style={{ color: 'hsl(var(--mp-brand-gold))' }} />
        <p className="text-white/80 text-sm">Ton insight quotidien t'attend ✨</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border p-5 text-center"
      style={{ borderColor: 'hsl(var(--mp-brand-gold) / 0.2)', backgroundColor: 'hsl(var(--mp-brand-gold) / 0.05)' }}
    >
      <Mail className="h-5 w-5 mx-auto mb-2 opacity-70" style={{ color: 'hsl(var(--mp-brand-gold))' }} />
      <p className="text-white/80 text-sm font-medium mb-1">Reçois ton insight quotidien</p>
      <p className="text-white/50 text-xs mb-4">Ta carte du jour, chaque matin dans ta boîte.</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="ton@email.fr"
          required
          aria-label="Ton adresse email"
          className="flex-1 h-10 rounded-xl px-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="h-10 px-4 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, hsl(var(--mp-brand-violet)), hsl(var(--mp-brand-violet2)))' }}
          aria-label="S'inscrire aux insights quotidiens"
        >
          {loading ? '…' : 'OK'}
        </button>
      </form>
      <button
        onClick={onDone}
        className="mt-3 text-xs text-white/30 hover:text-white/50 transition-colors underline-offset-2 hover:underline"
        aria-label="Passer la capture d'email"
      >
        Non merci
      </button>
    </motion.div>
  );
}

// ─── Main FreeDraw component ───────────────────────────────────────────────────
export function FreeDraw() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<DrawResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alreadyDrawn, setAlreadyDrawn] = useState(false);
  const isDrawing = useRef(false);
  const shouldReduce = useReducedMotion();

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const startDraw = useCallback(async () => {
    if (isDrawing.current || phase !== 'idle') return;
    isDrawing.current = true;
    setError(null);
    setPhase('shuffling');

    try {
      const sessionKey = getSessionKey();

      // Pause pour l'animation
      await new Promise(r => setTimeout(r, shouldReduce ? 600 : 2000));
      setPhase('revealing');

      const resp = await fetch(`${supabaseUrl}/functions/v1/free-draw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ session_key: sessionKey }),
      });

      const data = await resp.json();

      if (!resp.ok) throw new Error(data.error ?? 'Erreur serveur');

      setResult(data.draw);
      setAlreadyDrawn(data.alreadyDrawn === true);

      await new Promise(r => setTimeout(r, 900));
      setPhase('reading');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue');
      setPhase('idle');
    } finally {
      isDrawing.current = false;
    }
  }, [phase, supabaseUrl, shouldReduce]);

  const energyColor = {
    positif: 'hsl(42 70% 55%)',
    challenging: 'hsl(350 60% 55%)',
    neutre: 'hsl(265 45% 65%)',
  }[result?.interpretation?.energy ?? 'neutre'] ?? 'hsl(265 45% 65%)';

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">

        {/* ── IDLE ─────────────────────────────────────────────────── */}
        {phase === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="text-center space-y-6"
          >
            {error && (
              <p className="text-sm rounded-xl px-4 py-3" style={{ color: 'hsl(0 60% 70%)', backgroundColor: 'hsl(0 40% 15% / 0.5)' }} role="alert">{error}</p>
            )}
            <button
              onClick={startDraw}
              className="group relative w-full h-16 rounded-2xl text-lg font-bold text-white overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              style={{
                background: 'linear-gradient(135deg, hsl(350 70% 45%), hsl(30 80% 50%))',
                boxShadow: '0 8px 40px hsl(350 70% 35% / 0.45)',
              }}
              aria-label="Tirer ma carte gratuite"
            >
              <motion.span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, hsl(350 70% 50%), hsl(30 80% 55%))' }}
                aria-hidden="true"
              />
              <span className="relative flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
                Tirer ma carte gratuite
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </span>
            </button>
            <p className="text-white/30 text-xs">1 tirage gratuit par jour · Aucun compte requis</p>
          </motion.div>
        )}

        {/* ── SHUFFLING ────────────────────────────────────────────── */}
        {phase === 'shuffling' && (
          <motion.div key="shuffling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ShufflingDeck onDone={() => {}} />
          </motion.div>
        )}

        {/* ── REVEALING / READING ───────────────────────────────────── */}
        {(phase === 'revealing' || phase === 'reading') && result && (
          <motion.div
            key="reading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Card */}
            <div className="flex flex-col items-center gap-4">
              <CardFace
                cardId={result.card_id}
                cardName={result.card_nom_fr ?? result.card_id}
                orientation={result.orientation}
                revealed={phase === 'reading'}
              />
              {phase === 'reading' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <p className="font-serif text-xl font-semibold text-white">
                    {result.card_nom_fr ?? result.card_id}
                  </p>
                  <p className="text-white/50 text-xs mt-1 tracking-widest uppercase">
                    {result.orientation === 'upright' ? "À l'endroit" : 'Renversée'}
                    {result.themes?.length ? ` · ${result.themes.slice(0, 2).join(' · ')}` : ''}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Interprétation */}
            {phase === 'reading' && result.interpretation && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="rounded-2xl border p-5 space-y-4"
                style={{ borderColor: 'hsl(var(--mp-surface-border))', backgroundColor: 'hsl(var(--mp-bg-800) / 0.8)' }}
              >
                {result.interpretation.title && (
                  <p className="font-serif text-base font-semibold" style={{ color: energyColor }}>
                    {result.interpretation.title}
                  </p>
                )}
                {result.interpretation.message && (
                  <p className="text-white/75 text-sm leading-relaxed whitespace-pre-line">
                    {result.interpretation.message}
                  </p>
                )}
                {result.interpretation.advice && (
                  <div
                    className="flex gap-3 p-3 rounded-xl text-sm"
                    style={{ backgroundColor: 'hsl(var(--mp-brand-violet) / 0.1)', borderLeft: `2px solid hsl(var(--mp-brand-violet) / 0.4)` }}
                  >
                    <span className="text-white/40 text-xs uppercase tracking-widest flex-shrink-0 mt-0.5">Conseil</span>
                    <p className="text-white/70">{result.interpretation.advice}</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Already drawn notice */}
            {alreadyDrawn && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center text-white/40 text-xs"
              >
                Tu as déjà tiré ta carte aujourd'hui. Reviens demain 🌙
              </motion.p>
            )}

            {/* CTA vers upsell */}
            {phase === 'reading' && !alreadyDrawn && (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                className="space-y-3 pt-2"
              >
                <EmailCapture
                  drawId={result.id}
                  onDone={() => setPhase('upsell')}
                />
              </motion.div>
            )}

            {phase === 'reading' && alreadyDrawn && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                className="flex flex-col gap-3"
              >
                <button
                  onClick={() => setPhase('upsell')}
                  className="w-full h-12 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--mp-brand-violet)), hsl(var(--mp-brand-violet2)))' }}
                  aria-label="Débloquer l'oracle complet"
                >
                  Débloquer l'oracle complet
                </button>
                <button
                  onClick={() => setPhase('idle')}
                  className="text-xs text-white/30 hover:text-white/50 transition-colors"
                  aria-label="Retour"
                >
                  ← Retour
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ── UPSELL ───────────────────────────────────────────────── */}
        {phase === 'upsell' && (
          <motion.div key="upsell" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <UpsellModal cardName={result?.card_nom_fr} onClose={() => setPhase('reading')} />
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
