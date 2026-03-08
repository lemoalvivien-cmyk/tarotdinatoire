import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  status: AuthStatus;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// QueryClient ref — permet de vider le cache sans dépendance circulaire
export let _queryClientRef: { clear: () => void } | null = null;
export function setQueryClientRef(ref: { clear: () => void }) {
  _queryClientRef = ref;
}

// Navigation callback injectable — permet à AuthContext de naviguer
// sans dépendre de React Router (qui est en-dessous dans l'arbre)
let _navigateToRoot: (() => void) | null = null;
export function setNavigateCallback(fn: () => void) {
  _navigateToRoot = fn;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]     = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus]   = useState<AuthStatus>('loading');
  const initialCheckDone = useRef(false);
  const mountedRef       = useRef(true);

  const updateSession = useCallback((newSession: Session | null) => {
    if (!mountedRef.current) return;
    setSession(newSession);
    setUser(newSession?.user ?? null);
    setStatus(newSession ? 'authenticated' : 'unauthenticated');
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mountedRef.current) return;
        updateSession(newSession);
      }
    );

    if (!initialCheckDone.current) {
      initialCheckDone.current = true;
      supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
        if (!mountedRef.current) return;
        if (error) {
          setStatus('unauthenticated');
          return;
        }
        updateSession(initialSession);
      });
    }

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [updateSession]);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session: refreshed }, error } = await supabase.auth.getSession();
      if (error) return;
      updateSession(refreshed);
    } catch {
      // Silent — session refresh failure is not fatal
    }
  }, [updateSession]);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/app/onboarding`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });

    if (!error && data.session) {
      updateSession(data.session);
    } else if (!error && !data.session) {
      toast.info('Vérifiez votre email pour confirmer votre inscription.');
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.session) {
      updateSession(data.session);
    }
    return { error };
  };

  /**
   * signOut — correctif :
   *  - Vide le cache React Query (pas de données stale sur appareil partagé)
   *  - Utilise le callback de navigation injectable si disponible
   *    (évite window.history.replaceState qui ne notifie pas React Router)
   *  - Fallback window.history.replaceState si le callback n'est pas encore enregistré
   */
  const signOut = async () => {
    await supabase.auth.signOut();
    updateSession(null);
    _queryClientRef?.clear();

    if (_navigateToRoot) {
      _navigateToRoot();
    } else {
      // Fallback : remplace l'entrée history (back button → landing)
      window.history.replaceState(null, '', '/');
    }
  };

  const loading = status === 'loading';

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      status,
      signUp,
      signIn,
      signOut,
      refreshSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
