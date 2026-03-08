import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getSyncedUser } from "@/lib/auth/sync"
import { prisma } from "@/lib/prisma"
import { Download, ExternalLink, Filter, MessageSquare } from "lucide-react"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Reports & Downloads - Entrestate",
  description: "Browse and download your generated decision objects, memos, and reports.",
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const AUDIENCE_LABEL: Record<string, string> = {
  investor: "Investor Brief",
  client: "Client Report",
  executive: "Executive Summary",
  social: "Market Update",
}

const STOPWORDS = new Set([
  "with", "from", "that", "this", "and", "the", "for", "are", "have",
  "report", "analysis", "brief", "summary", "overview", "review",
])

function deriveTopics(title: string, payload: unknown): string[] {
  const p = payload as Record<string, any> | null
  const profile = p?.profile as Record<string, any> | undefined
  const topics: string[] = []

  const audience = profile?.audience as string | undefined
  if (audience && AUDIENCE_LABEL[audience]) topics.push(AUDIENCE_LABEL[audience])

  const templateName = profile?.templateName as string | undefined
  if (templateName) topics.push(templateName)

  const clientName = profile?.clientName as string | undefined
  if (clientName) topics.push(clientName)

  // Extract meaningful title words
  const words = title
    .split(/[\s·—\-:,]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 3 && !STOPWORDS.has(w.toLowerCase()))

  for (const w of words) {
    if (topics.length >= 5) break
    if (!topics.some((t) => t.toLowerCase().includes(w.toLowerCase()))) {
      topics.push(w)
    }
  }

  return topics.slice(0, 5)
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ReportsPage() {
  const user = await getSyncedUser()
  if (!user) redirect("/login")

  const reports = await prisma.assistantReport.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-24 pt-28 md:pt-36">

        {/* Page header */}
        <header className="mb-12 flex items-end justify-between border-b border-border/40 pb-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
              Decision Artifacts
            </p>
            <h1 className="mt-3 font-serif text-4xl font-medium text-foreground md:text-5xl">
              Reports Gallery
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              {reports.length} artifact{reports.length !== 1 ? "s" : ""} — each with an auditable evidence trail.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-2 rounded-xl border border-border bg-card/50 p-1.5">
            <button className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-xs font-medium text-foreground">
              <Filter className="h-3 w-3" />
              All Artifacts
            </button>
          </div>
        </header>

        {/* Empty state */}
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="mb-6 font-serif font-medium leading-none text-foreground"
              style={{ fontSize: "80px", WebkitTextStroke: "1px currentColor", color: "transparent", opacity: 0.08 }}
              aria-hidden
            >
              ∅
            </div>
            <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/35">
              Entrestate Decision Engine
            </p>
            <h3 className="text-xl font-medium text-foreground">No reports yet</h3>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Start a decision session in AI Copilot to generate your first institutional report.
            </p>
            <a
              href="/chat"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <MessageSquare className="h-4 w-4" />
              Open Copilot
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {reports.map((report, index) => {
              const topics = deriveTopics(report.title, report.payload)
              const num = String(index + 1).padStart(2, "0")
              const dateLabel = new Date(report.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })

              return (
                <article
                  key={report.id}
                  className="group relative flex min-h-[220px] overflow-hidden rounded-2xl border border-border/50 bg-card transition-all duration-300 hover:border-border hover:shadow-xl hover:shadow-black/10"
                >
                  {/* ── Main content ── */}
                  <div className="relative flex flex-1 flex-col overflow-hidden p-6">

                    {/* Stroke number — background decoration */}
                    <div
                      className="pointer-events-none absolute -right-2 -top-3 select-none font-black leading-none transition-opacity duration-500 group-hover:opacity-[0.09]"
                      aria-hidden
                      style={{
                        fontSize: "88px",
                        WebkitTextStroke: "1.5px currentColor",
                        color: "transparent",
                        opacity: 0.05,
                      }}
                    >
                      {num}
                    </div>

                    {/* Subtle top accent line */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    {/* Byline */}
                    <p className="mb-4 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/30 transition-colors duration-300 group-hover:text-muted-foreground/50">
                      by Entrestate Decision Engine
                    </p>

                    {/* Title — typography hero */}
                    <h2 className="flex-1 font-serif text-xl font-medium leading-snug text-foreground md:text-[22px]">
                      {report.title}
                    </h2>

                    {/* Mobile-only topics (compact inline tags) */}
                    {topics.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1 xl:hidden">
                        {topics.slice(0, 3).map((topic) => (
                          <span
                            key={topic}
                            className="rounded-md border border-border/40 px-2 py-0.5 text-[10px] text-muted-foreground/40"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bottom bar */}
                    <div className="mt-5 flex items-center justify-between border-t border-border/30 pt-4">
                      <time
                        className="text-[11px] text-muted-foreground/40"
                        dateTime={report.createdAt.toISOString()}
                      >
                        {dateLabel}
                      </time>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`/api/reports/${report.id}/download`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/40 text-muted-foreground/50 transition-colors hover:border-border/70 hover:text-foreground"
                          title="Download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                        <Link
                          href={`/reports/${report.publicId}`}
                          className="flex items-center gap-1.5 rounded-lg bg-foreground/[0.06] px-3 py-1.5 text-[11px] font-medium text-foreground/70 transition-all hover:bg-foreground/[0.1] hover:text-foreground"
                        >
                          Open
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* ── Right rail — desktop only ── */}
                  {topics.length > 0 && (
                    <aside className="hidden xl:flex w-[110px] shrink-0 flex-col border-l border-border/30 bg-card/20 p-4 pt-5">
                      <p className="mb-3 text-[8px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/25">
                        Topics
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {topics.map((topic) => (
                          <span
                            key={topic}
                            className="inline-block rounded-md border border-border/30 bg-background/30 px-2 py-1.5 text-[10px] leading-tight text-muted-foreground/45 transition-colors duration-200 group-hover:text-muted-foreground/65"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>

                      {/* Decorative fade line at bottom */}
                      <div className="mt-auto flex justify-center pt-4">
                        <div className="h-10 w-px bg-gradient-to-b from-border/20 to-transparent" />
                      </div>
                    </aside>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
      <Footer />
    </main>
  )
}
