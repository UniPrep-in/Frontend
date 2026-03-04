import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";
import Navbar from "../components/ui/Navbar";
import Footer from "../components/Footer";

const PAGE_SIZE = 6;

export default async function MockTestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; exam?: string; domain?: string }>;
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

  const selectedExam = resolvedSearchParams?.exam || "all";
  const selectedDomain = resolvedSearchParams?.domain || "all";
  const currentPage = Number(resolvedSearchParams?.page) || 1;
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("tests")
    .select("*", { count: "exact" })
    .order("year", { ascending: false });

  if (selectedExam !== "all") {
    query = query.ilike("title", `%${selectedExam}%`);
  }

  const { data: tests, count } = await query.range(from, to);

  const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 1;

  return (
    <main>
      <div>
        <Navbar />
      </div>
      <div className="p-8">
      {/* Domain + Subject Filter */}
      {(() => {
        const domainSubjects: Record<string, string[]> = {
          Science: ["physics", "chemistry", "biology", "maths"],
          Humanities: ["history", "polity", "geography", "economics"],
          Commerce: ["accountancy", "business", "economics", "maths"],
          English: ["Grammar", "Comprehension"],
          GAT: ["reasoning", "current affairs", "quantitative aptitude"],
        };

        const subjects =
          selectedDomain !== "all" && domainSubjects[selectedDomain]
            ? domainSubjects[selectedDomain]
            : [];

        return (
          <>
            {/* Domain Filter */}
            <div className="flex gap-4 mb-4 flex-wrap">
              {["all", ...Object.keys(domainSubjects)].map((domain) => (
                <Link
                  key={domain}
                  href={`/mock-tests?domain=${domain}`}
                  className={`px-4 py-2 rounded-full border ${
                    selectedDomain === domain
                      ? "bg-black text-white"
                      : "bg-gray-200 text-black"
                  }`}
                >
                  {domain}
                </Link>
              ))}
            </div>

            {/* Subject Filter (only if domain selected) */}
            {selectedDomain !== "all" && (
              <div className="flex gap-4 mb-6 flex-wrap">
                {subjects.map((subject) => (
                  <Link
                    key={subject}
                    href={`/mock-tests?domain=${selectedDomain}&exam=${subject}`}
                    className={`px-4 py-2 rounded-full border ${
                      selectedExam === subject
                        ? "bg-blue-500 text-white"
                        : "bg-neutral-200 text-black"
                    }`}
                  >
                    {subject.charAt(0).toUpperCase() + subject.slice(1)}
                  </Link>
                ))}
              </div>
            )}
          </>
        );
      })()}
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
            href={`/mock-tests?page=${i + 1}&exam=${selectedExam}`}
            className={`px-3 py-1 border rounded-full ${
              currentPage === i + 1
                ? "bg-blue-500 text-white"
                : "bg-neutral-400 text-black"
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