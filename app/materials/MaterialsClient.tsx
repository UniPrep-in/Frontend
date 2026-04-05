"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { FlashcardsSearchPage } from "@/lib/materials-data";

const Notes = dynamic(() => import("./tabs/notes"), {
  loading: () => (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
      Loading notes...
    </div>
  ),
});

const FlashCards = dynamic(() => import("./tabs/flashCards"), {
  loading: () => (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
      Loading flashcards...
    </div>
  ),
});

const Pyq = dynamic(() => import("./tabs/pyq"), {
  loading: () => (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 shadow-sm">
      Loading PYQs...
    </div>
  ),
});

type MaterialsClientProps = {
  initialFlashcardsPage: FlashcardsSearchPage;
};

export default function MaterialsClient({
  initialFlashcardsPage,
}: MaterialsClientProps) {
  const [activeTab, setActiveTab] = useState<"Flash Cards" | "Notes" | "PYQs">(
    "Flash Cards",
  );

  return (
    <div>
      <div className="flex gap-2 px-8 pt-6">
        <button
          type="button"
          onClick={() => setActiveTab("Flash Cards")}
          className={`${activeTab === "Flash Cards" ? "bg-blue-300 border px-6 py-2 rounded-full text-black duration-300" : "bg-neutral-200 px-6 py-2 rounded-full"}`}
        >
          Flash Cards
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("Notes")}
          className={`${activeTab === "Notes" ? "bg-blue-300 px-6 py-2 rounded-full text-black border duration-300" : "bg-neutral-200 px-6 py-2 rounded-full"}`}
        >
          Notes
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PYQs")}
          className={`${activeTab === "PYQs" ? "bg-blue-300 border px-6 py-2 rounded-full text-black duration-300" : "bg-neutral-200 px-6 py-2 rounded-full"}`}
        >
          PYQs
        </button>
      </div>

      <div className="px-8 py-4">
        {activeTab === "Notes" ? <Notes /> : null}
        {activeTab === "Flash Cards" ? (
          <FlashCards initialSearchPage={initialFlashcardsPage} />
        ) : null}
        {activeTab === "PYQs" ? <Pyq /> : null}
      </div>
    </div>
  );
}
