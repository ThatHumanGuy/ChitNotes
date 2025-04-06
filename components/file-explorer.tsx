"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useStorage } from "@/lib/hooks/use-storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown, ChevronRight, File, FileText, FolderPlus, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Note } from "@/lib/types"

interface FileExplorerProps {
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
  onCreateCategory: () => void
  onSelectNote: (noteId: string) => void
}

export function FileExplorer({
  selectedCategory,
  onSelectCategory,
  onCreateCategory,
  onSelectNote,
}: FileExplorerProps) {
  const { categories, notes, files } = useStorage()
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [filteredNotes, setFilteredNotes] = useState<Record<string, Note[]>>({})

  // Use refs to prevent infinite loops
  const categoriesRef = useRef(categories)
  const notesRef = useRef(notes)

  // Update refs when props change
  useEffect(() => {
    categoriesRef.current = categories
  }, [categories])

  useEffect(() => {
    notesRef.current = notes
  }, [notes])

  // Filter notes by category and update when notes or search term changes
  useEffect(() => {
    const filterNotes = () => {
      const result: Record<string, Note[]> = {
        uncategorized: notesRef.current.filter(
          (note) =>
            note.categoryId === null &&
            (searchTerm === "" ||
              note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              note.content.toLowerCase().includes(searchTerm.toLowerCase())),
        ),
      }

      categoriesRef.current.forEach((category) => {
        result[category.id] = notesRef.current.filter(
          (note) =>
            note.categoryId === category.id &&
            (searchTerm === "" ||
              note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              note.content.toLowerCase().includes(searchTerm.toLowerCase())),
        )
      })

      // Only update state if the filtered notes have actually changed
      if (JSON.stringify(result) !== JSON.stringify(filteredNotes)) {
        setFilteredNotes(result)
      }
    }

    filterNotes()
  }, [searchTerm, notes.length]) // Only depend on searchTerm and notes.length, not the entire notes array

  const toggleExpand = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  const filteredCategories = searchTerm
    ? categories.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : categories

  // Get uncategorized notes
  const uncategorizedNotes = filteredNotes.uncategorized || []

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-[#262433]">
        <Button
          variant="outline"
          size="sm"
          className="w-full bg-[#0E0D13] border-[#262433] hover:bg-[#262433] text-[#DFDFDF]"
          onClick={onCreateCategory}
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          New Category
        </Button>
      </div>

      <div className="p-4 relative">
        <Search className="absolute left-7 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9998A9]" />
        <Input
          placeholder="Search Files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-[#0E0D13] border-[#262433] text-[#DFDFDF] placeholder:text-[#676672]"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-6 top-1/2 transform -translate-y-1/2 h-6 w-6 text-[#9998A9]"
            onClick={() => setSearchTerm("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-4">
        {/* All Notes (Uncategorized) */}
        <div className="mb-2">
          <div
            className={cn(
              "flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-[#262433] group",
              selectedCategory === null && "bg-[#262433] text-[#DFDFDF]",
            )}
            onClick={() => onSelectCategory(null)}
          >
            <File className="h-4 w-4 mr-2 text-[#9998A9]" />
            <div className="flex-1 truncate">All Notes</div>
            <Badge variant="outline" className="ml-2 h-5 px-1.5 bg-[#15131D] text-[#9998A9] border-[#262433]">
              {uncategorizedNotes.length}
            </Badge>
          </div>

          {/* Show uncategorized notes if expanded */}
          {selectedCategory === null && uncategorizedNotes.length > 0 && (
            <div className="ml-6 mt-1 space-y-1">
              {uncategorizedNotes.map((note) => (
                <div
                  key={note.id}
                  className="py-1 px-2 text-sm text-[#9998A9] hover:text-[#DFDFDF] hover:bg-[#262433] rounded-md cursor-pointer truncate flex items-center"
                  onClick={() => onSelectNote(note.id)}
                >
                  <FileText className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="truncate">{note.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Files */}
        {filteredCategories.map((category) => {
          const categoryNotes = filteredNotes[category.id] || []
          const isExpanded = expandedCategories[category.id]
          const isSelected = category.id === selectedCategory
          const file = files.find((f) => f.id === category.id)

          return (
            <div key={category.id} className="mb-1">
              <div
                className={cn(
                  "flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-[#262433] group",
                  isSelected && "bg-[#262433] text-[#DFDFDF]",
                )}
                onClick={() => onSelectCategory(category.id)}
              >
                <button
                  type="button"
                  onClick={(e) => toggleExpand(category.id, e)}
                  className="mr-1 p-1 rounded-sm hover:bg-[#2B293A]"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <File className="h-4 w-4 mr-2 text-[#9998A9]" />
                <div className="flex-1 truncate">{category.name}</div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="ml-2 h-5 px-1.5 bg-[#15131D] text-[#9998A9] border-[#262433]">
                        {categoryNotes.length}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {categoryNotes.length} note{categoryNotes.length !== 1 ? "s" : ""}
                      </p>
                      {file && (
                        <p className="text-xs text-[#9998A9]">
                          Updated {new Date(file.updatedAt).toLocaleDateString()}
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Show notes in this category if expanded */}
              {isExpanded && categoryNotes.length > 0 && (
                <div className="ml-6 mt-1 space-y-1">
                  {categoryNotes.map((note) => (
                    <div
                      key={note.id}
                      className="py-1 px-2 text-sm text-[#9998A9] hover:text-[#DFDFDF] hover:bg-[#262433] rounded-md cursor-pointer truncate flex items-center"
                      onClick={() => onSelectNote(note.id)}
                    >
                      <FileText className="h-3 w-3 mr-2 flex-shrink-0" />
                      <span className="truncate">{note.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </ScrollArea>
    </div>
  )
}

