import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProjectCard } from "@/components/decision/project-card"
import { listProperties } from "@/lib/decision-infrastructure"
import { BarChart3, TrendingUp, ShieldCheck, Zap } from "lucide-react"

export const dynamic = "force-dynamic"

type SearchParams = {
  area?: string
  developer?: string
  timing?: "BUY" | "HOLD" | "WAIT"
  stress?: "A" | "B" | "C" | "D"
  minPrice?: string
  maxPrice?: string
  bedsMin?: string
  bedsMax?: string
  page?: string
}

function formatAed(v: number | null) {
  if (v === null) return "—"
  if (v >= 1_000_000) return `AED ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `AED ${(v / 1_000).toFixed(0)}K`
  return `AED ${v.toLocaleString()}`
}

function buildFilterHref(base: Record<string, string | undefined>, override: Record<string, string | undefined>) {
  const merged = { ...base, ...override }
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && v !== "") params.set(k, v)
  }
  const qs = params.toString()
  return `/properties${qs ? `?${qs}` : ""}`
}

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const page = Number.parseInt(params.page ?? "1", 10)
  const currentPage = Number.isFinite(page) && page > 0 ? page : 1
  const pageSize = 21

  const result = await listProperties({
    page: currentPage,
    pageSize,
    filters: {
      area: params.area,
      developer: params.developer,
      timingSignal: params.timing,
      stressGradeMin: params.stress,
      budgetMinAed: params.minPrice ? Number.parseFloat(params.minPrice) : undefined,
      budgetMaxAed: params.maxPrice ? Number.parseFloat(params.maxPrice) : undefined,
      bedsMin: params.bedsMin ? Number.parseFloat(params.bedsMin) : undefined,
      bedsMax: params.bedsMax ? Number.parseFloat(params.bedsMax) : undefined,
    },
  })

  const totalPages = Math.ceil(result.total / pageSize)
  const hasFilters = !!(params.timing || params.stress || params.area || params.developer || params.minPrice || params.maxPrice)

  // Derive stats from current page
  const projects = result.projects
  const buyCount = projects.filter((p) => p.l3_timing_signal === "BUY").length
  const prices = projects.map((p) => typeof p.l1_canonical_price === "number" ? p.l1_canonical_price : null).filter((v): v is number => v !== null && v > 0)
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null
  const yields = projects.map((p) => typeof p.l1_canonical_yield === "number" ? p.l1_canonical_yield : null).filter((v): v is number => v !== null && v > 0)
  const avgYield = yields.length > 0 ? yields.reduce((a, b) => a + b, 0) / yields.length : null

  const freshnessLabel = result.data_as_of
    ? new Date(result.data_as_of).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null

  // Base params for filter links (preserve all except the one being changed)
  const baseParams: Record<string, string | undefined> = {
    area: params.area,
    developer: params.developer,
    timing: params.timing,
    stress: params.stress,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
  }

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">

        {/* Header */}
        <header className="mb-10 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">
              Project Inventory
            </p>
            <h1 className="mt-2 font-serif text-3xl font-medium text-foreground md:text-4xl">
              UAE Project Intelligence
            </h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              {result.total.toLocaleString()} projects — each scored for pricing, market timing, stress resilience, and data confidence.
            </p>
          </div>
          {freshnessLabel && (
            <p className="text-[11px] text-muted-foreground/50 md:text-right">
              Data as of {freshnessLabel}
            </p>
          )}
        </header>

        {/* Metric cards */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Total Projects", value: result.total.toLocaleString(), sub: hasFilters ? "Matching current filters" : "Active UAE inventory", icon: BarChart3, color: "text-primary" },
            { label: "BUY Signals (this page)", value: `${buyCount} / ${projects.length}`, sub: `${projects.length > 0 ? ((buyCount / projects.length) * 100).toFixed(0) : 0}% of page results`, icon: Zap, color: "text-emerald-500" },
            { label: "Avg Price", value: formatAed(avgPrice), sub: "Across page results", icon: TrendingUp, color: "text-sky-500" },
            { label: "Avg Gross Yield", value: avgYield !== null ? `${avgYield.toFixed(1)}%` : "—", sub: "Across page results", icon: ShieldCheck, color: "text-violet-500" },
          ].map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className="rounded-2xl border border-border bg-card px-5 py-4">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${card.color}`} />
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{card.label}</p>
                </div>
                <p className={`mt-2 text-xl font-bold tabular-nums ${card.color}`}>{card.value}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{card.sub}</p>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {/* Timing signal */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground/60">Signal:</span>
            {(["BUY", "HOLD", "WAIT"] as const).map((signal) => {
              const isActive = params.timing === signal
              const colors = {
                BUY: isActive ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-400" : "border-emerald-500/30 bg-emerald-500/5 text-emerald-400/60 hover:bg-emerald-500/10",
                HOLD: isActive ? "border-amber-500/60 bg-amber-500/15 text-amber-400" : "border-amber-500/30 bg-amber-500/5 text-amber-400/60 hover:bg-amber-500/10",
                WAIT: isActive ? "border-red-500/60 bg-red-500/15 text-red-400" : "border-red-500/30 bg-red-500/5 text-red-400/60 hover:bg-red-500/10",
              }[signal]
              return (
                <Link
                  key={signal}
                  href={buildFilterHref(baseParams, { timing: isActive ? undefined : signal, page: undefined })}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${colors}`}
                >
                  {signal}
                </Link>
              )
            })}
          </div>

          <span className="text-border/60">·</span>

          {/* Stress grade */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground/60">Risk:</span>
            {(["A", "B", "C", "D"] as const).map((grade) => {
              const isActive = params.stress === grade
              return (
                <Link
                  key={grade}
                  href={buildFilterHref(baseParams, { stress: isActive ? undefined : grade, page: undefined })}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                    isActive
                      ? "border-primary/50 bg-primary/10 text-foreground"
                      : "border-border/50 bg-card/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  {grade}
                </Link>
              )
            })}
          </div>

          {hasFilters && (
            <>
              <span className="text-border/60">·</span>
              <Link href="/properties" className="rounded-full border border-border/50 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/30 hover:text-foreground">
                Clear all
              </Link>
            </>
          )}
        </div>

        {/* Active filter summary */}
        {hasFilters && (
          <div className="mb-4 flex flex-wrap gap-2">
            {params.timing && (
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                Signal: {params.timing}
                <Link href={buildFilterHref(baseParams, { timing: undefined, page: undefined })} className="ml-0.5 opacity-60 hover:opacity-100">×</Link>
              </span>
            )}
            {params.stress && (
              <span className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-foreground">
                Risk Grade: {params.stress}
                <Link href={buildFilterHref(baseParams, { stress: undefined, page: undefined })} className="ml-0.5 opacity-60 hover:opacity-100">×</Link>
              </span>
            )}
            {params.area && (
              <span className="flex items-center gap-1.5 rounded-full border border-border/50 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
                Area: {params.area}
                <Link href={buildFilterHref(baseParams, { area: undefined, page: undefined })} className="ml-0.5 opacity-60 hover:opacity-100">×</Link>
              </span>
            )}
            {params.developer && (
              <span className="flex items-center gap-1.5 rounded-full border border-border/50 bg-card/60 px-3 py-1 text-xs text-muted-foreground">
                Developer: {params.developer}
                <Link href={buildFilterHref(baseParams, { developer: undefined, page: undefined })} className="ml-0.5 opacity-60 hover:opacity-100">×</Link>
              </span>
            )}
          </div>
        )}

        {/* Showing count */}
        <p className="mb-4 text-xs text-muted-foreground/60">
          Page {currentPage} of {totalPages} · showing {projects.length} of {result.total.toLocaleString()} projects
        </p>

        {/* Grid */}
        <section className="relative grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_50%_-10%,rgba(59,130,246,0.12),transparent_58%)]" />
          {projects.map((project) => (
            <ProjectCard
              key={String(project.slug)}
              slug={String(project.slug)}
              name={String(project.name ?? "Unnamed project")}
              area={String(project.final_area ?? project.area ?? "")}
              developer={String(project.developer ?? "")}
              l1_canonical_price={typeof project.l1_canonical_price === "number" ? project.l1_canonical_price : null}
              l1_canonical_yield={typeof project.l1_canonical_yield === "number" ? project.l1_canonical_yield : null}
              l2_stress_test_grade={typeof project.l2_stress_test_grade === "string" ? project.l2_stress_test_grade : null}
              l3_timing_signal={typeof project.l3_timing_signal === "string" ? project.l3_timing_signal : null}
              engine_god_metric={typeof project.engine_god_metric === "number" ? project.engine_god_metric : null}
              l1_confidence={typeof project.l1_confidence === "string" ? project.l1_confidence : null}
            />
          ))}
          {projects.length === 0 && (
            <div className="col-span-3 rounded-2xl border border-dashed border-border/60 bg-card/40 px-6 py-16 text-center">
              <p className="text-sm font-medium text-foreground">No projects match these filters</p>
              <p className="mt-1 text-xs text-muted-foreground">Try adjusting your timing signal or risk grade filter.</p>
              <Link href="/properties" className="mt-4 inline-block rounded-full border border-border/60 bg-card px-4 py-2 text-xs text-foreground transition hover:border-primary/40">
                Clear all filters
              </Link>
            </div>
          )}
        </section>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            {currentPage > 1 && (
              <Link
                href={buildFilterHref(baseParams, { page: String(currentPage - 1) })}
                className="rounded-xl border border-border/60 bg-card/60 px-4 py-2 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                ← Previous
              </Link>
            )}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = currentPage <= 4
                  ? i + 1
                  : currentPage >= totalPages - 3
                    ? totalPages - 6 + i
                    : currentPage - 3 + i
                if (p < 1 || p > totalPages) return null
                const isActive = p === currentPage
                return (
                  <Link
                    key={p}
                    href={buildFilterHref(baseParams, { page: String(p) })}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-medium transition ${
                      isActive
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border/50 bg-card/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    {p}
                  </Link>
                )
              })}
            </div>
            {currentPage < totalPages && (
              <Link
                href={buildFilterHref(baseParams, { page: String(currentPage + 1) })}
                className="rounded-xl border border-border/60 bg-card/60 px-4 py-2 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
              >
                Next →
              </Link>
            )}
          </div>
        )}

      </div>
      <Footer />
    </main>
  )
}
