import Link from "next/link";
import { getFeaturedMocks } from "@/lib/mock-tests";
import { GoArrowUpRight } from "react-icons/go";
import Image from "next/image";

export default async function Courses() {
  const featuredMocks = await getFeaturedMocks(3);

  const images = ["/assets/test/book.png", "/assets/test/book2.png", "/assets/test/book3.png"];

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
          {featuredMocks.map((mock, index) => (
            <Link
              key={mock.id}
              href={`/mock-tests/${mock.id}`}
              className="group relative bg-white rounded-2xl p-8 border border-neutral-200 shadow-xl hover:shadow-xl transition duration-300"
            >
              <div className="flex justify-between items-center">
                <div className="relative w-20 h-18 shadow-xl bg-neutral-100 border border-neutral-300 overflow-hidden rounded-full p-4">
                <Image
                  src={images[index % images.length]}
                  alt="mock thumbnail"
                  fill
                  className="object-contain"
                  sizes="(max-width: 150px) 8vw, 8vw"
                  priority={index === 0}
                />
              </div>
              <div className="text-lg w-full font-semibold flex items-center justify-center text-gray-900 group-hover:text-black transition">
                <span>{mock.title}</span>
              </div>
              </div>

              <span className="flex justify-center items-center border-b mb-4 mt-2 text-md text-sm py-6">
                  The test is of {mock.duration_minutes} minutes and is of {mock.total_marks} Marks
              </span>

            <div className="realative p-0.5 bg-linear-to-br from-emerald-500 to-blue-500 w-fit rounded-xl">
              <div className="text-sm flex items-center justify-center gap-2 w-fit p-4 rounded-xl font-medium text-white bg-linear-to-br from-black via-neutral-700 to-black hover:shadow-xl hover:scale-110 duration-300">
                Start Now <GoArrowUpRight className="text-lg" />
              </div>
            </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
