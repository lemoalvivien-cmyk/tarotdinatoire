/**
 * StarfieldCanvas — Ethereal starfield, always behind all content.
 * z-index: -1, pointer-events: none, respects prefers-reduced-motion.
 */
import { useEffect, useRef } from 'react';

export function StarfieldCanvas({ starCount = 160 }: { starCount?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animId: number;
    const stars: { x: number; y: number; r: number; a: number; sp: number; ph: number }[] = [];

    function resize() {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function seed() {
      if (!canvas) return;
      stars.length = 0;
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.2 + 0.2,
          a: Math.random() * 0.5 + 0.15,
          sp: Math.random() * 0.2 + 0.04,
          ph: Math.random() * Math.PI * 2,
        });
      }
    }

    function draw(t: number) {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        const twinkle = reduced ? s.a : s.a + 0.22 * Math.sin(t * 0.0008 * s.sp + s.ph);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210,195,255,${Math.max(0, Math.min(1, twinkle))})`;
        ctx.fill();
      }
      if (!reduced) animId = requestAnimationFrame(draw);
    }

    resize();
    seed();
    animId = requestAnimationFrame(draw);
    const onResize = () => { resize(); seed(); };
    window.addEventListener('resize', onResize, { passive: true });
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
  }, [starCount]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        opacity: 0.35,
        pointerEvents: 'none',
      }}
    />
  );
}

export default StarfieldCanvas;
