import React from 'react';
import { FiBookOpen, FiActivity, FiLayers, FiUsers, FiVideo, FiTarget, FiFlag } from 'react-icons/fi';
import { MdOutlineEmail } from 'react-icons/md';

export default function AboutUs() {
  return (
    <section className="relative py-20 overflow-hidden bg-linear-to-b from-gray-50 to-white min-h-screen">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-14 border border-neutral-200 shadow-xl relative overflow-hidden">
          {/* Decorative Background Blur */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/2 -translate-y-1/2" />
          
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 text-black tracking-tight">
              About <span className="text-blue-600">UniPrep</span>
            </h1>
            
            <div className="space-y-6 text-gray-700 text-lg leading-relaxed mb-12">
              <p>
                UniPrep is an online exam preparation platform operated by RankersEdge Learning.
                Our goal is simple: help students prepare smarter for entrance exams through practice,
                clear guidance, and strategies shared by students who have already succeeded.
              </p>
              
              <p className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50">
                What makes UniPrep different is our focus on learning from rankers—students who
                have successfully cleared the exams and understand the preparation journey.
              </p>
            </div>

            <h2 className="text-3xl font-semibold mt-14 mb-8 text-black flex items-center gap-3">
              <FiTarget className="text-blue-600" /> What We Offer
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-lg transition duration-300">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition duration-300">
                  <FiBookOpen className="text-2xl text-blue-600 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-black">Mock Tests</h3>
                <p className="text-gray-600">Practice with exam-style mock tests designed to simulate real entrance exams.</p>
              </div>
              
              <div className="group bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-lg transition duration-300">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition duration-300">
                  <FiActivity className="text-2xl text-blue-600 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-black">Performance Analysis</h3>
                <p className="text-gray-600">Get detailed insights into your strengths and weaknesses to improve your preparation strategy.</p>
              </div>
              
              <div className="group bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-lg transition duration-300">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition duration-300">
                  <FiLayers className="text-2xl text-blue-600 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-black">Study Materials</h3>
                <p className="text-gray-600">Access curated resources and preparation materials designed specifically for entrance exams.</p>
              </div>
              
              <div className="group bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-lg transition duration-300">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition duration-300">
                  <FiUsers className="text-2xl text-blue-600 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-black">Mentorship from Rankers</h3>
                <p className="text-gray-600">Learn directly from students who have already cracked the exams and understand the preparation journey.</p>
              </div>
              
              <div className="group bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm hover:shadow-lg transition duration-300 md:col-span-2">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition duration-300">
                  <FiVideo className="text-2xl text-blue-600 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-black">Live Classes & Crash Courses</h3>
                <p className="text-gray-600 max-w-2xl">Structured sessions, marathon classes, and last-minute crash courses to help students revise effectively.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-14 mb-10">
              <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 border border-neutral-100">
                <h2 className="text-2xl font-semibold mb-4 text-black flex items-center gap-2">
                  <FiFlag className="text-blue-500" /> Our Vision
                </h2>
                <p className="text-gray-700 leading-relaxed text-sm lg:text-base">
                  We believe exam preparation should be accessible, structured, and student-driven.
                  RankersEdge aims to build a platform where students can practice, analyze, and
                  improve with the right tools and guidance.
                </p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 border border-neutral-100">
                <h2 className="text-2xl font-semibold mb-4 text-black flex items-center gap-2">
                  <FiTarget className="text-blue-500" /> Our Mission
                </h2>
                <p className="text-gray-700 leading-relaxed text-sm lg:text-base">
                  To simplify exam preparation and help students approach competitive exams with
                  clarity, confidence, and the right resources.
                </p>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-xl font-semibold text-black">Contact Us</h2>
                <p className="text-gray-500 mt-1">Have more questions? Reach out to our team.</p>
              </div>
              <a 
                href="mailto:support@uniprep.in" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition shadow-md hover:shadow-xl"
              >
                <MdOutlineEmail className="text-xl" /> support@uniprep.in
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
