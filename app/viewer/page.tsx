"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"

export default function Viewer() {
  const searchParams = useSearchParams()
  const file = searchParams.get("file")

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key)) ||
        (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    // Detect devtools open (basic trick)
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

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      clearInterval(checkDevTools)
    }
  }, [])

  if (!file) {
    return <div className="p-6">No file found</div>
  }

  return (
    <main
      className="w-full h-screen bg-black"
      onContextMenu={(e) => e.preventDefault()} // disable right click
    >
      <iframe
        src={`${file}#toolbar=0&navpanes=0&scrollbar=0`}
        className="w-full h-full"
      />
    </main>
  )
}