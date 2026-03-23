import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = () => {
  const cookieStore = cookies() as unknown as {
    getAll: () => { name: string; value: string }[];
    set: (args: { name: string; value: string; options?: Record<string, unknown> }) => void;
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          try {
            if (typeof cookieStore.getAll === "function") {
              return cookieStore.getAll();
            }
            return [];
          } catch {
            return [];
          }
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              if (typeof cookieStore.set === "function") {
                cookieStore.set({ name, value, options });
              }
            } catch {
              // ignore in read-only environments
            }
          });
        },
      },
    }
  );
};