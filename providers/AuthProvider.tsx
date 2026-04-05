"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
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

async function getAuthProfile(userId: string): Promise<AuthProfile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("avatar_url, phone, plan_id, payment_status")
    .eq("id", userId)
    .maybeSingle();

  return data
    ? {
        avatar_url: data.avatar_url ?? null,
        phone: data.phone ?? null,
        plan_id: data.plan_id ?? null,
        payment_status: data.payment_status ?? null,
      }
    : null;
}

export function AuthProvider({
  children,
  initialUser,
  initialProfile,
}: {
  children: React.ReactNode;
  initialUser: User | null;
  initialProfile: AuthProfile | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<AuthProfile | null>(initialProfile);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const activeUserIdRef = useRef<string | null>(initialUser?.id ?? null);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    setProfile(await getAuthProfile(user.id));
  };

  useEffect(() => {
    let isMounted = true;

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

        if (!currentUser) {
          activeUserIdRef.current = null;
          setProfile(null);
          setIsAuthLoading(false);
          return;
        }

        if (nextUserId === previousUserId) {
          return;
        }

        activeUserIdRef.current = nextUserId;
        setIsAuthLoading(true);

        const nextProfile = await getAuthProfile(currentUser.id);

        if (!isMounted || activeUserIdRef.current !== currentUser.id) {
          return;
        }

        setProfile(nextProfile);
        setIsAuthLoading(false);
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
    <AuthContext.Provider value={{ user, profile, isAuthLoading, refreshProfile }}>
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
