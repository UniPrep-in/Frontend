"use client";
import { motion, Variants, useInView } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
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

// Custom back-out like easing using cubic bezier
const backOutEasing = [0.34, 1.56, 0.64, 1];

const cardVariants: Variants = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 15,
      mass: 0.8 
    }
  },
  tap: { 
    scale: 0.98,
    transition: { duration: 0.1 }
  },
};

// Hook for intersection observer with fallback
function useOptimizedInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || hasAnimated.current) return;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          setIsInView(true);
          hasAnimated.current = true;
          // Disconnect after first trigger to save resources
          observer.disconnect();
        }
      },
      { 
        threshold,
        rootMargin: "50px" // Start slightly before visible
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

export default function Grid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<(HTMLDivElement | null)[]>([]);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const slideshowRef = useRef<HTMLDivElement>(null);
  const gsapContextRef = useRef<gsap.Context | null>(null);
  
  const { ref: sectionRef, isInView } = useOptimizedInView(0.1);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check reduced motion once on mount
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // GSAP animations - only run when in view
  useEffect(() => {
    if (!isInView || prefersReducedMotion) return;

    // Kill any existing context
    if (gsapContextRef.current) {
      gsapContextRef.current.revert();
    }

    const ctx = gsap.context(() => {
      // Cards bubble animation
      gsap.fromTo(
        cardsRef.current.filter(Boolean),
        { y: 60, opacity: 0, scale: 0.85 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          stagger: { each: 0.12, from: "start", ease: "power2.out" },
          ease: "back.out(1.4)",
          clearProps: "transform",
        }
      );

      // Slideshow
      if (slideshowRef.current) {
        gsap.fromTo(
          slideshowRef.current,
          { y: 80, opacity: 0, scale: 0.9 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1,
            delay: 0.2,
            ease: "back.out(1.2)",
            clearProps: "transform",
          }
        );
      }

      // Pills
      gsap.fromTo(
        pillsRef.current.filter(Boolean),
        { y: 30, opacity: 0, scale: 0.8 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: { each: 0.08, from: "random" },
          duration: 0.6,
          delay: 0.6,
          ease: "back.out(2)",
          clearProps: "transform",
        }
      );
    }, containerRef);

    gsapContextRef.current = ctx;

    return () => {
      ctx.revert();
      gsapContextRef.current = null;
    };
  }, [isInView, prefersReducedMotion]);

  // Memoized avatar data to prevent re-renders
  const avatarUrls = useRef([
    "https://i.pravatar.cc/100?img=1",
    "https://i.pravatar.cc/100?img=2",
    "https://i.pravatar.cc/100?img=3",
    "https://i.pravatar.cc/100?img=4",
    "https://i.pravatar.cc/100?img=5",
    "https://i.pravatar.cc/100?img=7",
  ]);

  // Static initial states for reduced motion
  const staticInitial = { opacity: 1, y: 0, scale: 1, rotate: 0 };
  const hiddenInitial = { opacity: 0, y: 20, scale: 0, x: -20, rotate: -180 };

  return (
    <main 
      ref={sectionRef}
      className="flex flex-col gap-4 md:gap-6 w-full px-4 sm:px-6 lg:px-0"
    >
      <div 
        ref={containerRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 md:gap-6 w-full"
      >
        
        <div className="flex flex-col gap-4 md:gap-6 w-full lg:col-span-2 order-2 lg:order-1">
          <div className="flex gap-4 md:gap-6 items-stretch">
            <motion.div
              ref={(el) => { cardsRef.current[0] = el; }}
              initial="rest"
              whileHover={prefersReducedMotion ? undefined : "hover"}
              whileTap={prefersReducedMotion ? undefined : "tap"}
              variants={cardVariants}
              className="flex flex-col items-center justify-center bg-linear-to-br from-blue-200 to-blue-300 shadow-lg rounded-2xl p-4 md:p-6 flex-1 min-w-0 will-change-transform"
            >
              <span className="text-3xl md:text-5xl">
                <FaFaceSmileBeam className="text-black" />
              </span>
              <p className="mt-2 text-center text-sm md:text-lg text-black">
                100+ Happy Students
              </p>
            </motion.div>

            <motion.div
              ref={(el) => { cardsRef.current[1] = el; }}
              initial="rest"
              whileHover={prefersReducedMotion ? undefined : "hover"}
              whileTap={prefersReducedMotion ? undefined : "tap"}
              variants={cardVariants}
              className="flex flex-col items-center justify-center bg-linear-to-br from-purple-200 to-purple-300 shadow-lg rounded-2xl p-4 md:p-6 flex-1 min-w-0 will-change-transform"
            >
              <span className="text-3xl md:text-5xl">
                <FaGraduationCap className="text-black" />
              </span>
              <p className="mt-2 text-sm md:text-lg text-center text-black">
                50+ Expert Mentors
              </p>
            </motion.div>
          </div>

          <motion.div
            ref={(el) => { cardsRef.current[2] = el; }}
            initial="rest"
            whileHover={prefersReducedMotion ? undefined : "hover"}
            whileTap={prefersReducedMotion ? undefined : "tap"}
            variants={cardVariants}
            className="bg-linear-to-br shadow-lg from-orange-200 to-orange-300 min-h-[200px] md:min-h-[264px] lg:h-[40vh] rounded-2xl flex flex-col justify-between p-4 md:p-6 will-change-transform"
          >
            <div className="flex -space-x-2 md:-space-x-3 overflow-hidden">
              {avatarUrls.current.map((src, i) => (
                <motion.img
                  key={i}
                  src={src}
                  alt="user avatar"
                  width={48}
                  height={48}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-orange-300 object-cover flex-shrink-0"
                  initial={prefersReducedMotion ? staticInitial : hiddenInitial}
                  animate={isInView && !prefersReducedMotion ? { 
                    opacity: 1, 
                    scale: 1, 
                    x: 0,
                    rotate: 0 
                  } : (prefersReducedMotion ? staticInitial : hiddenInitial)}
                  transition={{
                    delay: prefersReducedMotion ? 0 : 0.8 + i * 0.1,
                    duration: 0.4,
                    ease: backOutEasing,
                  }}
                  loading="lazy"
                />
              ))}
            </div>

            <div className="flex flex-col gap-1 md:gap-2 mt-4">
              <motion.h1 
                className="text-black text-4xl md:text-6xl font-semibold"
                initial={prefersReducedMotion ? staticInitial : { opacity: 0, y: 20 }}
                animate={isInView || prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ 
                  delay: prefersReducedMotion ? 0 : 1.2, 
                  duration: 0.5, 
                  ease: "easeOut" 
                }}
              >
                50+
              </motion.h1>
              <motion.span 
                className="text-lg md:text-xl text-black"
                initial={prefersReducedMotion ? staticInitial : { opacity: 0, y: 10 }}
                animate={isInView || prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ 
                  delay: prefersReducedMotion ? 0 : 1.3, 
                  duration: 0.5, 
                  ease: "easeOut" 
                }}
              >
                Worldwide Students
              </motion.span>
            </div>
          </motion.div>
        </div>

        <motion.div
          ref={slideshowRef}
          initial="rest"
          whileHover={prefersReducedMotion ? undefined : "hover"}
          whileTap={prefersReducedMotion ? undefined : "tap"}
          variants={cardVariants}
          className="relative h-[40vh] md:h-[50vh] lg:h-[65vh] shadow-lg w-full overflow-hidden rounded-2xl lg:col-span-2 order-1 lg:order-2 will-change-transform"
        >
          {[
            "/colleges/college1.webp",
            "/colleges/college2.jpeg",
            "/colleges/college3.jpeg",
          ].map((src, i) => (
            <motion.div
              key={src}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1 }}
              animate={isInView && !prefersReducedMotion ? {
                opacity: [0, 1, 1, 0],
                scale: [1, 1.12, 1.18, 1.2],
              } : (i === 0 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1 })}
              transition={prefersReducedMotion ? { duration: 0 } : {
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
                loading={i === 0 ? "eager" : "lazy"}
              />
            </motion.div>
          ))}
        </motion.div>

        <div className="flex flex-col gap-4 md:gap-6 lg:col-span-2 order-3">
          <motion.div
            ref={(el) => { cardsRef.current[3] = el; }}
            initial="rest"
            whileHover={prefersReducedMotion ? undefined : "hover"}
            whileTap={prefersReducedMotion ? undefined : "tap"}
            variants={cardVariants}
            className="h-auto md:h-[36vh] min-h-[250px] flex flex-col justify-center items-center bg-linear-to-br shadow-lg from-green-200 to-green-300 rounded-2xl relative overflow-hidden p-6 will-change-transform"
          >
            <motion.div 
              className="relative w-32 h-32 md:w-40 md:h-40"
              initial={prefersReducedMotion ? staticInitial : { scale: 0, rotate: -180 }}
              animate={isInView || prefersReducedMotion ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
              transition={{ 
                delay: prefersReducedMotion ? 0 : 0.4, 
                duration: 0.8, 
                ease: backOutEasing 
              }}
            >
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#bfdbfe"
                  strokeWidth="3"
                />
                <motion.path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={prefersReducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
                  animate={isInView || prefersReducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
                  transition={{ 
                    delay: prefersReducedMotion ? 0 : 0.8, 
                    duration: 1.2, 
                    ease: "easeOut" 
                  }}
                  strokeDasharray="100, 100"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <h1 className="text-3xl md:text-4xl font-bold text-black">100%</h1>
                <p className="text-xs md:text-sm text-black">Accuracy</p>
              </div>
            </motion.div>

            <motion.p 
              className="mt-4 text-lg md:text-xl text-black text-center"
              initial={prefersReducedMotion ? staticInitial : { opacity: 0, y: 10 }}
              animate={isInView || prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ 
                delay: prefersReducedMotion ? 0 : 1.4, 
                duration: 0.5, 
                ease: "easeOut" 
              }}
            >
              Over Subjects Covered
            </motion.p>
          </motion.div>

          <motion.div
            ref={(el) => { cardsRef.current[4] = el; }}
            initial="rest"
            whileHover={prefersReducedMotion ? undefined : "hover"}
            whileTap={prefersReducedMotion ? undefined : "tap"}
            variants={cardVariants}
            className="h-auto md:h-[26vh] min-h-[180px] shadow-lg bg-linear-to-br from-yellow-200 to-yellow-300 rounded-2xl p-4 md:p-6 flex flex-col gap-4 will-change-transform"
          >
            <motion.h1 
              className="text-lg md:text-xl text-black"
              initial={prefersReducedMotion ? staticInitial : { opacity: 0, x: -20 }}
              animate={isInView || prefersReducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ 
                delay: prefersReducedMotion ? 0 : 0.5, 
                duration: 0.5, 
                ease: "easeOut" 
              }}
            >
              Learn & Prepare
            </motion.h1>

            <div className="relative flex flex-wrap gap-2 md:gap-3 mt-auto">
              {capsules.map((text, i) => (
                <motion.div
                  key={text}
                  ref={(el) => { pillsRef.current[i] = el; }}
                  className="bg-white backdrop-blur px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs text-black cursor-default select-none"
                  whileHover={prefersReducedMotion ? undefined : { scale: 1.1, y: -2, transition: { duration: 0.2 } }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
                >
                  {text}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}