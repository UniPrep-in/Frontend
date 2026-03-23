import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const stream = searchParams.get("stream");
  const subject = searchParams.get("subject");
  const page = Number(searchParams.get("page") || "1");

  const PAGE_SIZE = 6;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let query = supabase
    .from("tests")
    .select("*", { count: "exact" });

  // ✅ Only allow your streams
  if (stream && ["GAT", "English", "Commerce", "Arts"].includes(stream)) {
    query = query.eq("stream", stream);
  }

  if (subject) {
    query = query.eq("subject", subject);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    tests: data,
    totalPages: Math.ceil((count || 0) / PAGE_SIZE),
    currentPage: page,
    totalCount: count || 0,
  });
}