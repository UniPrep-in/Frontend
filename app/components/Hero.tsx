"use client"
import {
  TiStarFullOutline,
  TiStarHalfOutline,
} from "react-icons/ti";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Hero() {
  const logoRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // GSAP floating animation for logos
    logoRefs.current.forEach((logo, index) => {
      if (!logo) return;
      
      // Random floating animation with different delays
      gsap.to(logo, {
        y: "random(-20, 20)",
        x: "random(-15, 15)",
        rotation: "random(-5, 5)",
        duration: "random(3, 5)",
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: index * 0.5,
      });

      // Subtle scale pulse
      gsap.to(logo, {
        scale: 1.05,
        duration: 2,
        ease: "power1.inOut",
        repeat: -1,
        yoyo: true,
        delay: index * 0.3,
      });
    });

    return () => {
      logoRefs.current.forEach((logo) => {
        if (logo) gsap.killTweensOf(logo);
      });
    };
  }, []);

  const logos = [
    { src: "/logos/du.png", alt: "DU", className: "top-20 left-8 md:top-24 md:left-20 w-24 md:w-24" },
    { src: "/logos/jnu.png", alt: "JNU", className: "bottom-32 right-8 md:bottom-40 md:right-24 w-18 md:w-18" },
    { src: "/logos/srcc.png", alt: "SRCC", className: "top-1/3 right-12 md:top-1/3 md:right-40 w-0 md:w-32" },
    { src: "/logos/st.png", alt: "ST", className: "bottom-24 left-12 md:bottom-32 md:left-32 w-24 md:w-24" },
  ];

  return (
    <main className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Modern gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-white to-indigo-50" />

      {/* Animated mesh gradient blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-100/20 to-indigo-100/20 rounded-full blur-3xl" />

      {/* Floating university logos with glass effect - GSAP animated */}
      <div className="absolute inset-0 pointer-events-none">
        {logos.map((logo, index) => (
          <div
            key={logo.alt}
            ref={(el) => { logoRefs.current[index] = el; }}
            className={`absolute ${logo.className} p-3 md:p-4`}
          >
            <div className="relative group">
              {/* Glass morphism effect */}
              <div className="absolute inset-0 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg transform transition-transform duration-500 group-hover:scale-110" />
              <img 
                src={logo.src} 
                className="relative z-10 w-full h-auto opacity-70 group-hover:opacity-100 transition-opacity duration-300" 
                alt={logo.alt} 
              />
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col gap-6 md:gap-8 justify-center items-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

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
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
            Crack CUET with
          </span>
          <br />
          <span className="relative inline-block mt-2">
            <span className="relative z-10 bg-clip-text text-transparent bg-linear-to-r from-blue-500 to-blue-600">
              Smart Practice
            </span>
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-orange-300 -z-0" viewBox="0 0 100 10" preserveAspectRatio="none">
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