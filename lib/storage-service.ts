import type { Category, Note } from "@/lib/types"

// Storage keys
const STORAGE_KEYS = {
  CATEGORIES: "categories",
  NOTES: "notes",
  FILES: "note_files",
  LAST_SYNC: "last_sync_timestamp",
}

// Interface for file structure
export interface NoteFile {
  id: string
  name: string
  notes: Note[]
  createdAt: string
  updatedAt: string
}

/**
 * Storage Service for managing notes and categories in localStorage
 * Provides methods for CRUD operations and file-based organization
 */
export class StorageService {
  private static instance: StorageService
  private initialized = false
  private saveQueue: Map<string, NodeJS.Timeout> = new Map()
  private saveDelay = 300 // ms to wait before saving (debounce)

  // Singleton pattern
  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService()
    }
    return StorageService.instance
  }

  /**
   * Initialize the storage service
   * Creates necessary structures if they don't exist
   */
  public initialize(): void {
    if (this.initialized) return

    try {
      // Check if localStorage is available
      if (typeof window === "undefined" || !window.localStorage) {
        console.error("localStorage is not available")
        return
      }

      // Initialize categories if not exists
      if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify([]))
      }

      // Initialize notes if not exists
      if (!localStorage.getItem(STORAGE_KEYS.NOTES)) {
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify([]))
      }

      // Initialize files if not exists
      if (!localStorage.getItem(STORAGE_KEYS.FILES)) {
        localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify([]))
        this.syncFilesWithCategories()
      }

      // Set last sync timestamp
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString())
      this.initialized = true
    } catch (error) {
      console.error("Error initializing storage service:", error)
    }
  }

  /**
   * Get all categories
   */
  public getCategories(): Category[] {
    try {
      const categoriesJson = localStorage.getItem(STORAGE_KEYS.CATEGORIES)
      return categoriesJson ? JSON.parse(categoriesJson) : []
    } catch (error) {
      console.error("Error getting categories:", error)
      return []
    }
  }

  /**
   * Save categories
   */
  public saveCategories(categories: Category[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories))
      this.syncFilesWithCategories()
    } catch (error) {
      console.error("Error saving categories:", error)
    }
  }

  /**
   * Get all notes
   */
  public getNotes(): Note[] {
    try {
      const notesJson = localStorage.getItem(STORAGE_KEYS.NOTES)
      return notesJson ? JSON.parse(notesJson) : []
    } catch (error) {
      console.error("Error getting notes:", error)
      return []
    }
  }

  /**
   * Save all notes
   */
  public saveNotes(notes: Note[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes))
      this.syncFilesWithNotes()
    } catch (error) {
      console.error("Error saving notes:", error)
    }
  }

  /**
   * Save a single note with debouncing
   */
  public saveNote(note: Note): void {
    try {
      // Get current notes
      const notes = this.getNotes()

      // Find and update the note
      const index = notes.findIndex((n) => n.id === note.id)
      if (index >= 0) {
        notes[index] = note
      } else {
        notes.push(note)
      }

      // Clear any existing timeout for this note
      if (this.saveQueue.has(note.id)) {
        clearTimeout(this.saveQueue.get(note.id))
      }

      // Set a new timeout to save after delay
      const timeoutId = setTimeout(() => {
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(notes))
        this.syncFilesWithNotes()
        this.saveQueue.delete(note.id)
      }, this.saveDelay)

      this.saveQueue.set(note.id, timeoutId)
    } catch (error) {
      console.error("Error saving note:", error)
    }
  }

  /**
   * Delete a note
   */
  public deleteNote(noteId: string): void {
    try {
      const notes = this.getNotes().filter((note) => note.id !== noteId)
      this.saveNotes(notes)
    } catch (error) {
      console.error("Error deleting note:", error)
    }
  }

  /**
   * Get all note files
   */
  public getNoteFiles(): NoteFile[] {
    try {
      const filesJson = localStorage.getItem(STORAGE_KEYS.FILES)
      return filesJson ? JSON.parse(filesJson) : []
    } catch (error) {
      console.error("Error getting note files:", error)
      return []
    }
  }

  /**
   * Get a specific note file by category ID
   */
  public getNoteFileByCategory(categoryId: string | null): NoteFile | null {
    try {
      const files = this.getNoteFiles()

      if (categoryId === null) {
        // Return the "Uncategorized" file
        const uncategorizedFile = files.find((file) => file.id === "uncategorized")
        return uncategorizedFile || null
      }

      return files.find((file) => file.id === categoryId) || null
    } catch (error) {
      console.error("Error getting note file by category:", error)
      return null
    }
  }

  /**
   * Save note files
   */
  private saveNoteFiles(files: NoteFile[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files))
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString())
    } catch (error) {
      console.error("Error saving note files:", error)
    }
  }

  /**
   * Sync files with categories
   * Creates/updates files based on categories
   */
  private syncFilesWithCategories(): void {
    try {
      const categories = this.getCategories()
      let files = this.getNoteFiles()

      // Create "Uncategorized" file if it doesn't exist
      if (!files.find((file) => file.id === "uncategorized")) {
        files.push({
          id: "uncategorized",
          name: "Uncategorized",
          notes: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }

      // Create/update files for each category
      categories.forEach((category) => {
        const existingFile = files.find((file) => file.id === category.id)

        if (existingFile) {
          // Update existing file
          existingFile.name = category.name
          existingFile.updatedAt = new Date().toISOString()
        } else {
          // Create new file
          files.push({
            id: category.id,
            name: category.name,
            notes: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        }
      })

      // Remove files for deleted categories (except "uncategorized")
      files = files.filter(
        (file) => file.id === "uncategorized" || categories.some((category) => category.id === file.id),
      )

      this.saveNoteFiles(files)
      this.syncFilesWithNotes()
    } catch (error) {
      console.error("Error syncing files with categories:", error)
    }
  }

  /**
   * Sync files with notes
   * Updates file contents based on notes
   */
  private syncFilesWithNotes(): void {
    try {
      const notes = this.getNotes()
      const files = this.getNoteFiles()

      // Clear notes from all files
      files.forEach((file) => {
        file.notes = []
      })

      // Add notes to appropriate files
      notes.forEach((note) => {
        const categoryId = note.categoryId || "uncategorized"
        const file = files.find((f) => f.id === categoryId)

        if (file) {
          file.notes.push(note)
          file.updatedAt = new Date().toISOString()
        } else {
          // If file doesn't exist (shouldn't happen), add to uncategorized
          const uncategorizedFile = files.find((f) => f.id === "uncategorized")
          if (uncategorizedFile) {
            uncategorizedFile.notes.push(note)
            uncategorizedFile.updatedAt = new Date().toISOString()
          }
        }
      })

      this.saveNoteFiles(files)
    } catch (error) {
      console.error("Error syncing files with notes:", error)
    }
  }

  /**
   * Export all data as JSON
   */
  public exportData(): string {
    try {
      const data = {
        categories: this.getCategories(),
        notes: this.getNotes(),
        files: this.getNoteFiles(),
        exportedAt: new Date().toISOString(),
      }

      return JSON.stringify(data, null, 2)
    } catch (error) {
      console.error("Error exporting data:", error)
      return ""
    }
  }

  /**
   * Import data from JSON
   */
  public importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)

      if (!data.categories || !data.notes) {
        throw new Error("Invalid data format")
      }

      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(data.categories))
      localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(data.notes))

      // Rebuild files
      this.syncFilesWithCategories()

      return true
    } catch (error) {
      console.error("Error importing data:", error)
      return false
    }
  }

  /**
   * Get the last sync timestamp
   */
  public getLastSyncTimestamp(): string {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || new Date().toISOString()
  }

  /**
   * Check if there are unsaved changes
   */
  public hasUnsavedChanges(): boolean {
    return this.saveQueue.size > 0
  }

  /**
   * Force save all pending changes
   */
  public forceSave(): void {
    this.saveQueue.forEach((timeoutId, noteId) => {
      clearTimeout(timeoutId)
    })

    this.saveQueue.clear()
    this.saveNotes(this.getNotes())
  }
}

// Create and export the singleton instance
export const storageService = StorageService.getInstance()

// Make sure the export is properly formatted
export type { NoteFile as type }

