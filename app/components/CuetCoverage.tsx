"use client";
import { motion, useInView, Variants } from "framer-motion";
import { useRef } from "react";
import { FaGlobeAmericas, FaLanguage, FaListUl, FaHistory, FaCheckCircle } from "react-icons/fa";
import Link from "next/link";

const coverageItems = [
    {
        title: "Domain Subjects",
        icon: <FaGlobeAmericas className="text-blue-600 text-3xl" />,
        description: "Complete syllabus coverage for Science, Commerce & Humanities.",
    },
    {
        title: "English Language",
        icon: <FaLanguage className="text-indigo-600 text-3xl" />,
        description: "Vocabulary, Grammar & Reading Comprehension mastery.",
    },
    {
        title: "General Test (GAT)",
        icon: <FaListUl className="text-blue-600 text-3xl" />,
        description: "Quantitative Aptitude, Logical Reasoning & General Awareness.",
    },
    {
        title: "Previous Year Questions",
        icon: <FaHistory className="text-indigo-600 text-3xl" />,
        description: "Real questions from 2022, 2023, and 2024 CUET papers.",
    },
    {
        title: "Structured Mock Series",
        icon: <FaCheckCircle className="text-blue-600 text-3xl" />,
        description: "Subject-wise and Full-length mocks based on latest NTA pattern.",
    },
];

// Domino-like cascade variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15, // Delay between each card (domino effect)
            delayChildren: 0.1,
        },
    },
};

const cardVariants: Variants = {
    hidden: { 
        opacity: 0, 
        y: 60,
        rotateX: -15,
        scale: 0.9,
    },
    visible: {
        opacity: 1,
        y: 0,
        rotateX: 0,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 12,
            mass: 0.8,
        },
    },
};

const ctaVariants: Variants = {
    hidden: { 
        opacity: 0, 
        y: 60, 
        scale: 0.9,
        rotateX: -15,
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 12,
            delay: 0.3, // Slight delay after last card
        },
    },
};

export default function CuetCoverage() {
    const sectionRef = useRef<HTMLElement>(null);
    const isInView = useInView(sectionRef, { 
        once: true, // Only animate once
        amount: 0.2, // Trigger when 20% visible
        margin: "-50px", // Start slightly before
    });

    return (
        <section 
            ref={sectionRef}
            className="py-20 bg-gray-50/50 overflow-hidden"
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div 
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <h2 className="text-blue-600 font-bold tracking-wider uppercase text-sm mb-4">
                        All-in-One Prep
                    </h2>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6">
                        Complete CUET Coverage
                    </h1>
                    <p className="text-xl text-gray-600 font-medium">
                        Everything in one place.
                    </p>
                </motion.div>

                {/* Coverage Grid with Domino Effect */}
                <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate={isInView ? "visible" : "hidden"}
                >
                    {coverageItems.map((item, index) => (
                        <motion.div
                            key={index}
                            variants={cardVariants}
                            whileHover={{ 
                                y: -8, 
                                scale: 1.02,
                                transition: { duration: 0.3, ease: "easeOut" }
                            }}
                            className={`bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-300 group perspective-1000 ${
                                index === coverageItems.length - 1 ? "md:col-span-2 lg:col-span-1" : ""
                            }`}
                            style={{ transformStyle: "preserve-3d" }}
                        >
                            <motion.div 
                                className="p-4 rounded-2xl bg-gray-50 group-hover:bg-blue-50 w-fit transition-colors mb-6"
                                whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
                            >
                                {item.icon}
                            </motion.div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{item.description}</p>
                        </motion.div>
                    ))}

                    {/* Custom CTA Card - Also part of domino */}
                    <motion.div 
                        variants={ctaVariants}
                        whileHover={{ 
                            scale: 1.05,
                            transition: { duration: 0.3 }
                        }}
                        className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-xl flex flex-col justify-center items-center text-center text-white lg:col-span-1"
                    >
                        <h3 className="text-2xl font-bold mb-4">Ready to start?</h3>
                        <p className="opacity-90 mb-6">Get access to all subjects and mocks instantly.</p>
                        <Link 
                            href="/auth" 
                            className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold hover:bg-opacity-90 transition-all shadow-lg text-center block w-fit transform hover:scale-105 active:scale-95"
                        >
                            Enroll Now
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}