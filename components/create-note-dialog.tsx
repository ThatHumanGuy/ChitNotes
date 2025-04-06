"use client"

import type React from "react"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Category, Note } from "@/lib/types"

interface CreateNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  selectedCategory: string | null
  onCreateNote: (note: Note) => void
}

// Removed color options as per requirements
export function CreateNoteDialog({
  open,
  onOpenChange,
  categories,
  selectedCategory,
  onCreateNote,
}: CreateNoteDialogProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState(selectedCategory || "none")

  // Default color - we'll use a single color for all notes
  const defaultColor = "#33691E"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: title.trim(),
      content: content,
      categoryId: categoryId === "none" ? null : categoryId,
      color: defaultColor, // Use default color
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onCreateNote(newNote)
    resetForm()
  }

  const resetForm = () => {
    setTitle("")
    setContent("")
    setCategoryId(selectedCategory || "none")
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm()
        onOpenChange(isOpen)
      }}
    >
      <DialogContent className="sm:max-w-[550px] bg-[#2B293A] border-[#262433] text-[#DFDFDF]">
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
          <DialogDescription className="text-[#9998A9]">Fill in the details to create a new note.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title" className="text-[#DFDFDF]">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title"
                required
                className="bg-[#15131D] border-[#262433] text-[#DFDFDF] placeholder:text-[#676672]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category" className="text-[#DFDFDF]">
                Category (Optional)
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="bg-[#15131D] border-[#262433] text-[#DFDFDF]">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-[#2B293A] border-[#262433] text-[#DFDFDF]">
                  <SelectItem value="none">None</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-[#15131D] border-[#262433] text-[#DFDFDF] hover:bg-[#262433]"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-[#33691E] hover:bg-[#33691E]/90 text-white">
              Create Note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

