"use client"

import type React from "react"

import type { Note, Category } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ExternalLink, MoreVertical, Share2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface NoteGridProps {
  notes: Note[]
  onNoteSelect: (noteId: string) => void
  onDeleteNote?: (noteId: string) => void
  onShareNote?: (noteId: string) => void
  categories?: Category[]
}

export function NoteGrid({ notes, onNoteSelect, onDeleteNote, onShareNote, categories = [] }: NoteGridProps) {
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null)
  const [noteToMove, setNoteToMove] = useState<string | null>(null)
  const [selectedMoveCategory, setSelectedMoveCategory] = useState<string | null>(null)
  const [localCategories, setLocalCategories] = useState<Category[]>([])

  // Memoized callbacks - move these outside of any conditional logic
  const memoizedOnNoteSelect = useCallback(
    (noteId: string) => {
      onNoteSelect(noteId)
    },
    [onNoteSelect],
  )

  const memoizedOnShareNote = useCallback(
    (noteId: string) => {
      if (onShareNote) {
        onShareNote(noteId)
      }
    },
    [onShareNote],
  )

  const memoizedOnDeleteNote = useCallback(
    (noteId: string) => {
      if (onDeleteNote) {
        onDeleteNote(noteId)
      }
    },
    [onDeleteNote],
  )

  // Fetch categories from localStorage on mount or use provided categories
  useEffect(() => {
    // Only load categories from localStorage if they weren't provided as props
    if (categories && categories.length > 0) {
      setLocalCategories(categories)
    } else {
      try {
        const storedCategories = localStorage.getItem("categories")
        if (storedCategories) {
          const parsedCategories = JSON.parse(storedCategories)
          // Only update state if the categories are different to prevent infinite loops
          if (JSON.stringify(parsedCategories) !== JSON.stringify(localCategories)) {
            setLocalCategories(parsedCategories)
          }
        }
      } catch (error) {
        console.error("Error loading categories:", error)
      }
    }
  }, [categories, localCategories])

  const handleDeleteClick = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation()
    setNoteToDelete(noteId)
  }

  const confirmDelete = () => {
    if (noteToDelete && onDeleteNote) {
      try {
        onDeleteNote(noteToDelete)
      } catch (error) {
        console.error("Error deleting note:", error)
      } finally {
        setNoteToDelete(null)
      }
    }
  }

  const handleMoveToCategory = useCallback(
    (e: React.MouseEvent, noteId: string) => {
      e.stopPropagation()
      setNoteToMove(noteId)

      // Get the current category of the note
      const note = notes.find((n) => n.id === noteId)
      setSelectedMoveCategory(note?.categoryId || "none")
    },
    [notes],
  )

  const confirmMove = useCallback(() => {
    if (!noteToMove) return

    try {
      // Get notes from localStorage
      const storedNotes = localStorage.getItem("notes")
      if (!storedNotes) return

      const allNotes = JSON.parse(storedNotes)

      // Update the note's category
      const updatedNotes = allNotes.map((n: Note) => {
        if (n.id === noteToMove) {
          return {
            ...n,
            categoryId: selectedMoveCategory === "none" ? null : selectedMoveCategory,
            updatedAt: new Date().toISOString(),
          }
        }
        return n
      })

      // Save back to localStorage
      localStorage.setItem("notes", JSON.stringify(updatedNotes))

      // Update UI if needed
      if (onDeleteNote) {
        // We're using onDeleteNote as a proxy to check if we have access to update functions
        // In a real app, you'd have a proper onUpdateNote function
        window.location.reload()
      }

      setNoteToMove(null)
    } catch (error) {
      console.error("Error moving note:", error)
    }
  }, [noteToMove, selectedMoveCategory, onDeleteNote])

  // Function to get category name by ID
  const getCategoryName = (categoryId: string | null): string => {
    if (!categoryId) return ""
    const category = localCategories.find((c) => c.id === categoryId)
    return category ? category.name : ""
  }

  // Function to determine grid span based on content length
  const getGridSpan = (content: string): string => {
    const length = content.length
    if (length > 500) return "md:col-span-2 md:row-span-2"
    if (length > 250) return "md:col-span-2"
    return ""
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-[#9998A9] mb-2">No notes found</p>
        <p className="text-sm text-[#676672]">Create a new note using the + button</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-min">
        {notes.map((note) => {
          const gridSpan = getGridSpan(note.content)
          const categoryName = getCategoryName(note.categoryId)

          return (
            <div
              key={note.id}
              className={cn("group cursor-pointer overflow-hidden rounded-xl transition-all hover:shadow-lg", gridSpan)}
              onClick={() => memoizedOnNoteSelect(note.id)}
            >
              <div className="h-full flex flex-col bg-[#2B293A] border border-[#262433] rounded-xl overflow-hidden">
                <div
                  className="p-4 pb-2 border-b border-[#262433] flex justify-between items-start"
                  style={{ backgroundColor: note.color + "33" }} // Adding transparency
                >
                  <div className="flex flex-col">
                    {categoryName && (
                      <Badge className="mb-2 self-start bg-[#33691E] hover:bg-[#33691E]/90 text-white">
                        {categoryName}
                      </Badge>
                    )}
                    <h3 className="text-lg font-semibold text-[#DFDFDF]">{note.title}</h3>
                  </div>
                  <div className="flex items-center">
                    <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#9998A9] mr-2" />
                    {onDeleteNote && (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4 text-[#9998A9]" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#2B293A] border-[#262433] text-[#DFDFDF]">
                          <DropdownMenuItem
                            className="hover:bg-[#262433] cursor-pointer"
                            onClick={(e) => handleMoveToCategory(e, note.id)}
                          >
                            Move to...
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="hover:bg-[#262433] cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              memoizedOnShareNote(note.id)
                            }}
                          >
                            <Share2 className="h-4 w-4 mr-2" />
                            Share Note
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400 hover:bg-[#262433] cursor-pointer"
                            onClick={(e) => handleDeleteClick(e, note.id)}
                          >
                            Delete Note
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
                <div className="p-4 flex-1">
                  <div className="text-[#9998A9] line-clamp-6 text-sm whitespace-pre-wrap">
                    {/* Show a preview of the content */}
                    {note.content || "No content"}
                  </div>
                </div>
                <div className="p-4 pt-2 text-xs flex justify-between items-center text-[#676672] border-t border-[#262433]">
                  <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
                  <span>Updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <AlertDialogContent className="bg-[#2B293A] border-[#262433] text-[#DFDFDF]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription className="text-[#9998A9]">
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#15131D] border-[#262433] text-[#DFDFDF] hover:bg-[#262433]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-[#0E0D13] hover:bg-[#0E0D13]/90 text-[#DFDFDF]">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Move to Category Dialog */}
      <Dialog open={!!noteToMove} onOpenChange={(open) => !open && setNoteToMove(null)}>
        <DialogContent className="bg-[#2B293A] border-[#262433] text-[#DFDFDF]">
          <DialogHeader>
            <DialogTitle>Move Note to Category</DialogTitle>
            <DialogDescription className="text-[#9998A9]">Select a category to move this note to.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedMoveCategory || "none"} onValueChange={setSelectedMoveCategory}>
              <SelectTrigger className="w-full bg-[#15131D] border-[#262433] text-[#DFDFDF]">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-[#2B293A] border-[#262433] text-[#DFDFDF]">
                <SelectItem value="none">No Category</SelectItem>
                {localCategories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNoteToMove(null)}
              className="bg-[#15131D] border-[#262433] text-[#DFDFDF] hover:bg-[#262433]"
            >
              Cancel
            </Button>
            <Button onClick={confirmMove} className="bg-[#33691E] hover:bg-[#33691E]/90 text-white">
              Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

