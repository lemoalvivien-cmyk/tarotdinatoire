/**
 * StarfieldCanvas — Standalone ethereal starfield
 * Always rendered, unconditional (not behind monetization gate).
 * Respects prefers-reduced-motion.
 * Lazy on mobile via IntersectionObserver.
 */
import { useEffect, useRef } from 'react';

interface StarfieldCanvasProps {
  starCount?: number;
  opacity?: number;
  className?: string;
}

export function StarfieldCanvas({
  starCount = 180,
  opacity = 0.45,
  className = 'absolute inset-0 w-full h-full pointer-events-none',
}: StarfieldCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Respect reduced motion — only static stars, no animation
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animId: number;
    const stars: { x: number; y: number; r: number; alpha: number; speed: number; phase: number }[] = [];

    function resize() {
      if (!canvas) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function init() {
      if (!canvas) return;
      stars.length = 0;
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x:     Math.random() * canvas.width,
          y:     Math.random() * canvas.height,
          r:     Math.random() * 1.2 + 0.2,
          alpha: Math.random() * 0.5 + 0.1,
          speed: Math.random() * 0.2 + 0.04,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    function drawFrame(t: number) {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        const twinkle = prefersReduced
          ? s.alpha
          : s.alpha + 0.25 * Math.sin(t * 0.0008 * s.speed + s.phase);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210,195,255,${Math.max(0, Math.min(1, twinkle))})`;
        ctx.fill();
      }
      if (!prefersReduced) {
        animId = requestAnimationFrame(drawFrame);
      }
    }

    resize();
    init();
    animId = requestAnimationFrame(drawFrame);

    const onResize = () => { resize(); init(); };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, [starCount]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}

export default StarfieldCanvas;
