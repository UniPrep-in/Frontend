"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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
  const hasResolvedInitialAuthRef = useRef(false);

  const {
    data: profile,
    mutate: mutateProfile,
  } = useSWR(user ? ["auth-profile", user.id] : null, getAuthProfile, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const isAuthLoading = isBootstrapping;

  const applySession = useCallback(
    (session: Session | null) => {
      const currentUser = session?.user ?? null;
      const nextUserId = currentUser?.id ?? null;
      const previousUserId = activeUserIdRef.current;

      activeUserIdRef.current = nextUserId;
      setUser(currentUser);

      if (previousUserId !== nextUserId) {
        if (!currentUser) {
          void mutateProfile(null, false);
        } else {
          void mutateProfile();
        }
      }

      if (!hasResolvedInitialAuthRef.current) {
        hasResolvedInitialAuthRef.current = true;
      }

      setIsBootstrapping(false);
    },
    [mutateProfile],
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

      applySession(session);
    };

    void bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (!isMounted) {
          return;
        }

        applySession(session);
      },
    );

    const handleVisibilityChange = async () => {
      if (!isMounted || document.visibilityState !== "visible") {
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      applySession(session);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      subscription.unsubscribe();
    };
  }, [applySession]);

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
