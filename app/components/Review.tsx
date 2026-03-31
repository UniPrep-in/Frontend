"use client";
import { useState } from "react";

export default function Reviews() {
  const [showAll, setShowAll] = useState(false);

const reviews = [
  {
    id: 1,
    name: "Aarav Sharma",
    role: "CUET 2025 Aspirant",
    content:
      "The mock tests on Uniprep closely matched the actual CUET pattern. The AI analysis helped me identify time management issues, and I was able to improve my score steadily over a few weeks.",
    rating: 5,
  },
  {
    id: 2,
    name: "Priya Verma",
    role: "CUET Aspirant",
    content:
      "What I found most useful was the automatic error tracking. Revising my mistakes before each mock made a noticeable difference in my accuracy. The platform is simple and focused.",
    rating: 5,
  },
  {
    id: 3,
    name: "Rohan Gupta",
    role: "CUET 2025 Candidate",
    content:
      "I liked the structured mock series and the detailed performance breakdown. It gave me clarity on which subjects needed more attention. Overall, a very practical preparation tool.",
    rating: 5,
  },
  {
    id: 4,
    name: "Ananya Singh",
    role: "CUET Aspirant",
    content:
      "The mentorship sessions were genuinely helpful for planning my preparation strategy. The guidance on subject selection and mock review saved me a lot of time.",
    rating: 5,
  },
  {
    id: 5,
    name: "Kunal Mehta",
    role: "CUET 2024 Aspirant",
    content:
      "The interface is clean and the handwritten notes are great for quick revision. I especially appreciate how everything — mocks, analysis, and revision — is in one place.",
    rating: 5,
  },
  {
    id: 6,
    name: "Sneha Patel",
    role: "CUET Aspirant",
    content:
      "After using Uniprep for a month, I feel much more confident about the exam. The mock environment feels realistic and the feedback is actually actionable.",
    rating: 5,
  },
];

  const initialReviews = reviews.slice(0, 3);
  const additionalReviews = reviews.slice(3);
  const displayedReviews = showAll ? reviews : initialReviews;

  return (
    <main
      id="testimonials"
      className="min-h-screen overflow-x-hidden bg-gray-50 px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="mb-12 flex flex-col items-center justify-center sm:mb-16">
          <h2 className="mb-4 max-w-xl text-center text-4xl text-black sm:text-5xl md:text-6xl">
            Testimonials
          </h2>
          <p className="mx-auto max-w-xl text-center text-base text-black sm:text-lg">
            What CUET Aspirants think about Uniprep
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {displayedReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border-neutral-200 rounded-2xl p-6 shadow-xl border"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(review.rating)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-4 h-4 text-amber-500 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-700 text-sm leading-relaxed mb-6">
                {review.content}
              </p>

              {/* Author */}
              <div className="border-t border-gray-100 pt-4">
                <p className="font-medium text-gray-900 text-sm">
                  {review.name}
                </p>
                <p className="text-gray-500 text-xs">
                  {review.role}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Read More Button */}
        {additionalReviews.length > 0 && (
          <div className="text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-300 border rounded-full hover:scale-110 duration-300"
            >
              {showAll ? (
                <>
                  Show Less
                </>
              ) : (
                <>
                  Read More Reviews
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
