import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CookieChoices {
  essential: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
}

const CONSENT_STORAGE_KEY = 'cookie_consent';
const ANON_ID_KEY = 'cookie_anon_id';

function generateAnonId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

function getOrCreateAnonId(): string {
  let anonId = localStorage.getItem(ANON_ID_KEY);
  if (!anonId) {
    anonId = generateAnonId();
    localStorage.setItem(ANON_ID_KEY, anonId);
  }
  return anonId;
}

export function useCookieConsent() {
  const { user } = useAuth();
  const [choices, setChoices] = useState<CookieChoices | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored consent on mount
  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CookieChoices;
        setChoices(parsed);
        setShowBanner(false);
      } catch {
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }
    setIsLoading(false);
  }, []);

  // Log consent to database
  const logConsent = useCallback(async (newChoices: CookieChoices) => {
    const anonId = getOrCreateAnonId();
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- anon_id required but not in generated Insert type
      await (supabase.from('consent_logs') as any).insert({
        anon_id: anonId,
        user_id: user?.id || null,
        choices: newChoices,
        user_agent: navigator.userAgent.substring(0, 500),
      });
    } catch {
      // Don't block user experience on logging failure
    }
  }, [user?.id]);

  // Accept all cookies
  const acceptAll = useCallback(() => {
    const newChoices: CookieChoices = {
      essential: true,
      analytics: true,
      marketing: true,
    };
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newChoices));
    setChoices(newChoices);
    setShowBanner(false);
    logConsent(newChoices);
  }, [logConsent]);

  // Accept only essential
  const acceptEssential = useCallback(() => {
    const newChoices: CookieChoices = {
      essential: true,
      analytics: false,
      marketing: false,
    };
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newChoices));
    setChoices(newChoices);
    setShowBanner(false);
    logConsent(newChoices);
  }, [logConsent]);

  // Custom selection
  const saveChoices = useCallback((customChoices: Omit<CookieChoices, 'essential'>) => {
    const newChoices: CookieChoices = {
      essential: true,
      analytics: customChoices.analytics,
      marketing: customChoices.marketing,
    };
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(newChoices));
    setChoices(newChoices);
    setShowBanner(false);
    logConsent(newChoices);
  }, [logConsent]);

  // Reset consent (for testing or settings)
  const resetConsent = useCallback(() => {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    setChoices(null);
    setShowBanner(true);
  }, []);

  // Check if specific consent is given
  const hasConsent = useCallback((type: keyof CookieChoices): boolean => {
    if (!choices) return false;
    return choices[type] === true;
  }, [choices]);

  return {
    choices,
    showBanner,
    isLoading,
    acceptAll,
    acceptEssential,
    saveChoices,
    resetConsent,
    hasConsent,
  };
}
