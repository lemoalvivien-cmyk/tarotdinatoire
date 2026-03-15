/**
 * StarConfetti — canvas 2D star burst on first successful draw.
 * Renders ABOVE content for the duration of the animation (~3s), then
 * calls onDone() and self-destructs. pointer-events: none always.
 * Respects prefers-reduced-motion.
 */
import { useEffect, useRef } from 'react';

interface Star {
  x: number; y: number;
  vx: number; vy: number;
  alpha: number; size: number;
  color: string; rotation: number; rotationSpeed: number;
}

const COLORS = [
  'hsl(45 90% 65%)',
  'hsl(220 80% 75%)',
  'hsl(270 60% 70%)',
  'hsl(50 100% 80%)',
  'hsl(30 80% 70%)',
];

function makeStar(cx: number, cy: number): Star {
  const angle = Math.random() * Math.PI * 2;
  const speed = 2 + Math.random() * 6;
  return {
    x: cx, y: cy,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 2,
    alpha: 1,
    size: 3 + Math.random() * 6,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.2,
  };
}

function drawStar(ctx: CanvasRenderingContext2D, s: Star) {
  ctx.save();
  ctx.globalAlpha = s.alpha;
  ctx.translate(s.x, s.y);
  ctx.rotate(s.rotation);
  ctx.fillStyle = s.color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const oa = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const ia = oa + (2 * Math.PI) / 10;
    if (i === 0) ctx.moveTo(Math.cos(oa) * s.size, Math.sin(oa) * s.size);
    else ctx.lineTo(Math.cos(oa) * s.size, Math.sin(oa) * s.size);
    ctx.lineTo(Math.cos(ia) * (s.size * 0.4), Math.sin(ia) * (s.size * 0.4));
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

interface StarConfettiProps { onDone?: () => void; starCount?: number; }

export function StarConfetti({ onDone, starCount = 60 }: StarConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onDone?.(); return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.35;
    const stars: Star[] = Array.from({ length: starCount }, () => makeStar(cx, cy));
    let rafId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const s of stars) {
        s.x += s.vx; s.y += s.vy;
        s.vy += 0.12; s.vx *= 0.99;
        s.alpha -= 0.012;
        s.rotation += s.rotationSpeed;
        if (s.alpha > 0) { alive = true; drawStar(ctx, s); }
      }
      if (!alive) { onDone?.(); return; }
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [onDone, starCount]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999,
        pointerEvents: 'none',
        mixBlendMode: 'screen',
      }}
    />
  );
}
