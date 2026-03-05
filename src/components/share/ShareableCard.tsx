import { forwardRef, useEffect, useRef } from 'react';
import type { TarotCard } from '@/types/tarot';

interface ShareableCardProps {
  card?: TarotCard | null;
  orientation: string;
  interpTitle?: string;
  interpSummary?: string;
  imageUrl?: string;
}

/**
 * Renders a beautiful shareable tarot card visual.
 * The hidden <canvas> is also exposed via ref for PNG download.
 */
export const ShareableCard = forwardRef<HTMLCanvasElement, ShareableCardProps>(
  function ShareableCard(
    { card, orientation, interpTitle, interpSummary, imageUrl },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const displayRef = useRef<HTMLCanvasElement>(null);

    // Merge external ref with internal ref
    const setRef = (el: HTMLCanvasElement | null) => {
      (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
    };

    const cardName = card?.nom_fr ?? 'Carte du Tarot';
    const orientLabel = orientation === 'upright' ? '✦ À l\'endroit' : '✦ Renversée';
    const title = interpTitle ?? cardName;
    const summary = interpSummary
      ? interpSummary.slice(0, 120) + (interpSummary.length > 120 ? '…' : '')
      : '';

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const W = 800;
      const H = 600;
      canvas.width  = W;
      canvas.height = H;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // ── Background gradient ──────────────────────────────────────────────
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0,   '#0d0920');
      bg.addColorStop(0.5, '#1a0e35');
      bg.addColorStop(1,   '#0d0920');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // ── Subtle star speckles ─────────────────────────────────────────────
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      const rng = (s: number) => {
        let x = Math.sin(s) * 10000;
        return x - Math.floor(x);
      };
      for (let i = 0; i < 120; i++) {
        const sx = rng(i * 7.3) * W;
        const sy = rng(i * 3.7) * H;
        const sr = rng(i * 11.1) * 1.4;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Gold border ──────────────────────────────────────────────────────
      const borderGrad = ctx.createLinearGradient(0, 0, W, H);
      borderGrad.addColorStop(0,   '#c9a227');
      borderGrad.addColorStop(0.5, '#f0c040');
      borderGrad.addColorStop(1,   '#c9a227');
      ctx.strokeStyle = borderGrad;
      ctx.lineWidth = 3;
      roundRect(ctx, 16, 16, W - 32, H - 32, 24);
      ctx.stroke();

      // Inner glow line
      ctx.strokeStyle = 'rgba(240,192,64,0.15)';
      ctx.lineWidth = 1;
      roundRect(ctx, 22, 22, W - 44, H - 44, 20);
      ctx.stroke();

      // ── Card image area (left side) ──────────────────────────────────────
      const imgX  = 52;
      const imgY  = 60;
      const imgW  = 220;
      const imgH  = 340;

      // Card back glow
      const glow = ctx.createRadialGradient(
        imgX + imgW / 2, imgY + imgH / 2, 10,
        imgX + imgW / 2, imgY + imgH / 2, 180,
      );
      glow.addColorStop(0, 'rgba(160,100,220,0.35)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(imgX - 20, imgY - 20, imgW + 40, imgH + 40);

      // Card frame
      ctx.save();
      roundRect(ctx, imgX, imgY, imgW, imgH, 14);
      ctx.clip();

      const drawCardContent = () => {
        // Placeholder gradient card face
        const cardGrad = ctx.createLinearGradient(imgX, imgY, imgX + imgW, imgY + imgH);
        cardGrad.addColorStop(0,   '#2d1b4e');
        cardGrad.addColorStop(1,   '#1a0e35');
        ctx.fillStyle = cardGrad;
        ctx.fillRect(imgX, imgY, imgW, imgH);

        // Ornamental cross/star in center
        ctx.save();
        ctx.translate(imgX + imgW / 2, imgY + imgH / 2 - 20);
        ctx.strokeStyle = 'rgba(240,192,64,0.6)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 8; i++) {
          ctx.save();
          ctx.rotate((i * Math.PI) / 4);
          ctx.beginPath();
          ctx.moveTo(0, 10);
          ctx.lineTo(0, 50);
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();

        // Card name on frame
        ctx.fillStyle = 'rgba(240,192,64,0.9)';
        ctx.font = 'bold 13px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(cardName.toUpperCase(), imgX + imgW / 2, imgY + imgH - 18);
      };

      if (imageUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          ctx.drawImage(img, imgX, imgY, imgW, imgH);
          ctx.restore();
          finishCanvas(ctx, W, H, imgX, imgY, imgW, imgH, cardName, orientLabel, title, summary);
        };
        img.onerror = () => {
          drawCardContent();
          ctx.restore();
          finishCanvas(ctx, W, H, imgX, imgY, imgW, imgH, cardName, orientLabel, title, summary);
        };
        img.src = imageUrl;
      } else {
        drawCardContent();
        ctx.restore();
        finishCanvas(ctx, W, H, imgX, imgY, imgW, imgH, cardName, orientLabel, title, summary);
      }

    }, [cardName, orientLabel, title, summary, imageUrl]);

    return (
      <canvas
        ref={setRef}
        className="w-full h-auto block"
        style={{ aspectRatio: '800/600' }}
        aria-label={`Carte partagée : ${cardName}`}
      />
    );
  }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function finishCanvas(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  imgX: number, imgY: number, imgW: number, _imgH: number,
  cardName: string, orientLabel: string,
  title: string, summary: string,
) {
  const textX = imgX + imgW + 32;
  const textW = W - textX - 52;

  // ── Brand logo area ──────────────────────────────────────────────────────
  const logoGrad = ctx.createLinearGradient(textX, 60, textX + 180, 80);
  logoGrad.addColorStop(0,   '#c9a227');
  logoGrad.addColorStop(1,   '#f0c040');
  ctx.fillStyle = logoGrad;
  ctx.font = '600 12px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('✦ TAROT DINATOIRE ✦', textX, 82);

  // ── Divider ──────────────────────────────────────────────────────────────
  const divGrad = ctx.createLinearGradient(textX, 0, textX + 200, 0);
  divGrad.addColorStop(0, 'rgba(201,162,39,0.8)');
  divGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(textX, 92);
  ctx.lineTo(textX + 200, 92);
  ctx.stroke();

  // ── Card name + orientation ───────────────────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px Georgia, serif';
  ctx.textAlign = 'left';
  wrapText(ctx, cardName, textX, 128, textW, 32);

  ctx.fillStyle = 'rgba(201,162,39,0.85)';
  ctx.font = '13px Georgia, serif';
  ctx.fillText(orientLabel, textX, 168);

  // ── Interpretation title ─────────────────────────────────────────────────
  if (title && title !== cardName) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'italic 15px Georgia, serif';
    wrapText(ctx, `"${title}"`, textX, 208, textW, 22);
  }

  // ── Summary text ─────────────────────────────────────────────────────────
  if (summary) {
    ctx.fillStyle = 'rgba(200,180,240,0.8)';
    ctx.font = '13px Arial, sans-serif';
    wrapText(ctx, summary, textX, 250, textW, 19, 5);
  }

  // ── CTA pill ─────────────────────────────────────────────────────────────
  const pillY = H - 80;
  const pillX = textX;
  const pillW = Math.min(textW, 260);
  const pillH = 38;

  const pillGrad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY);
  pillGrad.addColorStop(0, 'rgba(160,100,220,0.55)');
  pillGrad.addColorStop(1, 'rgba(100,60,180,0.55)');
  ctx.fillStyle = pillGrad;
  roundRect(ctx, pillX, pillY, pillW, pillH, 19);
  ctx.fill();

  ctx.strokeStyle = 'rgba(201,162,39,0.5)';
  ctx.lineWidth = 1;
  roundRect(ctx, pillX, pillY, pillW, pillH, 19);
  ctx.stroke();

  ctx.fillStyle = '#f0c040';
  ctx.font = 'bold 13px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🔮 Recevez votre tirage gratuit', pillX + pillW / 2, pillY + 24);

  // ── URL watermark ─────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.font = '11px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('tarotdinatoire.lovable.app', W / 2, H - 26);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  maxW: number, lineH: number, maxLines = 3,
) {
  const words = text.split(' ');
  let line   = '';
  let lineNo = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y + lineNo * lineH);
      line = word;
      lineNo++;
      if (lineNo >= maxLines) {
        ctx.fillText(line + '…', x, y + lineNo * lineH);
        return;
      }
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, y + lineNo * lineH);
}
