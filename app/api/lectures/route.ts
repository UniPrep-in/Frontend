import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createBrowseAccess,
  getLatestVerifiedSubscriptionAccess,
  normalizeContentCategory,
  resolveContentMeta,
} from "@/lib/subscriptions";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please sign in to view lectures." },
        { status: 401 },
      );
    }

    const adminSupabase = createAdminClient();
    const { data: subscriptionAccess, error: accessError } =
      await getLatestVerifiedSubscriptionAccess(adminSupabase, user.id);

    if (accessError) {
      console.error("Failed to load lecture access", accessError);
      return NextResponse.json(
        { error: "Unable to load lectures right now." },
        { status: 500 },
      );
    }

    const access = subscriptionAccess ?? createBrowseAccess();
    const { searchParams } = new URL(req.url);
    const category = normalizeContentCategory(searchParams.get("category"));
    const excludeId = searchParams.get("excludeId")?.trim() || "";
    const { data, error } = await adminSupabase
      .from("live_lectures")
      .select("id, title, description, subject, stream, youtube_url, thumbnail_url, is_live")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load lectures", error);
      return NextResponse.json(
        { error: "Unable to load lectures right now." },
        { status: 500 },
      );
    }

    const filteredLectures = (data ?? []).filter((lecture) => {
      if (excludeId && lecture.id === excludeId) {
        return false;
      }

      const contentMeta = resolveContentMeta(lecture.stream, lecture.subject);

      if (!contentMeta) {
        return false;
      }

      if (
        access.isSubscriber &&
        contentMeta.category === "main" &&
        contentMeta.mainStreamLabel !== access.baseStreamLabel
      ) {
        return false;
      }

      if (contentMeta.category === "gat" && !access.hasGat) {
        return false;
      }

      if (category !== "all" && contentMeta.category !== category) {
        return false;
      }

      return true;
    });

    return NextResponse.json({
      lectures: filteredLectures.map((lecture) => {
        const contentMeta = resolveContentMeta(lecture.stream, lecture.subject) ?? {
          category: "main" as const,
          mainStreamLabel: access.baseStreamLabel,
        };

        const displayStream =
          contentMeta.category === "main"
            ? contentMeta.mainStreamLabel ?? access.baseStreamLabel
            : contentMeta.category === "english"
              ? "English"
              : "GAT";

        return {
          ...lecture,
          stream: displayStream,
          category: contentMeta.category,
          mainStreamLabel: contentMeta.mainStreamLabel,
        };
      }),
    });
  } catch (error) {
    console.error("Lectures route failed", error);
    return NextResponse.json(
      { error: "Unable to load lectures right now." },
      { status: 500 },
    );
  }
}
