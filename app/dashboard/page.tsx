import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getProjects } from "@/app/actions/projects"
import { SiteHeader } from "@/components/site-header"
import { ProjectList } from "@/components/dashboard/project-list"

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const projects = await getProjects()

  return (
    <div className="min-h-svh bg-background">
      <SiteHeader user={{ name: session.user.name, email: session.user.email }} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Projects</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a project, attach your data, and run an analysis when you&apos;re ready.
            </p>
          </div>
        </div>
        <ProjectList
          initialProjects={projects.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            status: p.status,
            updatedAt: p.updatedAt.toISOString(),
          }))}
        />
      </main>
    </div>
  )
}
