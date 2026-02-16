import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

const oracleMessages = [
  "Connexion aux énergies...",
  "Nos tarologues synthétisent votre tirage...",
  "L'Oracle consulte les astres...",
  "Les cartes révèlent leur message...",
  "Synthèse spirituelle en cours...",
];

interface LoadingOracleProps {
  className?: string;
  messages?: string[];
}

export function LoadingOracle({ className, messages = oracleMessages }: LoadingOracleProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className={cn('min-h-[400px] flex flex-col items-center justify-center', className)}>
      {/* Pulsing violet circle */}
      <div className="relative w-32 h-32 mb-8">
        {/* Outer ping */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: 'hsl(var(--primary) / 0.15)' }}
          animate={shouldReduceMotion ? {} : {
            scale: [1, 1.8, 1],
            opacity: [0.4, 0, 0.4],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Middle ring */}
        <motion.div
          className="absolute inset-4 rounded-full"
          style={{ backgroundColor: 'hsl(var(--primary) / 0.25)' }}
          animate={shouldReduceMotion ? {} : {
            scale: [1, 1.4, 1],
            opacity: [0.5, 0.15, 0.5],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />
        {/* Inner solid */}
        <motion.div
          className="absolute inset-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'hsl(var(--primary) / 0.4)' }}
          animate={shouldReduceMotion ? {} : {
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="text-3xl">🔮</span>
        </motion.div>
      </div>

      {/* Rotating messages */}
      <motion.p
        key={currentIndex}
        className="font-serif text-lg md:text-xl text-muted-foreground text-center max-w-md"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5 }}
      >
        {messages[currentIndex]}
      </motion.p>

      {/* Subtle dots */}
      <div className="flex gap-1.5 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary/50"
            animate={shouldReduceMotion ? {} : {
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}
