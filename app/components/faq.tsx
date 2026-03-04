"use client";
import { useState } from "react";
import Image from "next/image";

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Is the content updated as per the latest CUET syllabus?",
      answer: "Yes, our study material and mock tests are regularly updated to reflect the latest CUET guidelines.",
    },
    {
      question: "Do you offer short notes and revision material?",
      answer: "Yes, concise exam-ready notes are provided for quick revision before the exam.",
    },
    {
      question: "Do you cover Class 12 NCERT syllabus as well?",
      answer: "Yes, since CUET commerce domain subjects are based on NCERT, our modules integrate Class 12 concepts with exam-focused practice.",
    },
    {
      question: "Can students access the platform on mobile?",
      answer: "Yes, our platform is mobile-friendly and accessible on smartphones, tablets, and laptops.",
    },
    {
      question: "Do you provide doubt-clearing sessions?",
      answer: "Yes, live doubt-clearing sessions are scheduled weekly, and students can also post queries for quick responses.",
    },
    {
      question: "Is career counseling included?",
      answer: "We guide students on course selection, university preferences, and career paths after CUET.",
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 md:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          
          {/* Left Side - Image */}
          <div className="relative w-full aspect-square max-w-md mx-auto lg:max-w-none">
            <Image
              src="/assets/faq.avif"
              alt="FAQ Illustration"
              fill
              className="object-cover rounded-2xl"
              priority
            />
          </div>

          {/* Right Side - FAQ Accordion */}
          <div className="flex flex-col gap-6">
            <div className="mb-4">
              <h2 className="text-3xl md:text-4xl text-black mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-black text-base md:text-lg">
                Everything you need to know about our platform and courses.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-lg text-gray-900 pr-4">
                      {faq.question}
                    </span>
                    <span className="flex-shrink-0">
                      {openIndex === index ? (
                        <svg
                          className="w-5 h-5 text-orange-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 12h14"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-orange-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      )}
                    </span>
                  </button>
                  
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openIndex === index ? "max-h-96" : "max-h-0"
                    }`}
                  >
                    <div className="p-5 pt-0 text-gray-600 text-sm md:text-base leading-relaxed border-t border-gray-100">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}