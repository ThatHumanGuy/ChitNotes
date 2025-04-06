"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Sidebar } from "./sidebar"
import { NoteGrid } from "./note-grid"
import { CreateNoteDialog } from "./create-note-dialog"
import { CreateCategoryDialog } from "./create-category-dialog"
import { WhiteboardNote } from "./whiteboard-note"
import { SearchBar } from "./search-bar"
import { UserAvatar } from "./user-avatar"
import { Plus, Folder, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Category, Note } from "@/lib/types"
import { ShareDialog } from "./share-dialog"
import { FileSharing } from "./file-sharing"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StorageStatus } from "./storage-status"
import { FileExplorer } from "./file-explorer"
import { useStorage } from "@/lib/hooks/use-storage"

export function NoteApp() {
  const {
    categories,
    notes,
    createCategory,
    updateCategory,
    deleteCategory,
    createNote,
    updateNote,
    deleteNote,
    getNotesByCategory,
    forceSave,
  } = useStorage()

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false)
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isPanelFloating, setIsPanelFloating] = useState(true)
  const [isSidebarHidden, setIsSidebarHidden] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [noteToShare, setNoteToShare] = useState<Note | null>(null)
  const [activeTab, setActiveTab] = useState<string>("notes")
  const [useFileExplorer, setUseFileExplorer] = useState<boolean>(true)

  // Save changes when navigating away - use callback to prevent infinite loops
  const handleBeforeUnload = useCallback(() => {
    forceSave()
  }, [forceSave])

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [handleBeforeUnload])

  // Replace the filteredNotes function with this memoized version
  // This prevents unnecessary recalculations and potential infinite loops
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesCategory = !selectedCategory || note.categoryId === selectedCategory
      const matchesSearch =
        !searchQuery ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [notes, selectedCategory, searchQuery])

  const selectedCategoryName = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)?.name || ""
    : "All Notes"

  const handleCreateNote = (note: Note) => {
    createNote(note)
    setIsCreateNoteOpen(false)
    setSelectedNote(note.id)
  }

  const handleCreateCategory = (category: Category) => {
    createCategory(category)
    setIsCreateCategoryOpen(false)
  }

  const handleDeleteCategory = (categoryId: string) => {
    deleteCategory(categoryId)

    // If the deleted category was selected, reset to all notes
    if (selectedCategory === categoryId) {
      setSelectedCategory(null)
    }
  }

  const handleRenameCategory = (categoryId: string, newName: string) => {
    updateCategory(categoryId, { name: newName })
  }

  const handleUpdateNote = (updatedNote: Note) => {
    updateNote(updatedNote.id, updatedNote)
  }

  const handleDeleteNote = (noteId: string) => {
    deleteNote(noteId)
    setSelectedNote(null)
  }

  // Toggle floating panel
  const togglePanelFloating = () => {
    setIsPanelFloating(!isPanelFloating)
  }

  const handleMainContentDoubleClick = () => {
    if (!isSidebarHidden) {
      setIsSidebarHidden(true)
    }
  }

  const toggleSidebarVisibility = () => {
    setIsSidebarHidden(!isSidebarHidden)
  }

  const handleShareNote = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId)
    if (note) {
      setNoteToShare(note)
      setIsShareDialogOpen(true)
    }
  }

  const toggleFileExplorer = () => {
    setUseFileExplorer(!useFileExplorer)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#15131D]">
      {/* Sidebar with improved positioning - now aligned to the left */}
      <div className={`${isSidebarHidden ? "hidden" : "relative border-r border-[#262433] w-72"}`}>
        {useFileExplorer ? (
          <FileExplorer
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onCreateCategory={() => setIsCreateCategoryOpen(true)}
            onSelectNote={setSelectedNote}
          />
        ) : (
          <Sidebar
            categories={categories}
            notes={notes}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onCreateCategory={() => setIsCreateCategoryOpen(true)}
            onDeleteCategory={handleDeleteCategory}
            onRenameCategory={handleRenameCategory}
            onSelectNote={setSelectedNote}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFileExplorer}
          className="absolute bottom-4 right-4 text-[#9998A9] hover:text-[#DFDFDF] hover:bg-[#262433]"
        >
          {useFileExplorer ? "Classic View" : "File Explorer"}
        </Button>
      </div>

      {/* Sidebar toggle button - only visible when sidebar is hidden */}
      {isSidebarHidden && (
        <Button
          size="icon"
          className="fixed top-4 left-4 z-40 bg-[#2B293A] border border-[#262433] shadow-md hover:bg-[#262433]"
          onClick={toggleSidebarVisibility}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[#DFDFDF]"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <line x1="9" x2="9" y1="3" y2="21" />
          </svg>
        </Button>
      )}

      <div className="flex-1 flex flex-col overflow-hidden relative" onDoubleClick={handleMainContentDoubleClick}>
        {!selectedNote && (
          <header className="flex items-center justify-between p-4 bg-[#2B293A]/90 backdrop-blur-md border-b border-[#262433] sticky top-0 z-10">
            {/* Center-aligned search bar */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-64 z-20">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>

            {/* Storage status and toggle panel button */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePanelFloating}
                className="ml-16 md:ml-0 text-[#DFDFDF] hover:bg-[#262433]"
              >
                {isPanelFloating ? "Dock Panel" : "Float Panel"}
              </Button>

              <StorageStatus />
            </div>

            <div className="ml-auto">
              <UserAvatar />
            </div>
          </header>
        )}

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {selectedNote ? (
            <WhiteboardNote
              note={notes.find((n) => n.id === selectedNote)!}
              categories={categories}
              onClose={() => setSelectedNote(null)}
              onUpdate={handleUpdateNote}
              onDelete={handleDeleteNote}
              onShare={handleShareNote}
            />
          ) : (
            <>
              <Tabs defaultValue="notes" value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="bg-[#2B293A] border-[#262433]">
                  <TabsTrigger value="notes" className="data-[state=active]:bg-[#262433] flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Notes
                  </TabsTrigger>
                  <TabsTrigger value="files" className="data-[state=active]:bg-[#262433] flex items-center">
                    <Folder className="h-4 w-4 mr-2" />
                    Files
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="notes" className="mt-4">
                  <div className="flex justify-between items-center mb-6 sticky top-0 z-10 bg-[#15131D] py-2">
                    <h1 className="text-2xl font-semibold text-[#DFDFDF]">{selectedCategoryName}</h1>
                  </div>
                  {/* Update the NoteGrid component to use the memoized filteredNotes */}
                  <NoteGrid
                    notes={filteredNotes}
                    onNoteSelect={setSelectedNote}
                    onDeleteNote={handleDeleteNote}
                    onShareNote={handleShareNote}
                  />
                </TabsContent>

                <TabsContent value="files" className="mt-4">
                  <FileSharing />
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>

        {!selectedNote && activeTab === "notes" && (
          <Button
            size="icon"
            className="rounded-full w-14 h-14 fixed bottom-6 right-6 shadow-lg bg-[#33691E] hover:bg-[#33691E]/90 text-white z-20"
            onClick={() => setIsCreateNoteOpen(true)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}
      </div>

      <CreateNoteDialog
        open={isCreateNoteOpen}
        onOpenChange={setIsCreateNoteOpen}
        categories={categories}
        selectedCategory={selectedCategory}
        onCreateNote={handleCreateNote}
      />

      <CreateCategoryDialog
        open={isCreateCategoryOpen}
        onOpenChange={setIsCreateCategoryOpen}
        categories={categories}
        onCreateCategory={handleCreateCategory}
      />

      <ShareDialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen} note={noteToShare} />
    </div>
  )
}

