"use client";

import { FaUsers, FaUserTie, FaQuestionCircle, FaFileAlt } from "react-icons/fa";
import { motion, type Variants } from "framer-motion";

const stats = [
    {
        icon: <FaUsers className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />,
        value: "1000+",
        label: "CUET Aspirants",
    },
    {
        icon: <FaUserTie className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />,
        value: "50+",
        label: "Domain Mentors",
    },
    {
        icon: <FaQuestionCircle className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />,
        value: "10,000+",
        label: "Questions Practiced",
    },
    {
        icon: <FaFileAlt className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />,
        value: "Real",
        label: "CUET Pattern Mocks",
    },
];

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.2,
        },
    },
};

const itemVariants: Variants = {
    hidden: { 
        opacity: 0, 
        y: 40,
        scale: 0.95,
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94],
        },
    },
};

const iconVariants: Variants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
        scale: 1,
        rotate: 0,
        transition: {
            type: "spring" as const,
            stiffness: 200,
            damping: 15,
            delay: 0.1,
        },
    },
};

const numberVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: "easeOut",
        },
    },
};

export default function StatsStrip() {
    return (
        <motion.div 
            className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 mb-12 relative z-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
        >
            <motion.div 
                className="bg-white/70 backdrop-blur-xl border border-gray-100 rounded-3xl shadow-xl shadow-gray-200/50 p-6 md:p-8"
                initial={{ opacity: 0, y: 60, scale: 0.98 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            whileHover={{ 
                                y: -8, 
                                transition: { duration: 0.3, ease: "easeOut" } 
                            }}
                            className={`flex flex-col items-center justify-center text-center p-4 rounded-2xl transition-colors duration-300 hover:bg-gray-50/80 group ${index !== stats.length - 1 ? "md:border-r border-gray-100" : ""
                                }`}
                        >
                            <motion.div 
                                className="mb-3 p-3 rounded-xl bg-gray-50 group-hover:bg-white group-hover:shadow-lg transition-all duration-300"
                                variants={iconVariants}
                                whileHover={{ 
                                    scale: 1.15, 
                                    rotate: [0, -10, 10, 0],
                                    transition: { duration: 0.5 }
                                }}
                            >
                                {stat.icon}
                            </motion.div>
                            <motion.div 
                                className="flex flex-col"
                                variants={numberVariants}
                            >
                                <motion.span 
                                    className="text-2xl md:text-3xl font-bold text-black tracking-tight group-hover:text-blue-600 transition-colors duration-300"
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                                >
                                    {stat.value}
                                </motion.span>
                                <span className="text-xs md:text-sm font-medium text-neutral-600 uppercase tracking-wider mt-1 group-hover:text-neutral-800 transition-colors duration-300">
                                    {stat.label}
                                </span>
                            </motion.div>
                            
                            {/* Subtle glow effect on hover */}
                            <motion.div
                                className="absolute inset-0 rounded-2xl bg-blue-400/0 group-hover:bg-blue-400/5 transition-colors duration-300 -z-10"
                                initial={false}
                            />
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}
