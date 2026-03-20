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
        <div className="flex gap-4 px-8 pt-6">
          <button
            onClick={() => setActiveTab("Flash Cards")}
            className={`${activeTab === "Flash Cards" ? "bg-linear-to-br from-blue-500 to-blue-600 px-6 py-2 rounded-full text-white duration-300" : "bg-neutral-200 px-6 py-2 rounded-full"}`}
          >
            Flash Cards
          </button>

          <button
            onClick={() => setActiveTab("Notes")}
            className={`pb-2 ${activeTab === "Notes" ? "bg-linear-to-br from-blue-500 to-blue-600 px-6 py-2 rounded-full text-white duration-300" : "bg-neutral-200 px-6 py-2 rounded-full"}`}
          >
            Notes
          </button>

          <button
            onClick={() => setActiveTab("PYQs")}
            className={`pb-2 ${activeTab === "PYQs" ? "bg-linear-to-br from-blue-500 to-blue-600 px-6 py-2 rounded-full text-white duration-300" : "bg-neutral-200 px-6 py-2 rounded-full"}`}
          >
            PYQs
          </button>
        </div>

        {/* Content */}
      <div className="p-8">
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
