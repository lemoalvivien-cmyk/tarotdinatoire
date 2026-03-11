import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface MysticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  glowOnHover?: boolean;
}

/**
 * Bouton mystique avec variantes, focus ring violet et hover glow
 */
export const MysticButton = forwardRef<HTMLButtonElement, MysticButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    const baseStyles = cn(
      'relative inline-flex items-center justify-center gap-2',
      'font-medium rounded-xl',
      'transition-all duration-[var(--motion-duration-normal)] ease-[var(--motion-easing-default)]',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'focus-visible:ring-mp-brand-violet focus-visible:ring-offset-background',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'
    );

    const variantStyles = {
      primary: cn(
        'text-white',
        'bg-gradient-to-r from-mp-brand-violet to-mp-brand-violet2',
        'shadow-mp-card',
        'hover:shadow-mp-glow-v hover:scale-[1.02] hover:-translate-y-0.5',
        'active:scale-[0.98] active:translate-y-0'
      ),
      outline: cn(
        'bg-transparent',
        'border-2 border-mp-brand-violet',
        'text-mp-brand-violet',
        'hover:bg-mp-brand-violet/10 hover:shadow-mp-glow-v hover:border-mp-brand-violet2',
        'active:scale-[0.98]'
      ),
      ghost: cn(
        'bg-transparent',
        'text-mp-brand-violet',
        'hover:bg-mp-brand-violet/10',
        'active:scale-[0.98]'
      ),
      gold: cn(
        'text-mp-bg-900',
        'bg-gradient-to-r from-mp-brand-gold to-mp-brand-gold2',
        'shadow-gold',
        'hover:shadow-mp-glow-g hover:scale-[1.02] hover:-translate-y-0.5',
        'active:scale-[0.98] active:translate-y-0'
      ),
    };

    const sizeStyles = {
      sm: 'h-9 px-4 text-sm',
      md: 'h-11 px-6 text-base',
      lg: 'h-14 px-8 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        
        {/* Left icon */}
        {!isLoading && leftIcon && (
          <span className="shrink-0">{leftIcon}</span>
        )}
        
        {/* Content */}
        <span>{children}</span>
        
        {/* Right icon */}
        {rightIcon && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

MysticButton.displayName = 'MysticButton';

export default MysticButton;
