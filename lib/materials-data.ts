import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export const FLASHCARDS_PAGE_SIZE = 5;

export type NoteSummary = {
  id: string;
  title: string;
  pdf_url: string;
  subject: string;
  stream: string;
};

export type NotesResponse = {
  notes: NoteSummary[];
  totalCount: number;
  availableStreams: string[];
  availableSubjects: string[];
};

export type Flashcard = {
  word: string;
  meaning: string;
  type?: string;
  synonyms?: string[];
  antonyms?: string[];
  hook?: string;
  example?: string;
  user_id?: string | null;
};

export type FlashcardsSearchPage = {
  cards: Flashcard[];
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

type NoteMetaRow = {
  stream: string | null;
  subject: string | null;
};

type NoteRow = {
  id: string;
  title: string;
  pdf_url: string;
  subject: string | null;
  stream: string | null;
};

type FlashcardRow = {
  word: string;
  meaning: string;
  type: string | null;
  synonyms: string[] | null;
  antonyms: string[] | null;
  hook: string | null;
  example: string | null;
  user_id?: string | null;
};

const NOTE_SELECT = "id, title, pdf_url, subject, stream";
const FLASHCARD_SELECT =
  "word, meaning, type, synonyms, antonyms, hook, example, user_id";

function normalizeFilterValue(value?: string | null) {
  return value && value !== "All" ? value : null;
}

function mapFlashcard(row: FlashcardRow): Flashcard {
  return {
    word: row.word,
    meaning: row.meaning,
    type: row.type ?? undefined,
    synonyms: row.synonyms ?? undefined,
    antonyms: row.antonyms ?? undefined,
    hook: row.hook ?? undefined,
    example: row.example ?? undefined,
    user_id: row.user_id ?? null,
  };
}

const getCachedNotesMetadata = unstable_cache(
  async () => {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("notes")
      .select("stream, subject");

    if (error || !data) {
      console.error("Failed to load notes metadata", error);
      return [] as NoteMetaRow[];
    }

    return data as NoteMetaRow[];
  },
  ["materials-notes-metadata"],
  { revalidate: 3600 },
);

export async function getNotesFilterOptions(selectedStream?: string | null) {
  const metadata = await getCachedNotesMetadata();
  const normalizedStream = normalizeFilterValue(selectedStream);

  const availableStreams = [
    "All",
    ...Array.from(
      new Set(metadata.map((row) => row.stream).filter(Boolean) as string[]),
    ).sort(),
  ];

  const availableSubjects = [
    "All",
    ...Array.from(
      new Set(
        metadata
          .filter((row) =>
            normalizedStream ? row.stream === normalizedStream : true,
          )
          .map((row) => row.subject)
          .filter(Boolean) as string[],
      ),
    ).sort(),
  ];

  return {
    availableStreams,
    availableSubjects,
  };
}

export async function getNotesData(
  supabase: SupabaseClient,
  filters: {
    stream?: string | null;
    subject?: string | null;
  } = {},
): Promise<NotesResponse> {
  const stream = normalizeFilterValue(filters.stream);
  const subject = normalizeFilterValue(filters.subject);
  let query = supabase.from("notes").select(NOTE_SELECT).order("title");

  if (stream) {
    query = query.eq("stream", stream);
  }

  if (subject) {
    query = query.eq("subject", subject);
  }

  const [{ data, error }, filterOptions] = await Promise.all([
    query,
    getNotesFilterOptions(stream),
  ]);

  if (error) {
    throw error;
  }

  const notes = ((data as NoteRow[] | null) ?? []).map((note) => ({
    id: note.id,
    title: note.title,
    pdf_url: note.pdf_url,
    subject: note.subject ?? "",
    stream: note.stream ?? "",
  }));

  return {
    notes,
    totalCount: notes.length,
    availableStreams: filterOptions.availableStreams,
    availableSubjects: filterOptions.availableSubjects,
  };
}

const getCachedNotesDataInternal = unstable_cache(
  async (stream: string | null, subject: string | null): Promise<NotesResponse> => {
    const adminSupabase = createAdminClient();
    return getNotesData(adminSupabase, { stream, subject });
  },
  ["materials-notes-data"],
  { revalidate: 300 },
);

export async function getCachedNotesData(filters: {
  stream?: string | null;
  subject?: string | null;
} = {}) {
  return getCachedNotesDataInternal(
    normalizeFilterValue(filters.stream),
    normalizeFilterValue(filters.subject),
  );
}

export async function getFlashcardsSearchPage(
  supabase: SupabaseClient,
  page: number,
  pageSize = FLASHCARDS_PAGE_SIZE,
): Promise<FlashcardsSearchPage> {
  const currentPage = Number.isInteger(page) && page >= 0 ? page : 0;
  const start = currentPage * pageSize;
  const end = start + pageSize;
  const { data, error } = await supabase
    .from("flash_cards")
    .select(FLASHCARD_SELECT)
    .order("word")
    .range(start, end);

  if (error) {
    throw error;
  }

  const rows = (data as FlashcardRow[] | null) ?? [];
  const hasNextPage = rows.length > pageSize;
  const cards = rows.slice(0, pageSize).map(mapFlashcard);

  return {
    cards,
    currentPage,
    hasNextPage,
    hasPrevPage: currentPage > 0,
  };
}

const getCachedFlashcardsSearchPageInternal = unstable_cache(
  async (page: number, pageSize: number) => {
    return getFlashcardsSearchPage(createAdminClient(), page, pageSize);
  },
  ["materials-flashcards-search-page"],
  { revalidate: 300 },
);

export async function getCachedFlashcardsSearchPage(page: number) {
  return getCachedFlashcardsSearchPageInternal(page, FLASHCARDS_PAGE_SIZE);
}

export async function getUserFlashcards(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("flash_cards")
    .select(FLASHCARD_SELECT)
    .eq("user_id", userId)
    .order("word");

  if (error) {
    throw error;
  }

  return ((data as FlashcardRow[] | null) ?? []).map(mapFlashcard);
}
