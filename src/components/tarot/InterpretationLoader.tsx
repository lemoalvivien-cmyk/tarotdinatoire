import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface InterpretationLoaderProps {
  className?: string;
  question?: string;
}

/**
 * Full-page cosmic loader for interpretation phase
 * Shows while our tarologists synthesize the reading interpretation
 */
export function InterpretationLoader({ className, question }: InterpretationLoaderProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center',
      'bg-gradient-to-b from-[hsl(260_30%_8%)] via-[hsl(260_25%_12%)] to-[hsl(260_20%_6%)]',
      className
    )}>
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={shouldReduceMotion ? {} : {
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Cosmic nebula effect */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(260 60% 40%), transparent)' }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(45 80% 40%), transparent)' }}
        />
      </div>

      {/* Central loader */}
      <div className="relative flex flex-col items-center gap-8 z-10 px-4">
        {/* Oracle wheel */}
        <div className="relative w-40 h-40 sm:w-48 sm:h-48">
          {/* Outer glow */}
          <motion.div
            className="absolute -inset-8 rounded-full opacity-40"
            style={{
              background: 'radial-gradient(circle, hsl(260 60% 50% / 0.5), transparent 60%)',
            }}
            animate={shouldReduceMotion ? {} : {
              scale: [1, 1.15, 1],
              opacity: [0.4, 0.2, 0.4],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* Rotating rings */}
          <motion.svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            animate={shouldReduceMotion ? {} : { rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="url(#loaderGradient1)"
              strokeWidth="1"
              strokeDasharray="8 4"
              opacity="0.6"
            />
            <defs>
              <linearGradient id="loaderGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(260 60% 60%)" />
                <stop offset="50%" stopColor="hsl(45 80% 60%)" />
                <stop offset="100%" stopColor="hsl(260 60% 60%)" />
              </linearGradient>
            </defs>
          </motion.svg>

          <motion.svg
            className="absolute inset-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)]"
            viewBox="0 0 100 100"
            animate={shouldReduceMotion ? {} : { rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          >
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="hsl(45 80% 55%)"
              strokeWidth="0.5"
              strokeDasharray="3 8"
              opacity="0.5"
            />
          </motion.svg>

          {/* Sun/wheel symbol */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={shouldReduceMotion ? {} : {
              rotate: -360,
              scale: [1, 1.05, 1],
            }}
            transition={{
              rotate: { duration: 30, repeat: Infinity, ease: 'linear' },
              scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            <div className="relative">
              {/* Sun rays */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-0.5 bg-gradient-to-b from-yellow-400 to-transparent"
                  style={{
                    height: 20 + (i % 2) * 8,
                    left: '50%',
                    top: '50%',
                    transformOrigin: 'center top',
                    transform: `translateX(-50%) translateY(-100%) rotate(${i * 30}deg)`,
                  }}
                  animate={shouldReduceMotion ? {} : {
                    opacity: [0.4, 0.8, 0.4],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
              
              {/* Center symbol */}
              <span 
                className="text-5xl sm:text-6xl filter drop-shadow-lg"
                style={{ 
                  color: 'hsl(45 90% 65%)',
                  textShadow: '0 0 30px hsl(45 80% 50% / 0.6)',
                }}
              >
                ☀
              </span>
            </div>
          </motion.div>

          {/* Orbiting moons */}
          {!shouldReduceMotion && [0, 120, 240].map((angle, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                width: 8,
                height: 8,
                background: i === 1 ? 'hsl(45 80% 60%)' : 'hsl(260 50% 70%)',
                borderRadius: '50%',
                boxShadow: `0 0 10px ${i === 1 ? 'hsl(45 80% 60%)' : 'hsl(260 50% 70%)'}`,
                top: '50%',
                left: '50%',
                marginTop: -4,
                marginLeft: -4,
              }}
              animate={{
                x: [
                  Math.cos((angle * Math.PI) / 180) * 55,
                  Math.cos(((angle + 360) * Math.PI) / 180) * 55,
                ],
                y: [
                  Math.sin((angle * Math.PI) / 180) * 55,
                  Math.sin(((angle + 360) * Math.PI) / 180) * 55,
                ],
              }}
              transition={{
                duration: 8 + i,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </div>

        {/* Messages */}
        <div className="text-center space-y-4 max-w-md">
          <motion.h2
            className="font-serif text-2xl sm:text-3xl text-white drop-shadow-lg"
            animate={shouldReduceMotion ? {} : { opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Nos tarologues interprètent...
          </motion.h2>
          
          <motion.p
            className="text-white/80 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Synthèse spirituelle de votre tirage en cours...
          </motion.p>

          {question && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Votre question</p>
              <p className="text-white/90 text-sm italic">« {question} »</p>
            </motion.div>
          )}
        </div>

        {/* Loading dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-white/60"
              animate={shouldReduceMotion ? {} : {
                y: [0, -8, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default InterpretationLoader;
