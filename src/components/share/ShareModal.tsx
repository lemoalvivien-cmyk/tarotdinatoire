import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Link, Twitter, Facebook, Copy, Check, Share2, Download, X,
} from 'lucide-react';
import { useShare, type SharePayload } from '@/hooks/useShare';
import { ShareableCard } from './ShareableCard';
import type { TarotCard } from '@/types/tarot';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  payload: SharePayload;
  card?: TarotCard | null;
}

const WHATSAPP_ICON = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export function ShareModal({ open, onClose, payload, card }: ShareModalProps) {
  const { createShare, copyShareLink, isCreating } = useShare();
  const [shareResult, setShareResult] = useState<{ share_url: string; referral_code: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open && !shareResult) {
      createShare(payload).then(res => {
        if (res) setShareResult(res);
      });
    }
    if (!open) {
      setShareResult(null);
      setCopied(false);
    }
  }, [open]);

  const shareUrl = shareResult?.share_url ?? '';
  const shareText = `🔮 ${payload.card_name_fr} — ${payload.interp_title ?? 'Mon tirage du jour'}\n\nDécouvrez votre propre carte sur Tarot Dinatoire 🌙`;

  const handleCopy = () => {
    copyShareLink(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const handleFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(fbUrl, '_blank', 'noopener,noreferrer');
  };

  const handleWhatsApp = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: payload.card_name_fr, text: shareText, url: shareUrl });
      } catch { /* user cancelled */ }
    }
  };

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);
    try {
      const link = document.createElement('a');
      link.download = `tarot-${payload.card_id}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-sm w-full p-0 overflow-hidden rounded-2xl"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Partager votre tirage</DialogTitle>
        </DialogHeader>

        {/* Visual card preview */}
        <div className="relative">
          <ShareableCard
            ref={canvasRef}
            card={card}
            orientation={payload.orientation}
            interpTitle={payload.interp_title}
            interpSummary={payload.interp_summary}
            imageUrl={payload.image_url}
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 rounded-full p-1.5 bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Share controls */}
        <div className="p-5 space-y-4">
          <div className="text-center space-y-0.5">
            <p className="font-serif text-base font-semibold text-foreground">
              {payload.card_name_fr}
            </p>
            <p className="text-xs text-muted-foreground">
              {payload.interp_title ?? 'Partagez votre tirage du jour'}
            </p>
          </div>

          {/* Share link */}
          {isCreating ? (
            <div className="flex items-center justify-center py-2">
              <span
                className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: 'hsl(var(--primary))' }}
              />
            </div>
          ) : shareUrl ? (
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))' }}
            >
              <Link className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-xs text-muted-foreground truncate">{shareUrl}</span>
              <button
                onClick={handleCopy}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium transition-colors"
                style={{
                  background: copied ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--background))',
                  color: copied ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
                }}
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          ) : null}

          {/* Social buttons */}
          <div className="grid grid-cols-4 gap-2">
            <SocialBtn
              icon={<Twitter className="h-4 w-4" />}
              label="Twitter"
              color="hsl(203 89% 53%)"
              onClick={handleTwitter}
              disabled={!shareUrl}
            />
            <SocialBtn
              icon={<Facebook className="h-4 w-4" />}
              label="Facebook"
              color="hsl(221 44% 41%)"
              onClick={handleFacebook}
              disabled={!shareUrl}
            />
            <SocialBtn
              icon={<WHATSAPP_ICON />}
              label="WhatsApp"
              color="hsl(142 70% 49%)"
              onClick={handleWhatsApp}
              disabled={!shareUrl}
            />
            {typeof navigator !== 'undefined' && 'share' in navigator ? (
              <SocialBtn
                icon={<Share2 className="h-4 w-4" />}
                label="Partager"
                color="hsl(var(--primary))"
                onClick={handleNativeShare}
                disabled={!shareUrl}
              />
            ) : (
              <SocialBtn
                icon={<Download className="h-4 w-4" />}
                label="Image"
                color="hsl(var(--primary))"
                onClick={handleDownload}
                disabled={downloading}
              />
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground/60">
            Vos amis pourront générer leur propre tirage 🌙
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SocialBtn({
  icon, label, color, onClick, disabled,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1 rounded-xl p-2.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
      style={{ background: `${color}1A`, border: `1px solid ${color}33` }}
    >
      <span style={{ color }}>{icon}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </button>
  );
}
