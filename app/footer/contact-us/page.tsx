import React from 'react';
import { FiMail, FiMessageCircle, FiBriefcase, FiClock } from 'react-icons/fi';

export default function ContactUs() {
  return (
    <section className="relative py-20 overflow-hidden bg-linear-to-b from-gray-50 to-white min-h-[80vh] flex items-center justify-center">
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-50 -z-10 -translate-x-1/3 translate-y-1/3" />
      
      <div className="mx-auto max-w-5xl px-4 sm:px-6 w-full">
        <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-14 border border-neutral-200 shadow-xl relative overflow-hidden">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-black tracking-tight">
              Contact <span className="text-blue-600">UniPrep</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Have questions or need help with your preparation? We're here to assist you at every step of your journey.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 text-gray-800">
            {/* Direct Contact */}
            <div className="group bg-gray-50/50 p-6 sm:p-8 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition duration-300">
                <FiMail className="text-2xl" />
              </div>
              <h2 className="text-2xl font-semibold mb-3 text-black">Email Us</h2>
              <p className="text-gray-600 mb-4 h-12">Reach out to our main support channel for general queries and account assistance.</p>
              <a href="mailto:support@uniprep.in" className="inline-flex font-semibold text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 decoration-2">
                support@uniprep.in
              </a>
            </div>

            {/* Student Support */}
            <div className="group bg-gray-50/50 p-6 sm:p-8 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition duration-300">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6 text-green-600 group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white transition duration-300">
                <FiMessageCircle className="text-2xl" />
              </div>
              <h2 className="text-2xl font-semibold mb-3 text-black">Student Support</h2>
              <p className="text-gray-600 h-12">Get specialized help with mock tests, course access, platform issues, and mentorship queries.</p>
            </div>

            {/* Collaboration */}
            <div className="group bg-gray-50/50 p-6 sm:p-8 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition duration-300">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition duration-300">
                <FiBriefcase className="text-2xl" />
              </div>
              <h2 className="text-2xl font-semibold mb-3 text-black">Collaboration</h2>
              <p className="text-gray-600 h-12">Interested in internships, partnerships, or expanding educational opportunities together?</p>
            </div>

            {/* Response Time */}
            <div className="group bg-gray-50/50 p-6 sm:p-8 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition duration-300">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6 text-orange-600 group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white transition duration-300">
                <FiClock className="text-2xl" />
              </div>
              <h2 className="text-2xl font-semibold mb-3 text-black">Response Time</h2>
              <p className="text-gray-600 h-12">We value your time. Our dedicated support team usually responds within <span className="font-semibold text-gray-900">24–48 hours</span>.</p>
            </div>
          </div>

          {/* Bottom Call to Action area if needed */}
          <div className="mt-16 pt-8 border-t border-gray-100 text-center">
            <p className="text-gray-500">We aim to respond to all inquiries promptly and look forward to assisting you on your journey.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
