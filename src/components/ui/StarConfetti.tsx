/**
 * StarConfetti — canvas 2D star burst on first successful draw.
 * Auto-respects prefers-reduced-motion.
 * Usage: mount <StarConfetti /> → plays once then self-destructs.
 */
import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
}

const STAR_COLORS = [
  'hsl(45 90% 65%)',   // gold
  'hsl(220 80% 75%)',  // blue ether
  'hsl(270 60% 70%)',  // lavender
  'hsl(50 100% 80%)',  // ivory
  'hsl(30 80% 70%)',   // amber
];

function createStar(cx: number, cy: number): Star {
  const angle = Math.random() * Math.PI * 2;
  const speed = 2 + Math.random() * 6;
  return {
    x: cx,
    y: cy,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 2,
    alpha: 1,
    size: 3 + Math.random() * 6,
    color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.2,
  };
}

function drawStar(ctx: CanvasRenderingContext2D, star: Star) {
  ctx.save();
  ctx.globalAlpha = star.alpha;
  ctx.translate(star.x, star.y);
  ctx.rotate(star.rotation);
  ctx.fillStyle = star.color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const innerAngle = outerAngle + (2 * Math.PI) / 10;
    if (i === 0) {
      ctx.moveTo(Math.cos(outerAngle) * star.size, Math.sin(outerAngle) * star.size);
    } else {
      ctx.lineTo(Math.cos(outerAngle) * star.size, Math.sin(outerAngle) * star.size);
    }
    ctx.lineTo(Math.cos(innerAngle) * (star.size * 0.4), Math.sin(innerAngle) * (star.size * 0.4));
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

interface StarConfettiProps {
  onDone?: () => void;
  starCount?: number;
}

export function StarConfetti({ onDone, starCount = 60 }: StarConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onDone?.();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Burst from center-top area
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.35;

    const stars: Star[] = Array.from({ length: starCount }, () => createStar(cx, cy));
    let rafId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let allDone = true;
      for (const star of stars) {
        star.x += star.vx;
        star.y += star.vy;
        star.vy += 0.12; // gravity
        star.vx *= 0.99;  // air resistance
        star.alpha -= 0.012;
        star.rotation += star.rotationSpeed;

        if (star.alpha > 0) {
          allDone = false;
          drawStar(ctx, star);
        }
      }

      if (allDone) {
        onDone?.();
        return;
      }
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [onDone, starCount]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      aria-hidden="true"
    />
  );
}
