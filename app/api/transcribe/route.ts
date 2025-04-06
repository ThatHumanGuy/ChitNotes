import { NextResponse } from "next/server"
import OpenAI from "openai"

// Initialize the OpenAI client with Function Network configuration
const client = new OpenAI({
  apiKey: process.env.FXN_API_KEY || "",
  baseURL: "https://api.function.network/v1",
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Convert File to Buffer for the OpenAI API
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Call Whisper API through Function Network
    const response = await client.audio.transcriptions.create({
      file: new Blob([buffer], { type: audioFile.type }),
      model: "whisper-1",
    })

    return NextResponse.json({ text: response.text })
  } catch (error) {
    console.error("Error transcribing audio:", error)
    return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 })
  }
}

