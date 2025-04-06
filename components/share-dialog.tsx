"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Copy, Plus, Trash } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Note } from "@/lib/types"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  note: Note
}

interface Recipient {
  email: string
  permission: "view" | "edit"
}

export function ShareDialog({ open, onOpenChange, note }: ShareDialogProps) {
  // Early return if note is null or undefined
  if (!note) {
    return null
  }

  const [shareLink, setShareLink] = useState<string>("")
  const [isPublic, setIsPublic] = useState<boolean>(false)
  const [recipients, setRecipients] = useState<Recipient[]>([{ email: "", permission: "view" }])
  const [activeTab, setActiveTab] = useState<string>("link")

  const { toast } = useToast()

  // Generate a share link when the dialog opens
  const generateShareLink = () => {
    const baseUrl = window.location.origin
    const noteId = note.id
    const token = Math.random().toString(36).substring(2, 15)

    // Store sharing info in localStorage
    const shareInfo = {
      noteId,
      token,
      isPublic,
      createdAt: new Date().toISOString(),
      recipients: recipients.filter((r) => r.email.trim() !== ""),
    }

    // Get existing shares or initialize empty array
    const existingShares = JSON.parse(localStorage.getItem("shares") || "[]")

    // Check if this note is already shared and update it
    const noteShareIndex = existingShares.findIndex((share: any) => share.noteId === noteId)
    if (noteShareIndex >= 0) {
      existingShares[noteShareIndex] = shareInfo
    } else {
      existingShares.push(shareInfo)
    }

    localStorage.setItem("shares", JSON.stringify(existingShares))

    return `${baseUrl}/shared/${noteId}?token=${token}`
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

    // In a real app, this would send emails to recipients
    // For now, we'll just show a success message
    toast({
      title: "Invitations sent",
      description: `Sent to ${validRecipients.length} recipient(s)`,
      className: "bg-[#2B293A] border-[#262433] text-[#DFDFDF]",
    })

    onOpenChange(false)
  }

  const handlePublicToggle = (checked: boolean) => {
    setIsPublic(checked)
    // Reset share link so it will be regenerated with new permissions
    setShareLink("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-[#2B293A] border-[#262433] text-[#DFDFDF]">
        <DialogHeader>
          <DialogTitle>Share Note</DialogTitle>
          <DialogDescription className="text-[#9998A9]">
            Share "{note.title}" with others via link or email invitation.
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
                ? "Anyone with this link can view this note without signing in."
                : "Only people you invite can access this note."}
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
                    onValueChange={(value) => handleRecipientChange(index, "permission", value)}
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
            onClick={() => onOpenChange(false)}
            className="bg-[#15131D] border-[#262433] text-[#DFDFDF] hover:bg-[#262433]"
          >
            Cancel
          </Button>
          {activeTab === "email" ? (
            <Button onClick={handleSendInvites} className="bg-[#33691E] hover:bg-[#33691E]/90 text-white">
              Send Invites
            </Button>
          ) : (
            <Button onClick={() => onOpenChange(false)} className="bg-[#33691E] hover:bg-[#33691E]/90 text-white">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

