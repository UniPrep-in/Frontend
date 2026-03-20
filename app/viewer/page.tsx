"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { createClient } from "@/lib/supabase/client"

export const dynamic = "force-dynamic"

function ViewerContent() {
  const searchParams = useSearchParams()
  const file = searchParams.get("file")
  const supabase = createClient()
  const [url, setUrl] = useState("")

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
        (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    const devtools = { open: false }
    const threshold = 160

    const checkDevTools = setInterval(() => {
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        if (!devtools.open) {
          devtools.open = true
          document.body.innerHTML = "<h1 style='color:white;text-align:center;margin-top:20%'>Access Restricted</h1>"
        }
      } else {
        devtools.open = false
      }
    }, 1000)

    const getSignedUrl = async () => {
      if (!file) return

      const { data, error } = await supabase.storage
        .from("notes")
        .createSignedUrl(file, 60)

      if (error) {
        console.error(error)
        return
      }

      setUrl(data?.signedUrl || "")
    }

    getSignedUrl()

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      clearInterval(checkDevTools)
    }
  }, [file])

  if (!file) {
    return <div className="p-6">No file found</div>
  }

  return (
    <main
      className="w-full h-screen bg-black"
      onContextMenu={(e) => e.preventDefault()}
    >
      <iframe
        src={`${url}#toolbar=0&navpanes=0&scrollbar=0`}
        className="w-full h-full"
      />
    </main>
  )
}

export default function Viewer() {
  return (
    <Suspense fallback={<div className="p-6 text-white">Loading...</div>}>
      <ViewerContent />
    </Suspense>
  )
}