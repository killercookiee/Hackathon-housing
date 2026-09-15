"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { projects, attachments } from "@/lib/db/schema"
import { and, desc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

export async function getProjects() {
  const userId = await getUserId()
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt))
}

export async function getProject(id: string) {
  const userId = await getUserId()
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
  if (!project) return null

  const files = await db
    .select()
    .from(attachments)
    .where(and(eq(attachments.projectId, id), eq(attachments.userId, userId)))
    .orderBy(desc(attachments.createdAt))

  return { project, attachments: files }
}

export async function createProject(name: string, description: string) {
  const userId = await getUserId()
  const trimmedName = name.trim()
  if (!trimmedName) throw new Error("Project name is required")

  const id = randomUUID()
  await db.insert(projects).values({
    id,
    userId,
    name: trimmedName,
    description: description.trim() || null,
  })
  revalidatePath("/dashboard")
  return id
}

export async function deleteProject(id: string) {
  const userId = await getUserId()
  await db.delete(attachments).where(and(eq(attachments.projectId, id), eq(attachments.userId, userId)))
  await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)))
  revalidatePath("/dashboard")
}

export async function updateProjectText(id: string, textInput: string) {
  const userId = await getUserId()
  await db
    .update(projects)
    .set({ textInput, updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
}

export async function addAttachmentRecord(
  projectId: string,
  file: { id: string; fileName: string; fileType: string; fileSize: number },
) {
  const userId = await getUserId()
  await db.insert(attachments).values({
    id: file.id,
    projectId,
    userId,
    fileName: file.fileName,
    fileType: file.fileType,
    fileSize: file.fileSize,
  })
  await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId))
  revalidatePath(`/projects/${projectId}`)
}

export async function removeAttachmentRecord(projectId: string, attachmentId: string) {
  const userId = await getUserId()
  await db
    .delete(attachments)
    .where(and(eq(attachments.id, attachmentId), eq(attachments.userId, userId)))
  revalidatePath(`/projects/${projectId}`)
}

export async function setProjectAnalyzing(id: string) {
  const userId = await getUserId()
  await db
    .update(projects)
    .set({ status: "analyzing", resultError: null, updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
  revalidatePath(`/projects/${id}`)
}

export async function saveAnalysisResult(id: string, resultText: string) {
  const userId = await getUserId()
  await db
    .update(projects)
    .set({
      status: "completed",
      resultText,
      resultError: null,
      analyzedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
  revalidatePath(`/projects/${id}`)
}

export async function saveAnalysisError(id: string, errorMessage: string) {
  const userId = await getUserId()
  await db
    .update(projects)
    .set({ status: "error", resultError: errorMessage, updatedAt: new Date() })
    .where(and(eq(projects.id, id), eq(projects.userId, userId)))
  revalidatePath(`/projects/${id}`)
}
