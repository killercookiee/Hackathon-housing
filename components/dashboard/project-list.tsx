"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createProject, deleteProject } from "@/app/actions/projects"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Plus, FolderOpen, Trash2 } from "lucide-react"
import { toast } from "sonner"

type ProjectSummary = {
  id: string
  name: string
  description: string | null
  status: string
  updatedAt: string
}

const statusLabel: Record<string, string> = {
  draft: "Draft",
  analyzing: "Analyzing",
  completed: "Completed",
  error: "Failed",
}

const statusVariant: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
  draft: "outline",
  analyzing: "secondary",
  completed: "default",
  error: "destructive",
}

export function ProjectList({ initialProjects }: { initialProjects: ProjectSummary[] }) {
  const router = useRouter()
  const [projects, setProjects] = useState(initialProjects)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return
    setCreating(true)
    try {
      const id = await createProject(name, description)
      setOpen(false)
      setName("")
      setDescription("")
      router.push(`/projects/${id}`)
    } catch {
      toast.error("Could not create project")
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
    try {
      await deleteProject(id)
      toast.success("Project deleted")
    } catch {
      toast.error("Could not delete project")
      router.refresh()
    }
  }

  return (
    <div>
      <div className="mb-6 flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button />}>
            <Plus data-icon="inline-start" />
            New project
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New project</DialogTitle>
              <DialogDescription>Give your project a name. You can attach files and text next.</DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="project-name">Name</FieldLabel>
                <Input
                  id="project-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Q3 support ticket review"
                  autoFocus
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="project-description">Description (optional)</FieldLabel>
                <Textarea
                  id="project-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this project for?"
                  rows={3}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!name.trim() || creating}>
                {creating ? "Creating..." : "Create project"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderOpen />
            </EmptyMedia>
            <EmptyTitle>No projects yet</EmptyTitle>
            <EmptyDescription>Create your first project to attach files and run an analysis.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setOpen(true)}>
              <Plus data-icon="inline-start" />
              New project
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-5"
            >
              <Link href={`/projects/${project.id}`} className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-1 font-medium text-card-foreground">{project.name}</h3>
                  <Badge variant={statusVariant[project.status]} className="shrink-0">
                    {statusLabel[project.status]}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {project.description || "No description"}
                </p>
              </Link>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Updated {new Date(project.updatedAt).toLocaleDateString()}
                </span>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      />
                    }
                  >
                    <Trash2 />
                    <span className="sr-only">Delete project</span>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete &quot;{project.name}&quot;?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the project, its saved text, and its attachment records. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={() => handleDelete(project.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
