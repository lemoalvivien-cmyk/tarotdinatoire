import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ReadableDarkOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Intensity of the dark overlay (0-1) */
  intensity?: 'light' | 'medium' | 'strong';
  /** Enable blur effect */
  blur?: boolean;
  /** Rounded corners */
  rounded?: 'none' | 'md' | 'lg' | 'xl' | '2xl';
}

/**
 * ReadableDarkOverlay - Component for better text readability on dark/busy backgrounds
 * Adds a dark overlay with optional blur behind content to ensure text contrast
 */
export const ReadableDarkOverlay = forwardRef<HTMLDivElement, ReadableDarkOverlayProps>(
  ({ 
    children, 
    className, 
    intensity = 'medium',
    blur = true,
    rounded = 'xl',
    ...props 
  }, ref) => {
    const intensityClasses = {
      light: 'bg-black/40',
      medium: 'bg-black/60',
      strong: 'bg-black/75',
    };

    const roundedClasses = {
      none: 'rounded-none',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative',
          intensityClasses[intensity],
          roundedClasses[rounded],
          blur && 'backdrop-blur-md',
          'border border-white/10',
          'shadow-lg shadow-black/20',
          className
        )}
        {...props}
      >
        {/* Inner content with enhanced text styling */}
        <div className="relative z-10 [&_h1]:text-white [&_h1]:font-bold [&_h1]:drop-shadow-lg [&_h2]:text-white [&_h2]:font-semibold [&_h2]:drop-shadow-md [&_h3]:text-white [&_h3]:font-medium [&_p]:text-white/90">
          {children}
        </div>
      </div>
    );
  }
);

ReadableDarkOverlay.displayName = 'ReadableDarkOverlay';

export default ReadableDarkOverlay;
