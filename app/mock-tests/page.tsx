import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import Navbar from "../components/ui/Navbar";
import Footer from "../components/Footer";

const PAGE_SIZE = 6;

export default async function MockTestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // No-op (not needed here)
        },
      },
    }
  );

  const currentPage = Number(resolvedSearchParams?.page) || 1;
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: tests, count } = await supabase
    .from("tests")
    .select("*", { count: "exact" })
    .order("year", { ascending: false })
    .range(from, to);

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

  return (
    <main>
      <div>
        <Navbar />
      </div>
      <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests?.map((test) => (
          <div
            key={test.id}
            className="border rounded-lg p-4 shadow-sm hover:shadow-md transition"
          >
            <h2 className="text-lg font-semibold">{test.title}</h2>
            <p className="text-sm text-gray-500">
              Duration: {test.duration_minutes} mins
            </p>
            <p className="text-sm text-gray-500">
              Total Marks: {test.total_marks}
            </p>

            <Link
              href={`/mock-tests/${test.id}`}
              className="inline-block mt-4 px-4 py-2 bg-black text-white rounded-md"
            >
              Start Test
            </Link>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-8 gap-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <Link
            key={i}
            href={`/mock-tests?page=${i + 1}`}
            className={`px-3 py-1 border rounded-md ${
              currentPage === i + 1
                ? "bg-black text-white"
                : "bg-white text-black"
            }`}
          >
            {i + 1}
          </Link>
        ))}
      </div>
    </div>

    <div>
      <Footer />
    </div>
    </main>
  );
}