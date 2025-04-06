"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Lock } from "lucide-react"

interface FileData {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: string
  sharedWith: Array<{ email: string; permission: string }>
  isPublic: boolean
  shareToken?: string
}

export default function SharedFilePage({ params }: { params: { fileId: string } }) {
  const [file, setFile] = useState<FileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    const validateAccess = () => {
      if (!token) {
        setError("Invalid access token")
        setLoading(false)
        return
      }

      try {
        // Get files from localStorage
        const files = JSON.parse(localStorage.getItem("sharedFiles") || "[]")

        // Find the file
        const foundFile = files.find((f: FileData) => f.id === params.fileId)

        if (!foundFile) {
          setError("File not found")
          setLoading(false)
          return
        }

        // Validate token
        if (foundFile.shareToken !== token && !foundFile.isPublic) {
          setError("Invalid access token")
          setLoading(false)
          return
        }

        setFile(foundFile)
        setLoading(false)
      } catch (error) {
        console.error("Error validating access:", error)
        setError("An error occurred while validating access")
        setLoading(false)
      }
    }

    validateAccess()
  }, [params.fileId, token])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB"
    else return (bytes / 1073741824).toFixed(1) + " GB"
  }

  const handleDownload = () => {
    if (!file) return

    // Create an anchor element and trigger download
    const a = document.createElement("a")
    a.href = file.url
    a.download = file.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#15131D] flex items-center justify-center">
        <div className="animate-pulse text-[#DFDFDF]">Loading...</div>
      </div>
    )
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-[#15131D] flex flex-col items-center justify-center p-4">
        <div className="bg-[#2B293A] border border-[#262433] rounded-xl p-8 max-w-md text-center">
          <Lock className="h-12 w-12 text-[#DFDFDF] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#DFDFDF] mb-2">Access Denied</h1>
          <p className="text-[#9998A9] mb-6">{error || "Unable to access this file"}</p>
          <Button onClick={() => router.push("/")} className="bg-[#33691E] hover:bg-[#33691E]/90 text-white">
            Go to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#15131D] flex flex-col">
      <header className="bg-[#2B293A] border-b border-[#262433] p-4 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="text-[#DFDFDF] hover:bg-[#262433]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
        <h1 className="text-lg font-medium text-[#DFDFDF] ml-4">Shared File</h1>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="bg-[#2B293A] border border-[#262433] rounded-xl overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[#DFDFDF] mb-2">{file.name}</h1>
                <p className="text-sm text-[#9998A9]">
                  {formatFileSize(file.size)} • Uploaded: {new Date(file.uploadedAt).toLocaleString()}
                </p>
              </div>
              <Button onClick={handleDownload} className="bg-[#33691E] hover:bg-[#33691E]/90 text-white">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>

            {file.type.startsWith("image/") ? (
              <div className="mt-4 flex justify-center">
                <img
                  src={file.url || "/placeholder.svg"}
                  alt={file.name}
                  className="max-w-full max-h-[500px] object-contain rounded-md"
                />
              </div>
            ) : (
              <div className="mt-4 p-8 bg-[#15131D] rounded-md text-center">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-[#DFDFDF]">Preview not available for this file type</p>
                <p className="text-[#9998A9] mt-2">Please download the file to view its contents</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

