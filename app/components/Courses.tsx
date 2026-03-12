import Link from "next/link";
import { getFeaturedMocks } from "@/lib/mock-tests";
import { GoArrowUpRight } from "react-icons/go";

export default async function Courses() {
  const featuredMocks = await getFeaturedMocks(3);

  return (
    <section className="relative py-20 bg-linear-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-14 gap-8">
          <div>
            <h2 className="text-4xl md:text-5xl text-black mb-4">
              Practice with Real Mock Tests
            </h2>
            <p className="text-lg text-neutral-800 max-w-2xl">
              Full-length exam simulations designed to mirror the real CUET
              experience. Track performance, analyze results, and improve with
              structured practice.
            </p>
          </div>

          <Link
            href="/mock-tests"
            className="px-8 py-4 text-lg bg-linear-to-br from-blue-400 to-blue-600 text-white rounded-full shadow-lg hover:shadow-2xl hover:scale-105 transition"
          >
            View Mocks
          </Link>
        </div>

        {/* Mock Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredMocks.map((mock) => (
            <Link
              key={mock.id}
              href={`/mock-tests/${mock.id}`}
              className="group relative bg-white rounded-2xl p-8 border border-neutral-200 shadow-xl hover:shadow-xl transition duration-300"
            >
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-black transition">
                {mock.title}
              </h3>

              <span className="flex justify-center items-center border-b mb-4 mt-2 text-md text-sm py-6">
                  The test is of {mock.duration_minutes} minutes and is of {mock.total_marks} Marks
              </span>

              <div className="text-sm flex items-center justify-center gap-2 w-fit px-4 py-2 rounded-xl font-medium text-white bg-linear-to-br from-black via-neutral-700 to-black hover:shadow-xl hover:scale-110 duration-300">
                Start Now <GoArrowUpRight className="text-lg" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
