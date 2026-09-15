import Link from "next/link"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sparkles, Paperclip, FileCheck2, Wand2 } from "lucide-react"

export default async function LandingPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect("/dashboard")

  return (
    <main className="min-h-svh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </span>
            DeltaConst
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/sign-in" />} nativeButton={false}>
              Sign in
            </Button>
            <Button size="sm" render={<Link href="/sign-up" />} nativeButton={false}>
              Get started
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
        <span className="mx-auto mb-6 inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          <Sparkles className="size-3" />
          AI-powered analysis
        </span>
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Organize your data. Confirm it. Analyze it.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-lg text-muted-foreground">
          Create a project, attach your files, add context, and analyze everything with a single confirmed action.
          Results come back as a clear report you can read or download.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button size="lg" render={<Link href="/sign-up" />} nativeButton={false}>
            Create your first project
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/sign-in" />} nativeButton={false}>
            I have an account
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <FeatureCard
            icon={Paperclip}
            title="Attach anything"
            description="Drop in documents, text files, or images. Everything is organized under one project."
          />
          <FeatureCard
            icon={FileCheck2}
            title="Confirm before you run"
            description="Review your text input and attachments, then confirm to send them for analysis - nothing runs automatically."
          />
          <FeatureCard
            icon={Wand2}
            title="Get a real result"
            description="Receive a written analysis you can read in place, copy, or download - ready to build on as your workflow grows."
          />
        </div>
      </section>
    </main>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="size-4" />
      </div>
      <h3 className="text-sm font-medium text-card-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}
