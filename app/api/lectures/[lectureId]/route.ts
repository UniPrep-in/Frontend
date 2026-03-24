import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createBrowseAccess,
  getLatestVerifiedSubscriptionAccess,
  resolveContentMeta,
} from "@/lib/subscriptions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lectureId: string }> },
) {
  try {
    const { lectureId } = await params;
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
      console.error("Failed to load lecture detail access", accessError);
      return NextResponse.json(
        { error: "Unable to load this lecture right now." },
        { status: 500 },
      );
    }

    const access = subscriptionAccess ?? createBrowseAccess();

    const { data: lecture, error } = await adminSupabase
      .from("live_lectures")
      .select("id, title, description, subject, stream, youtube_url, thumbnail_url, is_live")
      .eq("id", lectureId)
      .maybeSingle();

    if (error) {
      console.error("Failed to load lecture detail", error);
      return NextResponse.json(
        { error: "Unable to load this lecture right now." },
        { status: 500 },
      );
    }

    const contentMeta = resolveContentMeta(lecture?.stream, lecture?.subject);

    if (!lecture || !contentMeta) {
      return NextResponse.json(
        { error: "Lecture not found" },
        { status: 404 },
      );
    }

    if (
      access.isSubscriber &&
      contentMeta.category === "main" &&
      contentMeta.mainStreamLabel !== access.baseStreamLabel
    ) {
      return NextResponse.json(
        { error: "Lecture not found" },
        { status: 404 },
      );
    }

    if (contentMeta.category === "gat" && !access.hasGat) {
      return NextResponse.json(
        { error: "Lecture not found" },
        { status: 404 },
      );
    }

    const displayStream =
      contentMeta.category === "main"
        ? contentMeta.mainStreamLabel ?? access.baseStreamLabel
        : contentMeta.category === "english"
          ? "English"
          : "GAT";

    return NextResponse.json({
      lecture: {
        ...lecture,
        stream: displayStream,
        category: contentMeta.category,
        mainStreamLabel: contentMeta.mainStreamLabel,
      },
    });
  } catch (error) {
    console.error("Lecture detail route failed", error);
    return NextResponse.json(
      { error: "Unable to load this lecture right now." },
      { status: 500 },
    );
  }
}
