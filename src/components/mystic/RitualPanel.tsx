import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface RitualPanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated';
  glow?: 'none' | 'violet' | 'gold';
  animate?: boolean;
}

/**
 * Premium ritual panel with glass morphism and glow effects
 */
export const RitualPanel = forwardRef<HTMLDivElement, RitualPanelProps>(
  (
    {
      className,
      variant = 'default',
      glow = 'none',
      animate = false,
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default: cn(
        'bg-mp-bg-800/90',
        'border border-mp-surface-border',
        'shadow-mp-card'
      ),
      glass: cn(
        'bg-card/60 backdrop-blur-xl',
        'border border-mp-surface-border',
        'shadow-mp-card'
      ),
      elevated: cn(
        'bg-mp-bg-700/95 backdrop-blur-xl',
        'border border-mp-surface-border',
        'shadow-mp-float'
      ),
    };

    const glowStyles = {
      none: '',
      violet: 'shadow-mp-glow-v',
      gold: 'shadow-mp-glow-g',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-2xl p-6',
          'transition-all duration-[var(--motion-duration-normal)] ease-[var(--motion-easing-default)]',
          variantStyles[variant],
          glowStyles[glow],
          animate && 'animate-reveal',
          className
        )}
        {...props}
      >
        {/* Subtle gradient overlay */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, hsl(var(--mp-brand-violet) / 0.1), transparent 70%)'
          }}
        />
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }
);

RitualPanel.displayName = 'RitualPanel';

export default RitualPanel;
