"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Upload, Save, Check, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useStorage } from "@/lib/hooks/use-storage"

export function StorageStatus() {
  const { hasUnsavedChanges, lastSyncTime, forceSave, exportData, importData } = useStorage()
  const [lastSaved, setLastSaved] = useState<string>("")
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const lastSyncTimeRef = useRef<string>(lastSyncTime)

  // Update ref when lastSyncTime changes
  useEffect(() => {
    lastSyncTimeRef.current = lastSyncTime
  }, [lastSyncTime])

  useEffect(() => {
    // Create a file input element for importing
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.style.display = "none"
    input.addEventListener("change", handleImport)
    document.body.appendChild(input)
    fileInputRef.current = input

    return () => {
      document.body.removeChild(input)
    }
  }, [])

  useEffect(() => {
    const updateLastSaved = () => {
      if (lastSyncTimeRef.current) {
        const date = new Date(lastSyncTimeRef.current)
        setLastSaved(formatTimeAgo(date))
      }
    }

    // Update immediately
    updateLastSaved()

    const interval = setInterval(updateLastSaved, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)

    if (diffSec < 60) {
      return "just now"
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`
    } else {
      return date.toLocaleString()
    }
  }

  const handleSave = () => {
    forceSave()
    toast({
      title: "Changes saved",
      description: "All changes have been saved to local storage.",
      className: "bg-[#2B293A] border-[#262433] text-[#DFDFDF]",
    })
  }

  const handleExport = () => {
    const data = exportData()
    if (!data) {
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
        className: "bg-[#2B293A] border-[#262433] text-[#DFDFDF]",
      })
      return
    }

    // Create a blob and download it
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `chitnotes_backup_${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Export successful",
      description: "Your notes have been exported successfully.",
      className: "bg-[#2B293A] border-[#262433] text-[#DFDFDF]",
    })
  }

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleImport = (event: Event) => {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) return

    const file = input.files[0]
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string
        const success = importData(jsonData)

        if (success) {
          toast({
            title: "Import successful",
            description: "Your notes have been imported successfully.",
            className: "bg-[#2B293A] border-[#262433] text-[#DFDFDF]",
          })
        } else {
          toast({
            title: "Import failed",
            description: "Failed to import data. The file may be corrupted or in an invalid format.",
            variant: "destructive",
            className: "bg-[#2B293A] border-[#262433] text-[#DFDFDF]",
          })
        }
      } catch (error) {
        console.error("Error importing data:", error)
        toast({
          title: "Import failed",
          description: "An error occurred while importing data.",
          variant: "destructive",
          className: "bg-[#2B293A] border-[#262433] text-[#DFDFDF]",
        })
      }

      // Reset the input
      input.value = ""
    }

    reader.readAsText(file)
  }

  return (
    <div className="flex items-center space-x-2">
      {hasUnsavedChanges ? (
        <Badge variant="outline" className="bg-[#15131D] text-yellow-400 border-yellow-400/30">
          <AlertCircle className="h-3 w-3 mr-1" />
          Unsaved changes
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-[#15131D] text-green-400 border-green-400/30">
          <Check className="h-3 w-3 mr-1" />
          Saved {lastSaved}
        </Badge>
      )}

      <div className="flex space-x-1">
        {hasUnsavedChanges && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            className="h-7 px-2 bg-[#15131D] border-[#262433] text-[#DFDFDF] hover:bg-[#262433]"
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            Save
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="h-7 px-2 bg-[#15131D] border-[#262433] text-[#DFDFDF] hover:bg-[#262433]"
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          Export
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleImportClick}
          className="h-7 px-2 bg-[#15131D] border-[#262433] text-[#DFDFDF] hover:bg-[#262433]"
        >
          <Upload className="h-3.5 w-3.5 mr-1" />
          Import
        </Button>
      </div>
    </div>
  )
}

