import { useState, useEffect, useRef } from "react";
import { IoSearch } from "react-icons/io5";
import { createClient } from "@/lib/supabase/client";
import { gsap } from "gsap";
import { motion } from "framer-motion";
import Skeletal from "@/app/components/ui/skeletal";
import Loader from "@/app/components/ui/loader";
import { MdOutlineArrowOutward } from "react-icons/md";
import { MdOutlineArrowBack, MdOutlineArrowForward } from "react-icons/md";

const supabase = createClient();
interface Flashcard {
  word: string;
  meaning: string;
  type?: string;
  synonyms?: string[]; // now array of strings
  antonyms?: string[]; // now array of strings
  hook?: string;
  example?: string;
  user_id?: string | null;
}

export default function FlashCards() {
  const [randomFlashcard, setRandomFlashcard] = useState<Flashcard | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<"search" | "yourFlashcards">(
    "search",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [newWord, setNewWord] = useState("");
  const [newMeaning, setNewMeaning] = useState("");
  const [newType, setNewType] = useState("");
  const [newHook, setNewHook] = useState("");
  const [newExample, setNewExample] = useState("");
  const [newSynonyms, setNewSynonyms] = useState("");
  const [newAntonyms, setNewAntonyms] = useState("");
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Pagination states for "search" tab (queue of 5)
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 5;
  const [hasNextPage, setHasNextPage] = useState(true);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [nextPageCache, setNextPageCache] = useState<Flashcard[] | null>(null);

  // Fetch flashcards for "search" tab in batches of 5
  useEffect(() => {
    if (activeTab !== "search") return;
    async function fetchFlashcardPage() {
      if (flashcards.length === 0) setLoading(true);
      const start = page * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;
      const { data, error } = await supabase
        .from("flash_cards")
        .select("word, meaning, type, synonyms, antonyms, hook, example")
        .range(start, end);
      if (error) {
        console.error("Error fetching flashcards:", error.message || error);
        setLoading(false);
        return;
      }
      if (data && data.length > 0) {
        setFlashcards(data);
      }
      const initialIndex = 0;
      setCurrentIndex(initialIndex);
      if (data && data.length > 0) {
        setRandomFlashcard(data[0]);
      }
      setHasPrevPage(page > 0);
      setHasNextPage(data && data.length === PAGE_SIZE);
      // Prefetch next page for seamless pagination
      if (data && data.length === PAGE_SIZE) {
        const nextStart = (page + 1) * PAGE_SIZE;
        const nextEnd = nextStart + PAGE_SIZE - 1;
        const { data: nextData } = await supabase
          .from("flash_cards")
          .select("word, meaning, type, synonyms, antonyms, hook, example")
          .range(nextStart, nextEnd);
        setNextPageCache(nextData || []);
      } else {
        setNextPageCache(null);
      }
      setLoading(false);
    }
    fetchFlashcardPage();
  }, [page, activeTab === "search"]);

  // Fetch all user-specific flashcards for "yourFlashcards" tab (no pagination)
  useEffect(() => {
    async function fetchUserFlashcards() {
      setLoading(true);
      const { data, error } = await supabase
        .from("flash_cards")
        .select(
          "word, meaning, type, synonyms, antonyms, hook, example, user_id",
        )
        .not("user_id", "is", null);
      if (error) {
        console.error(
          "Error fetching user flashcards:",
          error.message || error,
        );
        setLoading(false);
        return;
      }
      if (data) {
        setFlashcards(data);
      }
      setLoading(false);
    }
    if (activeTab === "yourFlashcards") {
      fetchUserFlashcards();
    }
  }, [activeTab]);

  async function handleAddFlashcard() {
    if (!newWord.trim() || !newMeaning.trim()) return;
    // Split synonyms and antonyms by comma, trim whitespace, and filter out empty strings
    const synonymsArr = newSynonyms
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const antonymsArr = newAntonyms
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    // Get current user to attach user_id
    const { data: { session } } = await supabase.auth.getSession();
    const user_id = session?.user?.id;
    if (!user_id) {
      console.error("No user found");
      return;
    }

    const flashcardToAdd: Flashcard = {
      word: newWord,
      meaning: newMeaning,
      type: newType || undefined,
      hook: newHook || undefined,
      example: newExample || undefined,
      synonyms: synonymsArr.length > 0 ? synonymsArr : undefined,
      antonyms: antonymsArr.length > 0 ? antonymsArr : undefined,
      user_id,
    };
    const { error } = await supabase
      .from("flash_cards")
      .insert([flashcardToAdd]);
    if (error) {
      console.error("Error adding flashcard:", error.message || error);
      return;
    }
    // After adding, fetch the updated list from DB so UI is in sync
    setLoading(true);
    const { data: refreshed, error: fetchError } = await supabase
      .from("flash_cards")
      .select(
        "word, meaning, type, synonyms, antonyms, hook, example, user_id",
      )
      .not("user_id", "is", null);
    if (fetchError) {
      console.error("Error fetching user flashcards after add:", fetchError.message || fetchError);
      setLoading(false);
      return;
    }
    if (refreshed) {
      setFlashcards(refreshed);
    }
    setLoading(false);
    setNewWord("");
    setNewMeaning("");
    setNewType("");
    setNewHook("");
    setNewExample("");
    setNewSynonyms("");
    setNewAntonyms("");
  }

  const filteredFlashcards = flashcards.length
    ? flashcards.filter(
        (flashcard) =>
          flashcard.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
          flashcard.meaning.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  function toggleFlip(index: number) {
    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      const card = cardRefs.current.get(index);
      // The card should rotate in place around its center.
      // We'll animate the rotateY property and ensure the transformOrigin is "center center".
      if (newSet.has(index)) {
        newSet.delete(index);
        if (card) {
          gsap.to(card, {
            rotationY: 0,
            duration: 0.6,
            ease: "power2.out",
            transformOrigin: "center center",
          });
        }
      } else {
        newSet.add(index);
        if (card) {
          gsap.to(card, {
            rotationY: 180,
            duration: 0.6,
            ease: "power2.out",
            transformOrigin: "center center",
          });
        }
      }
      return newSet;
    });
  }

  function handlePrev() {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setRandomFlashcard(flashcards[prevIndex]);
      setFlippedCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(-1);
        return newSet;
      });
    } else if (hasPrevPage && page > 0) {
      setPage(page - 1);
      // currentIndex and randomFlashcard will be set by useEffect
    }
  }

  function handleNext() {
    if (currentIndex < flashcards.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setRandomFlashcard(flashcards[nextIndex]);
      setFlippedCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(-1);
        return newSet;
      });
    } else if (hasNextPage) {
      if (nextPageCache && nextPageCache.length > 0) {
        setFlashcards(nextPageCache);
        const nextIndex = 0;
        setCurrentIndex(nextIndex);
        setRandomFlashcard(nextPageCache[nextIndex]);
        setPage(page + 1);
      } else {
        setPage(page + 1);
      }
      // currentIndex and randomFlashcard will be set by useEffect or above
    }
  }

  return (
    <main>
      <div className="flex gap-2 items-center">
        <button
          className="bg-purple-300 border text-black rounded-xl px-4 py-2"
          onClick={() => setActiveTab("search")}
          disabled={activeTab === "search"}
        >
          View All Flashcards
        </button>
        <button
          className="bg-emerald-300 border text-black rounded-xl px-4 py-2"
          onClick={() => setActiveTab("yourFlashcards")}
          disabled={activeTab === "yourFlashcards"}
        >
          Your Flashcards
        </button>
      </div>

      {activeTab === "search" && (
        <div className="rounded-xl p-8">
          {loading ? (
            <div className="flex items-center justify-center">
              <Skeletal />
            </div>
          ) : (
            randomFlashcard && (
              <>
                <div
                  className="max-w-xl h-98 mt-4 mx-auto cursor-pointer"
                  onClick={() => toggleFlip(-1)}
                >
                  <motion.div
                    ref={(el) => {
                      if (el) {
                        cardRefs.current.set(-1, el);
                      }
                    }}
                    className=""
                    style={{
                      width: "100%",
                      height: "100%",
                      position: "relative",
                      transformStyle: "preserve-3d",
                      transformOrigin: "center center",
                      cursor: "pointer",
                      perspective: 1000,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        backfaceVisibility: "hidden",
                        backgroundColor: "black",
                        border: "1px solid #d1d5db",
                        borderRadius: "2rem",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        padding: "1rem",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      {/* Arrow button in bottom-right corner */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: "0.75rem",
                          right: "0.75rem",
                          zIndex: 2,
                        }}
                      >
                        <div className="bg-white flex items-center justify-center rounded-full h-12 w-12 shadow">
                          <MdOutlineArrowOutward className="text-black text-4xl" />
                        </div>
                      </div>
                      <h4 className="text-4xl text-white font-bold">
                        {randomFlashcard.word}
                      </h4>
                      <p className="text-sm text-black bg-purple-300 px-4 uppercase py-2 rounded-full">
                        # {randomFlashcard.type || ""}
                      </p>
                    </div>
                    <div
                      className="flex flex-col items-center justify-center gap-2 px-12 py-4"
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        backfaceVisibility: "hidden",
                        backgroundColor: "black",
                        borderRadius: "2rem",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        transform: "rotateY(180deg)",
                        overflow: "auto",
                      }}
                    >
                        {randomFlashcard.hook && (
                        <p className="flex flex-col w-full">
                          <strong className="text-white">Hook:</strong> 
                          <span className="text-neutral-200 text-sm">{randomFlashcard.hook}</span>
                        </p>
                      )}
                      <p className="flex flex-col w-full">
                        <strong className="text-white">Meaning:</strong>
                        <span className="text-neutral-200 text-sm">
                          {randomFlashcard.meaning}
                        </span>
                      </p>
                      <div className="flex flex-col gap-2 justify-between w-full">
                        {randomFlashcard.synonyms &&
                          Array.isArray(randomFlashcard.synonyms) &&
                          randomFlashcard.synonyms.length > 0 && (
                            <p className="flex flex-col">
                              <strong className="text-emerald-500">
                                Synonyms:
                              </strong>
                              <span className="flex flex-wrap gap-2 text-white text-sm">
                                {randomFlashcard.synonyms.map((syn: string, idx: number) => (
                                  <span className="bg-emerald-300 text-black px-4 py-2 rounded-full" key={syn + idx}>{syn}</span>
                                ))}
                              </span>
                            </p>
                          )}

                        {randomFlashcard.antonyms &&
                          Array.isArray(randomFlashcard.antonyms) &&
                          randomFlashcard.antonyms.length > 0 && (
                            <p className="flex flex-col">
                              <strong className="text-red-500">
                                Antonyms:
                              </strong>
                              <span className="flex gap-2 text-white text-sm">
                                {randomFlashcard.antonyms.map((ant: string, idx: number) => (
                                  <span className="px-4 py-2 text-black bg-purple-300 rounded-full" key={ant + idx}>{ant}</span>
                                ))}
                              </span>
                            </p>
                          )}
                      </div>
                      {randomFlashcard.example && (
                        <p className="flex flex-col w-full">
                          <strong className="text-white">Example:</strong> 
                          <span className="text-neutral-200 text-sm">{randomFlashcard.example}</span>
                        </p>
                      )}
                    </div>
                  </motion.div>
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0 && !hasPrevPage}
                    className={`px-4 py-2 rounded-xl flex border gap-2 justify-center items-center ${
                      currentIndex === 0 && !hasPrevPage
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-emerald-300 text-black"
                    }`}
                  >
                    <MdOutlineArrowBack />Prev
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={
                      (currentIndex === flashcards.length - 1 &&
                        !hasNextPage) ||
                      flashcards.length === 0
                    }
                    className={`px-4 py-2 flex items-center justify-center border gap-2 rounded-xl ${
                      (currentIndex === flashcards.length - 1 &&
                        !hasNextPage) ||
                      flashcards.length === 0
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-emerald-300 text-black"
                    }`}
                  >
                    Next <MdOutlineArrowForward />
                  </button>
                </div>
              </>
            )
          )}
        </div>
      )}

      {activeTab === "yourFlashcards" && (
        <div>
          {loading ? (
            <div className="flex justify-center items-center">
              <Loader />
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
  {/* Header */}
  <div className="flex items-center gap-2 mb-5 text-gray-700">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
    <h3 className="font-semibold text-lg">Add New Word</h3>
  </div>

  {/* Main Word & Meaning Row */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
    <div className="relative group">
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
        Word
      </label>
      <input
        type="text"
        placeholder="e.g., Serendipity"
        value={newWord}
        onChange={(e) => setNewWord(e.target.value)}
        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none transition-all duration-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-gray-400 font-medium text-gray-800"
      />
      <div className="absolute right-3 top-[2.1rem] text-gray-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      </div>
    </div>

    <div className="relative group">
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
        Meaning
      </label>
      <textarea
        placeholder="Enter definition..."
        value={newMeaning}
        onChange={(e) => setNewMeaning(e.target.value)}
        rows={1}
        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none transition-all duration-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-gray-400 resize-none text-gray-700 leading-relaxed"
      />
    </div>
  </div>

  {/* Type & Hook Row */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
    <div className="relative">
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
        Part of Speech
      </label>
      <div className="relative">
        <input
          type="text"
          placeholder="noun, verb, adjective..."
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none transition-all duration-200 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 placeholder:text-gray-400 text-sm"
        />
        <span className="absolute right-3 top-2.5 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">Type</span>
      </div>
    </div>

    <div className="relative">
      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
        Memory Hook
      </label>
      <input
        type="text"
        placeholder="Mnemonic or association..."
        value={newHook}
        onChange={(e) => setNewHook(e.target.value)}
        className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none transition-all duration-200 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 placeholder:text-gray-400 text-sm"
      />
    </div>
  </div>

  {/* Example Sentence */}
  <div className="mb-4">
    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
      Example Usage
    </label>
    <div className="relative">
      <input
        type="text"
        placeholder="Use the word in a sentence..."
        value={newExample}
        onChange={(e) => setNewExample(e.target.value)}
        className="w-full px-4 py-2.5 pl-10 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-gray-400 text-sm italic"
      />
    </div>
  </div>

  {/* Synonyms & Antonyms Row */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
    <div>
      <label className="block text-xs font-medium text-emerald-600 uppercase tracking-wider mb-1.5">
        Synonyms
      </label>
      <input
        type="text"
        placeholder="happy, joyful, cheerful..."
        value={newSynonyms}
        onChange={(e) => setNewSynonyms(e.target.value)}
        className="w-full px-4 py-2.5 bg-emerald-50/50 border-2 border-emerald-200 rounded-xl outline-none transition-all duration-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-emerald-400/70 text-sm"
      />
    </div>

    <div>
      <label className="block text-xs font-medium text-rose-600 uppercase tracking-wider mb-1.5">
        Antonyms
      </label>
      <input
        type="placeholder"
        placeholder="sad, unhappy, miserable..."
        value={newAntonyms}
        onChange={(e) => setNewAntonyms(e.target.value)}
        className="w-full px-4 py-2.5 bg-rose-50/50 border-2 border-rose-200 rounded-xl outline-none transition-all duration-200 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 placeholder:text-rose-400/70 text-sm"
      />
    </div>
  </div>

  {/* Submit Button */}
  <button
    onClick={handleAddFlashcard}
    className="w-full bg-emerald-300 border text-black font-semibold py-3.5 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 group"
  >
    <svg className="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
    Add Flashcard
  </button>
</div>
              <h1 className="text-xl border-b p-4">Your Flashcards</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 mt-4">
                {filteredFlashcards.map((flashcard, index) => {
                  return (
                    <div
                      key={index}
                      className="w-full h-98 cursor-pointer"
                      onClick={() => toggleFlip(index)}
                    >
                      <motion.div
                        ref={(el) => {
                          if (el) {
                            cardRefs.current.set(index, el);
                          }
                        }}
                        style={{
                          width: "100%",
                          height: "100%",
                          position: "relative",
                          transformStyle: "preserve-3d",
                          transformOrigin: "center center",
                          cursor: "pointer",
                          perspective: 1000,
                        }}
                      >
                        {/* Front side */}
                        <div
                          style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            backfaceVisibility: "hidden",
                            backgroundColor: "black",
                            border: "1px solid #d1d5db",
                            borderRadius: "2rem",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            padding: "1rem",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          {/* Arrow button in bottom-right corner */}
                          <div
                            style={{
                              position: "absolute",
                              bottom: "0.75rem",
                              right: "0.75rem",
                              zIndex: 2,
                            }}
                          >
                            <div className="bg-white flex items-center justify-center rounded-full h-12 w-12 shadow">
                              <MdOutlineArrowOutward className="text-black text-4xl" />
                            </div>
                          </div>
                          <h4 className="text-3xl text-white font-bold">
                            {flashcard.word}
                          </h4>
                          <p className="text-sm text-black bg-purple-300 px-4 uppercase py-2 rounded-full mt-2">
                            # {flashcard.type || ""}
                          </p>
                        </div>
                        {/* Back side */}
                        <div
                          className="flex flex-col items-center justify-center gap-2 px-6 py-4"
                          style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            backfaceVisibility: "hidden",
                            backgroundColor: "black",
                            borderRadius: "2rem",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            transform: "rotateY(180deg)",
                            overflow: "auto",
                          }}
                        >
                          {flashcard.hook && (
                            <p className="flex flex-col w-full">
                              <strong className="text-white">Hook:</strong>
                              <span className="text-neutral-200 text-sm">{flashcard.hook}</span>
                            </p>
                          )}
                          <p className="flex flex-col w-full">
                            <strong className="text-white">Meaning:</strong>
                            <span className="text-neutral-200 text-sm">
                              {flashcard.meaning}
                            </span>
                          </p>
                          <div className="flex flex-col gap-2 justify-between w-full">
                            {flashcard.synonyms &&
                              Array.isArray(flashcard.synonyms) &&
                              flashcard.synonyms.length > 0 && (
                                <p className="flex flex-col">
                                  <strong className="text-emerald-500">
                                    Synonyms:
                                  </strong>
                                  <span className="flex flex-wrap gap-2 text-white text-sm">
                                    {flashcard.synonyms.map((syn: string, idx: number) => (
                                      <span className="bg-emerald-300 text-black px-4 py-2 rounded-full" key={syn + idx}>{syn}</span>
                                    ))}
                                  </span>
                                </p>
                              )}
                            {flashcard.antonyms &&
                              Array.isArray(flashcard.antonyms) &&
                              flashcard.antonyms.length > 0 && (
                                <p className="flex flex-col">
                                  <strong className="text-red-500">
                                    Antonyms:
                                  </strong>
                                  <span className="flex flex-wrap gap-2 text-white text-sm">
                                    {flashcard.antonyms.map((ant: string, idx: number) => (
                                      <span className="px-4 py-2 text-black bg-purple-300 rounded-full" key={ant + idx}>{ant}</span>
                                    ))}
                                  </span>
                                </p>
                              )}
                          </div>
                          {flashcard.example && (
                            <p className="flex flex-col w-full">
                              <strong className="text-white">Example:</strong>
                              <span className="text-neutral-200 text-sm">{flashcard.example}</span>
                            </p>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}