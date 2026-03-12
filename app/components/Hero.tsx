"use client"
import {
  TiStarFullOutline,
  TiStarHalfOutline,
} from "react-icons/ti";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

export default function Hero() {

  return (
    <main className="relative w-full sm:min-h-[80vh] min-h-screen flex items-center justify-center overflow-hidden">
      <Image
        src="/bg/man.png"
        alt="Bottom Left Decoration"
        width={300}
        height={300}
        className="absolute bottom-0 left-0 w-64 h-64 sm:w-32 sm:h-32 md:w-84 md:h-84 object-contain"
      />
      <Image
        src="/bg/women.png"
        alt="Bottom Right Decoration"
        width={300}
        height={300}
        className="absolute bottom-0 right-0 w-24 h-24 sm:w-32 sm:h-32 md:w-88 md:h-88 object-contain hidden sm:block"
      />
      <div className="relative z-10 flex flex-col gap-6 md:gap-8 justify-center items-center max-w-4xl mx-auto px-6 sm:px-8 lg:px-10 py-12 rounded-2xl">
        {/* Modern Rating Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-0.5">
            {[...Array(4)].map((_, i) => (
              <TiStarFullOutline key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
            ))}
            <TiStarHalfOutline className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <span className="text-sm font-semibold text-gray-900">4.5</span>
          <span className="text-sm text-gray-500">•</span>
          <span className="text-sm text-gray-500">25k+ reviews</span>
        </motion.div>

        {/* Modern Headline with gradient text */}
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-center leading-[1.1] tracking-tight"
        >
          <span className="bg-clip-text text-transparent font-bold bg-linear-to-r from-gray-900 via-gray-800 to-gray-900">
            Crack CUET with
          </span>
          <br />
          <span className="relative inline-block mt-2">
            <span className="relative z-10 bg-clip-text text-transparent bg-linear-to-r from-blue-700 to-blue-800">
              Smart Practice
            </span>
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-orange-300 z-0" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
            </svg>
          </span>
        </motion.h1>

        {/* Modern Subheadline */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="max-w-2xl text-lg md:text-xl text-center text-black leading-relaxed"
        >
          Mocks. AI Analysis. Ranker Mentorship. Preference Filling.
        </motion.p>

        {/* Modern CTA Buttons with Framer Motion fade from background */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ 
            duration: 0.8, 
            delay: 0.4, 
            ease: [0.25, 0.46, 0.45, 0.94] 
          }}
          className="flex flex-col items-center gap-4"
        >
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
            <Link
              href="/mock-tests"
              className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white transition-all duration-300 bg-gray-900 rounded-full hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 overflow-hidden"
            >
              {/* Animated shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2, 
                  ease: "linear",
                  repeatDelay: 3 
                }}
              />
              <span className="relative z-10">Start Free Mock</span>
              <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}