"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Loader from "@/app/components/ui/loader";
import FlashCards from "./tabs/flashCards";
import { NotesLoaderState } from "./tabs/notes";

const Notes = dynamic(() => import("./tabs/notes"), {
  loading: () => <NotesLoaderState />,
});

const Pyq = dynamic(() => import("./tabs/pyq"), {
  loading: () => (
    <div className="flex min-h-[18rem] items-center justify-center rounded-2xl bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 shadow-sm">
      <Loader title="Loading PYQs" subtitle="Fetching previous-year questions for you." />
    </div>
  ),
});

export default function MaterialsClient() {
  const [activeTab, setActiveTab] = useState<"Flash Cards" | "Notes" | "PYQs">(
    "Flash Cards",
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 px-4 pt-4 sm:px-8">
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

      <div className="flex-1 px-4 py-2 sm:px-8">
        <div className="min-h-[42rem]">
          {activeTab === "Notes" ? <Notes /> : null}
          {activeTab === "Flash Cards" ? <FlashCards initialSearchPage={null} /> : null}
          {activeTab === "PYQs" ? <Pyq /> : null}
        </div>
      </div>
    </div>
  );
}
