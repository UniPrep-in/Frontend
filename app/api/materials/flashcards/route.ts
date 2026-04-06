import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getCachedFlashcardsSearchPage,
  getUserFlashcards,
  type Flashcard,
} from "@/lib/materials-data";

type CreateFlashcardBody = {
  word?: string;
  meaning?: string;
  type?: string;
  hook?: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
};

function normalizeArray(values?: string[]) {
  const normalized = (values ?? [])
    .map((value) => value.trim())
    .filter(Boolean);

  return normalized.length > 0 ? normalized : null;
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") ?? "search";

    if (mode === "mine") {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          { error: "Please sign in to view your flashcards." },
          { status: 401 },
        );
      }

      const cards = await getUserFlashcards(supabase, user.id);
      return NextResponse.json({ cards });
    }

    const pageParam = Number(searchParams.get("page") ?? "0");
    const page = Number.isInteger(pageParam) && pageParam >= 0 ? pageParam : 0;
    const data = await getCachedFlashcardsSearchPage(page);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load flashcards", error);
    return NextResponse.json(
      { error: "Unable to load flashcards right now." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please sign in to add a flashcard." },
        { status: 401 },
      );
    }

    const body = (await req.json()) as CreateFlashcardBody;
    const word = body.word?.trim();
    const meaning = body.meaning?.trim();

    if (!word || !meaning) {
      return NextResponse.json(
        { error: "Word and meaning are required." },
        { status: 400 },
      );
    }

    const insertPayload = {
      word,
      meaning,
      type: body.type?.trim() || null,
      hook: body.hook?.trim() || null,
      example: body.example?.trim() || null,
      synonyms: normalizeArray(body.synonyms),
      antonyms: normalizeArray(body.antonyms),
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from("flash_cards")
      .insert(insertPayload)
      .select("word, meaning, type, synonyms, antonyms, hook, example, user_id")
      .single();

    if (error) {
      throw error;
    }

    const card = {
      word: data.word,
      meaning: data.meaning,
      type: data.type ?? undefined,
      synonyms: data.synonyms ?? undefined,
      antonyms: data.antonyms ?? undefined,
      hook: data.hook ?? undefined,
      example: data.example ?? undefined,
      user_id: data.user_id,
    } satisfies Flashcard;

    return NextResponse.json({ card });
  } catch (error) {
    console.error("Failed to create flashcard", error);
    return NextResponse.json(
      { error: "Unable to add flashcard right now." },
      { status: 500 },
    );
  }
}
