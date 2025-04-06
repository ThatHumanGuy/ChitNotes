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
import type { Category } from "@/lib/types"

interface CreateCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  onCreateCategory: (category: Category) => void
}

export function CreateCategoryDialog({ open, onOpenChange, categories, onCreateCategory }: CreateCategoryDialogProps) {
  const [name, setName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    const newCategory: Category = {
      id: `category-${Date.now()}`,
      name: name.trim(),
      parentId: null,
    }

    onCreateCategory(newCategory)
    resetForm()
  }

  const resetForm = () => {
    setName("")
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm()
        onOpenChange(isOpen)
      }}
    >
      <DialogContent className="sm:max-w-[425px] bg-[#2B293A] border-[#262433] text-[#DFDFDF]">
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
          <DialogDescription className="text-[#9998A9]">Enter a name for your new category.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-[#DFDFDF]">
                Category Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter category name"
                required
                className="bg-[#15131D] border-[#262433] text-[#DFDFDF] placeholder:text-[#676672]"
              />
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
              Create Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

