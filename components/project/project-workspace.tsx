"use client"

import { useCallback, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  addAttachmentRecord,
  removeAttachmentRecord,
  saveAnalysisError,
  saveAnalysisResult,
  setProjectAnalyzing,
  updateProjectText,
} from "@/app/actions/projects"
import { deleteFile, getFile, storeFile } from "@/lib/file-storage"
import { prepareAttachment } from "@/lib/prepare-attachments"
import { useAnthropicKey } from "@/lib/use-anthropic-key"
import { ApiKeyDialog } from "@/components/api-key-dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Paperclip, FileText, ImageIcon, File as FileIcon, X, Sparkles, Download, Copy, AlertCircle } from "lucide-react"

type ProjectData = {
  id: string
  name: string
  description: string | null
  textInput: string
  status: string
  resultText: string | null
  resultError: string | null
  analyzedAt: string | null
}

type AttachmentData = {
  id: string
  fileName: string
  fileType: string
  fileSize: number
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIconFor(fileType: string) {
  if (fileType.startsWith("image/")) return ImageIcon
  if (fileType.startsWith("text/") || fileType === "application/json") return FileText
  return FileIcon
}

export function ProjectWorkspace({
  project,
  initialAttachments,
}: {
  project: ProjectData
  initialAttachments: AttachmentData[]
}) {
  const router = useRouter()
  const { apiKey, loaded } = useAnthropicKey()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [textInput, setTextInput] = useState(project.textInput)
  const [attachments, setAttachments] = useState(initialAttachments)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState(project.status)
  const [resultText, setResultText] = useState(project.resultText)
  const [resultError, setResultError] = useState(project.resultError)
  const [savingText, startSavingText] = useTransition()

  const handleTextBlur = useCallback(() => {
    if (textInput === project.textInput) return
    startSavingText(async () => {
      await updateProjectText(project.id, textInput)
    })
  }, [textInput, project.id, project.textInput])

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(fileList)) {
        const id = crypto.randomUUID()
        await storeFile(id, file)
        await addAttachmentRecord(project.id, {
          id,
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
        })
        setAttachments((prev) => [
          { id, fileName: file.name, fileType: file.type || "application/octet-stream", fileSize: file.size },
          ...prev,
        ])
      }
    } catch {
      toast.error("Could not attach file")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleRemoveAttachment = async (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
    await deleteFile(id)
    await removeAttachmentRecord(project.id, id)
  }

  const [analyzing, setAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    if (!apiKey) {
      toast.error("Add your Anthropic API key first")
      return
    }

    setAnalyzing(true)
    setStatus("analyzing")
    setResultError(null)

    try {
      await updateProjectText(project.id, textInput)
      await setProjectAnalyzing(project.id)

      const preparedFiles = []
      for (const attachment of attachments) {
        const file = await getFile(attachment.id)
        if (!file) continue
        preparedFiles.push(await prepareAttachment(file))
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey, textInput, attachments: preparedFiles }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed")
      }

      setResultText(data.resultText)
      setStatus("completed")
      await saveAnalysisResult(project.id, data.resultText)
      toast.success("Analysis complete")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis failed"
      setResultError(message)
      setStatus("error")
      await saveAnalysisError(project.id, message)
      toast.error(message)
    } finally {
      setAnalyzing(false)
      router.refresh()
    }
  }

  const handleCopy = async () => {
    if (!resultText) return
    await navigator.clipboard.writeText(resultText)
    toast.success("Copied to clipboard")
  }

  const handleDownload = () => {
    if (!resultText) return
    const blob = new Blob([resultText], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${project.name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "analysis"}-report.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const hasContent = textInput.trim().length > 0 || attachments.length > 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{project.name}</h1>
          {project.description && <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>}
        </div>
        <ApiKeyDialog />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <Field>
          <FieldLabel htmlFor="text-input">Text input</FieldLabel>
          <Textarea
            id="text-input"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onBlur={handleTextBlur}
            placeholder="Add context, questions, or the content you want analyzed..."
            rows={8}
            className="font-mono text-sm"
          />
          <FieldDescription>{savingText ? "Saving..." : "Saved automatically when you click away."}</FieldDescription>
        </Field>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-card-foreground">Attachments</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Spinner /> : <Paperclip data-icon="inline-start" />}
            {uploading ? "Uploading..." : "Attach file"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
        </div>

        {attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No files attached yet. Files are cached on this device and sent for analysis when you confirm.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {attachments.map((attachment) => {
              const Icon = fileIconFor(attachment.fileType)
              return (
                <li
                  key={attachment.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-sm text-foreground">{attachment.fileName}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatSize(attachment.fileSize)}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                  >
                    <X />
                    <span className="sr-only">Remove {attachment.fileName}</span>
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-5">
        <div>
          <p className="text-sm font-medium text-card-foreground">Ready to analyze?</p>
          <p className="text-sm text-muted-foreground">
            Confirm to send your text input and attachments to Claude for analysis.
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger render={<Button disabled={!hasContent || analyzing || !loaded} />}>
            {analyzing ? <Spinner /> : <Sparkles data-icon="inline-start" />}
            {analyzing ? "Analyzing..." : "Analyze"}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm analysis</AlertDialogTitle>
              <AlertDialogDescription>
                This sends your text input and {attachments.length} attachment
                {attachments.length === 1 ? "" : "s"} to Claude using your saved API key. Continue?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleAnalyze}>Confirm and analyze</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {!apiKey && loaded && (
        <Alert>
          <AlertCircle />
          <AlertTitle>No API key connected</AlertTitle>
          <AlertDescription>Add your Anthropic API key above before running an analysis.</AlertDescription>
        </Alert>
      )}

      {status === "error" && resultError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Analysis failed</AlertTitle>
          <AlertDescription>{resultError}</AlertDescription>
        </Alert>
      )}

      {resultText && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-card-foreground">Analysis result</h2>
              <Badge variant="secondary">Completed</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy data-icon="inline-start" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download data-icon="inline-start" />
                Download
              </Button>
            </div>
          </div>
          <div className="max-h-[32rem] overflow-y-auto rounded-lg bg-secondary/40 p-4">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">{resultText}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
