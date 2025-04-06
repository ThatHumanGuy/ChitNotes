"use client"

import type { Note } from "@/lib/types"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"

interface NoteListProps {
  notes: Note[]
  onNoteSelect: (noteId: string) => void
}

export function NoteList({ notes, onNoteSelect }: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-muted-foreground mb-2">No notes found</p>
        <p className="text-sm text-muted-foreground">Create a new note using the + button</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => (
        <Card
          key={note.id}
          className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
          onClick={() => onNoteSelect(note.id)}
        >
          <CardHeader className="p-4 pb-2" style={{ borderTop: `4px solid ${note.color}` }}>
            <CardTitle className="flex justify-between items-start">
              <span className="text-lg font-semibold">{note.title}</span>
              <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <p className="text-muted-foreground line-clamp-4 text-sm">{note.content}</p>
          </CardContent>
          <CardFooter className="p-4 pt-0 text-xs text-muted-foreground">
            {new Date(note.updatedAt).toLocaleDateString()}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

