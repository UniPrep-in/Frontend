import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCachedNotesData } from "@/lib/materials-data";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please sign in to view notes." },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(req.url);
    const data = await getCachedNotesData({
      stream: searchParams.get("stream"),
      subject: searchParams.get("subject"),
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load notes", error);
    return NextResponse.json(
      { error: "Unable to load notes right now." },
      { status: 500 },
    );
  }
}
