import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCookieConsent } from '@/hooks/useCookieConsent';

// Analytics event types for the funnel
export type AnalyticsEventName =
  | 'page_view'
  | 'reading_start'
  | 'shuffle'
  | 'cut'
  | 'select_card'
  | 'validate'
  | 'result_view'
  | 'email_submit'
  | 'email_unsub'
  | 'auth_signup'
  | 'auth_login'
  | 'consent_accept'
  | 'consent_reject';

interface EventProps {
  spread_id?: string;
  card_id?: string;
  card_index?: number;
  session_id?: string;
  page?: string;
  [key: string]: string | number | boolean | undefined;
}

const ANON_ID_KEY = 'analytics_anon_id';

function getOrCreateAnonId(): string {
  let anonId = localStorage.getItem(ANON_ID_KEY);
  if (!anonId) {
    anonId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(ANON_ID_KEY, anonId);
  }
  return anonId;
}

export function useAnalytics() {
  const { user } = useAuth();
  const { hasConsent } = useCookieConsent();
  const queueRef = useRef<Array<{ event_name: string; props: EventProps }>>([]);
  const flushingRef = useRef(false);

  // Flush queued events
  const flushQueue = useCallback(async () => {
    if (flushingRef.current || queueRef.current.length === 0) return;
    
    flushingRef.current = true;
    const events = [...queueRef.current];
    queueRef.current = [];

    const anonId = getOrCreateAnonId();

    try {
      const rows = events.map(e => ({
        anon_id: anonId,
        user_id: user?.id || null,
        event_name: e.event_name,
        props: e.props,
      }));

      // Insert all events in a single batch
      const { error } = await supabase.from('analytics_events').insert(rows);

      if (error) {
        // Re-queue failed events (limit to prevent infinite growth)
        if (queueRef.current.length < 50) {
          queueRef.current.unshift(...events);
        }
      }
    } catch {
      // Silent: analytics failures must not impact user experience
    } finally {
      flushingRef.current = false;
    }
  }, [user?.id]);

  // Flush on unmount or when queue gets large
  useEffect(() => {
    const interval = setInterval(() => {
      if (queueRef.current.length > 0) {
        flushQueue();
      }
    }, 5000); // Flush every 5 seconds

    return () => {
      clearInterval(interval);
      // Flush remaining on unmount
      if (queueRef.current.length > 0) {
        flushQueue();
      }
    };
  }, [flushQueue]);

  // Track an event
  const track = useCallback((eventName: AnalyticsEventName, props: EventProps = {}) => {
    // Check analytics consent (essential events always allowed)
    const essentialEvents: AnalyticsEventName[] = ['consent_accept', 'consent_reject'];
    if (!essentialEvents.includes(eventName) && !hasConsent('analytics')) {
      return;
    }

    // Add to queue
    queueRef.current.push({
      event_name: eventName,
      props: {
        ...props,
        timestamp: Date.now(),
      },
    });

    // Immediate flush for important events
    const immediateEvents: AnalyticsEventName[] = ['reading_start', 'result_view', 'email_submit'];
    if (immediateEvents.includes(eventName) || queueRef.current.length >= 10) {
      flushQueue();
    }
  }, [hasConsent, flushQueue]);

  // Track page view
  const trackPageView = useCallback((page: string) => {
    track('page_view', { page });
  }, [track]);

  return {
    track,
    trackPageView,
  };
}

// Singleton for use outside React components
let globalAnonId: string | null = null;

export async function trackEventDirect(
  eventName: AnalyticsEventName,
  props: EventProps = {},
  userId?: string
) {
  if (!globalAnonId) {
    globalAnonId = getOrCreateAnonId();
  }

  try {
    await supabase.from('analytics_events').insert({
      anon_id: globalAnonId,
      user_id: userId || null,
      event_name: eventName,
      props: { ...props, timestamp: Date.now() },
    });
  } catch {
    // Silent: analytics failures must not impact user experience
  }
}
