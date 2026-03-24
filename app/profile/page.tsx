import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfilePageClient from "./ProfilePageClient";
import type { Flashcard } from "./components/flashCards";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const [profileRes, cardsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("flash_cards")
      .select("word, meaning, type, synonyms, antonyms, example")
      .eq("user_id", user.id),
  ]);

  const profile = profileRes.data;
  const initialFlashcards = (cardsRes.data as Flashcard[] | null) ?? [];
  const memberSince = user.created_at
    ? new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
      }).format(new Date(user.created_at))
    : null;

  return (
    <ProfilePageClient
      initialEmail={user.email || ""}
      initialFullName={user.user_metadata?.display_name || ""}
      initialPhone={profile?.phone || ""}
      initialAddress={profile?.address || ""}
      initialAvatarUrl={
        profile?.avatar_url || user.user_metadata?.avatar_url || null
      }
      memberSince={memberSince}
      initialFlashcards={initialFlashcards}
    />
  );
}
