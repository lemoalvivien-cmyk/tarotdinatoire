import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface BetaBadgeProps {
  className?: string;
  variant?: 'default' | 'compact';
}

/**
 * Badge "VERSION BÊTA" avec effet glass et point doré pulsant
 */
export const BetaBadge = forwardRef<HTMLDivElement, BetaBadgeProps>(
  ({ className, variant = 'default' }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-2 rounded-full',
          'mp-glass backdrop-blur-md',
          'border border-mp-surface-border',
          variant === 'default' 
            ? 'px-3 py-1.5 text-xs' 
            : 'px-2 py-1 text-[10px]',
          className
        )}
      >
        {/* Point doré pulsant */}
        <span className="relative flex h-2 w-2">
          <span 
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ backgroundColor: 'hsl(var(--mp-brand-gold))' }}
          />
          <span 
            className="relative inline-flex h-2 w-2 rounded-full"
            style={{ backgroundColor: 'hsl(var(--mp-brand-gold))' }}
          />
        </span>
        
        {/* Texte */}
        <span 
          className="font-medium uppercase tracking-wider"
          style={{ color: 'hsl(var(--mp-brand-gold))' }}
        >
          {variant === 'default' ? 'Version Bêta Gratuite' : 'Bêta'}
        </span>
      </div>
    );
  }
);

BetaBadge.displayName = 'BetaBadge';

export default BetaBadge;
