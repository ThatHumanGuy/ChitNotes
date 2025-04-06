"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileUp, Share2, Copy, Plus, Trash } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

interface FileData {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploadedAt: string
  sharedWith: Recipient[]
  isPublic: boolean
  shareToken?: string
}

interface Recipient {
  email: string
  permission: "view" | "edit"
}

export function FileSharing() {
  const [files, setFiles] = useState<FileData[]>(() => {
    if (typeof window !== "undefined") {
      const savedFiles = localStorage.getItem("sharedFiles")
      return savedFiles ? JSON.parse(savedFiles) : []
    }
    return []
  })

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null)
  const [shareLink, setShareLink] = useState<string>("")
  const [isPublic, setIsPublic] = useState<boolean>(false)
  const [recipients, setRecipients] = useState<Recipient[]>([{ email: "", permission: "view" }])
  const [activeTab, setActiveTab] = useState<string>("link")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files
    if (!uploadedFiles || uploadedFiles.length === 0) return

    const newFiles: FileData[] = []

    Array.from(uploadedFiles).forEach((file) => {
      // Create a URL for the file (in a real app, you'd upload to a server)
      const fileUrl = URL.createObjectURL(file)

      const newFile: FileData = {
        id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: fileUrl,
        uploadedAt: new Date().toISOString(),
        sharedWith: [],
        isPublic: false,
      }

      newFiles.push(newFile)
    })

    const updatedFiles = [...files, ...newFiles]
    setFiles(updatedFiles)
    localStorage.setItem("sharedFiles", JSON.stringify(updatedFiles))
    setIsUploadDialogOpen(false)

    toast({
      title: "Files uploaded",
      description: `Successfully uploaded ${newFiles.length} file(s)`,
      className: "bg-[#2B293A] border-[#262433] text-[#DFDFDF]",
    })
  }

  const handleShareFile = (file: FileData) => {
    setSelectedFile(file)
    setIsPublic(file.isPublic)
    setRecipients(file.sharedWith.length > 0 ? file.sharedWith : [{ email: "", permission: "view" }])

    // Generate share link if it doesn't exist
    if (file.shareToken) {
      setShareLink(`${window.location.origin}/shared-files/${file.id}?token=${file.shareToken}`)
    } else {
      setShareLink("")
    }

    setIsShareDialogOpen(true)
  }

  const handleDeleteFile = (fileId: string) => {
    const updatedFiles = files.filter((file) => file.id !== fileId)
    setFiles(updatedFiles)
    localStorage.setItem("sharedFiles", JSON.stringify(updatedFiles))

    toast({
      title: "File deleted",
      description: "The file has been removed",
      className: "bg-[#2B293A] border-[#262433] text-[#DFDFDF]",
    })
  }

  const generateShareLink = () => {
    if (!selectedFile) return ""

    const token = Math.random().toString(36).substring(2, 15)
    const link = `${window.location.origin}/shared-files/${selectedFile.id}?token=${token}`

    // Update the file with sharing info
    const updatedFiles = files.map((file) => {
      if (file.id === selectedFile.id) {
        return {
          ...file,
          isPublic,
          sharedWith: recipients.filter((r) => r.email.trim() !== ""),
          shareToken: token,
        }
      }
      return file
    })

    setFiles(updatedFiles)
    localStorage.setItem("sharedFiles", JSON.stringify(updatedFiles))

    return link
  }

  const handleCopyLink = () => {
    if (!shareLink) {
      const link = generateShareLink()
      setShareLink(link)
    }

    navigator.clipboard.writeText(shareLink)
    toast({
      title: "Link copied",
      description: "The share link has been copied to your clipboard",
      className: "bg-[#2B293A] border-[#262433] text-[#DFDFDF]",
    })
  }

  const handleAddRecipient = () => {
    setRecipients([...recipients, { email: "", permission: "view" }])
  }

  const handleRemoveRecipient = (index: number) => {
    const newRecipients = [...recipients]
    newRecipients.splice(index, 1)
    setRecipients(newRecipients)
  }

  const handleRecipientChange = (index: number, field: keyof Recipient, value: string) => {
    const newRecipients = [...recipients]
    newRecipients[index] = { ...newRecipients[index], [field]: value }
    setRecipients(newRecipients)
  }

  const handleSendInvites = () => {
    // Filter out empty emails
    const validRecipients = recipients.filter((r) => r.email.trim() !== "")

    if (validRecipients.length === 0) {
      toast({
        title: "No recipients",
        description: "Please add at least one recipient email",
        variant: "destructive",
        className: "bg-[#2B293A] border-[#262433] text-[#DFDFDF]",
      })
      return
    }

    // Generate link if not already generated
    if (!shareLink) {
      const link = generateShareLink()
      setShareLink(link)
    }

    // Update the file with sharing info
    if (selectedFile) {
      const updatedFiles = files.map((file) => {
        if (file.id === selectedFile.id) {
          return {
            ...file,
            isPublic,
            sharedWith: validRecipients,
          }
        }
        return file
      })

      setFiles(updatedFiles)
      localStorage.setItem("sharedFiles", JSON.stringify(updatedFiles))
    }

    // In a real app, this would send emails to recipients
    toast({
      title: "Invitations sent",
      description: `Sent to ${validRecipients.length} recipient(s)`,
      className: "bg-[#2B293A] border-[#262433] text-[#DFDFDF]",
    })

    setIsShareDialogOpen(false)
  }

  const handlePublicToggle = (checked: boolean) => {
    setIsPublic(checked)
    // Reset share link so it will be regenerated with new permissions
    setShareLink("")
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB"
    else return (bytes / 1073741824).toFixed(1) + " GB"
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return "🖼️"
    if (fileType.startsWith("video/")) return "🎬"
    if (fileType.startsWith("audio/")) return "🎵"
    if (fileType.includes("pdf")) return "📄"
    if (fileType.includes("word") || fileType.includes("document")) return "📝"
    if (fileType.includes("excel") || fileType.includes("sheet")) return "📊"
    if (fileType.includes("powerpoint") || fileType.includes("presentation")) return "📑"
    return "📁"
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-[#DFDFDF]">Shared Files</h2>
        <Button onClick={() => setIsUploadDialogOpen(true)} className="bg-[#33691E] hover:bg-[#33691E]/90 text-white">
          <FileUp className="h-4 w-4 mr-2" />
          Upload File
        </Button>
      </div>

      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-muted-foreground mb-2">No files uploaded yet</p>
          <p className="text-sm text-muted-foreground">Upload a file using the button above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <Card
              key={file.id}
              className="overflow-hidden hover:shadow-md transition-shadow bg-[#2B293A] border-[#262433]"
            >
              <CardHeader className="p-4 pb-2 flex justify-between items-start">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{getFileIcon(file.type)}</span>
                  <div className="truncate">
                    <h3 className="text-lg font-semibold text-[#DFDFDF] truncate">{file.name}</h3>
                    <p className="text-xs text-[#9998A9]">{formatFileSize(file.size)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="flex items-center text-xs text-[#9998A9]">
                  <span>Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}</span>
                </div>
                {file.sharedWith.length > 0 && (
                  <div className="mt-2 text-xs text-[#9998A9]">
                    <span>Shared with: {file.sharedWith.length} people</span>
                  </div>
                )}
                {file.isPublic && (
                  <div className="mt-2 text-xs text-[#4FC3F7]">
                    <span>Public link available</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#15131D] border-[#262433] text-[#DFDFDF] hover:bg-[#262433]"
                  onClick={() => handleShareFile(file)}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-[#15131D] border-[#262433] text-[#DFDFDF] hover:bg-[#262433]"
                  onClick={() => handleDeleteFile(file.id)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#2B293A] border-[#262433] text-[#DFDFDF]">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription className="text-[#9998A9]">
              Select files from your device to upload and share.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="file-upload" className="text-[#DFDFDF]">
              Select Files
            </Label>
            <Input
              id="file-upload"
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="bg-[#15131D] border-[#262433] text-[#DFDFDF]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
              className="bg-[#15131D] border-[#262433] text-[#DFDFDF] hover:bg-[#262433]"
            >
              Cancel
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#33691E] hover:bg-[#33691E]/90 text-white"
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-[550px] bg-[#2B293A] border-[#262433] text-[#DFDFDF]">
          <DialogHeader>
            <DialogTitle>Share File</DialogTitle>
            <DialogDescription className="text-[#9998A9]">
              {selectedFile && `Share "${selectedFile.name}" with others via link or email invitation.`}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="link" value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid grid-cols-2 bg-[#15131D]">
              <TabsTrigger value="link" className="data-[state=active]:bg-[#262433]">
                Share Link
              </TabsTrigger>
              <TabsTrigger value="email" className="data-[state=active]:bg-[#262433]">
                Email Invites
              </TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="mt-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="public-toggle" className="flex-grow">
                  Anyone with the link can view
                </Label>
                <Switch
                  id="public-toggle"
                  checked={isPublic}
                  onCheckedChange={handlePublicToggle}
                  className="data-[state=checked]:bg-[#33691E]"
                />
              </div>

              <div className="flex space-x-2">
                <Input
                  value={shareLink || "Generate a link by clicking the button →"}
                  readOnly
                  className="flex-grow bg-[#15131D] border-[#262433] text-[#DFDFDF]"
                />
                <Button onClick={handleCopyLink} className="bg-[#33691E] hover:bg-[#33691E]/90 text-white">
                  <Copy className="h-4 w-4 mr-2" />
                  {shareLink ? "Copy" : "Generate"}
                </Button>
              </div>

              <div className="text-sm text-[#9998A9]">
                {isPublic
                  ? "Anyone with this link can view this file without signing in."
                  : "Only people you invite can access this file."}
              </div>
            </TabsContent>

            <TabsContent value="email" className="mt-4 space-y-4">
              <div className="space-y-4">
                {recipients.map((recipient, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      placeholder="Email address"
                      value={recipient.email}
                      onChange={(e) => handleRecipientChange(index, "email", e.target.value)}
                      className="flex-grow bg-[#15131D] border-[#262433] text-[#DFDFDF]"
                    />
                    <Select
                      value={recipient.permission}
                      onValueChange={(value) => handleRecipientChange(index, "permission", value as "view" | "edit")}
                    >
                      <SelectTrigger className="w-[110px] bg-[#15131D] border-[#262433] text-[#DFDFDF]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2B293A] border-[#262433] text-[#DFDFDF]">
                        <SelectItem value="view">Can view</SelectItem>
                        <SelectItem value="edit">Can edit</SelectItem>
                      </SelectContent>
                    </Select>
                    {recipients.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveRecipient(index)}
                        className="text-[#DFDFDF] hover:bg-[#262433]"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddRecipient}
                  className="mt-2 bg-[#15131D] border-[#262433] text-[#DFDFDF] hover:bg-[#262433]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add another
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setIsShareDialogOpen(false)}
              className="bg-[#15131D] border-[#262433] text-[#DFDFDF] hover:bg-[#262433]"
            >
              Cancel
            </Button>
            {activeTab === "email" ? (
              <Button onClick={handleSendInvites} className="bg-[#33691E] hover:bg-[#33691E]/90 text-white">
                Send Invites
              </Button>
            ) : (
              <Button
                onClick={() => setIsShareDialogOpen(false)}
                className="bg-[#33691E] hover:bg-[#33691E]/90 text-white"
              >
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden file input for upload */}
      <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />
    </div>
  )
}

