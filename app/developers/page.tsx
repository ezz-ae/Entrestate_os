import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { DeveloperCard } from "@/components/decision/developer-card"
import { listDevelopers } from "@/lib/decision-infrastructure"

export const dynamic = "force-dynamic"

type SearchParams = { filter?: string }

function tierOf(score: number | null): "excellent" | "good" | "watch" | "unknown" {
  if (score === null) return "unknown"
  if (score >= 80) return "excellent"
  if (score >= 60) return "good"
  return "watch"
}

export default async function DevelopersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { filter } = await searchParams
  const data = await listDevelopers()

  const developers = data.developers

  // Derive tier counts
  const tierCounts = { excellent: 0, good: 0, watch: 0 }
  const withRel = developers.filter((d) => typeof d.reliability === "number")
  for (const d of withRel) {
    const t = tierOf(d.reliability as number)
    if (t === "excellent") tierCounts.excellent++
    else if (t === "good") tierCounts.good++
    else if (t === "watch") tierCounts.watch++
  }
  const avgRel = withRel.length > 0
    ? withRel.reduce((sum, d) => sum + (d.reliability as number), 0) / withRel.length
    : null
  const totalProjects = developers.reduce((sum, d) => sum + (typeof d.projects === "number" ? d.projects : 0), 0)

  // Apply filter
  const filtered = filter && ["excellent", "good", "watch"].includes(filter)
    ? developers.filter((d) => tierOf(typeof d.reliability === "number" ? d.reliability as number : null) === filter)
    : developers

  const FILTER_TABS = [
    { key: "", label: "All", count: developers.length },
    { key: "excellent", label: "Excellent", count: tierCounts.excellent, color: "text-emerald-500" },
    { key: "good", label: "Good", count: tierCounts.good, color: "text-amber-500" },
    { key: "watch", label: "Watch", count: tierCounts.watch, color: "text-red-400" },
  ]

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        {/* Header */}
        <header className="mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Developers</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-4xl">Developer Reliability Index</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {developers.length.toLocaleString()} active developers scored for delivery consistency and stress-grade distribution.
          </p>
        </header>

        {/* Stats strip */}
        <div className="mb-5 flex flex-wrap gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-4 py-2">
            <span className="text-xs text-muted-foreground">Developers</span>
            <span className="text-xs font-semibold text-foreground">{developers.length}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-4 py-2">
            <span className="text-xs text-muted-foreground">Total projects</span>
            <span className="text-xs font-semibold text-foreground">{totalProjects.toLocaleString()}</span>
          </div>
          {avgRel !== null ? (
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-4 py-2">
              <span className="text-xs text-muted-foreground">Avg score</span>
              <span className={`text-xs font-semibold ${avgRel >= 70 ? "text-emerald-500" : avgRel >= 50 ? "text-amber-500" : "text-red-400"}`}>
                {avgRel.toFixed(0)} / 100
              </span>
            </div>
          ) : null}
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-4 py-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Excellent</span>
            <span className="text-xs font-semibold text-foreground">{tierCounts.excellent}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-4 py-2">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-xs text-muted-foreground">Good</span>
            <span className="text-xs font-semibold text-foreground">{tierCounts.good}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-4 py-2">
            <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
            <span className="text-xs text-muted-foreground">Watch</span>
            <span className="text-xs font-semibold text-foreground">{tierCounts.watch}</span>
          </div>
        </div>

        {/* Score methodology note */}
        <div className="mb-6 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">How scores work: </span>
            Reliability score (0–100) combines delivery consistency (on-time handover rate), project stress-grade distribution (proportion of units graded A–B vs C–D), and historical price appreciation. Scores ≥80 = Excellent · 60–79 = Good · &lt;60 = Watch list.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => {
            const isActive = (tab.key === "" && !filter) || tab.key === filter
            return (
              <Link
                key={tab.key}
                href={tab.key ? `/developers?filter=${tab.key}` : "/developers"}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-foreground/30 bg-foreground text-background"
                    : "border-border/60 bg-card/70 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                }`}
              >
                {tab.label}
                <span className={`tabular-nums ${isActive ? "text-background/70" : (tab as { color?: string }).color ?? "text-muted-foreground"}`}>
                  {tab.count}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Cards grid */}
        <section className="relative grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_50%_-10%,rgba(99,102,241,0.22),transparent_58%)]" />
          {filtered.map((developer) => (
            <DeveloperCard
              key={String(developer.slug)}
              slug={String(developer.slug)}
              developer={String(developer.developer ?? "Developer")}
              projects={typeof developer.projects === "number" ? developer.projects : null}
              reliability={typeof developer.reliability === "number" ? developer.reliability : null}
              avg_price={typeof developer.avg_price === "number" ? developer.avg_price : null}
              logo_url={typeof developer.logo_url === "string" ? developer.logo_url : null}
              top_areas={
                Array.isArray(developer.top_areas)
                  ? developer.top_areas.filter((item): item is string => typeof item === "string")
                  : null
              }
              top_projects={
                Array.isArray(developer.top_projects)
                  ? developer.top_projects.filter((item): item is string => typeof item === "string")
                  : null
              }
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 rounded-2xl border border-border/60 bg-card/70 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">No developers found for this filter.</p>
              <Link href="/developers" className="mt-3 inline-block text-xs text-foreground underline">
                Clear filter
              </Link>
            </div>
          )}
        </section>
      </div>
      <Footer />
    </main>
  )
}
