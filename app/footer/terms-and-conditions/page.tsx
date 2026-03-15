import React from 'react';
import { FiFileText, FiUserCheck, FiAward, FiAlertTriangle, FiUnlock, FiRefreshCw, FiAlertCircle, FiMapPin, FiMail } from 'react-icons/fi';

export default function TermsAndConditions() {
  return (
    <section className="relative py-20 overflow-hidden bg-linear-to-b from-gray-50 to-white min-h-[80vh]">
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-50 -z-10 -translate-x-1/3 translate-y-1/3" />
      
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-14 border border-neutral-200 shadow-xl relative overflow-hidden">
          
          <div className="mb-12 border-b border-gray-100 pb-8 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-black tracking-tight flex items-center gap-4 justify-center sm:justify-start">
              <span className="hidden sm:inline-flex p-3 bg-blue-50 text-blue-600 rounded-xl">
                 <FiFileText className="text-2xl" />
              </span>
              Terms & Conditions
            </h1>
            <p className="text-gray-500 font-medium tracking-wide text-sm uppercase">
               Last Updated: March 2026
            </p>
          </div>

          <div className="space-y-12 text-gray-700 leading-relaxed text-base sm:text-lg">
            
            <section className="bg-blue-50/50 p-6 sm:p-8 rounded-2xl border border-blue-100 shadow-sm text-gray-800">
              <p>
                These Terms apply to the use of <strong>UniPrep</strong>, a learning platform operated by <strong>RankersEdge Learning</strong>.
              </p>
              <p className="mt-4 font-medium">
                By accessing or using UniPrep, you agree to comply with and be bound by the following terms.
              </p>
            </section>

            <div className="space-y-10">
              <section className="group">
                <h2 className="text-2xl font-semibold text-black flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                     <FiUnlock className="text-xl" />
                  </span>
                  1. Use of Platform
                </h2>
                <div className="pl-14 text-gray-600">
                  UniPrep provides educational resources including mock tests, study materials,
                  mentorship, and live classes for exam preparation. The platform is intended for personal,
                  non-commercial educational use only.
                </div>
              </section>

              <section className="group">
                <h2 className="text-2xl font-semibold text-black flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                     <FiUserCheck className="text-xl" />
                  </span>
                  2. Account Responsibility
                </h2>
                <div className="pl-14 text-gray-600">
                  Users are responsible for maintaining the confidentiality of their login credentials.
                  Sharing accounts is strictly prohibited and may lead to immediate suspension or termination of access.
                </div>
              </section>

              <section className="group">
                <h2 className="text-2xl font-semibold text-black flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                     <FiAward className="text-xl" />
                  </span>
                  3. Intellectual Property
                </h2>
                <div className="pl-14 text-gray-600">
                  All content on UniPrep including mock tests, questions, study materials, videos, and branding
                  are the exclusive intellectual property of UniPrep. These materials may not be reproduced, 
                  distributed, modified, or sold without explicit written permission.
                </div>
              </section>

              <section className="group">
                <h2 className="text-2xl font-semibold text-black flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                     <FiAlertTriangle className="text-xl" />
                  </span>
                  4. Fair Usage
                </h2>
                <div className="pl-14 text-gray-600">
                  Users must not attempt to copy, scrape, distribute, or otherwise misuse content from the
                  platform. Automated access, data mining, or malicious activity is prohibited.
                </div>
              </section>

              <section className="group">
                <h2 className="text-2xl font-semibold text-black flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                     <FiFileText className="text-xl" />
                  </span>
                  5. Course Access
                </h2>
                <div className="pl-14 text-gray-600">
                  Access to courses, mock tests, or materials is granted based on the specific plan purchased and
                  may be limited to a defined duration or validity period.
                </div>
              </section>

              <section className="group">
                <h2 className="text-2xl font-semibold text-black flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                     <FiRefreshCw className="text-xl" />
                  </span>
                  6. Platform Changes
                </h2>
                <div className="pl-14 text-gray-600">
                  UniPrep reserves the right to modify, suspend, or discontinue services, features, or content at any
                  time, with or without prior notice.
                </div>
              </section>

              <section className="group">
                <h2 className="text-2xl font-semibold text-black flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                     <FiAlertCircle className="text-xl" />
                  </span>
                  7. Limitation of Liability
                </h2>
                <div className="pl-14 text-gray-600">
                  UniPrep does not guarantee specific exam results, scores, or college admissions. Our platform provides
                  preparation resources, but outcomes depend on individual student effort and execution.
                </div>
              </section>

              <section className="group mb-12">
                <h2 className="text-2xl font-semibold text-black flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                     <FiMapPin className="text-xl" />
                  </span>
                  8. Governing Law
                </h2>
                <div className="pl-14 text-gray-600">
                  These terms shall be governed by and construed in accordance with the laws of India, without regard
                  to its conflict of law provisions.
                </div>
              </section>
            </div>

            <div className="mt-16 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-black mb-4 flex items-center gap-2">
                 <FiMail className="text-gray-400" /> Need Clarification?
              </h2>
              <p className="text-gray-600 mb-2">For any queries directly regarding these terms, send an email to:</p>
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
