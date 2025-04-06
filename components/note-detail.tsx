"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Note } from "@/lib/types"
import { ArrowLeft, Save, Trash, Share2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface NoteDetailProps {
  note: Note
  onClose: () => void
  onUpdate: (note: Note) => void
  onDelete: (noteId: string) => void
  onShare?: (noteId: string) => void
}

export function NoteDetail({ note, onClose, onUpdate, onDelete, onShare }: NoteDetailProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return

    const updatedNote: Note = {
      ...note,
      title: title.trim(),
      content: content.trim(),
      updatedAt: new Date().toISOString(),
    }

    onUpdate(updatedNote)
    setIsEditing(false)
  }

  return (
    <div className="h-full flex flex-col bg-[#2B293A] rounded-xl border border-[#262433] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-[#262433]">
        <Button variant="ghost" size="sm" onClick={onClose} className="text-[#DFDFDF] hover:bg-[#262433]">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <Button size="sm" onClick={handleSave} className="bg-[#33691E] hover:bg-[#33691E]/90 text-white">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="bg-[#15131D] border-[#262433] text-[#DFDFDF] hover:bg-[#262433]"
              >
                Edit
              </Button>
              {onShare && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onShare(note.id)}
                  className="bg-[#15131D] border-[#262433] text-[#DFDFDF] hover:bg-[#262433]"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}
            </>
          )}

          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            className="bg-[#0E0D13] hover:bg-[#0E0D13]/90 text-[#DFDFDF]"
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6" style={{ borderTop: `4px solid ${note.color}` }}>
        {isEditing ? (
          <div className="space-y-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold border-none text-[#DFDFDF] bg-transparent focus-visible:ring-0 px-0 text-3xl"
            />
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[calc(100vh-300px)] resize-none border-none bg-transparent focus-visible:ring-0 px-0 text-[#DFDFDF] placeholder:text-[#676672]"
              placeholder="Write your note here..."
            />
          </div>
        ) : (
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-[#DFDFDF]">{note.title}</h1>
            <p className="text-sm text-[#9998A9]">Last updated: {new Date(note.updatedAt).toLocaleString()}</p>
            <div className="whitespace-pre-wrap text-[#DFDFDF]">{note.content}</div>
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[#2B293A] border-[#262433] text-[#DFDFDF]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#9998A9]">
              This action cannot be undone. This will permanently delete the note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#15131D] border-[#262433] text-[#DFDFDF] hover:bg-[#262433]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(note.id)}
              className="bg-[#0E0D13] hover:bg-[#0E0D13]/90 text-[#DFDFDF]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

