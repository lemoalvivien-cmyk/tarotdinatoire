import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MysticBackground } from '@/components/mystic/MysticBackground';
import { MysticButton } from '@/components/mystic/MysticButton';
import { OracleLoader } from '@/components/tarot-ui/OracleLoader';
import { SEOHead } from '@/components/seo/SEOHead';
import { useShare } from '@/hooks/useShare';
import { Sparkles, Eye, Heart, ArrowRight } from 'lucide-react';

interface SharedData {
  id: string;
  share_id: string;
  card_id: string;
  card_name_fr: string;
  orientation: string;
  interp_title: string | null;
  interp_summary: string | null;
  image_url: string | null;
  visit_count: number;
  referral_code: string;
  created_at: string;
}

export default function SharePage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchShare } = useShare();
  const [share, setShare] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const ref = searchParams.get('ref');

  useEffect(() => {
    if (!shareId) { setNotFound(true); setLoading(false); return; }
    const url = ref
      ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/og-share?id=${shareId}&format=json&ref=${ref}`
      : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/og-share?id=${shareId}&format=json`;

    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (d.share) setShare(d.share);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [shareId, ref]);

  const handleGetMyReading = () => {
    const dest = `/auth?action=signup${share?.referral_code ? `&ref=${share.referral_code}` : ''}`;
    navigate(dest);
  };

  const handleLogin = () => navigate('/auth');

  if (loading) {
    return (
      <MysticBackground className="min-h-screen flex items-center justify-center">
        <OracleLoader size="lg" message="Révélation en cours…" />
      </MysticBackground>
    );
  }

  if (notFound) {
    return (
      <MysticBackground className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
        <SEOHead title="Tirage introuvable | Tarot Dinatoire" description="Ce tirage a expiré ou n'existe pas." />
        <p className="text-4xl">🌙</p>
        <h1 className="font-serif text-2xl text-foreground">Ce tirage a expiré</h1>
        <p className="text-muted-foreground text-sm max-w-xs">
          Les partages expirent après 30 jours. Créez votre propre tirage !
        </p>
        <MysticButton onClick={() => navigate('/')}>
          <Sparkles className="h-4 w-4 mr-2" />
          Obtenir mon tirage gratuit
        </MysticButton>
      </MysticBackground>
    );
  }

  const title  = share?.interp_title ?? share?.card_name_fr ?? 'Tirage du Tarot';
  const desc   = share?.interp_summary
    ? share.interp_summary.slice(0, 155)
    : `Découvrez ${share?.card_name_fr} et recevez votre propre tirage quotidien gratuit.`;

  return (
    <>
      <SEOHead
        title={`${title} | Tarot Dinatoire`}
        description={desc}
        ogTitle={title}
        ogDescription={desc}
      />
      <MysticBackground className="min-h-screen py-10 px-4">
        <div className="max-w-md mx-auto space-y-8">

          {/* Header branding */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-1"
          >
            <p
              className="text-xs font-medium tracking-widest uppercase"
              style={{ color: 'hsl(var(--primary))' }}
            >
              ✦ Tarot Dinatoire ✦
            </p>
            <h1 className="font-serif text-xl text-foreground">Un tirage vous a été partagé</h1>
          </motion.div>

          {/* Card visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'hsl(var(--card) / 0.6)',
              border: '1px solid hsl(var(--border))',
              boxShadow: '0 20px 60px hsl(var(--primary) / 0.15)',
            }}
          >
            {/* Card image */}
            <div
              className="relative flex items-center justify-center py-8"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--secondary) / 0.1))' }}
            >
              {share?.image_url ? (
                <motion.img
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.75 }}
                  src={share.image_url}
                  alt={share.card_name_fr}
                  className="h-48 w-auto rounded-xl object-cover"
                  style={{ boxShadow: '0 8px 32px hsl(var(--primary) / 0.3)' }}
                />
              ) : (
                <motion.div
                  initial={{ rotateY: 90 }}
                  animate={{ rotateY: 0 }}
                  transition={{ delay: 0.4, duration: 0.75 }}
                  className="h-48 w-32 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--secondary) / 0.3))',
                    border: '1px solid hsl(var(--primary) / 0.4)',
                  }}
                >
                  <Sparkles className="h-10 w-10" style={{ color: 'hsl(var(--primary))' }} />
                </motion.div>
              )}

              {/* Visit counter */}
              <div
                className="absolute top-3 right-3 flex items-center gap-1 rounded-full px-2 py-1 text-xs"
                style={{
                  background: 'hsl(var(--background) / 0.7)',
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                <Eye className="h-3 w-3" />
                {(share?.visit_count ?? 0) + 1}
              </div>
            </div>

            {/* Interpretation */}
            <div className="p-5 space-y-3">
              <div className="text-center space-y-1">
                <h2 className="font-serif text-xl font-semibold text-foreground">
                  {share?.card_name_fr}
                </h2>
                <p
                  className="text-xs"
                  style={{ color: 'hsl(var(--primary))' }}
                >
                  {share?.orientation === 'upright' ? '✦ À l\'endroit' : '✦ Renversée'}
                </p>
              </div>

              {title && (
                <p className="text-sm font-medium text-center text-foreground/90">
                  {title}
                </p>
              )}

              {share?.interp_summary && (
                <p className="text-sm text-muted-foreground text-center leading-relaxed italic">
                  {share.interp_summary}
                </p>
              )}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <div
              className="rounded-2xl p-5 text-center space-y-3"
              style={{
                background: 'hsl(var(--card) / 0.5)',
                border: '1px solid hsl(var(--primary) / 0.3)',
              }}
            >
              <div className="flex justify-center">
                <span className="text-3xl">🔮</span>
              </div>
              <h3 className="font-serif text-base font-semibold text-foreground">
                Recevez votre propre carte du jour
              </h3>
              <p className="text-xs text-muted-foreground">
                Un tirage quotidien gratuit. Votre voyage intérieur commence ici.
              </p>
              <MysticButton
                onClick={handleGetMyReading}
                size="lg"
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Obtenir mon tirage gratuit
                <ArrowRight className="h-4 w-4 ml-2" />
              </MysticButton>
              <button
                onClick={handleLogin}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
              >
                J'ai déjà un compte — me connecter
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
              <Heart className="h-3 w-3" />
              <span>Gratuit · Sans CB · Données privées</span>
            </div>
          </motion.div>

        </div>
      </MysticBackground>
    </>
  );
}
