"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { storageService, type NoteFile } from "@/lib/storage-service"
import type { Category, Note } from "@/lib/types"

/**
 * Custom hook for interacting with the storage service
 * Provides methods for CRUD operations on notes and categories
 */
export function useStorage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [files, setFiles] = useState<NoteFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastSyncTime, setLastSyncTime] = useState<string>("")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Use refs to prevent infinite loops
  const categoriesRef = useRef<Category[]>([])
  const notesRef = useRef<Note[]>([])

  // Update refs when state changes
  useEffect(() => {
    categoriesRef.current = categories
  }, [categories])

  useEffect(() => {
    notesRef.current = notes
  }, [notes])

  // Initialize storage - only run once
  useEffect(() => {
    storageService.initialize()
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Check for unsaved changes periodically
  useEffect(() => {
    const checkInterval = setInterval(() => {
      setHasUnsavedChanges(storageService.hasUnsavedChanges())
    }, 500)

    return () => clearInterval(checkInterval)
  }, [])

  // Load all data from storage
  const loadData = useCallback(() => {
    setIsLoading(true)
    try {
      const loadedCategories = storageService.getCategories()
      const loadedNotes = storageService.getNotes()
      const loadedFiles = storageService.getNoteFiles()
      const syncTime = storageService.getLastSyncTimestamp()

      setCategories(loadedCategories)
      setNotes(loadedNotes)
      setFiles(loadedFiles)
      setLastSyncTime(syncTime)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Create a new category
  const createCategory = useCallback(
    (category: Category) => {
      try {
        const updatedCategories = [...categoriesRef.current, category]
        storageService.saveCategories(updatedCategories)
        setCategories(updatedCategories)
        loadData() // Reload to get updated files
        return true
      } catch (error) {
        console.error("Error creating category:", error)
        return false
      }
    },
    [loadData],
  )

  // Update a category
  const updateCategory = useCallback(
    (categoryId: string, updates: Partial<Category>) => {
      try {
        const updatedCategories = categoriesRef.current.map((category) =>
          category.id === categoryId ? { ...category, ...updates } : category,
        )
        storageService.saveCategories(updatedCategories)
        setCategories(updatedCategories)
        loadData() // Reload to get updated files
        return true
      } catch (error) {
        console.error("Error updating category:", error)
        return false
      }
    },
    [loadData],
  )

  // Delete a category
  const deleteCategory = useCallback(
    (categoryId: string) => {
      try {
        // Update notes in this category to be uncategorized
        const updatedNotes = notesRef.current.map((note) =>
          note.categoryId === categoryId ? { ...note, categoryId: null } : note,
        )

        // Remove the category
        const updatedCategories = categoriesRef.current.filter((category) => category.id !== categoryId)

        storageService.saveNotes(updatedNotes)
        storageService.saveCategories(updatedCategories)

        setNotes(updatedNotes)
        setCategories(updatedCategories)

        loadData() // Reload to get updated files
        return true
      } catch (error) {
        console.error("Error deleting category:", error)
        return false
      }
    },
    [loadData],
  )

  // Create a new note
  const createNote = useCallback(
    (note: Note) => {
      try {
        const updatedNotes = [...notesRef.current, note]
        storageService.saveNotes(updatedNotes)
        setNotes(updatedNotes)
        loadData() // Reload to get updated files
        return true
      } catch (error) {
        console.error("Error creating note:", error)
        return false
      }
    },
    [loadData],
  )

  // Update a note
  const updateNote = useCallback((noteId: string, updates: Partial<Note>) => {
    try {
      const noteIndex = notesRef.current.findIndex((note) => note.id === noteId)

      if (noteIndex === -1) {
        console.error("Note not found:", noteId)
        return false
      }

      const updatedNote = {
        ...notesRef.current[noteIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      const updatedNotes = [...notesRef.current]
      updatedNotes[noteIndex] = updatedNote

      // Use the individual note save method for better performance
      storageService.saveNote(updatedNote)

      setNotes(updatedNotes)
      setHasUnsavedChanges(true)

      return true
    } catch (error) {
      console.error("Error updating note:", error)
      return false
    }
  }, [])

  // Delete a note
  const deleteNote = useCallback(
    (noteId: string) => {
      try {
        const updatedNotes = notesRef.current.filter((note) => note.id !== noteId)
        storageService.saveNotes(updatedNotes)
        setNotes(updatedNotes)
        loadData() // Reload to get updated files
        return true
      } catch (error) {
        console.error("Error deleting note:", error)
        return false
      }
    },
    [loadData],
  )

  // Get notes by category
  const getNotesByCategory = useCallback((categoryId: string | null) => {
    // Use the ref to access the latest notes without causing re-renders
    return notesRef.current.filter((note) =>
      categoryId === null ? note.categoryId === null : note.categoryId === categoryId,
    )
  }, []) // Empty dependency array since we're using refs

  // Get a note file by category
  const getNoteFileByCategory = useCallback((categoryId: string | null) => {
    return storageService.getNoteFileByCategory(categoryId)
  }, [])

  // Force save all pending changes
  const forceSave = useCallback(() => {
    storageService.forceSave()
    setHasUnsavedChanges(false)
    loadData()
  }, [loadData])

  // Export data
  const exportData = useCallback(() => {
    return storageService.exportData()
  }, [])

  // Import data
  const importData = useCallback(
    (jsonData: string) => {
      const success = storageService.importData(jsonData)
      if (success) {
        loadData()
      }
      return success
    },
    [loadData],
  )

  return {
    categories,
    notes,
    files,
    isLoading,
    lastSyncTime,
    hasUnsavedChanges,
    createCategory,
    updateCategory,
    deleteCategory,
    createNote,
    updateNote,
    deleteNote,
    getNotesByCategory,
    getNoteFileByCategory,
    forceSave,
    exportData,
    importData,
    refreshData: loadData,
  }
}

