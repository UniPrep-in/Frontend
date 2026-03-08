"use client";
import { motion, useInView, Variants } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

const leftLines = [
  {
    title: "Unlimited Resources",
    comment: "Discover a treasure trove of courses, tools, and resources.",
  },
  {
    title: "Diverse Course Library",
    comment: "Learn about hundreds of topics across multiple domains.",
  },
  {
    title: "Schedule-flexible",
    comment: "Learn at your own pace with 24/7 access to all courses and materials.",
  },
];

const rightLines = [
  {
    title: "50+ Expert Instructors",
    comment: "Each instructor on our platform has years of experience.",
  },
  {
    title: "Industry Certificates",
    comment: "Enhance your career prospects with recognized certifications.",
  },
  {
    title: "Dedicated Support",
    comment: "Get assistance whenever you need it with our responsive support team.",
  },
];

// Container orchestrates the dispersal
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

// Points start behind center, then disperse outward
const leftPointVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: 0, // Start at center
    scale: 0.5,
    filter: "blur(10px)",
  },
  visible: (i: number) => ({
    opacity: 1,
    x: 0, // End at natural position (CSS handles layout)
    scale: 1,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.15,
      duration: 0.8,
      type: "spring",
      stiffness: 60,
      damping: 15,
    },
  }),
};

const rightPointVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: 0, // Start at center
    scale: 0.5,
    filter: "blur(10px)",
  },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.15 + 0.1, // Slight offset from left
      duration: 0.8,
      type: "spring",
      stiffness: 60,
      damping: 15,
    },
  }),
};

const imageVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    rotate: -10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 1,
      ease: [0.34, 1.56, 0.64, 1], // Back-out easing
    },
  },
};

const titleVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export default function Usp() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { 
    once: true, 
    amount: 0.3,
    margin: "-100px",
  });

  return (
    <motion.main 
      ref={sectionRef}
      className="min-h-screen py-12 bg-white rounded-t-4xl border-t border-neutral-200 overflow-hidden"
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      {/* Title */}
      <motion.div 
        className="flex justify-center items-center mb-16"
        variants={titleVariants}
      >
        <h1 className="max-w-xl text-center text-6xl text-black">
          Steady progress, endless potential
        </h1>
      </motion.div>

      <div className="flex items-center justify-center p-8 lg:p-16">
        <div className="max-w-6xl w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16 items-center relative">
            
            {/* Left Column - Disperses from center */}
            <motion.div 
              className="space-y-10 relative z-10"
              variants={containerVariants}
            >
              {leftLines.map((item, i) => (
                <motion.div 
                  key={item.title} 
                  className="text-left origin-right"
                  custom={i}
                  variants={leftPointVariants}
                  whileHover={{ 
                    x: -10, 
                    transition: { duration: 0.3 } 
                  }}
                >
                  <h3 className="text-2xl text-black mb-2 font-semibold">
                    {item.title}
                  </h3>
                  <p className="text-neutral-800 leading-relaxed">
                    {item.comment}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            {/* Center Image - Fades in first, then points disperse */}
            <motion.div 
              className="flex justify-center items-center order-first lg:order-none relative"
              variants={imageVariants}
            >
              <motion.div 
                className="relative w-full max-w-sm aspect-square rounded-full border border-neutral-300 shadow-2xl"
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.4 }
                }}
              >
                <Image
                  src="/assets/usp.avif"
                  alt="Platform Preview"
                  fill
                  className="object-cover rounded-full p-4"
                  priority
                />
              </motion.div>
            </motion.div>

            {/* Right Column - Disperses from center */}
            <motion.div 
              className="space-y-10 relative z-10"
              variants={containerVariants}
            >
              {rightLines.map((item, i) => (
                <motion.div 
                  key={item.title} 
                  className="text-right origin-left"
                  custom={i}
                  variants={rightPointVariants}
                  whileHover={{ 
                    x: 10, 
                    transition: { duration: 0.3 } 
                  }}
                >
                  <h3 className="text-2xl text-black mb-2 font-semibold">
                    {item.title}
                  </h3>
                  <p className="text-neutral-800 leading-relaxed">
                    {item.comment}
                  </p>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </div>
      </div>
    </motion.main>
  );
}