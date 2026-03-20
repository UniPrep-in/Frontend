"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import ComingSoon from "@/app/components/ui/comingSoon"

type Note = {
  id: string
  title: string
  pdf_url: string
  bucket: string
  subject: string
  stream: string
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchNotes = async () => {
      const { data, error } = await supabase.from("notes").select("*")

      if (error) {
        console.error(error)
      } else {
        setNotes(data || [])
      }

      setLoading(false)
    }

    fetchNotes()
  }, [])

  if (loading) {
    return <main className="p-6 text-white">Loading notes...</main>
  }

  return (
    <main className="px-6 text-white">
      <h1 className="text-2xl text-black mb-6">Notes</h1>

      {notes.length === 0 ? (
        <p className="flex justify-center items-center">
            <ComingSoon />
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-4 border col-span-1 border-neutral-200 rounded-lg bg-neutral-100"
            >
              <h2 className="text-lg font-semibold text-black">{note.title}</h2>
              <p className="text-sm text-neutral-400">
                {note.bucket} • {note.subject} • {note.stream}
              </p>

              <a
                href={note.pdf_url}
                target="_blank"
                className="inline-block mt-3 text-blue-400 hover:underline"
              >
                View PDF
              </a>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}