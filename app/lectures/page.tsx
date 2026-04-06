"use client";
import ComingSoon from "../components/ui/comingSoon";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { RotateCcw } from "lucide-react";
import type { ContentCategory, MainStreamLabel } from "@/lib/subscriptions";

type Lecture = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  is_live: boolean;
  subject: string;
  stream: string;
  category: Exclude<ContentCategory, "all">;
  mainStreamLabel: MainStreamLabel | null;
};

type SubscriptionAccessResponse = {
  streamLabel?: MainStreamLabel | null;
  allowedCategories?: ContentCategory[];
  isSubscriber?: boolean;
  selectableStreams?: MainStreamLabel[];
};

type LecturesResponse = {
  lectures?: Lecture[];
  error?: string;
};

const CATEGORY_LABELS: Record<ContentCategory, string> = {
  all: "All",
  main: "Main Stream",
  english: "English",
  gat: "GAT",
};

function FilterTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-linear-to-br from-blue-500 to-blue-600 text-white shadow-md"
          : "bg-neutral-200 text-black hover:bg-neutral-300"
      }`}
    >
      {children}
    </button>
  );
}

export default function Lecture() {
  const [allLectures, setAllLectures] = useState<Lecture[]>([]);
  const [selectedStream, setSelectedStream] =
    useState<MainStreamLabel>("Science");
  const [selectableStreams, setSelectableStreams] = useState<
    MainStreamLabel[]
  >([]);
  const [allowedCategories, setAllowedCategories] = useState<
    ContentCategory[]
  >([]);
  const [selectedCategory, setSelectedCategory] =
    useState<ContentCategory>("all");
  const [isSubscriber, setIsSubscriber] = useState(true);
  const [accessLoading, setAccessLoading] = useState(true);
  const [lecturesLoading, setLecturesLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAccess = async () => {
      try {
        const response = await fetch("/api/payments/subscription-status");

        if (!response.ok) {
          throw new Error("Unable to load your lecture access.");
        }

        const payload = (await response.json()) as SubscriptionAccessResponse;

        if (!isMounted) {
          return;
        }

        const initialStream = payload.streamLabel ?? "Science";
        setSelectedStream(initialStream);
        setSelectableStreams(payload.selectableStreams ?? [initialStream]);
        setAllowedCategories(payload.allowedCategories ?? []);
        setIsSubscriber(Boolean(payload.isSubscriber));
        setSelectedCategory("all");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load your lecture access.",
        );
      } finally {
        if (isMounted) {
          setAccessLoading(false);
        }
      }
    };

    void loadAccess();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (allowedCategories.length === 0) {
      return;
    }

    let isMounted = true;
    setLecturesLoading(true);
    setErrorMessage(null);

    const loadLectures = async () => {
      try {
        const response = await fetch("/api/lectures?category=all");
        const payload = (await response.json().catch(() => null)) as
          | LecturesResponse
          | null;

        if (!response.ok || !payload) {
          throw new Error("Unable to load lectures right now.");
        }

        if (!isMounted) {
          return;
        }

        setAllLectures(payload.lectures ?? []);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load lectures right now.",
        );
      } finally {
        if (isMounted) {
          setLecturesLoading(false);
        }
      }
    };

    void loadLectures();

    return () => {
      isMounted = false;
    };
  }, [allowedCategories]);

  const filteredLectures = useMemo(() => {
    if (selectedCategory === "all") {
      return allLectures.filter(
        (lecture) =>
          lecture.category !== "main" || lecture.mainStreamLabel === selectedStream,
      );
    }

    if (selectedCategory === "main") {
      return allLectures.filter(
        (lecture) =>
          lecture.category === "main" &&
          lecture.mainStreamLabel === selectedStream,
      );
    }

    return allLectures.filter((lecture) => lecture.category === selectedCategory);
  }, [allLectures, selectedCategory, selectedStream]);

  const liveLectures = useMemo(
    () => filteredLectures.filter((lecture) => lecture.is_live),
    [filteredLectures],
  );
  const recordedLectures = useMemo(
    () => filteredLectures.filter((lecture) => !lecture.is_live),
    [filteredLectures],
  );
  const loading = accessLoading || lecturesLoading;
  const resetFilters = () => {
    setSelectedCategory("all");
  };

  const renderLectureGrid = (items: Lecture[], live: boolean) => {
    if (items.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm text-neutral-500">
          No lectures available in this category yet.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((lecture) => (
          <a
            key={lecture.id}
            href={`/lectures/${lecture.id}`}
            className="overflow-hidden rounded-lg border transition hover:shadow-md"
          >
            <div className="relative h-40 bg-gray-200">
              <Image
                src={lecture.thumbnail_url || "https://via.placeholder.com/300"}
                alt={lecture.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />

              {live ? (
                <span className="absolute top-2 left-2 rounded bg-red-500 px-2 py-1 text-xs text-white">
                  LIVE
                </span>
              ) : null}

              {lecture.stream ? (
                <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[11px] text-white">
                  {lecture.stream}
                </span>
              ) : null}
            </div>

            <div className="p-3">
              <p className="line-clamp-2 text-sm font-medium">
                {lecture.title}
              </p>
            </div>
          </a>
        ))}
      </div>
    );
  };

  return (
    <main>
      <div className="p-4 md:p-8">
        {/* 
        <h1 className="mb-6 text-xl font-semibold">Lectures</h1>

        {selectableStreams.length > 0 ? (
          <section className="mb-8 rounded-3xl border border-neutral-100 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-neutral-500">
                  Stream:
                </span>
                {isSubscriber ? (
                  <span className="rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white">
                    {selectedStream}
                  </span>
                ) : (
                  selectableStreams.map((stream) => (
                    <FilterTab
                      key={stream}
                      active={selectedStream === stream}
                      onClick={() => {
                        setSelectedStream(stream);
                        setSelectedCategory("all");
                      }}
                    >
                      {stream}
                    </FilterTab>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="mr-2 text-sm font-medium text-neutral-500">
                    Category:
                  </span>
                  {allowedCategories.map((category) => (
                    <FilterTab
                      key={category}
                      active={selectedCategory === category}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {CATEGORY_LABELS[category]}
                    </FilterTab>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={resetFilters}
                  disabled={selectedCategory === "all"}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {loading ? (
          <p className="text-gray-500">Loading lectures...</p>
        ) : errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : (
          <>
            <div className="mb-10">
              <h2 className="mb-4 text-lg font-semibold">Live Lectures</h2>
              {renderLectureGrid(liveLectures, true)}
            </div>

            <div>
              <h2 className="mb-4 text-lg font-semibold">Recorded Lectures</h2>
              {renderLectureGrid(recordedLectures, false)}
            </div>
          </>
        )}
          */}

          <ComingSoon />
      </div>
    </main>
  );
}
