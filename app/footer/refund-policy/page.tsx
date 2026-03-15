import React from 'react';
import { FiDollarSign, FiClock, FiSettings, FiXCircle, FiCreditCard, FiMail, FiCheckCircle } from 'react-icons/fi';

export default function RefundPolicy() {
  return (
    <section className="relative py-20 overflow-hidden bg-linear-to-b from-gray-50 to-white min-h-[80vh]">
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10 translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-50 -z-10 -translate-x-1/3 translate-y-1/3" />
      
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-14 border border-neutral-200 shadow-xl relative overflow-hidden">
          
          <div className="mb-12 border-b border-gray-100 pb-8 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-black tracking-tight flex items-center gap-4 justify-center sm:justify-start">
              <span className="hidden sm:inline-flex p-3 bg-blue-50 text-blue-600 rounded-xl">
                 <FiDollarSign className="text-2xl" />
              </span>
              Refund Policy
            </h1>
            <p className="text-gray-500 font-medium tracking-wide text-sm uppercase">
               Last Updated: March 2026
            </p>
          </div>

          <div className="space-y-12 text-gray-700 leading-relaxed text-base sm:text-lg">
            
            <section className="bg-orange-50/50 p-6 sm:p-8 rounded-2xl border border-orange-100 shadow-sm text-gray-800">
              <p>
                <strong>UniPrep</strong> is operated by RankersEdge Learning.
              </p>
              <p className="mt-4">
                Since most services on UniPrep are digital (mock tests, courses, and study materials),
                <strong> refunds are generally not available once the content has been accessed.</strong>
              </p>
              <p className="mt-4 text-gray-600">
                We strive to provide high-quality educational services. Please read our refund policy
                carefully before purchasing.
              </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
                <h2 className="text-xl font-semibold text-black flex items-center gap-3 mb-4">
                  <FiCreditCard className="text-blue-500 text-2xl" /> 1. Digital Products
                </h2>
                <p className="text-gray-600 text-base">
                  Most of our services, including mock tests, study materials, and digital courses, are
                  delivered instantly. Therefore, they are non-refundable once content has been delivered and accessed.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
                <h2 className="text-xl font-semibold text-black flex items-center gap-3 mb-4">
                  <FiClock className="text-blue-500 text-2xl" /> 2. Refund Requests
                </h2>
                <p className="text-gray-600 text-base mb-3">Refunds may be considered only if:</p>
                <ul className="space-y-2 text-base text-gray-600">
                  <li className="flex items-start gap-2"><FiCheckCircle className="text-green-500 mt-1 shrink-0" /> Requested within 48 hours.</li>
                  <li className="flex items-start gap-2"><FiCheckCircle className="text-green-500 mt-1 shrink-0" /> Course has largely not been accessed.</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
                <h2 className="text-xl font-semibold text-black flex items-center gap-3 mb-4">
                  <FiSettings className="text-blue-500 text-2xl" /> 3. Technical Issues
                </h2>
                <p className="text-gray-600 text-base">
                  If you experience technical issues preventing access to the platform, contact our
                  support team. We will resolve the issue or provide an alternative solution.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
                <h2 className="text-xl font-semibold text-black flex items-center gap-3 mb-4">
                  <FiXCircle className="text-blue-500 text-2xl" /> 4. Cancellation
                </h2>
                <p className="text-gray-600 text-base">
                  Users may cancel subscriptions before the scheduled renewal date at any point to avoid future recurring charges.
                </p>
              </div>
            </div>

            <section className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
              <h2 className="text-xl font-semibold text-black flex items-center gap-3 mb-3">
                <FiClock className="text-blue-600" /> 5. Processing Time
              </h2>
              <p className="text-gray-700">
                Approved refunds will be processed within <strong>5–10 business days</strong> directly to the original method of payment.
              </p>
            </section>

            <div className="mt-16 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-black mb-4 flex items-center gap-2">
                 <FiMail className="text-gray-400" /> Have Questions?
              </h2>
              <p className="text-gray-600 mb-2">For refund requests or inquiries, reach out to us at:</p>
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
