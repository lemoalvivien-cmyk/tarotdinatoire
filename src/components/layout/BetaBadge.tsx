/**
 * BetaBadge — Permanent "VERSION BÊTA GRATUITE" badge.
 * Displayed in Header and Footer when monetization is disabled.
 */
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BetaBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function BetaBadge({ className, size = 'sm' }: BetaBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wider uppercase',
        size === 'sm' ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs',
        className
      )}
      style={{
        borderColor: 'hsl(var(--mp-brand-gold) / 0.35)',
        color: 'hsl(var(--mp-brand-gold))',
        backgroundColor: 'hsl(var(--mp-brand-gold) / 0.08)',
      }}
      aria-label="Version bêta gratuite — guidance pure et éthérée"
      role="status"
    >
      <Sparkles className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} aria-hidden="true" />
      <span>Version Bêta · Gratuit</span>
    </div>
  );
}
