"use client";

import { useFormStatus } from "react-dom";

export default function ProceedLoader() {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      <p className="mt-4 text-gray-600 font-medium">Starting test…</p>
      <p className="text-sm text-gray-500">Please wait</p>
    </div>
  );
}
