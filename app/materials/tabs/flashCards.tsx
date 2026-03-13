import { useState, useEffect, useRef } from "react";
import { IoSearch } from "react-icons/io5";
import { createClient } from "@/lib/supabase/client";
import { gsap } from "gsap";
import { motion } from "framer-motion";
import Skeletal from "@/app/components/ui/skeletal";
import Loader from "@/app/components/ui/loader";

const supabase = createClient();
interface Flashcard {
  word: string;
  meaning: string;
  type?: string;
  synonyms?: string;
  antonyms?: string;
  hook?: string;
  example?: string;
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

  useEffect(() => {
    async function fetchRandomFlashcard() {
      setLoading(true);
      const { data, error } = await supabase
        .from("flash_cards")
        .select("word, meaning, type, synonyms, antonyms, hook, example");
      if (error) {
        console.error("Error fetching flashcards:", error.message || error);
        setLoading(false);
        return;
      }
      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        setRandomFlashcard(data[randomIndex]);
      }
      setLoading(false);
    }
    fetchRandomFlashcard();
  }, []);

  useEffect(() => {
    async function fetchUserFlashcards() {
      setLoading(true);
      const { data, error } = await supabase
        .from("flash_cards")
        .select("word, meaning, type, synonyms, antonyms, hook, example");
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
      if (newSet.has(index)) {
        newSet.delete(index);
        if (card) {
          gsap.to(card, { rotationY: 0, duration: 0.6, ease: "power2.out" });
        }
      } else {
        newSet.add(index);
        if (card) {
          gsap.to(card, { rotationY: 180, duration: 0.6, ease: "power2.out" });
        }
      }
      return newSet;
    });
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
                    <IoSearch className="text-xl"/>
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
              <div
                className="w-64 h-40 mt-4 mx-auto cursor-pointer"
                onClick={() => toggleFlip(-1)}
              >
                <motion.div
                  ref={(el) => {
                    if (el) {
                      cardRefs.current.set(-1, el);
                    }
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    transformStyle: "preserve-3d",
                    transformOrigin: "center right",
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
                      backgroundColor: "white",
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
                    <h4 className="text-xl font-bold">
                      {randomFlashcard.word}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {randomFlashcard.type || ""}
                    </p>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      backfaceVisibility: "hidden",
                      backgroundColor: "#f3f4f6",
                      border: "1px solid #d1d5db",
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
                      <strong>Meaning:</strong> {randomFlashcard.meaning}
                    </p>
                    {randomFlashcard.synonyms && (
                      <p>
                        <strong>Synonyms:</strong> {randomFlashcard.synonyms}
                      </p>
                    )}
                    {randomFlashcard.antonyms && (
                      <p>
                        <strong>Antonyms:</strong> {randomFlashcard.antonyms}
                      </p>
                    )}
                    {randomFlashcard.hook && (
                      <p>
                        <strong>Hook:</strong> {randomFlashcard.hook}
                      </p>
                    )}
                    {randomFlashcard.example && (
                      <p>
                        <strong>Example:</strong> {randomFlashcard.example}
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>
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
                          transformOrigin: "center right",
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
                            backgroundColor: "white",
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
                            backgroundColor: "#f3f4f6",
                            border: "1px solid #d1d5db",
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
                          {flashcard.synonyms && (
                            <p>
                              <strong>Synonyms:</strong> {flashcard.synonyms}
                            </p>
                          )}
                          {flashcard.antonyms && (
                            <p>
                              <strong>Antonyms:</strong> {flashcard.antonyms}
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
