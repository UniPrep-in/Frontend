import {
  TiStarFullOutline,
  TiStarHalfOutline,
} from "react-icons/ti";
import Link from "next/link";

export default function Hero() {
  return (
    <main className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Modern gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-blue-50 via-white to-indigo-50" />

      {/* Animated mesh gradient blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-100/20 to-indigo-100/20 rounded-full blur-3xl" />

      {/* Floating university logos with glass effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-8 md:top-24 md:left-20 p-3 md:p-4">
          <img src="/logos/du.png" className="w-10 md:w-14 h-auto opacity-70" alt="" />
        </div>
        <div className="absolute bottom-32 right-8 md:bottom-40 md:right-24 p-3 md:p-4">
          <img src="/logos/jnu.png" className="w-8 md:w-12 h-auto opacity-60" alt="" />
        </div>
        <div className="absolute top-1/3 right-12 md:top-1/3 md:right-40 p-3 md:p-4">
          <img src="/logos/srcc.png" className="w-12 md:w-16 h-auto opacity-60" alt="" />
        </div>
        <div className="absolute bottom-24 left-12 md:bottom-32 md:left-32 p-3 md:p-4">
          <img src="/logos/st.png" className="w-10 md:w-14 h-auto opacity-70" alt="" />
        </div>
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />

      <div className="relative z-10 flex flex-col gap-6 md:gap-8 justify-center items-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* Modern Rating Badge */}
        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-0.5">
            {[...Array(4)].map((_, i) => (
              <TiStarFullOutline key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
            ))}
            <TiStarHalfOutline className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <span className="text-sm font-semibold text-gray-900">4.5</span>
          <span className="text-sm text-gray-500">•</span>
          <span className="text-sm text-gray-500">120k+ reviews</span>
        </div>

        {/* Modern Headline with gradient text */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-center leading-[1.1] tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
            Crack CUET with
          </span>
          <br />
          <span className="relative inline-block mt-2">
            <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Smart Practice
            </span>
            <svg className="absolute -bottom-2 left-0 w-full h-3 text-blue-200 -z-0" viewBox="0 0 100 10" preserveAspectRatio="none">
              <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
            </svg>
          </span>
        </h1>

        {/* Modern Subheadline */}
        <p className="max-w-2xl text-lg md:text-xl text-center text-gray-600 leading-relaxed font-semibold">
          Mocks. AI Analysis. Ranker Mentorship. Preference Filling.
        </p>

        {/* Modern CTA Buttons */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
            <Link
              href="/mock-tests"
              className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white transition-all duration-300 bg-gray-900 rounded-full hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
            >
              Start Free Mock
              <svg className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>

            {/* <Link
              href="/explore"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-gray-700 transition-all duration-200 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200"
            >
              <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Explore CUET Plans
            </Link> */}
          </div>
        </div>
      </div>
    </main>
  );
}