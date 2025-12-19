import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { motionTokens } from '@/lib/motionTokens';

interface OracleLoaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

/**
 * Loader mystique premium avec rotation et halo pulsant
 */
export function OracleLoader({
  className,
  size = 'md',
  message = 'L\'oracle médite...',
}: OracleLoaderProps) {
  const shouldReduceMotion = useReducedMotion();

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl',
  };

  return (
    <div className={cn('flex flex-col items-center gap-6', className)}>
      {/* Loader container */}
      <div className={cn('relative', sizeClasses[size])}>
        {/* Outer glow ring */}
        <motion.div
          className="absolute -inset-4 rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, hsl(var(--mp-brand-violet) / 0.4), transparent 70%)',
          }}
          animate={shouldReduceMotion ? {} : {
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{
            duration: motionTokens.duration.dramatic,
            repeat: Infinity,
            ease: [0.25, 0.46, 0.45, 0.94], // celestial easing
          }}
        />

        {/* Primary halo pulsant */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--mp-brand-violet) / 0.35), transparent 65%)',
          }}
          animate={shouldReduceMotion ? {} : {
            scale: [1, 1.25, 1],
            opacity: [0.6, 0.25, 0.6],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        />

        {/* Secondary halo (gold) */}
        <motion.div
          className="absolute inset-3 rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--mp-brand-gold) / 0.25), transparent 65%)',
          }}
          animate={shouldReduceMotion ? {} : {
            scale: [1.15, 1, 1.15],
            opacity: [0.35, 0.55, 0.35],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: [0.25, 0.46, 0.45, 0.94],
            delay: 0.4,
          }}
        />

        {/* Rotating symbol container */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={shouldReduceMotion ? {} : { rotate: 360 }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {/* Outer ring with symbols */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="url(#oracleGradient)"
              strokeWidth="1.5"
              strokeDasharray="6 3"
              opacity="0.7"
            />
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="url(#oracleGradientInner)"
              strokeWidth="0.5"
              strokeDasharray="2 6"
              opacity="0.4"
            />
            <defs>
              <linearGradient id="oracleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--mp-brand-violet))" />
                <stop offset="50%" stopColor="hsl(var(--mp-brand-gold))" />
                <stop offset="100%" stopColor="hsl(var(--mp-brand-violet))" />
              </linearGradient>
              <linearGradient id="oracleGradientInner" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--mp-brand-gold))" />
                <stop offset="100%" stopColor="hsl(var(--mp-brand-violet2))" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Center symbol (counter-rotating for visual effect) */}
        <motion.div
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            iconSizes[size]
          )}
          animate={shouldReduceMotion ? {} : { 
            rotate: -360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: {
              duration: 15,
              repeat: Infinity,
              ease: 'linear',
            },
            scale: {
              duration: 3,
              repeat: Infinity,
              ease: [0.25, 0.46, 0.45, 0.94],
            },
          }}
        >
          <span 
            className="filter drop-shadow-lg"
            style={{ 
              color: 'hsl(var(--mp-brand-gold))',
              textShadow: '0 0 20px hsl(var(--mp-brand-gold) / 0.5)',
            }}
          >
            ✦
          </span>
        </motion.div>

        {/* Orbiting dots */}
        {!shouldReduceMotion && [0, 90, 180, 270].map((angle, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: i % 2 === 0 ? 6 : 4,
              height: i % 2 === 0 ? 6 : 4,
              background: i % 2 === 0 
                ? 'hsl(var(--mp-brand-gold))' 
                : 'hsl(var(--mp-brand-violet))',
              boxShadow: i % 2 === 0 
                ? '0 0 8px hsl(var(--mp-brand-gold) / 0.6)' 
                : '0 0 8px hsl(var(--mp-brand-violet) / 0.6)',
              top: '50%',
              left: '50%',
              marginTop: i % 2 === 0 ? -3 : -2,
              marginLeft: i % 2 === 0 ? -3 : -2,
            }}
            animate={{
              x: [
                Math.cos((angle * Math.PI) / 180) * 38,
                Math.cos(((angle + 360) * Math.PI) / 180) * 38,
              ],
              y: [
                Math.sin((angle * Math.PI) / 180) * 38,
                Math.sin(((angle + 360) * Math.PI) / 180) * 38,
              ],
            }}
            transition={{
              duration: 5 + i * 0.5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Message */}
      {message && (
        <motion.p
          className="text-muted-foreground text-sm font-medium tracking-wide"
          animate={shouldReduceMotion ? {} : { opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
}

export default OracleLoader;
