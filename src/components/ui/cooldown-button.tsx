import React, { forwardRef } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useCooldown } from '@/hooks/useCooldown';
import { cn } from '@/lib/utils';

interface CooldownButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick?: () => Promise<void> | void;
  cooldownMs?: number;
  showCountdown?: boolean;
  loadingText?: string;
}

export const CooldownButton = forwardRef<HTMLButtonElement, CooldownButtonProps>(
  ({ onClick, cooldownMs = 2000, showCountdown = true, loadingText, children, disabled, className, ...props }, ref) => {
    const { isCoolingDown, remainingSeconds, withCooldown } = useCooldown({ cooldownMs });
    const [isLoading, setIsLoading] = React.useState(false);

    const handleClick = async () => {
      if (!onClick || isCoolingDown || isLoading) return;
      
      setIsLoading(true);
      try {
        await withCooldown(async () => {
          await onClick();
        })();
      } finally {
        setIsLoading(false);
      }
    };

    const isDisabled = disabled || isCoolingDown || isLoading;

    return (
      <Button
        ref={ref}
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          isCoolingDown && 'opacity-70 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {loadingText || children}
          </>
        ) : isCoolingDown && showCountdown ? (
          <>
            {children}
            <span className="ml-2 text-xs opacity-70">({remainingSeconds}s)</span>
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);

CooldownButton.displayName = 'CooldownButton';
