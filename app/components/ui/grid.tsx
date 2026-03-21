"use client";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { FaUsers, FaCirclePlay, FaBookOpen, FaGraduationCap, FaChartLine } from "react-icons/fa6";

export default function Grid() {
  return (
    <main className="flex flex-col w-full px-4 sm:px-6 lg:px-0 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
        
        {/* Left Column */}
        <div className="flex flex-col gap-4 md:gap-6 w-full h-full lg:h-156 order-1">
          {/* Blue Card - Student Reviews */}
          <div className="flex-1 flex flex-col items-center justify-center bg-linear-to-br from-blue-200 to-blue-300 shadow-lg rounded-2xl p-6 min-h-55">
            <FaUsers className="text-4xl text-black mb-3" />
            <h3 className="text-xl md:text-2xl font-bold text-black mb-2 text-center">
              Student Reviews
            </h3>
            <p className="text-center text-sm md:text-base text-black mb-5">
              See how students improved their CUET preparation with UniPrep.
            </p>
            <button
              onClick={() => {
                const el = document.getElementById("testimonials");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-black text-white px-5 py-2.5 rounded-full text-sm md:text-base font-semibold hover:bg-gray-800 transition-colors"
            >
              Read Reviews
            </button>
          </div>

          {/* Orange Card - Active Courses */}
          <div className="flex-1 flex flex-col items-center justify-center bg-linear-to-br from-orange-200 to-orange-300 shadow-lg rounded-2xl p-6 min-h-55">
            <FaCirclePlay className="text-4xl text-black mb-3" />
            <h3 className="text-xl md:text-2xl font-bold text-black mb-3 text-center">
              Your Active Courses
            </h3>
            <p className="text-center text-sm md:text-base text-black mb-6">
              Continue learning from your enrolled classes.
            </p>
          </div>
        </div>

        {/* Center Column */}
        <div className="flex flex-col gap-4 md:gap-6 w-full h-full lg:h-156 order-2 lg:order-2">
          {/* Image Slideshow (taller) */}
          <div className="relative shadow-lg w-full overflow-hidden rounded-2xl h-75 lg:h-100">
            {[
              "/colleges/college1.webp",
              "/colleges/college2.jpeg",
              "/colleges/college3.jpeg",
            ].map((src, i) => (
              <motion.div
                key={src}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [1, 1.12, 1.18, 1.2],
                }}
                transition={{
                  duration: 18,
                  repeat: Infinity,
                  delay: i * 6,
                  ease: "linear",
                }}
              >
                <Image
                  src={src}
                  alt="college image"
                  fill
                  className="object-cover object-center"
                  priority={i === 0}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 33vw, 33vw"
                />
              </motion.div>
            ))}
          </div>

          {/* Yellow Card - Study Materials (shorter) */}
          <div className="flex-1 flex flex-col items-center justify-center bg-linear-to-br from-yellow-200 to-yellow-300 shadow-lg rounded-2xl p-6 min-h-45">
            <FaBookOpen className="text-4xl text-black mb-3" />
            <h3 className="text-xl md:text-2xl font-bold text-black mb-2 text-center">
              Study Materials
            </h3>
            <p className="text-center text-sm md:text-base text-black mb-4">
              Quick notes, PYQs, and resources designed for CUET prep.
            </p>
            <Link
              href="/materials"
              className="bg-black text-white px-5 py-2.5 rounded-full text-sm md:text-base font-semibold hover:bg-gray-800 transition-colors"
            >
              Explore Materials
            </Link>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4 md:gap-6 w-full h-full lg:h-156 order-3">
          {/* Purple Card - Explore Courses */}
          <div className="flex-1 flex flex-col items-center justify-center bg-linear-to-br from-purple-200 to-purple-300 shadow-lg rounded-2xl p-6 min-h-55">
            <FaGraduationCap className="text-4xl text-black mb-3" />
            <h3 className="text-xl md:text-2xl font-bold text-black mb-2 text-center">
              Explore Courses
            </h3>
            <p className="text-center text-sm md:text-base text-black mb-5">
              Browse our CUET crash courses and live programs.
            </p>
            <button
              onClick={() => {
                const el = document.getElementById("pricing");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-black text-white px-5 py-2.5 rounded-full text-sm md:text-base font-semibold hover:bg-gray-800 transition-colors"
            >
              View Pricing
            </button>
          </div>

          {/* Green Card - Performance Analysis */}
          <div className="flex-1 flex flex-col items-center justify-center bg-linear-to-br from-green-200 to-green-300 shadow-lg rounded-2xl p-6 min-h-55">
            <FaChartLine className="text-4xl text-black mb-3" />
            <h3 className="text-xl md:text-2xl font-bold text-black mb-3 text-center">
              Performance Analysis
            </h3>
            <p className="text-center text-sm md:text-base text-black mb-6">
              Track accuracy, identify weak areas, and improve smarter.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}