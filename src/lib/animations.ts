/**
 * TarotDinatoire – Unified Animation Library
 * Single source of truth for all Framer Motion variants + CSS animation tokens.
 * Import these instead of inline animation objects.
 */

import type { Variants, Transition } from 'framer-motion';

// ─── Shared transitions ──────────────────────────────────────────────────────

export const transitions = {
  /** Smooth mystic reveal – primary transition */
  mystic: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } satisfies Transition,
  /** Fast feedback (hover, tap) */
  fast: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } satisfies Transition,
  /** Slow dramatic reveal */
  dramatic: { duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] } satisfies Transition,
  /** Bouncy for small UI pops */
  bounce: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] } satisfies Transition,
  /** Celestial float (infinite loops) */
  celestial: { duration: 6, ease: [0.25, 0.46, 0.45, 0.94], repeat: Infinity, repeatType: 'reverse' as const },
} as const;

// ─── Shared variants ─────────────────────────────────────────────────────────

/** Fade + slide up — for page sections and cards */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.mystic,
  },
};

/** Fade in only — for overlays */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.mystic },
};

/** Scale + fade — for modal/dialog entrance */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: transitions.bounce },
  exit: { opacity: 0, scale: 0.95, transition: transitions.fast },
};

/** Stagger container — wraps list items */
export const staggerContainer = (stagger = 0.1, delayChildren = 0): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: stagger, delayChildren },
  },
});

/** Stagger item — child of staggerContainer */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.mystic,
  },
};

/** Slide in from right — for drawers / panels */
export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: transitions.mystic },
  exit: { opacity: 0, x: 40, transition: transitions.fast },
};

/** Card hover lift — use on motion.div wrapping card */
export const cardHover = {
  rest: { y: 0, scale: 1 },
  hover: { y: -4, scale: 1.02, transition: transitions.fast },
  tap: { scale: 0.98, transition: transitions.fast },
} satisfies Variants;

/** Glow pulse — infinite subtle glow ring */
export const glowPulse: Variants = {
  dim: { opacity: 0.3, scale: 1 },
  bright: {
    opacity: 0.6,
    scale: 1.05,
    transition: { ...transitions.celestial, duration: 2.5 },
  },
};

/** Tarot card reveal — 3D flip */
export const cardFlip: Variants = {
  faceDown: { rotateY: 180, opacity: 1 },
  faceUp: {
    rotateY: 0,
    opacity: 1,
    transition: { duration: 0.75, ease: [0.68, -0.55, 0.265, 1.55] },
  },
};

/** Page transition wrapper */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { ...transitions.mystic, duration: 0.4 } },
  exit: { opacity: 0, y: -8, transition: transitions.fast },
};

// ─── Reduced-motion overrides ────────────────────────────────────────────────

/** Returns instant no-op variants when reduced motion is preferred */
export const noMotion: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1 },
};

export const noTransition: Transition = { duration: 0 };

/** Helper — pick correct variants based on reduced motion preference */
export function motionVariants(
  variants: Variants,
  reducedMotion: boolean | null,
): Variants {
  return reducedMotion ? noMotion : variants;
}
