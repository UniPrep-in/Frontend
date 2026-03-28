"use client";
import { useState } from "react";
import Footer from "../components/Footer";
import Navbar from "../components/ui/Navbar";
import Notes from "./tabs/notes";
import FlashCards from "./tabs/flashCards";
import Pyq from "./tabs/pyq";

export default function Materials() {
  const [activeTab, setActiveTab] = useState("Flash Cards");

  return (
    <main>
      <div>
        <Navbar />
      </div>

      <div>
        {/* Tabs */}
        <div className="flex gap-2 px-8 pt-6">
          <button
            onClick={() => setActiveTab("Flash Cards")}
            className={`${activeTab === "Flash Cards" ? "bg-blue-300 border px-6 py-2 rounded-full text-black duration-300" : "bg-neutral-200 px-6 py-2 rounded-full"}`}
          >
            Flash Cards
          </button>

          <button
            onClick={() => setActiveTab("Notes")}
            className={`${activeTab === "Notes" ? "bg-blue-300 px-6 py-2 rounded-full text-black border duration-300" : "bg-neutral-200 px-6 py-2 rounded-full"}`}
          >
            Notes
          </button>

          <button
            onClick={() => setActiveTab("PYQs")}
            className={`${activeTab === "PYQs" ? "bg-blue-300 border px-6 py-2 rounded-full text-black duration-300" : "bg-neutral-200 px-6 py-2 rounded-full"}`}
          >
            PYQs
          </button>
        </div>

        {/* Content */}
      <div className="px-8 py-4">
        {activeTab === "Notes" && <Notes />}
        {activeTab === "Flash Cards" && <FlashCards />}
        {activeTab === "PYQs" && <Pyq />}
      </div>
      </div>

      <div>
        <Footer />
      </div>
    </main>
  );
}
