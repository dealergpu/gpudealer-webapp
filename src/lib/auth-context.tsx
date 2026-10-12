'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { setAuthTokenGetter } from '@/lib/api';
import { createClientSafely } from '@/lib/supabase/client';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(createClientSafely);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  // `undefined` = the initial session hasn't been seen yet. Only a change
  // *after* that is a real sign-in/sign-out/account switch.
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    setAuthTokenGetter(async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    });

    supabase.auth.getSession().then(({ data }) => {
      if (prevUserIdRef.current === undefined) {
        prevUserIdRef.current = data.session?.user.id ?? null;
      }
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      const userId = newSession?.user.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        // resetQueries (not clear) keeps mounted observers attached to their
        // cache entries, so active queries refetch and the UI updates.
        queryClient.resetQueries();
      }
      prevUserIdRef.current = userId;
      setSession(newSession);
      setIsLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
      setAuthTokenGetter(null);
    };
  }, [queryClient, supabase]);

  const signOut = async () => {
    await supabase?.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user: session?.user ?? null, session, isLoading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
