"use client"

const TEXT_EXTENSIONS = [
  ".txt",
  ".md",
  ".markdown",
  ".csv",
  ".json",
  ".log",
  ".yml",
  ".yaml",
  ".xml",
  ".html",
  ".css",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".py",
  ".rb",
  ".go",
  ".java",
  ".sql",
]

const MAX_TEXT_CHARS = 60_000

export type PreparedAttachment = {
  name: string
  mimeType: string
  kind: "text" | "image" | "unsupported"
  text?: string
  base64?: string
}

function isTextFile(file: File) {
  if (file.type.startsWith("text/")) return true
  if (file.type === "application/json") return true
  const lowerName = file.name.toLowerCase()
  return TEXT_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(",")[1] ?? "")
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export async function prepareAttachment(file: File): Promise<PreparedAttachment> {
  if (file.type.startsWith("image/")) {
    const base64 = await fileToBase64(file)
    return { name: file.name, mimeType: file.type, kind: "image", base64 }
  }

  if (isTextFile(file)) {
    const text = await file.text()
    return {
      name: file.name,
      mimeType: file.type || "text/plain",
      kind: "text",
      text: text.slice(0, MAX_TEXT_CHARS),
    }
  }

  return { name: file.name, mimeType: file.type || "application/octet-stream", kind: "unsupported" }
}
