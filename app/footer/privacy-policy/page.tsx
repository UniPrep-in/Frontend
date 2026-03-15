import React from 'react';
import { FiShield, FiFileText, FiDatabase, FiLock, FiSettings, FiGlobe, FiUsers, FiMail, FiRefreshCw } from 'react-icons/fi';

export default function PrivacyPolicy() {
  return (
    <section className="relative py-20 overflow-hidden bg-linear-to-b from-gray-50 to-white min-h-[80vh]">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-50 -z-10 -translate-x-1/3 translate-y-1/3" />
      
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-14 border border-neutral-200 shadow-xl relative overflow-hidden">
          
          {/* Header */}
          <div className="mb-12 border-b border-gray-100 pb-8 text-center sm:text-left">
            <div className="inline-flex items-center justify-center p-3 sm:hidden mb-4 bg-blue-50 text-blue-600 rounded-xl">
               <FiShield className="text-3xl" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-black tracking-tight flex items-center gap-4 justify-center sm:justify-start">
              <span className="hidden sm:inline-flex p-3 bg-blue-50 text-blue-600 rounded-xl">
                 <FiShield className="text-2xl" />
              </span>
              Privacy Policy
            </h1>
            <p className="text-gray-500 font-medium tracking-wide text-sm uppercase">
               Last Updated: March 2026
            </p>
          </div>

          <div className="space-y-12 text-gray-700 leading-relaxed text-base sm:text-lg">
            
            <section className="bg-gray-50/70 p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm text-gray-800">
              <p>
                <strong>UniPrep</strong> is operated by <span className="font-semibold text-blue-600">RankersEdge Learning</span>. We respect your privacy and are committed to protecting your personal information.
              </p>
              <p className="mt-4">
                This Privacy Policy explains how we collect, use, and safeguard your data when you use our website and services. By accessing UniPrep, you consent to the data practices described in this statement.
              </p>
            </section>

            <section className="space-y-4 pt-4">
              <h2 className="text-2xl font-semibold text-black flex items-center gap-3">
                <FiDatabase className="text-blue-500" /> 1. Information We Collect
              </h2>
              <p className="text-gray-600">We may collect the following information:</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <li className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <FiUsers className="text-xl text-blue-500 mt-1 shrink-0" />
                  <span>Name, email address, phone number</span>
                </li>
                <li className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <FiFileText className="text-xl text-blue-500 mt-1 shrink-0" />
                  <span>Educational details (exam interests, preferences)</span>
                </li>
                <li className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <FiLock className="text-xl text-blue-500 mt-1 shrink-0" />
                  <span>Payment details (securely via third-party gateways)</span>
                </li>
                <li className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <FiGlobe className="text-xl text-blue-500 mt-1 shrink-0" />
                  <span>Usage data (visited pages, tests, performance)</span>
                </li>
              </ul>
            </section>

            <section className="space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-2xl font-semibold text-black flex items-center gap-3">
                <FiSettings className="text-blue-500" /> 2. How We Use Your Information
              </h2>
              <p className="text-gray-600">Your information may be used to:</p>
              <div className="bg-white border text-base border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <ul className="divide-y divide-gray-100">
                  <li className="p-4 flex items-center gap-3 hover:bg-gray-50 transition"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Provide access to mock tests, courses, and study materials</li>
                  <li className="p-4 flex items-center gap-3 hover:bg-gray-50 transition"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Personalize learning recommendations</li>
                  <li className="p-4 flex items-center gap-3 hover:bg-gray-50 transition"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Communicate updates, results, or announcements</li>
                  <li className="p-4 flex items-center gap-3 hover:bg-gray-50 transition"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Improve our platform and services</li>
                  <li className="p-4 flex items-center gap-3 hover:bg-gray-50 transition"><span className="w-2 h-2 rounded-full bg-blue-500"></span>Process payments and transactions securely</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4 pt-6 border-t border-gray-100">
              <h2 className="text-2xl font-semibold text-black flex items-center gap-3">
                <FiLock className="text-blue-500" /> 3. Data Protection
              </h2>
              <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 text-gray-700">
                We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, please note that no digital platform or internet transmission can guarantee absolute security.
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-100">
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-black flex items-center gap-3">
                  <FiGlobe className="text-blue-500" /> 4. Third-Party Services
                </h2>
                <p className="text-gray-700">
                  We may use trusted third-party services (such as payment gateways, analytics tools, or hosting providers) that may collect and process information in accordance with their respective privacy policies.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-black flex items-center gap-3">
                  <FiFileText className="text-blue-500" /> 5. Cookies
                </h2>
                <p className="text-gray-700">
                  Our website may use cookies to improve user experience, track usage patterns, analyze interactions, and enhance the overall platform performance.
                </p>
              </section>
            </div>

            <section className="space-y-4 pt-6 border-t border-gray-100 mb-8">
              <h2 className="text-2xl font-semibold text-black flex items-center gap-3">
                <FiUsers className="text-blue-500" /> 6. Student Data Usage
              </h2>
              <div className="bg-gray-50/70 p-6 rounded-2xl border border-gray-100 text-gray-700">
                Test results and analytical data securely gathered during use may be used to improve our exam preparation tools, adjust difficulty models, and provide tailored performance insights.
              </div>
            </section>

            <section className="space-y-4 pt-6 border-t border-gray-100 mb-8">
              <h2 className="text-2xl font-semibold text-black flex items-center gap-3">
                <FiRefreshCw className="text-blue-500" /> 7. Changes to Policy
              </h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. Any changes will be posted on this
                page with an updated revision date.
              </p>
            </section>

            {/* Footer Contact area */}
            <div className="mt-16 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-black mb-4 flex items-center gap-2">
                 <FiMail className="text-gray-400" /> Contact Questions
              </h2>
              <p className="text-gray-600 mb-2">For questions about this policy, please reach out:</p>
              <a 
                href="mailto:support@uniprep.in" 
                className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-800 hover:underline transition"
              >
                support@uniprep.in
              </a>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
