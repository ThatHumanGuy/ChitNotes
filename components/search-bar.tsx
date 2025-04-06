"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full mx-auto">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#9998A9]" />
      <Input
        type="text"
        placeholder="Search Notes..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 w-full bg-transparent border-none shadow-md rounded-md text-[#DFDFDF] placeholder:text-[#676672] focus-visible:ring-[#33691E] focus:shadow-lg transition-shadow"
      />
    </div>
  )
}

