"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";

export type AuthProfile = {
  avatar_url: string | null;
  phone: string | null;
  plan_id: string | null;
  payment_status: string | null;
};

type AuthContextValue = {
  user: User | null;
  profile: AuthProfile | null;
  isAuthLoading: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const supabase = createClient();

async function getAuthProfile(): Promise<AuthProfile | null> {
  const response = await fetch("/api/me", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to load profile right now.");
  }

  const payload = (await response.json()) as { profile?: AuthProfile | null };
  return payload.profile ?? null;
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const activeUserIdRef = useRef<string | null>(null);

  const {
    data: profile,
    mutate: mutateProfile,
    isLoading: isProfileLoading,
  } = useSWR(user ? ["auth-profile", user.id] : null, getAuthProfile, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const isAuthLoading = useMemo(
    () => isBootstrapping || (Boolean(user) && isProfileLoading && typeof profile === "undefined"),
    [isBootstrapping, isProfileLoading, profile, user],
  );

  const refreshProfile = async () => {
    if (!user) {
      return;
    }

    await mutateProfile();
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      const currentUser = session?.user ?? null;
      activeUserIdRef.current = currentUser?.id ?? null;
      setUser(currentUser);
      setIsBootstrapping(false);
    };

    void bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!isMounted || event === "INITIAL_SESSION") {
          return;
        }

        const currentUser = session?.user ?? null;
        const nextUserId = currentUser?.id ?? null;
        const previousUserId = activeUserIdRef.current;

        setUser(currentUser);
        setIsBootstrapping(false);

        if (!currentUser) {
          activeUserIdRef.current = null;
          return;
        }

        if (nextUserId === previousUserId) {
          return;
        }

        activeUserIdRef.current = nextUserId;
      },
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    activeUserIdRef.current = user?.id ?? null;
  }, [user?.id]);

  return (
    <AuthContext.Provider
      value={{ user, profile: profile ?? null, isAuthLoading, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
