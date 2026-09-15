import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect, notFound } from "next/navigation"
import { getProject } from "@/app/actions/projects"
import { SiteHeader } from "@/components/site-header"
import { ProjectWorkspace } from "@/components/project/project-workspace"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const data = await getProject(id)
  if (!data) notFound()

  const { project, attachments } = data

  return (
    <div className="min-h-svh bg-background">
      <SiteHeader user={{ name: session.user.name, email: session.user.email }} />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-4"
          render={<Link href="/dashboard" />}
          nativeButton={false}
        >
          <ChevronLeft data-icon="inline-start" />
          Projects
        </Button>
        <ProjectWorkspace
          project={{
            id: project.id,
            name: project.name,
            description: project.description,
            textInput: project.textInput,
            status: project.status,
            resultText: project.resultText,
            resultError: project.resultError,
            analyzedAt: project.analyzedAt ? project.analyzedAt.toISOString() : null,
          }}
          initialAttachments={attachments.map((a) => ({
            id: a.id,
            fileName: a.fileName,
            fileType: a.fileType,
            fileSize: a.fileSize,
          }))}
        />
      </main>
    </div>
  )
}
