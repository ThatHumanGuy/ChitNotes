import { NextResponse } from "next/server"
import OpenAI from "openai"

// Initialize the OpenAI client with Function Network configuration
const client = new OpenAI({
  apiKey: process.env.FXN_API_KEY || "",
  baseURL: "https://api.function.network/v1",
})

export async function POST(req: Request) {
  try {
    const { text, targetLanguage } = await req.json()

    if (!text || !targetLanguage) {
      return NextResponse.json({ error: "Text and target language are required" }, { status: 400 })
    }

    // Use chat completions for translation
    const response = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a translator. Translate the following text to ${targetLanguage}.`,
        },
        { role: "user", content: text },
      ],
    })

    return NextResponse.json({
      translatedText: response.choices[0].message.content,
      detectedLanguage: "auto", // In a real app, you might want to detect the source language
    })
  } catch (error) {
    console.error("Error translating text:", error)
    return NextResponse.json({ error: "Failed to translate text" }, { status: 500 })
  }
}

