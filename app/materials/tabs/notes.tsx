"use client";

import Image from "next/image";
import Loader from "@/app/components/ui/loader";
import ComingSoon from "@/app/components/ui/comingSoon";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Filter, X } from "lucide-react";
import type { NoteSummary, NotesResponse } from "@/lib/materials-data";

const EMPTY_NOTES_RESPONSE: NotesResponse = {
  notes: [],
  totalCount: 0,
  availableStreams: ["All"],
  availableSubjects: ["All"],
};

export default function Notes() {
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStream, setSelectedStream] = useState<string>("All");
  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [availableStreams, setAvailableStreams] = useState<string[]>(["All"]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>(["All"]);
  const [totalCount, setTotalCount] = useState(0);
  const [isStreamOpen, setIsStreamOpen] = useState(false);
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);

  const router = useRouter();

  const fetchNotes = useCallback(
    async (stream: string, subject: string) => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (stream !== "All") {
          params.set("stream", stream);
        }

        if (subject !== "All") {
          params.set("subject", subject);
        }

        const query = params.toString();
        const response = await fetch(
          `/api/materials/notes${query ? `?${query}` : ""}`,
        );

        const payload = response.ok
          ? ((await response.json()) as NotesResponse)
          : EMPTY_NOTES_RESPONSE;

        if (!response.ok) {
          if (response.status === 401) {
            setError("Please sign in to view notes.");
          } else {
            setError("We could not load notes right now.");
          }
          setNotes([]);
          setAvailableStreams(payload.availableStreams);
          setAvailableSubjects(payload.availableSubjects);
          setTotalCount(0);
          return;
        }

        setNotes(payload.notes);
        setAvailableStreams(payload.availableStreams);
        setAvailableSubjects(payload.availableSubjects);
        setTotalCount(payload.totalCount);
      } catch (fetchError) {
        console.error("Fetch notes error:", fetchError);
        setError("We could not load notes right now.");
        setNotes([]);
        setAvailableStreams(["All"]);
        setAvailableSubjects(["All"]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchNotes(selectedStream, selectedSubject);
  }, [fetchNotes, selectedStream, selectedSubject]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest(".dropdown-container")) {
        setIsStreamOpen(false);
        setIsSubjectOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStreamChange = useCallback((newStream: string) => {
    setSelectedStream(newStream);
    setSelectedSubject("All");
    setIsStreamOpen(false);
  }, []);

  const handleSubjectChange = useCallback((newSubject: string) => {
    setSelectedSubject(newSubject);
    setIsSubjectOpen(false);
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedStream("All");
    setSelectedSubject("All");
  }, []);

  const hasActiveFilters =
    selectedStream !== "All" || selectedSubject !== "All";

  if (loading) {
    return (
      <main className="flex min-h-[42rem] items-center justify-center px-6 py-8">
        <Loader
          title="Loading notes"
          subtitle="Bringing your study notes into view."
        />
      </main>
    );
  }

  return (
    <main className="min-h-[42rem] overflow-x-hidden px-6 pt-6 pb-24">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-semibold text-black">Notes</h1>

        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-neutral-600">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filter by:</span>
          </div>

          {availableStreams.length > 1 ? (
            <div className="relative min-w-0 max-w-full dropdown-container">
              <button
                type="button"
                onClick={() => {
                  setIsStreamOpen((current) => !current);
                  setIsSubjectOpen(false);
                }}
                className={`flex max-w-full items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                  selectedStream !== "All"
                    ? "bg-blue-300 text-black border"
                    : "bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200"
                }`}
              >
                <span className="max-w-[10rem] truncate">
                  {selectedStream === "All" ? "Stream" : selectedStream}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    isStreamOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isStreamOpen ? (
                <div className="absolute left-0 top-full z-50 mt-2 max-h-60 w-48 max-w-[calc(100vw-3rem)] overflow-x-hidden overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
                  {availableStreams.map((stream) => (
                    <button
                      key={stream}
                      type="button"
                      onClick={() => handleStreamChange(stream)}
                      className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                        selectedStream === stream
                          ? "bg-blue-50 text-black font-medium"
                          : "text-black hover:bg-neutral-50"
                      }`}
                    >
                      {stream}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {availableSubjects.length > 1 ? (
            <div className="relative min-w-0 max-w-full dropdown-container">
              <button
                type="button"
                onClick={() => {
                  setIsSubjectOpen((current) => !current);
                  setIsStreamOpen(false);
                }}
                className={`flex max-w-full items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                  selectedSubject !== "All"
                    ? "bg-emerald-300 text-black border"
                    : "bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200"
                }`}
              >
                <span className="max-w-[11rem] truncate">
                  {selectedSubject === "All" ? "Subject" : selectedSubject}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    isSubjectOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isSubjectOpen ? (
                <div className="absolute left-0 top-full z-50 mt-2 max-h-64 w-56 max-w-[calc(100vw-3rem)] overflow-x-hidden overflow-y-auto rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
                  {availableSubjects.map((subject) => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => handleSubjectChange(subject)}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        selectedSubject === subject
                          ? "bg-green-50 text-green-700 font-medium"
                          : "text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-50"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="py-4 text-sm text-neutral-600">
        Showing {notes.length} {notes.length === 1 ? "note" : "notes"}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center text-rose-700">
          {error}
        </div>
      ) : null}

      {!error && notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          {totalCount === 0 && !hasActiveFilters ? (
            <div className="text-center">
              <p className="mb-4 text-neutral-500">
                No notes available in database
              </p>
              <ComingSoon />
            </div>
          ) : (
            <div className="text-center">
              <p className="mb-2 text-neutral-500">No notes match your filters</p>
              <button
                type="button"
                onClick={clearFilters}
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Clear filters to see all notes
              </button>
            </div>
          )}
        </div>
      ) : null}

      {!error && notes.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="col-span-1 rounded-2xl bg-white p-4 shadow-lg transition duration-300 hover:scale-105"
            >
              <div className="relative mb-3 h-50 w-full overflow-hidden rounded-md">
                <Image
                  src="/assets/notes.png"
                  alt="preview"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center p-2">
                  <span className="line-clamp-2 text-center text-xl font-medium text-black">
                    {note.title}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-4">
                {note.stream ? (
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                    {note.stream}
                  </span>
                ) : null}
                {note.subject ? (
                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                    {note.subject}
                  </span>
                ) : null}
              </div>

              <div className="py-4">
                <span>
                  Revise &amp; Study about {note.title} using the notes provided
                  below.
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const path = note.pdf_url
                    ?.split("/object/sign/notes/")[1]
                    ?.split("?")[0];

                  if (path) {
                    router.push(`/viewer?file=${encodeURIComponent(path)}`);
                  }
                }}
                className="inline-block rounded-xl border bg-purple-300 px-6 py-4 text-sm font-medium text-black"
              >
                View Notes
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </main>
  );
}
