import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("avatar_url, phone, plan_id, payment_status")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Failed to load current profile", profileError);
      return NextResponse.json(
        { error: "Unable to load profile right now." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      profile: profile
        ? {
            avatar_url: profile.avatar_url ?? null,
            phone: profile.phone ?? null,
            plan_id: profile.plan_id ?? null,
            payment_status: profile.payment_status ?? null,
          }
        : null,
    });
  } catch (error) {
    console.error("Current user route failed", error);
    return NextResponse.json(
      { error: "Unable to load profile right now." },
      { status: 500 },
    );
  }
}
