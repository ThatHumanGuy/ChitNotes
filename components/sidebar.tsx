"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Category, Note } from "@/lib/types"
import { ChevronDown, ChevronRight, FolderPlus, Menu, MoreVertical, Pencil, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface SidebarProps {
  categories: Category[]
  notes: Note[]
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
  onCreateCategory: () => void
  onDeleteCategory: (categoryId: string) => void
  onRenameCategory?: (categoryId: string, newName: string) => void
  onSelectNote: (noteId: string) => void
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
}

export function Sidebar({
  categories,
  notes,
  selectedCategory,
  onSelectCategory,
  onCreateCategory,
  onDeleteCategory,
  onRenameCategory,
  onSelectNote,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [categoryToRename, setCategoryToRename] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState("")

  const toggleExpand = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedCategories({
      ...expandedCategories,
      [categoryId]: !expandedCategories[categoryId],
    })
  }

  const handleDeleteCategory = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCategoryToDelete(categoryId)
  }

  const confirmDeleteCategory = () => {
    if (categoryToDelete) {
      onDeleteCategory(categoryToDelete)
      setCategoryToDelete(null)
    }
  }

  const handleRenameCategory = (categoryId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const category = categories.find((c) => c.id === categoryId)
    if (category) {
      setNewCategoryName(category.name)
      setCategoryToRename(categoryId)
    }
  }

  const confirmRenameCategory = () => {
    if (categoryToRename && onRenameCategory && newCategoryName.trim()) {
      onRenameCategory(categoryToRename, newCategoryName.trim())
      setCategoryToRename(null)
      setNewCategoryName("")
    }
  }

  const filteredCategories = searchTerm
    ? categories.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : categories

  const getCategoryNotes = (categoryId: string) => {
    return notes.filter((note) => note.categoryId === categoryId)
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X /> : <Menu />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "w-72 bg-[#2B293A]/90 backdrop-blur-md border-r border-[#262433] flex flex-col h-full overflow-hidden rounded-r-xl shadow-xl",
          "fixed inset-y-0 left-0 z-40 md:relative md:translate-x-0",
          "transition-transform duration-300 ease-in-out",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          "md:float-left md:mr-4 md:my-4", // Make it floating on desktop with margin
        )}
      >
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
            placeholder="Search Categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-[#0E0D13] border-[#262433] text-[#DFDFDF] placeholder:text-[#676672]"
          />
        </div>

        <div className="px-4 py-2">
          <div
            className={cn(
              "flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-[#262433]",
              selectedCategory === null && "bg-[#262433] text-[#DFDFDF]",
            )}
            onClick={() => onSelectCategory(null)}
          >
            <div className="w-6" />
            <div className="flex-1 truncate">All Notes</div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          {filteredCategories.map((category) => {
            const categoryNotes = getCategoryNotes(category.id)
            const isExpanded = expandedCategories[category.id]
            const isSelected = category.id === selectedCategory

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
                  <div className="flex-1 truncate">{category.name}</div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100 hover:bg-[#262433]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3 w-3 text-[#9998A9]" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#2B293A] border-[#262433] text-[#DFDFDF]">
                      {onRenameCategory && (
                        <DropdownMenuItem
                          className="hover:bg-[#262433] cursor-pointer"
                          onClick={(e) => handleRenameCategory(category.id, e)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-2" />
                          Rename Category
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-red-400 hover:bg-[#262433] cursor-pointer"
                        onClick={(e) => handleDeleteCategory(category.id, e)}
                      >
                        Delete Category
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {isExpanded && categoryNotes.length > 0 && (
                  <div className="ml-6 mt-1 space-y-1">
                    {categoryNotes.map((note) => (
                      <div
                        key={note.id}
                        className="py-1 px-2 text-sm text-[#9998A9] hover:text-[#DFDFDF] hover:bg-[#262433] rounded-md cursor-pointer truncate"
                        onClick={() => onSelectNote(note.id)}
                      >
                        {note.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </ScrollArea>
      </div>

      {/* Delete Category Dialog */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent className="bg-[#2B293A] border-[#262433] text-[#DFDFDF]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription className="text-[#9998A9]">
              Are you sure you want to delete this category? Notes in this category will be moved to "Uncategorized".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#15131D] border-[#262433] text-[#DFDFDF] hover:bg-[#262433]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCategory}
              className="bg-[#0E0D13] hover:bg-[#0E0D13]/90 text-[#DFDFDF]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Category Dialog */}
      <Dialog open={!!categoryToRename} onOpenChange={(open) => !open && setCategoryToRename(null)}>
        <DialogContent className="bg-[#2B293A] border-[#262433] text-[#DFDFDF]">
          <DialogHeader>
            <DialogTitle>Rename Category</DialogTitle>
            <DialogDescription className="text-[#9998A9]">Enter a new name for this category.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-[#DFDFDF]">
                Category Name
              </Label>
              <Input
                id="name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="bg-[#15131D] border-[#262433] text-[#DFDFDF]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCategoryToRename(null)}
              className="bg-[#15131D] border-[#262433] text-[#DFDFDF] hover:bg-[#262433]"
            >
              Cancel
            </Button>
            <Button onClick={confirmRenameCategory} className="bg-[#33691E] hover:bg-[#33691E]/90 text-white">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

