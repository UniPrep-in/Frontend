"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type AuthProfile = {
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    setProfile(await getAuthProfile(user.id));
  };

  useEffect(() => {
    let isMounted = true;

    const loadAuthState = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      setUser(currentUser ?? null);

      if (currentUser) {
        setProfile(await getAuthProfile(currentUser.id));
      } else {
        setProfile(null);
      }

      if (isMounted) {
        setIsAuthLoading(false);
      }
    };

    void loadAuthState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "INITIAL_SESSION" || !isMounted) {
        return;
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        setProfile(await getAuthProfile(currentUser.id));
      } else {
        setProfile(null);
      }

      if (isMounted) {
        setIsAuthLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
