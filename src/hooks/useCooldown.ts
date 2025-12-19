import { useState, useCallback, useRef } from 'react';

interface UseCooldownOptions {
  cooldownMs?: number;
  onCooldownStart?: () => void;
  onCooldownEnd?: () => void;
}

export function useCooldown(options: UseCooldownOptions = {}) {
  const { cooldownMs = 2000, onCooldownStart, onCooldownEnd } = options;
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startCooldown = useCallback(() => {
    if (isCoolingDown) return false;

    setIsCoolingDown(true);
    setRemainingMs(cooldownMs);
    onCooldownStart?.();

    // Update remaining time every 100ms
    intervalRef.current = setInterval(() => {
      setRemainingMs(prev => Math.max(0, prev - 100));
    }, 100);

    timerRef.current = setTimeout(() => {
      setIsCoolingDown(false);
      setRemainingMs(0);
      onCooldownEnd?.();
      if (intervalRef.current) clearInterval(intervalRef.current);
    }, cooldownMs);

    return true;
  }, [cooldownMs, isCoolingDown, onCooldownStart, onCooldownEnd]);

  const cancelCooldown = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsCoolingDown(false);
    setRemainingMs(0);
  }, []);

  // Wrapper for async functions with cooldown
  const withCooldown = useCallback(<T extends (...args: any[]) => Promise<any>>(fn: T) => {
    return async (...args: Parameters<T>): Promise<ReturnType<T> | null> => {
      if (isCoolingDown) {
        console.log('[Cooldown] Action blocked - cooldown active');
        return null;
      }
      
      startCooldown();
      try {
        return await fn(...args);
      } catch (error) {
        // Don't cancel cooldown on error - prevents rapid retry spam
        throw error;
      }
    };
  }, [isCoolingDown, startCooldown]);

  return {
    isCoolingDown,
    remainingMs,
    remainingSeconds: Math.ceil(remainingMs / 1000),
    startCooldown,
    cancelCooldown,
    withCooldown,
  };
}
