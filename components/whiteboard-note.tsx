"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import type { Category, Note } from "@/lib/types"
import {
  ArrowLeft,
  Image,
  Mic,
  Type,
  Pencil,
  MousePointer,
  Eraser,
  Palette,
  Minus,
  Plus,
  ChevronDown,
  ChevronUp,
  Move,
  Camera,
  Link,
  StopCircle,
  Globe,
  X,
  GripHorizontal,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface WhiteboardNoteProps {
  note: Note
  categories: Category[]
  onClose: () => void
  onUpdate: (note: Note) => void
  onDelete: (noteId: string) => void
  onShare?: (noteId: string) => void
}

// 1. Update the COLORS array to provide more color options
const COLORS = [
  "#FF6347", // Tomato
  "#4FC3F7", // Light Blue
  "#33691E", // Green
  "#FFC107", // Amber
  "#E91E63", // Pink
  "#9C27B0", // Purple
  "#3F51B5", // Indigo
  "#00BCD4", // Cyan
  "#009688", // Teal
  "#8BC34A", // Light Green
  "#CDDC39", // Lime
  "#FF9800", // Orange
  "#795548", // Brown
  "#607D8B", // Blue Grey
  "#FFFFFF", // White
  "#000000", // Black
]

// Languages for translation
const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
]

// Mock functions for detectLanguage, translateText, and showNotification
const detectLanguage = async (text: string) => {
  // In a real application, you would use a language detection API here
  console.log("Detecting language for:", text)
  return "en" // Default to English for the mock
}

const translateText = async (text: string, sourceLang: string, targetLang: string) => {
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        targetLanguage: targetLang,
      }),
    })

    if (!response.ok) {
      throw new Error("Translation failed")
    }

    const data = await response.json()
    return data.translatedText
  } catch (error) {
    console.error("Translation error:", error)
    showNotification("Translation failed", "error")
    return null
  }
}

// Fix the showNotification function to use the toast component
const showNotification = (message: string, type: "success" | "error") => {
  // In a real application, you would use a notification library here
  console.log(`Notification: ${message} (Type: ${type})`)
  if (typeof window !== "undefined") {
    if (type === "success") {
      alert(message) // Mock notification
    } else {
      alert(`Error: ${message}`) // Mock notification
    }
  }
}

export function WhiteboardNote({ note, categories, onClose, onUpdate, onDelete, onShare }: WhiteboardNoteProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [categoryId, setCategoryId] = useState<string | null>(note.categoryId)
  const [currentTool, setCurrentTool] = useState<string>("pointer")
  const [currentColor, setCurrentColor] = useState<string>(COLORS[0])
  const [strokeWidth, setStrokeWidth] = useState<number>(2)
  const [scale, setScale] = useState<number>(1)
  const [showBottomToolbar, setShowBottomToolbar] = useState<boolean>(false)
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [imageData, setImageData] = useState<string | null>(null)

  // 2. Add new state variables for shape selection and fill options after the existing state declarations
  const [currentShape, setCurrentShape] = useState<string>("rectangle")
  const [isFilled, setIsFilled] = useState<boolean>(false)
  const [eraserSize, setEraserSize] = useState<number>(20)
  const [shapeStartPos, setShapeStartPos] = useState<{ x: number; y: number } | null>(null)

  // Add these new state variables after the existing state declarations
  const [canvasObjects, setCanvasObjects] = useState<
    Array<{
      type: string
      shape?: string
      startX: number
      startY: number
      endX: number
      endY: number
      color: string
      filled: boolean
      strokeWidth: number
    }>
  >([])
  const [selectedObjectIndex, setSelectedObjectIndex] = useState<number | null>(null)
  const [canvasState, setCanvasState] = useState<ImageData | null>(null)
  const [isMovingObject, setIsMovingObject] = useState(false)
  const [moveStartPos, setMoveStartPos] = useState<{ x: number; y: number } | null>(null)

  // Toolbar positions
  const [toolbarPosition, setToolbarPosition] = useState({ x: 20, y: 100 })
  const [isToolbarDragging, setIsToolbarDragging] = useState(false)
  const [toolbarInitialPosition, setToolbarInitialPosition] = useState({ x: 0, y: 0 })

  // Bottom toolbar position
  const [bottomToolbarPosition, setBottomToolbarPosition] = useState({ x: 20, y: 500 })
  const [isBottomToolbarDragging, setIsBottomToolbarDragging] = useState(false)
  const [bottomToolbarInitialPosition, setBottomToolbarInitialPosition] = useState({ x: 0, y: 0 })

  // Voice transcription states
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [transcript, setTranscript] = useState<string>("")
  const [translatedText, setTranslatedText] = useState<string>("")
  const [detectedLanguage, setDetectedLanguage] = useState<string>("en")
  const [targetLanguage, setTargetLanguage] = useState<string>("en")
  const [showTranscription, setShowTranscription] = useState<boolean>(false)
  const [transcriptionPosition, setTranscriptionPosition] = useState({ x: 100, y: 300 })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const textBoxesRef = useRef<HTMLDivElement[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const transcriptionBoxRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const bottomToolbarRef = useRef<HTMLDivElement>(null)

  // Auto-save timer
  useEffect(() => {
    const interval = setInterval(() => {
      handleSave()
    }, 5000)

    return () => clearInterval(interval)
  }, [title, content, categoryId])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = containerRef.current?.clientWidth || window.innerWidth
    canvas.height = containerRef.current?.clientHeight || window.innerHeight

    // Set initial styles
    ctx.strokeStyle = currentColor
    ctx.lineWidth = strokeWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Save initial canvas state
    setCanvasState(ctx.getImageData(0, 0, canvas.width, canvas.height))

    // Handle window resize
    const handleResize = () => {
      if (!canvas) return

      // Save current canvas content
      const tempCanvas = document.createElement("canvas")
      const tempCtx = tempCanvas.getContext("2d")
      if (!tempCtx) return

      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      tempCtx.drawImage(canvas, 0, 0)

      // Resize canvas
      canvas.width = containerRef.current?.clientWidth || window.innerWidth
      canvas.height = containerRef.current?.clientHeight || window.innerHeight

      // Restore content
      ctx.drawImage(tempCanvas, 0, 0)

      // Save new canvas state
      setCanvasState(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Update canvas styles when tool or color changes
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.strokeStyle = currentColor
    ctx.lineWidth = strokeWidth
  }, [currentColor, strokeWidth])

  // 10. Update the cursor effect based on the selected tool
  useEffect(() => {
    if (!containerRef.current) return

    let cursorStyle = "default"

    switch (currentTool) {
      case "pointer":
        cursorStyle = "default"
        break
      case "move":
        cursorStyle = "move"
        break
      case "text":
        cursorStyle = "text"
        break
      case "pen":
        cursorStyle = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%23FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z"/></svg>') 0 24, auto`
        break
      case "eraser":
        // Create a custom cursor for the eraser with the current size
        const size = Math.min(eraserSize, 40) // Limit cursor size for usability
        cursorStyle = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" stroke="%23FFFFFF" strokeWidth="1"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}" /></svg>') ${size / 2} ${size / 2}, auto`
        break
      case "shape":
        cursorStyle = "crosshair"
        break
      default:
        cursorStyle = "default"
    }

    containerRef.current.style.cursor = cursorStyle
  }, [currentTool, eraserSize])

  // Initialize speech recognition with improved language detection
  useEffect(() => {
    // We're using a custom implementation with MediaRecorder and our API endpoint
    let mediaRecorder: MediaRecorder | null = null
    let audioChunks: Blob[] = []

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaRecorder = new MediaRecorder(stream)

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data)
          }
        }

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" })
          audioChunks = []

          // Send the audio to our API endpoint
          const formData = new FormData()
          formData.append("audio", audioBlob)

          try {
            // Show processing indicator
            setTranscript("Processing audio...")

            // Call our transcription API
            const response = await fetch("/api/transcribe", {
              method: "POST",
              body: formData,
            })

            if (!response.ok) {
              throw new Error("Failed to transcribe audio")
            }

            const data = await response.json()
            setTranscript(data.text)

            // Only translate if target language is different from English
            if (targetLanguage !== "en") {
              const translatedText = await translateText(data.text, "en", targetLanguage)
              if (translatedText) {
                setTranslatedText(translatedText)
              }
            }
          } catch (error) {
            console.error("Error processing audio:", error)
            setTranscript("Error processing audio. Please try again.")
          }
        }

        mediaRecorder.start()
        setIsRecording(true)
      } catch (error) {
        console.error("Error starting recording:", error)
        showNotification("Microphone access denied or not available", "error")
      }
    }

    const stopRecording = () => {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop()

        // Stop all tracks in the stream
        mediaRecorder.stream.getTracks().forEach((track) => track.stop())
      }
      setIsRecording(false)
    }

    // Update the recognitionRef to store our custom functions
    recognitionRef.current = {
      start: startRecording,
      stop: stopRecording,
    }

    return () => {
      // Clean up
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop()
        mediaRecorder.stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [targetLanguage])

  // Make transcription box draggable
  useEffect(() => {
    if (!transcriptionBoxRef.current) return

    const element = transcriptionBoxRef.current

    const handleMouseDown = (e: MouseEvent) => {
      if (currentTool !== "move") return

      const startX = e.clientX
      const startY = e.clientY
      const startLeft = transcriptionPosition.x
      const startTop = transcriptionPosition.y

      const handleMouseMove = (e: MouseEvent) => {
        setTranscriptionPosition({
          x: startLeft + e.clientX - startX,
          y: startTop + e.clientY - startY,
        })
      }

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    element.addEventListener("mousedown", handleMouseDown)

    return () => {
      element.removeEventListener("mousedown", handleMouseDown)
    }
  }, [currentTool, transcriptionPosition])

  // Handle toolbar dragging
  const handleToolbarDragStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsToolbarDragging(true)
    setToolbarInitialPosition({
      x: e.clientX - toolbarPosition.x,
      y: e.clientY - toolbarPosition.y,
    })
  }

  const handleToolbarDrag = (e: React.MouseEvent) => {
    if (!isToolbarDragging) return

    setToolbarPosition({
      x: e.clientX - toolbarInitialPosition.x,
      y: e.clientY - toolbarInitialPosition.y,
    })
  }

  const handleToolbarDragEnd = () => {
    setIsToolbarDragging(false)
  }

  // Handle bottom toolbar dragging
  const handleBottomToolbarDragStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsBottomToolbarDragging(true)
    setBottomToolbarInitialPosition({
      x: e.clientX - bottomToolbarPosition.x,
      y: e.clientY - bottomToolbarPosition.y,
    })
  }

  const handleBottomToolbarDrag = (e: React.MouseEvent) => {
    if (!isBottomToolbarDragging) return

    setBottomToolbarPosition({
      x: e.clientX - bottomToolbarInitialPosition.x,
      y: e.clientY - bottomToolbarInitialPosition.y,
    })
  }

  const handleBottomToolbarDragEnd = () => {
    setIsBottomToolbarDragging(false)
  }

  const handleSave = () => {
    if (!title.trim()) return

    const updatedNote: Note = {
      ...note,
      title: title.trim(),
      content: content,
      categoryId: categoryId,
      updatedAt: new Date().toISOString(),
    }

    onUpdate(updatedNote)
  }

  const handleCategoryChange = (value: string) => {
    setCategoryId(value === "none" ? null : value)
  }

  // 6. Replace the existing tool change handler to include shape tool
  const handleToolChange = (tool: string) => {
    setCurrentTool(tool)

    // Reset shape start position when changing tools
    if (tool !== "shape") {
      setShapeStartPos(null)
    }
  }

  // 7. Add a function to handle shape selection
  const handleShapeChange = (shape: string) => {
    setCurrentShape(shape)
  }

  // 8. Add a function to toggle fill mode
  const toggleFill = () => {
    setIsFilled(!isFilled)
  }

  // 9. Add a function to handle eraser size change
  const handleEraserSizeChange = (value: number[]) => {
    setEraserSize(value[0])
  }

  // 3. Replace the handleCanvasMouseDown function to handle shape drawing
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale

    // Check if we're clicking on an existing object when in move mode
    if (currentTool === "move") {
      const clickedObjectIndex = canvasObjects.findIndex((obj) => {
        if (obj.type === "shape") {
          // Simple bounding box check
          const minX = Math.min(obj.startX, obj.endX)
          const maxX = Math.max(obj.startX, obj.endX)
          const minY = Math.min(obj.startY, obj.endY)
          const maxY = Math.max(obj.startY, obj.endY)

          // Add some padding for easier selection
          const padding = 5
          return x >= minX - padding && x <= maxX + padding && y >= minY - padding && y <= maxY + padding
        }
        return false
      })

      if (clickedObjectIndex !== -1) {
        setSelectedObjectIndex(clickedObjectIndex)
        setIsMovingObject(true)
        setMoveStartPos({ x, y })
        return
      } else {
        setSelectedObjectIndex(null)
      }
    }

    if (currentTool === "text") {
      addTextBox()
      return
    }

    if (currentTool !== "pen" && currentTool !== "eraser" && currentTool !== "shape") return

    setIsDrawing(true)
    setPosition({ x, y })

    if (currentTool === "shape") {
      // Save the current canvas state before drawing a new shape
      if (ctx) {
        setCanvasState(ctx.getImageData(0, 0, canvas.width, canvas.height))
      }
      setShapeStartPos({ x, y })
      return
    }

    ctx.beginPath()
    ctx.moveTo(x, y)

    if (currentTool === "eraser") {
      ctx.globalCompositeOperation = "destination-out"
      ctx.lineWidth = eraserSize
    } else {
      ctx.globalCompositeOperation = "source-over"
      ctx.lineWidth = strokeWidth
    }
  }

  // 4. Update the handleCanvasMouseMove function to handle shape preview
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale

    // Handle moving an existing object
    if (isMovingObject && selectedObjectIndex !== null && moveStartPos) {
      const deltaX = x - moveStartPos.x
      const deltaY = y - moveStartPos.y

      setCanvasObjects((prevObjects) => {
        const newObjects = [...prevObjects]
        const obj = newObjects[selectedObjectIndex]

        // Update object position
        newObjects[selectedObjectIndex] = {
          ...obj,
          startX: obj.startX + deltaX,
          startY: obj.startY + deltaY,
          endX: obj.endX + deltaX,
          endY: obj.endY + deltaY,
        }

        return newObjects
      })

      setMoveStartPos({ x, y })

      // Redraw all objects
      redrawCanvas()
      return
    }

    if (!isDrawing) return

    if (currentTool === "shape" && shapeStartPos) {
      // Restore the saved canvas state
      if (canvasState) {
        ctx.putImageData(canvasState, 0, 0)
      }

      // Draw the shape based on the current selection
      ctx.beginPath()
      ctx.strokeStyle = currentColor
      ctx.fillStyle = currentColor
      ctx.lineWidth = strokeWidth

      const width = x - shapeStartPos.x
      const height = y - shapeStartPos.y

      switch (currentShape) {
        case "rectangle":
          if (isFilled) {
            ctx.fillRect(shapeStartPos.x, shapeStartPos.y, width, height)
          } else {
            ctx.strokeRect(shapeStartPos.x, shapeStartPos.y, width, height)
          }
          break
        case "circle":
          const radius = Math.sqrt(width * width + height * height)
          ctx.arc(shapeStartPos.x, shapeStartPos.y, radius, 0, 2 * Math.PI)
          if (isFilled) {
            ctx.fill()
          } else {
            ctx.stroke()
          }
          break
        case "triangle":
          ctx.moveTo(shapeStartPos.x, shapeStartPos.y)
          ctx.lineTo(x, y)
          ctx.lineTo(shapeStartPos.x - (x - shapeStartPos.x), y)
          ctx.closePath()
          if (isFilled) {
            ctx.fill()
          } else {
            ctx.stroke()
          }
          break
        case "line":
          ctx.moveTo(shapeStartPos.x, shapeStartPos.y)
          ctx.lineTo(x, y)
          ctx.stroke()
          break
        case "arrow":
          // Draw the line
          ctx.moveTo(shapeStartPos.x, shapeStartPos.y)
          ctx.lineTo(x, y)
          ctx.stroke()

          // Calculate the arrow head
          const angle = Math.atan2(y - shapeStartPos.y, x - shapeStartPos.x)
          const headLength = 15 // Length of arrow head

          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x - headLength * Math.cos(angle - Math.PI / 6), y - headLength * Math.sin(angle - Math.PI / 6))
          ctx.moveTo(x, y)
          ctx.lineTo(x - headLength * Math.cos(angle + Math.PI / 6), y - headLength * Math.sin(angle + Math.PI / 6))
          ctx.stroke()
          break
      }
      return
    }

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  // 5. Update the handleCanvasMouseUp function to finalize shape drawing
  const handleCanvasMouseUp = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Handle finishing moving an object
    if (isMovingObject) {
      setIsMovingObject(false)
      setMoveStartPos(null)
    }

    if (!isDrawing) return

    if (currentTool === "shape" && shapeStartPos) {
      // Add the shape to our objects array
      const rect = canvas.getBoundingClientRect()
      const x = position.x / scale
      const y = position.y / scale

      setCanvasObjects((prevObjects) => [
        ...prevObjects,
        {
          type: "shape",
          shape: currentShape,
          startX: shapeStartPos.x,
          startY: shapeStartPos.y,
          endX: x,
          endY: y,
          color: currentColor,
          filled: isFilled,
          strokeWidth: strokeWidth,
        },
      ])

      setShapeStartPos(null)
      setCanvasState(null)
    } else {
      ctx.closePath()
    }

    setIsDrawing(false)

    // Reset composite operation and line width
    ctx.globalCompositeOperation = "source-over"
    ctx.lineWidth = strokeWidth

    // Save the current canvas state after drawing is complete
    setCanvasState(ctx.getImageData(0, 0, canvas.width, canvas.height))
  }

  // Add this new function to redraw all canvas objects
  const redrawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Don't clear the entire canvas - this would erase pen drawings
    // Instead, restore the saved canvas state if available
    if (canvasState) {
      ctx.putImageData(canvasState, 0, 0)
    }

    // Redraw all objects
    canvasObjects.forEach((obj, index) => {
      const isSelected = index === selectedObjectIndex

      if (obj.type === "shape") {
        ctx.beginPath()
        ctx.strokeStyle = obj.color
        ctx.fillStyle = obj.color
        ctx.lineWidth = obj.strokeWidth

        const width = obj.endX - obj.startX
        const height = obj.endY - obj.startY

        switch (obj.shape) {
          case "rectangle":
            if (obj.filled) {
              ctx.fillRect(obj.startX, obj.startY, width, height)
            } else {
              ctx.strokeRect(obj.startX, obj.startY, width, height)
            }
            break
          case "circle":
            const radius = Math.sqrt(width * width + height * height)
            ctx.arc(obj.startX, obj.startY, radius, 0, 2 * Math.PI)
            if (obj.filled) {
              ctx.fill()
            } else {
              ctx.stroke()
            }
            break
          case "triangle":
            ctx.moveTo(obj.startX, obj.startY)
            ctx.lineTo(obj.endX, obj.endY)
            ctx.lineTo(obj.startX - (obj.endX - obj.startX), obj.endY)
            ctx.closePath()
            if (obj.filled) {
              ctx.fill()
            } else {
              ctx.stroke()
            }
            break
          case "line":
            ctx.moveTo(obj.startX, obj.startY)
            ctx.lineTo(obj.endX, obj.endY)
            ctx.stroke()
            break
          case "arrow":
            // Draw the line
            ctx.moveTo(obj.startX, obj.startY)
            ctx.lineTo(obj.endX, obj.endY)
            ctx.stroke()

            // Calculate the arrow head
            const angle = Math.atan2(obj.endY - obj.startY, obj.endX - obj.startX)
            const headLength = 15 // Length of arrow head

            ctx.beginPath()
            ctx.moveTo(obj.endX, obj.endY)
            ctx.lineTo(
              obj.endX - headLength * Math.cos(angle - Math.PI / 6),
              obj.endY - headLength * Math.sin(angle - Math.PI / 6),
            )
            ctx.moveTo(obj.endX, obj.endY)
            ctx.lineTo(
              obj.endX - headLength * Math.cos(angle + Math.PI / 6),
              obj.endY - headLength * Math.sin(angle + Math.PI / 6),
            )
            ctx.stroke()
            break
        }

        // Draw selection indicator if selected
        if (isSelected) {
          ctx.strokeStyle = "#4FC3F7"
          ctx.lineWidth = 2
          ctx.setLineDash([5, 5])

          // Draw selection box around the shape
          const minX = Math.min(obj.startX, obj.endX)
          const maxX = Math.max(obj.startX, obj.endX)
          const minY = Math.min(obj.startY, obj.endY)
          const maxY = Math.max(obj.startY, obj.endY)

          const padding = 5
          ctx.strokeRect(minX - padding, minY - padding, maxX - minX + padding * 2, maxY - minY + padding * 2)

          ctx.setLineDash([])
        }
      }
    })
  }

  // Add this effect to redraw the canvas when objects change
  useEffect(() => {
    redrawCanvas()
  }, [canvasObjects, selectedObjectIndex])

  const addDraggableElement = (type: string) => {
    // Create a draggable element based on type
    const element = document.createElement("div")
    element.className =
      "absolute flex items-start p-2 min-w-[150px] min-h-[100px] bg-[#2B293A] border border-[#262433] rounded-md"
    element.style.left = `${position.x}px`
    element.style.top = `${position.y}px`

    // Add icon based on type
    const iconContainer = document.createElement("div")
    iconContainer.className = "p-1 mr-2 bg-[#15131D] rounded-sm"

    let iconHTML = ""
    if (type === "text")
      iconHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>'
    else if (type === "image")
      iconHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'
    else if (type === "voice")
      iconHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>'

    iconContainer.innerHTML = iconHTML
    element.appendChild(iconContainer)

    // Add content area
    const content = document.createElement("div")
    content.className = "flex-1"
    content.contentEditable = "true"

    if (type === "text") {
      content.className += " min-h-[80px] focus:outline-none text-[#DFDFDF]"
      content.textContent = "Type here..."
    } else if (type === "image") {
      content.innerHTML = '<div class="text-[#9998A9] text-sm">Click to add an image</div>'
      content.addEventListener("click", () => {
        fileInputRef.current?.click()
      })
    } else if (type === "voice") {
      content.innerHTML = '<div class="text-[#9998A9] text-sm">Click to record audio</div>'
      content.addEventListener("click", handleVoiceRecording)
    }

    element.appendChild(content)

    // Add drag functionality
    element.addEventListener("mousedown", (e) => {
      if (e.target !== iconContainer && currentTool !== "move") return

      const startX = e.clientX
      const startY = e.clientY
      const startLeft = Number.parseInt(element.style.left)
      const startTop = Number.parseInt(element.style.top)

      const handleMouseMove = (e: MouseEvent) => {
        element.style.left = `${startLeft + e.clientX - startX}px`
        element.style.top = `${startTop + e.clientY - startY}px`
      }

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    })

    containerRef.current?.appendChild(element)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    // Handle toolbar dragging
    handleToolbarDrag(e)
    handleBottomToolbarDrag(e)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const reader = new FileReader()
      reader.onloadend = () => {
        try {
          const imageDataUri = reader.result as string
          setImageData(imageDataUri)

          // Create image element with the loaded data
          const img = document.createElement("img")
          img.src = imageDataUri
          img.className = "max-w-[300px] max-h-[300px] object-contain"
          img.crossOrigin = "anonymous" // Add crossOrigin to avoid CORS issues

          // Create container for the image
          const container = document.createElement("div")
          container.className = "absolute p-2 bg-[#2B293A] border border-[#262433] rounded-md"
          container.style.left = `${position.x}px`
          container.style.top = `${position.y}px`
          container.style.cursor = "move" // Add move cursor to indicate draggability

          // Add resize handle
          const resizeHandle = document.createElement("div")
          resizeHandle.className = "absolute bottom-0 right-0 w-4 h-4 bg-[#33691E] cursor-nwse-resize"
          resizeHandle.style.borderTopLeftRadius = "4px"

          // Add OCR button
          const ocrButton = document.createElement("button")
          ocrButton.className = "mt-2 px-3 py-1 bg-[#33691E] text-white rounded-md text-sm flex items-center"
          ocrButton.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="mr-1"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg> Scan Text'

          // Add delete button
          const deleteButton = document.createElement("button")
          deleteButton.className = "mt-2 ml-2 px-3 py-1 bg-[#0E0D13] text-white rounded-md text-sm flex items-center"
          deleteButton.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="mr-1"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg> Delete Image'

          // Add button container
          const buttonContainer = document.createElement("div")
          buttonContainer.className = "flex"
          buttonContainer.appendChild(ocrButton)
          buttonContainer.appendChild(deleteButton)

          container.appendChild(img)
          container.appendChild(buttonContainer)
          container.appendChild(resizeHandle)

          // Add OCR functionality
          ocrButton.onclick = async () => {
            showNotification("OCR processing started", "success")

            try {
              // Load Tesseract.js dynamically
              if (!window.Tesseract) {
                showNotification("Loading OCR engine...", "success")
                const script = document.createElement("script")
                script.src = "https://unpkg.com/tesseract.js@v2.1.0/dist/tesseract.min.js"
                document.head.appendChild(script)

                // Wait for script to load
                await new Promise((resolve, reject) => {
                  script.onload = resolve
                  script.onerror = reject
                })
              }

              // Show processing indicator
              const processingIndicator = document.createElement("div")
              processingIndicator.className =
                "absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/50 rounded-md"
              processingIndicator.innerHTML = `
              <div class="bg-[#2B293A] p-4 rounded-md flex flex-col items-center">
                <div class="animate-spin h-8 w-8 border-4 border-[#33691E] border-t-transparent rounded-full mb-2"></div>
                <div class="text-[#DFDFDF] text-sm">Processing image...</div>
              </div>
            `
              container.appendChild(processingIndicator)

              // Run OCR on the image
              const result = await window.Tesseract.recognize(img, "eng", {
                logger: (m) => {
                  if (m.status === "recognizing text") {
                    processingIndicator.querySelector("div:last-child").textContent =
                      `Processing: ${Math.round(m.progress * 100)}%`
                  }
                },
              })

              // Remove processing indicator
              container.removeChild(processingIndicator)

              // Create text element with the OCR result
              const textElement = document.createElement("div")
              textElement.className =
                "absolute p-3 min-w-[200px] max-w-[500px] bg-[#2B293A] border border-[#262433] rounded-md text-[#DFDFDF]"
              textElement.style.left = `${Number.parseInt(container.style.left) + 320}px`
              textElement.style.top = `${container.style.top}px`
              textElement.style.cursor = "move"

              // Create header with controls
              const header = document.createElement("div")
              header.className = "font-medium mb-2 text-[#4FC3F7] flex items-center justify-between"

              const headerTitle = document.createElement("div")
              headerTitle.innerHTML =
                '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="mr-2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg> Extracted Text'
              headerTitle.className = "flex items-center"

              const deleteButton = document.createElement("button")
              deleteButton.innerHTML =
                '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>'
              deleteButton.className = "text-red-400 hover:text-red-500 p-1 rounded-full hover:bg-[#262433]"
              deleteButton.onclick = () => textElement.remove()

              header.appendChild(headerTitle)
              header.appendChild(deleteButton)

              const content = document.createElement("div")
              content.className = "text-sm whitespace-pre-wrap overflow-auto max-h-[400px]"

              // Get the extracted text and clean it up
              const extractedText = result.data.text.trim()
              content.textContent = extractedText || "No text detected in image"

              // Add confidence information
              const confidenceInfo = document.createElement("div")
              confidenceInfo.className = "text-xs text-[#9998A9] mt-2"
              confidenceInfo.textContent = `Confidence: ${Math.round(result.data.confidence)}%`

              textElement.appendChild(header)
              textElement.appendChild(content)
              textElement.appendChild(confidenceInfo)

              // Add translate button
              const translateButton = document.createElement("button")
              translateButton.className = "mt-3 px-3 py-1 bg-[#33691E] text-white rounded-md text-sm flex items-center"
              translateButton.innerHTML =
                '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="mr-1"><path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2-2.4-3.5-4.4-3.5h-1.2c-.7-3-3.2-5.2-6.2-5.6-3-.3-5.9 1.3-7.3 4-1.2 2.5-1 6.5.5 8.8m8.7-1.6V21"></path><path d="M16 16l-4-4-4 4"></path></svg> Translate'

              // Add language selector
              const langSelector = document.createElement("select")
              langSelector.className =
                "mt-3 ml-2 px-2 py-1 bg-[#15131D] border-[#262433] text-[#DFDFDF] rounded-md text-sm"

              // Add language options
              LANGUAGES.forEach((lang) => {
                if (lang.code !== "en") {
                  // Skip English as it's the source
                  const option = document.createElement("option")
                  option.value = lang.code
                  option.textContent = lang.name
                  langSelector.appendChild(option)
                }
              })

              // Create button container
              const actionContainer = document.createElement("div")
              actionContainer.className = "flex items-center"
              actionContainer.appendChild(translateButton)
              actionContainer.appendChild(langSelector)

              textElement.appendChild(actionContainer)

              // Add translation functionality
              translateButton.onclick = async () => {
                const targetLang = langSelector.value
                if (!targetLang) return

                const translationHeader = document.createElement("div")
                translationHeader.className = "font-medium mb-2 text-[#4FC3F7] flex items-center mt-3"
                translationHeader.innerHTML =
                  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="mr-1"><path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2-2.4-3.5-4.4-3.5h-1.2c-.7-3-3.2-5.2-6.2-5.6-3-.3-5.9 1.3-7.3 4-1.2 2.5-1 6.5.5 8.8m8.7-1.6V21"></path><path d="M16 16l-4-4-4 4"></path></svg> Translation'

                const translationContent = document.createElement("div")
                translationContent.className = "text-sm whitespace-pre-wrap border-l-2 border-[#4FC3F7] pl-2"
                translationContent.textContent = "Translating..."

                // Add translation elements to the DOM
                textElement.appendChild(translationHeader)
                textElement.appendChild(translationContent)

                // Simulate translation (in a real app, you'd use a translation API)
                await new Promise((resolve) => setTimeout(resolve, 1000))

                // Get language name
                const langName = LANGUAGES.find((l) => l.code === targetLang)?.name || targetLang

                // Update translation header with language
                translationHeader.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="mr-1"><path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2-2.4-3.5-4.4-3.5h-1.2c-.7-3-3.2-5.2-6.2-5.6-3-.3-5.9 1.3-7.3 4-1.2 2.5-1 6.5.5 8.8m8.7-1.6V21"></path><path d="M16 16l-4-4-4 4"></path></svg> Translation (${langName})`

                // Update translation content with translated text
                translationContent.textContent = `[Translated to ${langName}]:\n\n${extractedText}`
              }

              // Make the text element draggable
              textElement.addEventListener("mousedown", (e) => {
                // Make text elements draggable regardless of current tool
                e.preventDefault()
                const startX = e.clientX
                const startY = e.clientY
                const startLeft = Number.parseInt(textElement.style.left) || 0
                const startTop = Number.parseInt(textElement.style.top) || 0

                const handleMouseMove = (e) => {
                  textElement.style.left = `${startLeft + e.clientX - startX}px`
                  textElement.style.top = `${startTop + e.clientY - startY}px`
                }

                const handleMouseUp = () => {
                  document.removeEventListener("mousemove", handleMouseMove)
                  document.removeEventListener("mouseup", handleMouseUp)
                }

                document.addEventListener("mousemove", handleMouseMove)
                document.addEventListener("mouseup", handleMouseUp)
              })

              containerRef.current?.appendChild(textElement)
              showNotification("OCR processing complete", "success")
            } catch (error) {
              console.error("OCR processing error:", error)
              showNotification("Error processing image OCR", "error")
            }
          }

          // Add delete functionality
          deleteButton.onclick = () => {
            container.remove()
          }

          // Add drag functionality - make it work regardless of current tool
          container.addEventListener("mousedown", (e) => {
            if (e.target === resizeHandle) {
              // Handle resize
              e.preventDefault()
              const startX = e.clientX
              const startY = e.clientY
              const startWidth = container.offsetWidth
              const startHeight = container.offsetHeight

              const handleMouseMove = (e) => {
                const newWidth = startWidth + e.clientX - startX
                const newHeight = startHeight + e.clientY - startY
                container.style.width = `${Math.max(100, newWidth)}px`
                container.style.height = `${Math.max(100, newHeight)}px`
                img.style.maxWidth = "100%"
                img.style.maxHeight = `${Math.max(50, newHeight - 60)}px` // Adjust for buttons
              }

              const handleMouseUp = () => {
                document.removeEventListener("mousemove", handleMouseMove)
                document.removeEventListener("mouseup", handleMouseUp)
              }

              document.addEventListener("mousemove", handleMouseMove)
              document.addEventListener("mouseup", handleMouseUp)
              return
            }

            // Handle drag - make it work regardless of current tool
            e.preventDefault()
            const startX = e.clientX
            const startY = e.clientY
            const startLeft = Number.parseInt(container.style.left) || 0
            const startTop = Number.parseInt(container.style.top) || 0

            const handleMouseMove = (e) => {
              container.style.left = `${startLeft + e.clientX - startX}px`
              container.style.top = `${startTop + e.clientY - startY}px`
            }

            const handleMouseUp = () => {
              document.removeEventListener("mousemove", handleMouseMove)
              document.removeEventListener("mouseup", handleMouseUp)
            }

            document.addEventListener("mousemove", handleMouseMove)
            document.addEventListener("mouseup", handleMouseUp)
          })

          containerRef.current?.appendChild(container)
        } catch (error) {
          console.error("Error processing image:", error)
          showNotification("Error processing image", "error")
        }
      }

      reader.onerror = () => {
        console.error("FileReader error")
        showNotification("Error reading file", "error")
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error("File handling error:", error)
      showNotification("Error handling file", "error")
    }
  }

  // Fix the handleVoiceRecording function to properly handle the API call
  const handleVoiceRecording = () => {
    if (recognitionRef.current) {
      setShowTranscription(true)
      toggleVoiceRecording()
    } else {
      showNotification("Voice recording is not available in your browser", "error")
    }
  }

  // 6. Fix the addTextBox function to make text boxes properly movable and resizable
  const addTextBox = () => {
    const newTextBox = document.createElement("div")
    newTextBox.contentEditable = "true"
    newTextBox.className =
      "absolute p-2 min-w-[100px] min-h-[50px] border border-dashed border-gray-400 text-[#DFDFDF] focus:outline-none"
    newTextBox.style.left = `${position.x}px`
    newTextBox.style.top = `${position.y}px`
    newTextBox.style.cursor = "move"

    // Add resize handle
    const resizeHandle = document.createElement("div")
    resizeHandle.className = "absolute bottom-0 right-0 w-4 h-4 bg-[#33691E] cursor-nwse-resize"
    resizeHandle.style.borderTopLeftRadius = "4px"

    // Add drag functionality - make it work regardless of current tool
    newTextBox.addEventListener("mousedown", (e) => {
      if (e.target === resizeHandle) {
        // Handle resize
        e.preventDefault()
        const startX = e.clientX
        const startY = e.clientY
        const startWidth = newTextBox.offsetWidth
        const startHeight = newTextBox.offsetHeight

        const handleMouseMove = (e) => {
          const newWidth = startWidth + e.clientX - startX
          const newHeight = startHeight + e.clientY - startY
          newTextBox.style.width = `${Math.max(100, newWidth)}px`
          newTextBox.style.height = `${Math.max(50, newHeight)}px`
        }

        const handleMouseUp = () => {
          document.removeEventListener("mousemove", handleMouseMove)
          document.removeEventListener("mouseup", handleMouseUp)
        }

        document.addEventListener("mousemove", handleMouseMove)
        document.addEventListener("mouseup", handleMouseUp)
        return
      }

      // Don't drag if we're editing text
      if (document.activeElement === newTextBox) {
        return
      }

      // Handle drag - make it work regardless of current tool
      e.preventDefault()
      const startX = e.clientX
      const startY = e.clientY
      const startLeft = Number.parseInt(newTextBox.style.left) || 0
      const startTop = Number.parseInt(newTextBox.style.top) || 0

      const handleMouseMove = (e) => {
        newTextBox.style.left = `${startLeft + e.clientX - startX}px`
        newTextBox.style.top = `${startTop + e.clientY - startY}px`
      }

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    })

    newTextBox.appendChild(resizeHandle)
    containerRef.current?.appendChild(newTextBox)
    textBoxesRef.current.push(newTextBox)
    newTextBox.focus()
  }

  // 7. Add a function to delete shapes from the canvas

  const deleteSelectedShape = () => {
    if (selectedObjectIndex !== null) {
      setCanvasObjects((prevObjects) => {
        const newObjects = [...prevObjects]
        newObjects.splice(selectedObjectIndex, 1)
        return newObjects
      })
      setSelectedObjectIndex(null)

      // Redraw the canvas after deletion
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Save the current canvas state after deletion
      setCanvasState(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }
  }

  // 8. Add keyboard event listener to handle deletion of selected shapes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedObjectIndex !== null) {
          deleteSelectedShape()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [selectedObjectIndex])

  // 9. Update the useEffect that initializes the canvas to properly save the initial canvas state
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = containerRef.current?.clientWidth || window.innerWidth
    canvas.height = containerRef.current?.clientHeight || window.innerHeight

    // Set initial styles
    ctx.strokeStyle = currentColor
    ctx.lineWidth = strokeWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Save initial canvas state
    setCanvasState(ctx.getImageData(0, 0, canvas.width, canvas.height))

    // Handle window resize
    const handleResize = () => {
      if (!canvas) return

      // Save current canvas content
      const tempCanvas = document.createElement("canvas")
      const tempCtx = tempCanvas.getContext("2d")
      if (!tempCtx) return

      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      tempCtx.drawImage(canvas, 0, 0)

      // Resize canvas
      canvas.width = containerRef.current?.clientWidth || window.innerWidth
      canvas.height = containerRef.current?.clientHeight || window.innerHeight

      // Restore content
      ctx.drawImage(tempCanvas, 0, 0)

      // Save new canvas state
      setCanvasState(ctx.getImageData(0, 0, canvas.width, canvas.height))
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleZoom = (direction: "in" | "out") => {
    setScale((prevScale) => {
      const newScale = direction === "in" ? prevScale + 0.1 : prevScale - 0.1
      return Math.max(0.2, Math.min(newScale, 3)) // Limit zoom level
    })
  }

  const handleColorChange = (color: string) => {
    setCurrentColor(color)
  }

  const handleStrokeWidthChange = (value: number[]) => {
    setStrokeWidth(value[0])
  }

  const toggleVoiceRecording = async () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsRecording(false)
    } else {
      setTranscript("")
      setTranslatedText("")
      setShowTranscription(true)
      if (recognitionRef.current) {
        recognitionRef.current.start()
      }
    }
  }

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#15131D] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center p-2 bg-[#2B293A] border-b border-[#262433]">
        {/* Replace this line:
        <Button variant="ghost" size="icon" onClick={onClose} className="text-[#DFDFDF] hover:bg-[#262433]">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        // With this: */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            handleSave()
            onClose()
          }}
          className="text-[#DFDFDF] hover:bg-[#262433]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <h2 className="ml-4 text-lg font-medium text-[#DFDFDF]">{title}</h2>

        <div className="flex space-x-1 ml-4">
          <Button variant="ghost" size="sm" className="text-[#DFDFDF] hover:bg-[#262433]">
            Files
          </Button>
          <Button variant="ghost" size="sm" className="text-[#DFDFDF] hover:bg-[#262433]">
            Edit
          </Button>
          <Button variant="ghost" size="sm" className="text-[#DFDFDF] hover:bg-[#262433]">
            View
          </Button>
          <Button variant="ghost" size="sm" className="text-[#DFDFDF] hover:bg-[#262433]">
            Settings
          </Button>
          <Button variant="ghost" size="sm" className="text-[#DFDFDF] hover:bg-[#262433]">
            Help
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoom("out")}
            className="text-[#DFDFDF] hover:bg-[#262433]"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-[#DFDFDF] text-sm">{Math.round(scale * 100)}%</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleZoom("in")}
            className="text-[#DFDFDF] hover:bg-[#262433]"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div ref={containerRef} className="flex-1 overflow-auto relative" onMouseMove={handleMouseMove}>
        <div
          className="absolute inset-0 min-w-full min-h-full"
          style={{ transform: `scale(${scale})`, transformOrigin: "0 0" }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-10"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />
        </div>

        {/* Floating Tools Sidebar */}
        <div
          ref={toolbarRef}
          className="absolute bg-[#2B293A] border border-[#262433] rounded-lg p-2 flex flex-col space-y-2 shadow-lg z-30"
          style={{
            left: `${toolbarPosition.x}px`,
            top: `${toolbarPosition.y}px`,
            cursor: isToolbarDragging ? "grabbing" : "grab",
          }}
        >
          <div
            className="flex items-center justify-center mb-1 cursor-grab"
            onMouseDown={handleToolbarDragStart}
            onMouseUp={handleToolbarDragEnd}
          >
            <GripHorizontal className="h-4 w-4 text-[#9998A9]" />
          </div>

          <Tabs defaultValue="draw" className="w-10">
            <TabsList className="grid grid-cols-1 h-auto bg-transparent">
              <TabsTrigger value="draw" className="px-0 py-1 data-[state=active]:bg-[#262433]">
                <Pencil className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger value="select" className="px-0 py-1 data-[state=active]:bg-[#262433]">
                <MousePointer className="h-5 w-5" />
              </TabsTrigger>
            </TabsList>

            {/* 11. Replace the drawing tools section in the TabsContent with updated UI */}
            <TabsContent value="draw" className="mt-2 space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={currentTool === "pen" ? "secondary" : "ghost"}
                      size="icon"
                      className="text-[#DFDFDF]"
                      onClick={() => handleToolChange("pen")}
                    >
                      <Pencil className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Draw</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={currentTool === "eraser" ? "secondary" : "ghost"}
                          size="icon"
                          className="text-[#DFDFDF]"
                          onClick={() => handleToolChange("eraser")}
                        >
                          <Eraser className="h-5 w-5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="right" className="w-40 p-4 bg-[#2B293A] border-[#262433]">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-[#DFDFDF]">Eraser Size</h4>
                          <Slider
                            defaultValue={[eraserSize]}
                            max={50}
                            min={5}
                            step={5}
                            onValueChange={handleEraserSizeChange}
                          />
                          <div className="flex justify-between text-xs text-[#9998A9] mt-1">
                            <span>Small</span>
                            <span>Large</span>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TooltipTrigger>
                  <TooltipContent side="right">Eraser</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={currentTool === "shape" ? "secondary" : "ghost"}
                          size="icon"
                          className="text-[#DFDFDF]"
                          onClick={() => handleToolChange("shape")}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="12" cy="12" r="5" />
                          </svg>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="right" className="w-64 p-4 bg-[#2B293A] border-[#262433]">
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-[#DFDFDF]">Shapes</h4>
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              variant={currentShape === "rectangle" ? "secondary" : "outline"}
                              size="sm"
                              className="p-2 h-10"
                              onClick={() => handleShapeChange("rectangle")}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                              </svg>
                            </Button>
                            <Button
                              variant={currentShape === "circle" ? "secondary" : "outline"}
                              size="sm"
                              className="p-2 h-10"
                              onClick={() => handleShapeChange("circle")}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx="12" cy="12" r="10" />
                              </svg>
                            </Button>
                            <Button
                              variant={currentShape === "triangle" ? "secondary" : "outline"}
                              size="sm"
                              className="p-2 h-10"
                              onClick={() => handleShapeChange("triangle")}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 20h18L12 4z" />
                              </svg>
                            </Button>
                            <Button
                              variant={currentShape === "line" ? "secondary" : "outline"}
                              size="sm"
                              className="p-2 h-10"
                              onClick={() => handleShapeChange("line")}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="5" y1="19" x2="19" y2="5" />
                              </svg>
                            </Button>
                            <Button
                              variant={currentShape === "arrow" ? "secondary" : "outline"}
                              size="sm"
                              className="p-2 h-10"
                              onClick={() => handleShapeChange("arrow")}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                              </svg>
                            </Button>
                          </div>

                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-[#DFDFDF]">Fill Shape</h4>
                            <Button
                              variant={isFilled ? "secondary" : "outline"}
                              size="sm"
                              onClick={toggleFill}
                              className="gap-2"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M19 11h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-2" />
                                <path d="M5 5v3a3 3 0 0 0 3 3h11" />
                                <path d="m5 5 14 14" />
                              </svg>
                              {isFilled ? "Filled" : "Outline"}
                            </Button>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-[#DFDFDF] mb-2">Shape Color</h4>
                            <div className="grid grid-cols-4 gap-2">
                              {COLORS.map((color) => (
                                <button
                                  key={color}
                                  className="w-8 h-8 rounded-full border border-[#262433] focus:outline-none focus:ring-2 focus:ring-[#DFDFDF] transition-transform hover:scale-110"
                                  style={{
                                    backgroundColor: color,
                                    boxShadow: color === currentColor ? "0 0 0 2px #DFDFDF" : "none",
                                  }}
                                  onClick={() => handleColorChange(color)}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TooltipTrigger>
                  <TooltipContent side="right">Shapes</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-[#DFDFDF]" style={{ color: currentColor }}>
                    <Palette className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="right" className="w-auto p-2 bg-[#2B293A] border-[#262433]">
                  <div className="grid grid-cols-4 gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        className="w-8 h-8 rounded-full border border-[#262433] focus:outline-none focus:ring-2 focus:ring-[#DFDFDF] transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color,
                          boxShadow: color === currentColor ? "0 0 0 2px #DFDFDF" : "none",
                        }}
                        onClick={() => handleColorChange(color)}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-[#DFDFDF]">
                    <div className="w-5 h-5 flex items-center justify-center">
                      <div className="w-full h-[2px] bg-current rounded-full" style={{ height: `${strokeWidth}px` }} />
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="right" className="w-40 p-4 bg-[#2B293A] border-[#262433]">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-[#DFDFDF]">Pen Thickness</h4>
                    <Slider
                      defaultValue={[strokeWidth]}
                      max={10}
                      min={1}
                      step={1}
                      onValueChange={handleStrokeWidthChange}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </TabsContent>

            <TabsContent value="select" className="mt-2 space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={currentTool === "move" ? "secondary" : "ghost"}
                      size="icon"
                      className="text-[#DFDFDF]"
                      onClick={() => handleToolChange("move")}
                    >
                      <Move className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Move & Select</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={currentTool === "text" ? "secondary" : "ghost"}
                      size="icon"
                      className="text-[#DFDFDF]"
                      onClick={() => {
                        handleToolChange("text")
                        if (currentTool !== "text") addTextBox()
                      }}
                    >
                      <Type className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Text</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TabsContent>
          </Tabs>
        </div>

        {/* Floating Bottom Toolbar */}
        <div
          ref={bottomToolbarRef}
          className="absolute bg-[#2B293A] border border-[#262433] rounded-lg p-2 flex flex-col space-y-2 shadow-lg z-30"
          style={{
            left: `${bottomToolbarPosition.x}px`,
            top: `${bottomToolbarPosition.y}px`,
            cursor: isBottomToolbarDragging ? "grabbing" : "grab",
          }}
        >
          <div
            className="flex items-center justify-center mb-1 cursor-grab"
            onMouseDown={handleBottomToolbarDragStart}
            onMouseUp={handleBottomToolbarDragEnd}
          >
            <GripHorizontal className="h-4 w-4 text-[#9998A9]" />
          </div>

          <div className="flex space-x-2 items-center">
            <Button
              variant="ghost"
              size="icon"
              className="text-[#DFDFDF] hover:bg-[#262433] rounded-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Link className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-[#DFDFDF] hover:bg-[#262433] rounded-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image className="h-5 w-5" />
            </Button>

            <Button
              variant={isRecording ? "default" : "ghost"}
              size="icon"
              className={`${isRecording ? "bg-red-500 text-white" : "text-[#DFDFDF]"} hover:bg-[#262433] rounded-full`}
              onClick={toggleVoiceRecording}
            >
              <Mic className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-[#DFDFDF] hover:bg-[#262433] rounded-full"
              onClick={() => setShowBottomToolbar(!showBottomToolbar)}
            >
              {showBottomToolbar ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </Button>
          </div>

          {showBottomToolbar && (
            <div className="bg-[#2B293A] border border-[#262433] rounded-lg p-2 flex space-x-2 shadow-lg mt-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-[#DFDFDF]"
                      onClick={() => addDraggableElement("text")}
                    >
                      <Type className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add Text Box</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-[#DFDFDF]"
                      onClick={() => addDraggableElement("image")}
                    >
                      <Image className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add Image</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-[#DFDFDF]"
                      onClick={() => addDraggableElement("voice")}
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add Voice Note</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-[#DFDFDF]"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Scan Image</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        {/* Live Transcription Box */}
        {showTranscription && (
          <div
            ref={transcriptionBoxRef}
            className="absolute p-3 min-w-[300px] max-w-[500px] bg-[#2B293A]/90 backdrop-blur-sm border border-[#262433] rounded-md text-[#DFDFDF] z-20"
            style={{
              left: `${transcriptionPosition.x}px`,
              top: `${transcriptionPosition.y}px`,
              borderStyle: isRecording ? "dashed" : "solid",
              borderColor: isRecording ? "#FF6347" : "#262433",
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <div className="font-medium text-[#4FC3F7] flex items-center">
                {isRecording ? (
                  <>
                    <span className="animate-pulse mr-2 h-2 w-2 rounded-full bg-red-500"></span>
                    <span>
                      Listening To Voice: Auto-Translate({LANGUAGES.find((l) => l.code === targetLanguage)?.name})
                    </span>
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    <span>Voice Transcription</span>
                  </>
                )}
              </div>
              <div className="flex space-x-1">
                {isRecording ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500 hover:bg-[#262433]"
                    onClick={stopVoiceRecording}
                  >
                    <StopCircle className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-[#DFDFDF] hover:bg-[#262433]"
                    onClick={toggleVoiceRecording}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[#DFDFDF] hover:bg-[#262433]"
                  onClick={() => setShowTranscription(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {transcript.includes("[Speech recognition") || transcript.includes("[Network error") ? (
              <textarea
                className="min-h-[100px] max-h-[300px] w-full overflow-y-auto whitespace-pre-wrap border border-dashed border-[#262433] rounded p-2 mb-2 bg-[#15131D] text-[#DFDFDF]"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Type your text here..."
              />
            ) : (
              <div className="min-h-[100px] max-h-[300px] overflow-y-auto whitespace-pre-wrap border border-dashed border-[#262433] rounded p-2 mb-2">
                {transcript || (isRecording ? "Speak now..." : "No transcription yet. Click the microphone to start.")}
              </div>
            )}

            {detectedLanguage !== "en" && (
              <>
                <div className="font-medium text-[#4FC3F7] flex items-center mt-2 mb-1">
                  <Globe className="h-4 w-4 mr-2" />
                  <span>Translation (English)</span>
                </div>
                <div className="min-h-[50px] max-h-[200px] overflow-y-auto whitespace-pre-wrap border-l-2 border-[#4FC3F7] pl-2">
                  {translatedText || "Translation will appear here..."}
                </div>
              </>
            )}

            <div className="flex justify-between items-center mt-3">
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger className="w-[180px] h-7 bg-[#15131D] border-[#262433] text-[#DFDFDF] text-xs">
                  <SelectValue placeholder="Target Language" />
                </SelectTrigger>
                <SelectContent className="bg-[#2B293A] border-[#262433] text-[#DFDFDF]">
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="text-xs text-[#9998A9]">
                {detectedLanguage !== "en"
                  ? `Detected: ${LANGUAGES.find((l) => l.code === detectedLanguage)?.name || "Unknown"}`
                  : ""}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input for image upload */}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
    </div>
  )
}

