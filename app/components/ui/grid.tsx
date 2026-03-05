"use client";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import Image from "next/image";
import { FaFaceSmileBeam, FaGraduationCap } from "react-icons/fa6";

const capsules = [
  "Happy Students",
  "24/7 Availability",
  "Best Mentors",
  "Learning",
  "Analytics",
];

export default function Grid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    gsap.fromTo(
      pillsRef.current,
      {
        y: -80,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        stagger: 0.15,
        duration: 1,
        ease: "power3.out",
      }
    );
  }, []);

  return (
    <main className="flex flex-col gap-4 md:gap-6 w-full px-4 sm:px-6 lg:px-0">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-6 w-full">
        
        {/* Left Column - Stats & Avatar Stack */}
        <div className="flex flex-col gap-4 md:gap-6 w-full lg:col-span-2 order-2 lg:order-1">
          {/* Top Row - Two Small Cards */}
          <div className="flex gap-4 md:gap-6 items-stretch">
            <div className="flex flex-col items-center justify-center bg-linear-to-br from-blue-200 to-blue-300 shadow-lg rounded-2xl p-4 md:p-6 flex-1 min-w-0">
              <span className="text-3xl md:text-5xl">
                <FaFaceSmileBeam className="text-black" />
              </span>
              <p className="mt-2 text-center text-sm md:text-lg text-black">
                100+ Happy Students
              </p>
            </div>

            <div className="flex flex-col items-center justify-center bg-linear-to-br from-purple-200 to-purple-300 shadow-lg rounded-2xl p-4 md:p-6 flex-1 min-w-0">
              <span className="text-3xl md:text-5xl">
                <FaGraduationCap className="text-black" />
              </span>
              <p className="mt-2 text-sm md:text-lg text-center text-black">
                50+ Expert Mentors
              </p>
            </div>
          </div>

          {/* Avatar Stack Card */}
          <div className="bg-linear-to-br shadow-lg from-orange-200 to-orange-300 min-h-[200px] md:min-h-[264px] lg:h-[40vh] rounded-2xl flex flex-col justify-between p-4 md:p-6">
            {/* Avatar Stack */}
            <div className="flex -space-x-2 md:-space-x-3 overflow-hidden">
              {[
                "https://i.pravatar.cc/100?img=1",
                "https://i.pravatar.cc/100?img=2",
                "https://i.pravatar.cc/100?img=3",
                "https://i.pravatar.cc/100?img=4",
                "https://i.pravatar.cc/100?img=5",
                "https://i.pravatar.cc/100?img=7",
              ].map((src, i) => (
                <img
                  key={i}
                  width={48}
                  height={48}
                  src={src}
                  alt="user avatar"
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-orange-300 object-cover flex-shrink-0"
                />
              ))}
            </div>

            <div className="flex flex-col gap-1 md:gap-2 mt-4">
              <h1 className="text-black text-4xl md:text-6xl font-semibold">50+</h1>
              <span className="text-lg md:text-xl text-black">Worldwide Students</span>
            </div>
          </div>
        </div>

        {/* Center Column - Ken Burns Slideshow */}
        <div className="relative h-[40vh] md:h-[50vh] lg:h-[65vh] shadow-lg w-full overflow-hidden rounded-2xl lg:col-span-2 order-1 lg:order-2">
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
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </motion.div>
          ))}
        </div>

        {/* Right Column - Accuracy & Capsules */}
        <div className="flex flex-col gap-4 md:gap-6 lg:col-span-2 order-3">
          {/* Accuracy Circle Card */}
          <div className="h-auto md:h-[36vh] min-h-[250px] flex flex-col justify-center items-center bg-linear-to-br shadow-lg from-green-200 to-green-300 rounded-2xl relative overflow-hidden p-6">
            {/* Circular Accuracy Graph */}
            <div className="relative w-32 h-32 md:w-40 md:h-40">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {/* Background Circle */}
                <path
                  d="M18 2.0845
                     a 15.9155 15.9155 0 0 1 0 31.831
                     a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#bfdbfe"
                  strokeWidth="3"
                />

                {/* Progress Circle */}
                <path
                  d="M18 2.0845
                     a 15.9155 15.9155 0 0 1 0 31.831
                     a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="100, 100"
                />
              </svg>

              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <h1 className="text-3xl md:text-4xl font-bold text-black">100%</h1>
                <p className="text-xs md:text-sm text-black">Accuracy</p>
              </div>
            </div>

            {/* Subtitle */}
            <p className="mt-4 text-lg md:text-xl text-black text-center">Over Subjects Covered</p>
          </div>

          {/* Capsules Card */}
          <div className="h-auto md:h-[26vh] min-h-[180px] shadow-lg bg-linear-to-br from-yellow-200 to-yellow-300 rounded-2xl p-4 md:p-6 flex flex-col gap-4">
            <h1 className="text-lg md:text-xl text-black">Learn & Prepare</h1>

            {/* Capsule area */}
            <div
              ref={containerRef}
              className="relative flex flex-wrap gap-2 md:gap-3 mt-auto"
            >
              {capsules.map((text, i) => (
                <motion.div
                  key={text}
                  ref={(el) => {
                    if (el) pillsRef.current[i] = el;
                  }}
                  className="bg-white backdrop-blur px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs text-black"
                >
                  {text}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}