"use client";
import { useState } from "react";

export interface Flashcard {
  word: string;
  meaning: string;
  type?: string;
  synonyms?: string[];
  antonyms?: string[];
  example?: string;
}

type UserFlashcardCarouselProps = {
  initialFlashcards: Flashcard[];
};

export default function UserFlashcardCarousel({
  initialFlashcards,
}: UserFlashcardCarouselProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const flashcards = initialFlashcards;

  if (flashcards.length === 0) {
    return (
      <div className="p-6 border h-78 flex gap-2 flex-col justify-center items-center rounded-2xl bg-black">
        <span className="text-6xl">📝</span>
        <h1 className="text-white text-center text-xl max-w-xs">
          Flashcards you created will appear here
        </h1>
      </div>
    );
  }

  const card = flashcards[index];

  function next() {
    setFlipped(false);
    setIndex((prev) => (prev + 1) % flashcards.length);
  }

  function prev() {
    setFlipped(false);
    setIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        onClick={() => setFlipped(!flipped)}
        className="relative w-full h-72 cursor-pointer"
        style={{ perspective: "1000px" }}
      >
        <div
          className="absolute w-full h-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <div
            className="absolute w-full h-full bg-black rounded-2xl flex flex-col items-center justify-center border border-neutral-800"
            style={{ backfaceVisibility: "hidden" }}
          >
            <h3 className="text-white text-4xl font-bold">{card.word}</h3>

            {card.type ? (
              <span className="mt-2 text-md uppercase bg-purple-300 text-black px-3 py-1 rounded-full">
                # {card.type}
              </span>
            ) : null}

            <span className="text-xs text-neutral-400 mt-6">Click to flip</span>
          </div>

          <div
            className="absolute w-full h-full bg-neutral-900 rounded-2xl flex flex-col gap-3 items-center justify-center p-6 border border-neutral-800"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="text-neutral-200 text-sm text-center">{card.meaning}</p>

            {card.example ? (
              <p className="text-xs text-neutral-400 italic text-center">
                {card.example}
              </p>
            ) : null}

            {card.synonyms && card.synonyms.length > 0 ? (
              <div className="flex flex-wrap gap-2 justify-center">
                {card.synonyms.map((syn, i) => (
                  <span
                    key={i}
                    className="text-xs bg-emerald-400 text-black px-2 py-1 rounded-full"
                  >
                    {syn}
                  </span>
                ))}
              </div>
            ) : null}

            {card.antonyms && card.antonyms.length > 0 ? (
              <div className="flex flex-wrap gap-2 justify-center">
                {card.antonyms.map((ant, i) => (
                  <span
                    key={i}
                    className="text-xs bg-red-400 text-black px-2 py-1 rounded-full"
                  >
                    {ant}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={prev}
          className="px-4 py-2 bg-red-300 border text-black rounded-xl"
        >
          Prev
        </button>

        <span className="text-xs text-neutral-400">
          {index + 1} / {flashcards.length}
        </span>

        <button
          onClick={next}
          className="px-4 py-2 bg-emerald-300 border text-black rounded-xl"
        >
          Next
        </button>
      </div>
    </div>
  );
}
