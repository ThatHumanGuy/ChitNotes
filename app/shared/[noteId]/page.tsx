"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Lock } from "lucide-react"
import type { Note } from "@/lib/types"

export default function SharedNotePage({ params }: { params: { noteId: string } }) {
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    const validateAccess = () => {
      if (!token) {
        setError("Invalid access token")
        setLoading(false)
        return
      }

      try {
        // Get shares from localStorage
        const shares = JSON.parse(localStorage.getItem("shares") || "[]")

        // Find the share for this note
        const noteShare = shares.find((share: any) => share.noteId === params.noteId && share.token === token)

        if (!noteShare) {
          setError("This note has not been shared or the link is invalid")
          setLoading(false)
          return
        }

        // Check if it's a public share or if the user has access
        if (!noteShare.isPublic) {
          // In a real app, we would check if the current user's email
          // is in the recipients list. For now, we'll just allow access
          // since we don't have user authentication.
        }

        // Get the note from localStorage
        const notes = JSON.parse(localStorage.getItem("notes") || "[]")
        const foundNote = notes.find((n: Note) => n.id === params.noteId)

        if (!foundNote) {
          setError("Note not found")
          setLoading(false)
          return
        }

        setNote(foundNote)
        setLoading(false)
      } catch (error) {
        console.error("Error validating access:", error)
        setError("An error occurred while validating access")
        setLoading(false)
      }
    }

    validateAccess()
  }, [params.noteId, token])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#15131D] flex items-center justify-center">
        <div className="animate-pulse text-[#DFDFDF]">Loading...</div>
      </div>
    )
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-[#15131D] flex flex-col items-center justify-center p-4">
        <div className="bg-[#2B293A] border border-[#262433] rounded-xl p-8 max-w-md text-center">
          <Lock className="h-12 w-12 text-[#DFDFDF] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#DFDFDF] mb-2">Access Denied</h1>
          <p className="text-[#9998A9] mb-6">{error || "Unable to access this note"}</p>
          <Button onClick={() => router.push("/")} className="bg-[#33691E] hover:bg-[#33691E]/90 text-white">
            Go to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#15131D] flex flex-col">
      <header className="bg-[#2B293A] border-b border-[#262433] p-4 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="text-[#DFDFDF] hover:bg-[#262433]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        <h1 className="text-lg font-medium text-[#DFDFDF] ml-4">Shared Note</h1>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="bg-[#2B293A] border border-[#262433] rounded-xl overflow-hidden">
          <div className="p-6" style={{ borderTop: `4px solid ${note.color}` }}>
            <h1 className="text-3xl font-bold text-[#DFDFDF] mb-4">{note.title}</h1>
            <p className="text-sm text-[#9998A9] mb-6">Last updated: {new Date(note.updatedAt).toLocaleString()}</p>
            <div className="whitespace-pre-wrap text-[#DFDFDF]">{note.content}</div>
          </div>
        </div>
      </main>
    </div>
  )
}

