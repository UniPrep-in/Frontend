"use client"
import Loader from "@/app/components/ui/loader"
import { useEffect, useState, useMemo, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import ComingSoon from "@/app/components/ui/comingSoon"
import { useRouter } from "next/navigation"
import { ChevronDown, Filter, X } from "lucide-react"

type Note = {
  id: string
  title: string
  pdf_url: string
  bucket: string
  subject: string
  stream: string
}

const supabase = createClient()

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStream, setSelectedStream] = useState<string>("All")
  const [selectedSubject, setSelectedSubject] = useState<string>("All")
  const [isStreamOpen, setIsStreamOpen] = useState(false)
  const [isSubjectOpen, setIsSubjectOpen] = useState(false)

  const router = useRouter()

  // Fetch notes from Supabase
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          console.error("No active session")
          setLoading(false)
          return
        }

        const { data, error } = await supabase.from("notes").select("*")

        if (error) {
          console.error("Supabase error:", error)
        } else {
          console.log("Fetched notes:", data)
          setNotes(data || [])
        }
      } catch (err) {
        console.error("Fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchNotes()
  }, [])

  // Get unique streams from actual data
  const availableStreams = useMemo(() => {
    const streams = new Set(notes.map((note) => note.stream).filter(Boolean))
    const streamList = ["All", ...Array.from(streams)]
    console.log("Available streams:", streamList)
    return streamList
  }, [notes])

  // Get unique subjects from actual data (optionally filtered by stream)
  const availableSubjects = useMemo(() => {
    let filteredNotes = notes
    if (selectedStream !== "All") {
      filteredNotes = notes.filter((note) => note.stream === selectedStream)
    }
    const subjects = new Set(filteredNotes.map((note) => note.subject).filter(Boolean))
    const subjectList = ["All", ...Array.from(subjects)]
    console.log("Available subjects for", selectedStream, ":", subjectList)
    return subjectList
  }, [notes, selectedStream])

  // Handle stream change
  const handleStreamChange = useCallback((newStream: string) => {
    setSelectedStream(newStream)
    setSelectedSubject("All") // Reset subject when stream changes
    setIsStreamOpen(false)
  }, [])

  // Handle subject change
  const handleSubjectChange = useCallback((newSubject: string) => {
    setSelectedSubject(newSubject)
    setIsSubjectOpen(false)
  }, [])

  // Filter notes
  const filteredNotes = useMemo(() => {
    const result = notes.filter((note) => {
      const streamMatch = selectedStream === "All" || note.stream === selectedStream
      const subjectMatch = selectedSubject === "All" || note.subject === selectedSubject
      return streamMatch && subjectMatch
    })
    console.log("Filtered notes:", result.length, "of", notes.length)
    return result
  }, [notes, selectedStream, selectedSubject])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest(".dropdown-container")) {
        setIsStreamOpen(false)
        setIsSubjectOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const clearFilters = useCallback(() => {
    setSelectedStream("All")
    setSelectedSubject("All")
  }, [])

  const hasActiveFilters = selectedStream !== "All" || selectedSubject !== "All"

  if (loading) {
    return (
      <main className="flex items-center justify-center">
        <Loader />
      </main>
    )
  }

  return (
    <main className="px-6 pt-4 pb-24">
      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-2xl text-black font-semibold">Notes</h1>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-neutral-600">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filter by:</span>
          </div>

          {/* Stream Dropdown - Only show if we have streams */}
          {availableStreams.length > 1 && (
            <div className="relative dropdown-container">
              <button
                onClick={() => {
                  setIsStreamOpen(!isStreamOpen)
                  setIsSubjectOpen(false)
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                  selectedStream !== "All"
                    ? "bg-blue-300 text-black border"
                    : "bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200"
                }`}
              >
                {selectedStream === "All" ? "Stream" : selectedStream}
                <ChevronDown className={`h-4 w-4 transition-transform ${isStreamOpen ? "rotate-180" : ""}`} />
              </button>

              {isStreamOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl border border-neutral-200 shadow-lg z-50 max-h-60 overflow-y-auto">
                  {availableStreams.map((stream) => (
                    <button
                      key={stream}
                      onClick={() => handleStreamChange(stream)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        selectedStream === stream
                          ? "bg-blue-50 text-black font-medium"
                          : "text-black hover:bg-neutral-50"
                      }`}
                    >
                      {stream}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Subject Dropdown - Only show if we have subjects */}
          {availableSubjects.length > 1 && (
            <div className="relative dropdown-container">
              <button
                onClick={() => {
                  setIsSubjectOpen(!isSubjectOpen)
                  setIsStreamOpen(false)
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                  selectedSubject !== "All"
                    ? "bg-emerald-300 text-black border"
                    : "bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200"
                }`}
              >
                {selectedSubject === "All" ? "Subject" : selectedSubject}
                <ChevronDown className={`h-4 w-4 transition-transform ${isSubjectOpen ? "rotate-180" : ""}`} />
              </button>

              {isSubjectOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl border border-neutral-200 shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
                  {availableSubjects.map((subject) => (
                    <button
                      key={subject}
                      onClick={() => handleSubjectChange(subject)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        selectedSubject === subject
                          ? "bg-green-50 text-green-700 font-medium"
                          : "text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="py-4 text-sm text-neutral-600">
        Showing {filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"}
        {notes.length > 0 && ` of ${notes.length} total`}
        {hasActiveFilters}
      </div>

      {filteredNotes.length === 0 ? (
        <div className="flex flex-col justify-center items-center py-12">
          {notes.length === 0 ? (
            <div className="text-center">
              <p className="text-neutral-500 mb-4">No notes available in database</p>
              <ComingSoon />
            </div>
          ) : (
            <div className="text-center">
              <p className="text-neutral-500 mb-2">No notes match your filters</p>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters to see all notes
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="p-4 col-span-1 shadow-lg rounded-2xl bg-white duration-300 hover:scale-105 transition"
            >
              <div className="relative w-full h-50 mb-3 rounded-md overflow-hidden">
                <img
                  src="/assets/notes.png"
                  alt="preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center p-2">
                  <span className="text-xl text-black font-medium line-clamp-2 text-center">
                    {note.title}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 flex-wrap">
                {note.stream && (
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                    {note.stream}
                  </span>
                )}
                {note.subject && (
                  <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                    {note.subject}
                  </span>
                )}
              </div>

              <div className="py-4">
                <span>Revise & Study about {note.title} using the notes provided below.</span>
              </div>

              <button
                onClick={() => {
                  const path = note.pdf_url
                    ?.split("/object/sign/notes/")[1]
                    ?.split("?")[0]

                  if (path) {
                    router.push(`/viewer?file=${encodeURIComponent(path)}`)
                  }
                }}
                className="inline-block py-4 px-6 rounded-xl text-sm bg-purple-300 text-black border font-medium"
              >
                View Notes
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}