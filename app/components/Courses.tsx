import Link from "next/link";
import { getFeaturedMocks } from "@/lib/mock-tests";
import { HiOutlineClock } from "react-icons/hi2";

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
              <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-black transition">
                {mock.title}
              </h3>

              <div className="flex justify-between items-center mt-6">
                <span className="text-white text-sm px-4 py-2 rounded-full flex gap-1 items-center justify-center bg-black">
                  <HiOutlineClock className="text-lg" /> {mock.duration_minutes} mins
                </span>
                <span className="text-black">
                  {mock.total_marks} Marks
                </span>
              </div>

              <div className="p-4 my-6 bg-neutral-50 shadow-md border border-neutral-200 rounded-xl">
                <ul className="text-black list-disc text-sm m-2">
                  <li>Each question carries 5 marks.</li>
                  <li>Negative marking applies where specified.</li>
                  <li>Test will auto-submit when time expires.</li>
                  <li>Do not refresh or close the browser during the test.</li>
                </ul>
              </div>

              <div className="ext-sm flex w-fit px-4 py-2 rounded-full font-medium text-white bg-linear-to-br from-blue-400 to-blue-600 hover:shadow-xl hover:scale-110 duration-300">
                Start Now
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
