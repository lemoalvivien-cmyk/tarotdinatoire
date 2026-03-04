import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QueryClient } from '@tanstack/react-query';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const initialCheckDone = useRef(false);
  const mountedRef = useRef(true);

  // Centralized session update function with logging
  const updateSession = useCallback((newSession: Session | null, source: string) => {
    if (!mountedRef.current) return;
    
    if (import.meta.env.DEV) {
      console.log('[Auth] updateSession from', source, {
        userId: newSession?.user?.id ?? 'null',
        hasSession: !!newSession,
      });
    }
    
    setSession(newSession);
    setUser(newSession?.user ?? null);
    setStatus(newSession ? 'authenticated' : 'unauthenticated');
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    // Set up auth state listener FIRST (synchronous callback only!)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mountedRef.current) return;
        
        if (import.meta.env.DEV) {
          console.log('[Auth] onAuthStateChange:', event, session?.user?.id);
        }
        updateSession(session, `onAuthStateChange:${event}`);
      }
    );

    // THEN check for existing session (only once)
    if (!initialCheckDone.current) {
      initialCheckDone.current = true;
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (!mountedRef.current) return;
        
        if (error) {
          console.error('[Auth] getSession error:', error);
          setStatus('unauthenticated');
          return;
        }
        if (import.meta.env.DEV) {
          console.log('[Auth] Initial getSession:', session?.user?.id ?? 'no session');
        }
        updateSession(session, 'getSession');
      });
    }

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [updateSession]);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[Auth] refreshSession error:', error);
        return;
      }
      updateSession(session, 'refreshSession');
    } catch (error) {
      console.error('[Auth] Error refreshing session:', error);
    }
  }, [updateSession]);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    if (import.meta.env.DEV) {
      console.log('[Auth] signUp attempt for:', email);
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    // If signup successful and we have a session, update state immediately
    if (!error && data.session) {
      if (import.meta.env.DEV) {
        console.log('[Auth] signUp success, session received immediately');
      }
      updateSession(data.session, 'signUp');
    } else if (!error && !data.session) {
      // Email confirmation required
      if (import.meta.env.DEV) {
        console.log('[Auth] signUp success, awaiting email confirmation');
      }
      toast.info('Vérifiez votre email pour confirmer votre inscription.');
    }
    
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (import.meta.env.DEV) {
      console.log('[Auth] signIn attempt for:', email);
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    // If signin successful, update state immediately
    if (!error && data.session) {
      if (import.meta.env.DEV) {
        console.log('[Auth] signIn success');
      }
      updateSession(data.session, 'signIn');
    }
    
    return { error };
  };

  const signOut = async () => {
    if (import.meta.env.DEV) {
      console.log('[Auth] signOut');
    }
    await supabase.auth.signOut();
    updateSession(null, 'signOut');
  };

  // Derive loading from status
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
      refreshSession 
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
