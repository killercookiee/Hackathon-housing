import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export const maxDuration = 300

type AttachmentPayload = {
  name: string
  mimeType: string
  kind: "text" | "image" | "unsupported"
  text?: string
  base64?: string
}

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { apiKey, textInput, attachments } = body as {
    apiKey?: string
    textInput?: string
    attachments?: AttachmentPayload[]
  }

  if (!apiKey || typeof apiKey !== "string") {
    return Response.json({ error: "Missing Anthropic API key" }, { status: 400 })
  }

  const content: AnthropicContentBlock[] = [
    {
      type: "text",
      text: "You are analyzing the material below for the user. Read the text input and any attached files, then produce a clear, well-structured analysis report covering key points, notable patterns, and any risks or recommendations. This is an early version of an analysis workflow that will grow more specialized over time, so keep the report generally useful.",
    },
  ]

  if (textInput?.trim()) {
    content.push({ type: "text", text: `## Text input\n\n${textInput.trim()}` })
  }

  for (const file of attachments ?? []) {
    if (file.kind === "text" && file.text) {
      content.push({ type: "text", text: `## File: ${file.name}\n\n${file.text}` })
    } else if (file.kind === "image" && file.base64) {
      content.push({ type: "text", text: `## File: ${file.name} (image)` })
      content.push({
        type: "image",
        source: { type: "base64", media_type: file.mimeType, data: file.base64 },
      })
    } else {
      content.push({
        type: "text",
        text: `## File: ${file.name}\n\n(Content not extracted - unsupported file type "${file.mimeType}". Only the file name and type were sent.)`,
      })
    }
  }

  if (content.length <= 1) {
    return Response.json({ error: "Add some text or attach a file before analyzing" }, { status: 400 })
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 8000,
        thinking: { type: "enabled", budget_tokens: 4000 },
        messages: [{ role: "user", content }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      const message =
        typeof data?.error?.message === "string" ? data.error.message : "Anthropic API request failed"
      return Response.json({ error: message }, { status: response.status })
    }

    const textBlocks = Array.isArray(data.content) ? data.content.filter((b: { type: string }) => b.type === "text") : []
    const resultText = textBlocks
      .map((b: { text: string }) => b.text)
      .join("\n\n")
      .trim()

    if (!resultText) {
      return Response.json({ error: "The model returned an empty response" }, { status: 502 })
    }

    return Response.json({ resultText })
  } catch (error) {
    console.error("[v0] Anthropic request failed:", error)
    return Response.json({ error: "Failed to reach the Anthropic API" }, { status: 502 })
  }
}
