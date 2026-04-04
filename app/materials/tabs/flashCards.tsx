"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { motion } from "framer-motion";
import Skeletal from "@/app/components/ui/skeletal";
import Loader from "@/app/components/ui/loader";
import { MdOutlineArrowOutward } from "react-icons/md";
import {
  MdOutlineArrowBack,
  MdOutlineArrowForward,
} from "react-icons/md";
import type { Flashcard, FlashcardsSearchPage } from "@/lib/materials-data";

type FlashCardsProps = {
  initialSearchPage: FlashcardsSearchPage | null;
};

export default function FlashCards({
  initialSearchPage,
}: FlashCardsProps) {
  const [activeTab, setActiveTab] = useState<"search" | "yourFlashcards">(
    "search",
  );
  const [searchPage, setSearchPage] = useState<FlashcardsSearchPage | null>(
    initialSearchPage,
  );
  const [searchLoading, setSearchLoading] = useState(!initialSearchPage);
  const [searchError, setSearchError] = useState("");
  const [userFlashcards, setUserFlashcards] = useState<Flashcard[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState("");
  const [hasLoadedUserFlashcards, setHasLoadedUserFlashcards] =
    useState(false);
  const [newWord, setNewWord] = useState("");
  const [newMeaning, setNewMeaning] = useState("");
  const [newType, setNewType] = useState("");
  const [newHook, setNewHook] = useState("");
  const [newExample, setNewExample] = useState("");
  const [newSynonyms, setNewSynonyms] = useState("");
  const [newAntonyms, setNewAntonyms] = useState("");
  const [, setFlippedCards] = useState<Set<number>>(new Set());
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [page, setPage] = useState(initialSearchPage?.currentPage ?? 0);

  useEffect(() => {
    if (activeTab !== "search") {
      return;
    }

    if (searchPage && searchPage.currentPage === page) {
      return;
    }

    let cancelled = false;

    const fetchSearchPage = async () => {
      setSearchLoading(true);
      setSearchError("");

      try {
        const response = await fetch(`/api/materials/flashcards?page=${page}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("We could not load flashcards right now.");
        }

        const payload = (await response.json()) as FlashcardsSearchPage;

        if (!cancelled) {
          setSearchPage(payload);
        }
      } catch (error) {
        console.error("Error fetching flashcards:", error);

        if (!cancelled) {
          setSearchError("We could not load flashcards right now.");
          setSearchPage(null);
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    };

    void fetchSearchPage();

    return () => {
      cancelled = true;
    };
  }, [activeTab, page, searchPage]);

  useEffect(() => {
    if (activeTab !== "yourFlashcards" || hasLoadedUserFlashcards) {
      return;
    }

    let cancelled = false;

    const fetchUserFlashcards = async () => {
      setUserLoading(true);
      setUserError("");

      try {
        const response = await fetch("/api/materials/flashcards?mode=mine", {
          cache: "no-store",
        });
        const payload = response.ok
          ? ((await response.json()) as { cards: Flashcard[] })
          : { cards: [] as Flashcard[] };

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Please sign in to view your flashcards.");
          }

          throw new Error("We could not load your flashcards right now.");
        }

        if (!cancelled) {
          setUserFlashcards(payload.cards);
          setHasLoadedUserFlashcards(true);
        }
      } catch (error) {
        console.error("Error fetching user flashcards:", error);

        if (!cancelled) {
          setUserError(
            error instanceof Error
              ? error.message
              : "We could not load your flashcards right now.",
          );
        }
      } finally {
        if (!cancelled) {
          setUserLoading(false);
        }
      }
    };

    void fetchUserFlashcards();

    return () => {
      cancelled = true;
    };
  }, [activeTab, hasLoadedUserFlashcards]);

  useEffect(() => {
    setCurrentIndex(0);
    setFlippedCards(new Set());
  }, [searchPage?.currentPage]);

  async function handleAddFlashcard() {
    if (!newWord.trim() || !newMeaning.trim()) {
      return;
    }

    const synonyms = newSynonyms
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const antonyms = newAntonyms
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    setUserLoading(true);
    setUserError("");

    try {
      const response = await fetch("/api/materials/flashcards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          word: newWord,
          meaning: newMeaning,
          type: newType,
          hook: newHook,
          example: newExample,
          synonyms,
          antonyms,
        }),
      });

      const payload = response.ok
        ? ((await response.json()) as { card: Flashcard })
        : null;

      if (!response.ok || !payload) {
        if (response.status === 401) {
          throw new Error("Please sign in to add a flashcard.");
        }

        throw new Error("Unable to add flashcard right now.");
      }

      setUserFlashcards((current) => [...current, payload.card]);
      setHasLoadedUserFlashcards(true);
      setNewWord("");
      setNewMeaning("");
      setNewType("");
      setNewHook("");
      setNewExample("");
      setNewSynonyms("");
      setNewAntonyms("");
    } catch (error) {
      console.error("Error adding flashcard:", error);
      setUserError(
        error instanceof Error
          ? error.message
          : "Unable to add flashcard right now.",
      );
    } finally {
      setUserLoading(false);
    }
  }

  function toggleFlip(index: number) {
    setFlippedCards((previous) => {
      const next = new Set(previous);
      const card = cardRefs.current.get(index);

      if (next.has(index)) {
        next.delete(index);

        if (card) {
          gsap.to(card, {
            rotationY: 0,
            duration: 0.6,
            ease: "power2.out",
            transformOrigin: "center center",
          });
        }
      } else {
        next.add(index);

        if (card) {
          gsap.to(card, {
            rotationY: 180,
            duration: 0.6,
            ease: "power2.out",
            transformOrigin: "center center",
          });
        }
      }

      return next;
    });
  }

  const currentSearchCards = searchPage?.cards ?? [];
  const currentFlashcard = currentSearchCards[currentIndex] ?? null;
  const hasPrevPage = searchPage?.hasPrevPage ?? false;
  const hasNextPage = searchPage?.hasNextPage ?? false;

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex((value) => value - 1);
      setFlippedCards((previous) => {
        const next = new Set(previous);
        next.delete(-1);
        return next;
      });
      return;
    }

    if (hasPrevPage) {
      setPage((value) => Math.max(value - 1, 0));
    }
  }

  function handleNext() {
    if (currentIndex < currentSearchCards.length - 1) {
      setCurrentIndex((value) => value + 1);
      setFlippedCards((previous) => {
        const next = new Set(previous);
        next.delete(-1);
        return next;
      });
      return;
    }

    if (hasNextPage) {
      setPage((value) => value + 1);
    }
  }

  return (
    <main>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-xl border bg-purple-300 px-4 py-2 text-black"
          onClick={() => setActiveTab("search")}
          disabled={activeTab === "search"}
        >
          View All Flashcards
        </button>
        <button
          type="button"
          className="rounded-xl border bg-emerald-300 px-4 py-2 text-black"
          onClick={() => setActiveTab("yourFlashcards")}
          disabled={activeTab === "yourFlashcards"}
        >
          Your Flashcards
        </button>
      </div>

      {activeTab === "search" ? (
        <div className="rounded-xl p-8">
          {searchLoading ? (
            <div className="flex items-center justify-center">
              <Skeletal />
            </div>
          ) : searchError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-700">
              {searchError}
            </div>
          ) : currentFlashcard ? (
            <>
              <div
                className="mx-auto mt-4 h-98 max-w-xl cursor-pointer"
                onClick={() => toggleFlip(-1)}
              >
                <motion.div
                  ref={(element) => {
                    if (element) {
                      cardRefs.current.set(-1, element);
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
                      borderRadius: "2rem",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      padding: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        bottom: "0.75rem",
                        right: "0.75rem",
                        zIndex: 2,
                      }}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow">
                        <MdOutlineArrowOutward className="text-4xl text-black" />
                      </div>
                    </div>
                    <h4 className="text-4xl font-bold text-white">
                      {currentFlashcard.word}
                    </h4>
                    <p className="rounded-full bg-purple-300 px-4 py-2 text-sm uppercase text-black">
                      # {currentFlashcard.type || ""}
                    </p>
                  </div>
                  <div
                    className="flex flex-col items-center justify-center gap-2 overflow-auto px-12 py-4"
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      backfaceVisibility: "hidden",
                      backgroundColor: "black",
                      borderRadius: "2rem",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    {currentFlashcard.hook ? (
                      <p className="flex w-full flex-col">
                        <strong className="text-white">Hook:</strong>
                        <span className="text-sm text-neutral-200">
                          {currentFlashcard.hook}
                        </span>
                      </p>
                    ) : null}
                    <p className="flex w-full flex-col">
                      <strong className="text-white">Meaning:</strong>
                      <span className="text-sm text-neutral-200">
                        {currentFlashcard.meaning}
                      </span>
                    </p>
                    <div className="flex w-full flex-col gap-2 justify-between">
                      {currentFlashcard.synonyms &&
                      currentFlashcard.synonyms.length > 0 ? (
                        <p className="flex flex-col">
                          <strong className="text-emerald-500">
                            Synonyms:
                          </strong>
                          <span className="flex flex-wrap gap-2 text-sm text-white">
                            {currentFlashcard.synonyms.map((synonym, index) => (
                              <span
                                className="rounded-full bg-emerald-300 px-4 py-2 text-black"
                                key={`${synonym}-${index}`}
                              >
                                {synonym}
                              </span>
                            ))}
                          </span>
                        </p>
                      ) : null}

                      {currentFlashcard.antonyms &&
                      currentFlashcard.antonyms.length > 0 ? (
                        <p className="flex flex-col">
                          <strong className="text-red-500">Antonyms:</strong>
                          <span className="flex gap-2 text-sm text-white">
                            {currentFlashcard.antonyms.map((antonym, index) => (
                              <span
                                className="rounded-full bg-purple-300 px-4 py-2 text-black"
                                key={`${antonym}-${index}`}
                              >
                                {antonym}
                              </span>
                            ))}
                          </span>
                        </p>
                      ) : null}
                    </div>
                    {currentFlashcard.example ? (
                      <p className="flex w-full flex-col">
                        <strong className="text-white">Example:</strong>
                        <span className="text-sm text-neutral-200">
                          {currentFlashcard.example}
                        </span>
                      </p>
                    ) : null}
                  </div>
                </motion.div>
              </div>

              <div className="mt-4 flex justify-center gap-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentIndex === 0 && !hasPrevPage}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2 ${
                    currentIndex === 0 && !hasPrevPage
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-emerald-300 text-black"
                  }`}
                >
                  <MdOutlineArrowBack />
                  Prev
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    (currentIndex === currentSearchCards.length - 1 &&
                      !hasNextPage) ||
                    currentSearchCards.length === 0
                  }
                  className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-2 ${
                    (currentIndex === currentSearchCards.length - 1 &&
                      !hasNextPage) ||
                    currentSearchCards.length === 0
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-emerald-300 text-black"
                  }`}
                >
                  Next
                  <MdOutlineArrowForward />
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-slate-600">
              No flashcards available right now.
            </div>
          )}
        </div>
      ) : null}

      {activeTab === "yourFlashcards" ? (
        <div>
          {userLoading ? (
            <div className="flex items-center justify-center">
              <Loader />
            </div>
          ) : (
            <>
              <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
                <div className="mb-5 flex items-center gap-2 text-gray-700">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold">Add New Word</h3>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="relative group">
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                      Word
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Serendipity"
                      value={newWord}
                      onChange={(event) => setNewWord(event.target.value)}
                      className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 font-medium text-gray-800 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                    <div className="absolute right-3 top-[2.1rem] text-gray-400">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="relative group">
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                      Meaning
                    </label>
                    <textarea
                      placeholder="Enter definition..."
                      value={newMeaning}
                      onChange={(event) => setNewMeaning(event.target.value)}
                      rows={1}
                      className="w-full resize-none rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 leading-relaxed text-gray-700 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="relative">
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                      Part of Speech
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="noun, verb, adjective..."
                        value={newType}
                        onChange={(event) => setNewType(event.target.value)}
                        className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-500/10"
                      />
                      <span className="absolute right-3 top-2.5 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
                        Type
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                      Memory Hook
                    </label>
                    <input
                      type="text"
                      placeholder="Mnemonic or association..."
                      value={newHook}
                      onChange={(event) => setNewHook(event.target.value)}
                      className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500">
                    Example Usage
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Use the word in a sentence..."
                      value={newExample}
                      onChange={(event) => setNewExample(event.target.value)}
                      className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-2.5 pl-10 text-sm italic outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-emerald-600">
                      Synonyms
                    </label>
                    <input
                      type="text"
                      placeholder="happy, joyful, cheerful..."
                      value={newSynonyms}
                      onChange={(event) => setNewSynonyms(event.target.value)}
                      className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50/50 px-4 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-emerald-400/70 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-rose-600">
                      Antonyms
                    </label>
                    <input
                      type="text"
                      placeholder="sad, unhappy, miserable..."
                      value={newAntonyms}
                      onChange={(event) => setNewAntonyms(event.target.value)}
                      className="w-full rounded-xl border-2 border-rose-200 bg-rose-50/50 px-4 py-2.5 text-sm outline-none transition-all duration-200 placeholder:text-rose-400/70 focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddFlashcard}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl border bg-emerald-300 py-3.5 font-semibold text-black shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <svg
                    className="h-5 w-5 transition-transform group-hover:rotate-90"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Flashcard
                </button>
              </div>

              {userError ? (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm text-rose-700">
                  {userError}
                </div>
              ) : null}

              <h1 className="border-b p-4 text-xl">Your Flashcards</h1>
              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
                {userFlashcards.map((flashcard, index) => (
                  <div
                    key={`${flashcard.word}-${index}`}
                    className="h-98 w-full cursor-pointer"
                    onClick={() => toggleFlip(index)}
                  >
                    <motion.div
                      ref={(element) => {
                        if (element) {
                          cardRefs.current.set(index, element);
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
                          borderRadius: "2rem",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                          padding: "1rem",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            bottom: "0.75rem",
                            right: "0.75rem",
                            zIndex: 2,
                          }}
                        >
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow">
                            <MdOutlineArrowOutward className="text-4xl text-black" />
                          </div>
                        </div>
                        <h4 className="text-3xl font-bold text-white">
                          {flashcard.word}
                        </h4>
                        <p className="mt-2 rounded-full bg-purple-300 px-4 py-2 text-sm uppercase text-black">
                          # {flashcard.type || ""}
                        </p>
                      </div>
                      <div
                        className="flex flex-col items-center justify-center gap-2 overflow-auto px-6 py-4"
                        style={{
                          position: "absolute",
                          width: "100%",
                          height: "100%",
                          backfaceVisibility: "hidden",
                          backgroundColor: "black",
                          borderRadius: "2rem",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                          transform: "rotateY(180deg)",
                        }}
                      >
                        {flashcard.hook ? (
                          <p className="flex w-full flex-col">
                            <strong className="text-white">Hook:</strong>
                            <span className="text-sm text-neutral-200">
                              {flashcard.hook}
                            </span>
                          </p>
                        ) : null}
                        <p className="flex w-full flex-col">
                          <strong className="text-white">Meaning:</strong>
                          <span className="text-sm text-neutral-200">
                            {flashcard.meaning}
                          </span>
                        </p>
                        <div className="flex w-full flex-col gap-2 justify-between">
                          {flashcard.synonyms && flashcard.synonyms.length > 0 ? (
                            <p className="flex flex-col">
                              <strong className="text-emerald-500">
                                Synonyms:
                              </strong>
                              <span className="flex flex-wrap gap-2 text-sm text-white">
                                {flashcard.synonyms.map((synonym, index) => (
                                  <span
                                    className="rounded-full bg-emerald-300 px-4 py-2 text-black"
                                    key={`${synonym}-${index}`}
                                  >
                                    {synonym}
                                  </span>
                                ))}
                              </span>
                            </p>
                          ) : null}
                          {flashcard.antonyms && flashcard.antonyms.length > 0 ? (
                            <p className="flex flex-col">
                              <strong className="text-red-500">
                                Antonyms:
                              </strong>
                              <span className="flex flex-wrap gap-2 text-sm text-white">
                                {flashcard.antonyms.map((antonym, index) => (
                                  <span
                                    className="rounded-full bg-purple-300 px-4 py-2 text-black"
                                    key={`${antonym}-${index}`}
                                  >
                                    {antonym}
                                  </span>
                                ))}
                              </span>
                            </p>
                          ) : null}
                        </div>
                        {flashcard.example ? (
                          <p className="flex w-full flex-col">
                            <strong className="text-white">Example:</strong>
                            <span className="text-sm text-neutral-200">
                              {flashcard.example}
                            </span>
                          </p>
                        ) : null}
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}
    </main>
  );
}
