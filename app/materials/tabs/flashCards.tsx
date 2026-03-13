import { useState, useEffect, useRef } from "react";
import { IoSearch } from "react-icons/io5";
import { createClient } from "@/lib/supabase/client";
import { gsap } from "gsap";
import { motion } from "framer-motion";
import Skeletal from "@/app/components/ui/skeletal";
import Loader from "@/app/components/ui/loader";
import { MdOutlineArrowOutward } from "react-icons/md";

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
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Pagination states for "search" tab (queue of 5)
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 5;
  const [hasNextPage, setHasNextPage] = useState(true);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  // Fetch flashcards for "search" tab in batches of 5
  useEffect(() => {
    if (activeTab !== "search") return;
    async function fetchFlashcardPage() {
      setLoading(true);
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
      setFlashcards(data || []);
      setCurrentIndex(0);
      setRandomFlashcard(data && data.length > 0 ? data[0] : null);
      setHasPrevPage(page > 0);
      setHasNextPage(data && data.length === PAGE_SIZE);
      setLoading(false);
    }
    fetchFlashcardPage();
  }, [page, activeTab]);

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
    const { data, error } = await supabase
      .from("flash_cards")
      .insert([{ word: newWord, meaning: newMeaning }])
      .select();
    if (error) {
      console.error("Error adding flashcard:", error.message || error);
      return;
    }
    if (data) {
      setFlashcards((prev) => [...prev, data[0]]);
      setNewWord("");
      setNewMeaning("");
    }
  }

  const filteredFlashcards = flashcards.filter(
    (flashcard) =>
      flashcard.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flashcard.meaning.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
      setCurrentIndex(currentIndex - 1);
      setRandomFlashcard(flashcards[currentIndex - 1]);
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
      setCurrentIndex(currentIndex + 1);
      setRandomFlashcard(flashcards[currentIndex + 1]);
      setFlippedCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(-1);
        return newSet;
      });
    } else if (hasNextPage) {
      setPage(page + 1);
      // currentIndex and randomFlashcard will be set by useEffect
    }
  }

  return (
    <main>
      <div className="flex justify-between gap-2 items-center">
        <button
          className="bg-black text-white rounded-xl px-4 py-2"
          onClick={() => setActiveTab("search")}
          disabled={activeTab === "search"}
        >
          Search
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
        <div className="bg-neutral-100 rounded-xl p-8">
          <div className="relative p-0.5 bg-linear-to-br from-emerald-300 via-blue-300 to-purple-300 rounded-full w-fit">
            <div className="bg-white rounded-full px-6 py-2 flex items-center gap-2 justify-center w-fit">
              <span className="border-r pr-2">
                <IoSearch className="text-xl" />
              </span>
              <input
                type="text"
                placeholder="Search Flashcard..."
                value={searchTerm}
                className="text-black outline-none flex-1 bg-transparent focus:border-transparent rounded"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
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
                    className={`px-4 py-2 rounded-xl ${
                      currentIndex === 0 && !hasPrevPage
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-emerald-300 text-black"
                    }`}
                  >
                    Prev
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={
                      (currentIndex === flashcards.length - 1 &&
                        !hasNextPage) ||
                      flashcards.length === 0
                    }
                    className={`px-4 py-2 rounded-xl ${
                      (currentIndex === flashcards.length - 1 &&
                        !hasNextPage) ||
                      flashcards.length === 0
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-emerald-300 text-black"
                    }`}
                  >
                    Next
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
              <div>
                <input
                  type="text"
                  placeholder="Word"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                />
                <textarea
                  placeholder="Meaning"
                  value={newMeaning}
                  onChange={(e) => setNewMeaning(e.target.value)}
                />
                <button onClick={handleAddFlashcard}>Add Flashcard</button>
              </div>
              <ul className="flex flex-wrap gap-4 mt-4">
                {filteredFlashcards.map((flashcard, index) => {
                  return (
                    <li
                      key={index}
                      className="w-64 h-40 cursor-pointer"
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
                        <div
                          style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            backfaceVisibility: "hidden",
                            backgroundColor: "black",
                            border: "1px solid #d1d5db",
                            borderRadius: "0.5rem",
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
                            <div className="bg-white flex items-center justify-center rounded-full h-10 w-10 shadow">
                              <MdOutlineArrowOutward className="text-black text-2xl" />
                            </div>
                          </div>
                          <h4 className="text-xl font-bold">
                            {flashcard.word}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {flashcard.type || ""}
                          </p>
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            backfaceVisibility: "hidden",
                            backgroundColor: "black",
                            border: "1px solid black",
                            borderRadius: "0.5rem",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            padding: "1rem",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "flex-start",
                            transform: "rotateY(180deg)",
                            overflow: "auto",
                          }}
                        >
                          <p>
                            <strong>Meaning:</strong> {flashcard.meaning}
                          </p>
                          {flashcard.synonyms &&
                            Array.isArray(flashcard.synonyms) &&
                            flashcard.synonyms.length > 0 && (
                              <p>
                                <strong>Synonyms:</strong>{" "}
                                {flashcard.synonyms.map((syn: string, idx: number) => (
                                  <span key={syn + idx}>
                                    {syn}
                                    {idx < flashcard.synonyms!.length - 1 ? ", " : ""}
                                  </span>
                                ))}
                              </p>
                            )}
                          {flashcard.antonyms &&
                            Array.isArray(flashcard.antonyms) &&
                            flashcard.antonyms.length > 0 && (
                              <p>
                                <strong>Antonyms:</strong>{" "}
                                {flashcard.antonyms.map((ant: string, idx: number) => (
                                  <span key={ant + idx}>
                                    {ant}
                                    {idx < flashcard.antonyms!.length - 1 ? ", " : ""}
                                  </span>
                                ))}
                              </p>
                            )}
                          {flashcard.hook && (
                            <p>
                              <strong>Hook:</strong> {flashcard.hook}
                            </p>
                          )}
                          {flashcard.example && (
                            <p>
                              <strong>Example:</strong> {flashcard.example}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </main>
  );
}
