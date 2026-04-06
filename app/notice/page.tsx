"use client";
import Blogs from "./components/blogs";
import Syllabus from "./components/syllabus";
import { useState } from "react";

export default function Notice(){
    const [activeTab, setActiveTab] = useState<"syllabus" | "blogs">("syllabus");

    return(
        <main className="bg-neutral-100">
            <div className="mx-auto max-w-6xl bg-transparent py-12">
                <div className="flex items-center justify-center">
                  <div className="relative w-fit bg-white flex px-2 py-2 rounded-full">

                    {/* Sliding Indicator */}
                    <div
                      className={`absolute top-2 bottom-2 w-28 rounded-full bg-emerald-300 border transition-transform duration-300 ease-in-out ${
                        activeTab === "blogs" ? "translate-x-[112px]" : "translate-x-0"
                      }`}
                    />

                    <button
                      onClick={() => setActiveTab("syllabus")}
                      className="relative z-10 px-6 py-2 text-black rounded-full"
                    >
                      Syllabus
                    </button>

                    <button
                      onClick={() => setActiveTab("blogs")}
                      className="relative z-10 px-6 py-2 text-black rounded-full"
                    >
                      Blogs
                    </button>

                  </div>
                </div>

                <div className="mt-10">
                  {activeTab === "syllabus" && (
                    <Blogs />
                  )}

                  {activeTab === "blogs" && (
                    <Syllabus />
                  )}
                </div>
            </div>
        </main>
    );
}
