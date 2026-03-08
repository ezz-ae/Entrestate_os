"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Building2,
  MapPin,
  ChevronDown,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────

type Project = Record<string, unknown>

// ── Preset shortcuts ──────────────────────────────────────────────────────────

const PRESETS = [
  {
    label: "All projects",
    icon: Sparkles,
    filters: { timing: "", stress: "", minPrice: "", maxPrice: "" },
    sort: "god_metric",
  },
  {
    label: "BUY signals",
    icon: TrendingUp,
    filters: { timing: "BUY", stress: "", minPrice: "", maxPrice: "" },
    sort: "god_metric",
  },
  {
    label: "High yield",
    icon: TrendingUp,
    filters: { timing: "", stress: "", minPrice: "", maxPrice: "" },
    sort: "yield",
  },
  {
    label: "Grade A only",
    icon: ShieldCheck,
    filters: { timing: "", stress: "A", minPrice: "", maxPrice: "" },
    sort: "god_metric",
  },
  {
    label: "Golden Visa",
    icon: Building2,
    filters: { timing: "", stress: "", minPrice: "2000000", maxPrice: "" },
    sort: "price",
  },
]

const TIMING_OPTIONS = [
  { value: "", label: "Any signal" },
  { value: "BUY", label: "BUY", color: "text-emerald-400" },
  { value: "HOLD", label: "HOLD", color: "text-amber-400" },
  { value: "WAIT", label: "WAIT", color: "text-red-400" },
]

const GRADE_OPTIONS = [
  { value: "", label: "Any grade" },
  { value: "A", label: "Grade A" },
  { value: "B", label: "Grade B" },
  { value: "C", label: "Grade C" },
]

const SORT_OPTIONS = [
  { value: "god_metric", label: "Score" },
  { value: "yield", label: "Yield" },
  { value: "price", label: "Price" },
  { value: "reliability", label: "Reliability" },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function signalStyle(signal: string) {
  if (signal === "BUY") return { badge: "bg-emerald-500/12 text-emerald-400 border-emerald-500/25", bar: "bg-emerald-400" }
  if (signal === "HOLD") return { badge: "bg-amber-500/12 text-amber-400 border-amber-500/25", bar: "bg-amber-400" }
  return { badge: "bg-red-500/12 text-red-400 border-red-500/25", bar: "bg-red-400" }
}

function gradeStyle(grade: string) {
  if (grade === "A") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  if (grade === "B") return "bg-blue-500/10 text-blue-400 border-blue-500/20"
  return "bg-amber-500/10 text-amber-400 border-amber-500/20"
}

// ── Dropdown filter chip ──────────────────────────────────────────────────────

function FilterChip({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string; color?: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = value !== ""
  const displayLabel = value ? (options.find((o) => o.value === value)?.label ?? label) : label

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-200 ${
          active
            ? "border-primary/50 bg-primary/10 text-primary shadow-sm shadow-primary/10"
            : "border-border/50 bg-card/60 text-muted-foreground hover:border-border hover:text-foreground"
        }`}
      >
        {displayLabel}
        {active ? (
          <X
            className="h-3 w-3 opacity-60 hover:opacity-100"
            onClick={(e) => { e.stopPropagation(); onChange(""); setOpen(false) }}
          />
        ) : (
          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1.5 min-w-[140px] rounded-xl border border-border/60 bg-card shadow-xl shadow-black/20 overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full px-4 py-2.5 text-left text-xs transition-colors hover:bg-muted/50 ${
                opt.value === value ? "text-primary font-medium" : `text-foreground ${opt.color ?? ""}`
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [area, setArea] = useState("")
  const [developer, setDeveloper] = useState("")
  const [timing, setTiming] = useState("")
  const [stress, setStress] = useState("")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [sortBy, setSortBy] = useState("god_metric")
  const [activePreset, setActivePreset] = useState<number | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [results, setResults] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const totalPages = Math.ceil(total / 24)

  async function runQuery(queryPage = 1) {
    setLoading(true)
    setHasSearched(true)
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (area) params.set("area", area)
    if (developer) params.set("developer", developer)
    if (timing) params.set("timing", timing)
    if (stress) params.set("stress", stress)
    if (minPrice) params.set("minPrice", minPrice)
    if (maxPrice) params.set("maxPrice", maxPrice)
    params.set("sortBy", sortBy)
    params.set("page", String(queryPage))
    params.set("pageSize", "24")

    try {
      const res = await fetch(`/api/search?${params.toString()}`)
      const data = res.ok ? await res.json() : {}
      setResults(data.projects ?? [])
      setTotal(data.total ?? 0)
      setPage(queryPage)
    } catch {
      setResults([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  function applyPreset(i: number) {
    const p = PRESETS[i]
    setActivePreset(i)
    setQuery("")
    setArea("")
    setDeveloper("")
    setTiming(p.filters.timing)
    setStress(p.filters.stress)
    setMinPrice(p.filters.minPrice)
    setMaxPrice(p.filters.maxPrice)
    setSortBy(p.sort)
    // run immediately
    const params = new URLSearchParams()
    if (p.filters.timing) params.set("timing", p.filters.timing)
    if (p.filters.stress) params.set("stress", p.filters.stress)
    if (p.filters.minPrice) params.set("minPrice", p.filters.minPrice)
    params.set("sortBy", p.sort)
    params.set("page", "1")
    params.set("pageSize", "24")
    setLoading(true)
    setHasSearched(true)
    setPage(1)
    fetch(`/api/search?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : { projects: [], total: 0 }))
      .then((data: { projects?: Project[]; total?: number }) => { setResults(data.projects ?? []); setTotal(data.total ?? 0) })
      .catch(() => { setResults([]); setTotal(0) })
      .finally(() => setLoading(false))
  }

  const activeFilterCount = [timing, stress, area, developer, minPrice, maxPrice].filter(Boolean).length

  return (
    <main id="main-content">
      <Navbar />

      <div className="mx-auto max-w-[1200px] px-6 pb-28 pt-28 md:pt-36">

        {/* ── Page header ── */}
        <div className="mb-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/40">
            Market Intelligence
          </p>
          <h1 className="mt-2 font-serif text-4xl font-medium text-foreground md:text-5xl">
            Project Search
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Filter across {(7015).toLocaleString()} scored projects. Click any result to go deeper.
          </p>
        </div>

        {/* ── Search + filter controls ── */}
        <div className="mb-8 space-y-4">

          {/* Main search bar */}
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActivePreset(null) }}
                onKeyDown={(e) => e.key === "Enter" && runQuery(1)}
                placeholder="Search by project name, developer, area…"
                className="h-12 w-full rounded-xl border border-border/60 bg-card/60 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/40 backdrop-blur-sm transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <button
              onClick={() => runQuery(1)}
              disabled={loading}
              className="flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Search <ArrowRight className="h-4 w-4" /></>}
            </button>
          </div>

          {/* Preset pills */}
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p, i) => {
              const Icon = p.icon
              return (
                <button
                  key={p.label}
                  onClick={() => applyPreset(i)}
                  className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                    activePreset === i
                      ? "border-primary/60 bg-primary/10 text-primary shadow-sm shadow-primary/10"
                      : "border-border/40 bg-background/50 text-muted-foreground hover:border-border/70 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {p.label}
                </button>
              )
            })}

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setShowAdvanced((v) => !v)}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
                  showAdvanced || activeFilterCount > 0
                    ? "border-border/60 bg-card text-foreground"
                    : "border-border/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <SlidersHorizontal className="h-3 w-3" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Expanded filter row */}
          {showAdvanced && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/40 bg-card/40 px-4 py-3">

              {/* Inline text filters */}
              <div className="flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1.5">
                <MapPin className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Area"
                  className="w-24 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                />
                {area && <X className="h-3 w-3 cursor-pointer text-muted-foreground/40 hover:text-foreground" onClick={() => setArea("")} />}
              </div>

              <div className="flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 px-3 py-1.5">
                <Building2 className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                <input
                  type="text"
                  value={developer}
                  onChange={(e) => setDeveloper(e.target.value)}
                  placeholder="Developer"
                  className="w-28 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                />
                {developer && <X className="h-3 w-3 cursor-pointer text-muted-foreground/40 hover:text-foreground" onClick={() => setDeveloper("")} />}
              </div>

              <FilterChip label="Timing" value={timing} options={TIMING_OPTIONS} onChange={setTiming} />
              <FilterChip label="Grade" value={stress} options={GRADE_OPTIONS} onChange={setStress} />

              {/* Price range */}
              <div className="flex items-center gap-1 rounded-full border border-border/50 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground">
                <span className="text-muted-foreground/40">AED</span>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  className="w-16 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
                />
                <span className="text-muted-foreground/30">—</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max"
                  className="w-16 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40">Sort</span>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`rounded-full border px-3 py-1 text-xs transition-all ${
                      sortBy === opt.value
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Clear all */}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setTiming(""); setStress(""); setArea(""); setDeveloper(""); setMinPrice(""); setMaxPrice(""); setActivePreset(null) }}
                  className="ml-auto text-[11px] text-muted-foreground/40 underline underline-offset-2 hover:text-muted-foreground transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Results ── */}
        {!hasSearched ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="mb-6 select-none font-black leading-none text-foreground opacity-[0.04]"
              style={{ fontSize: "100px", WebkitTextStroke: "1.5px currentColor", color: "transparent" }}
              aria-hidden
            >
              ∅
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/30 mb-3">
              Entrestate · Market Intelligence
            </p>
            <p className="text-sm text-muted-foreground">
              Choose a preset above or enter a search to load results.
            </p>
          </div>
        ) : loading ? (
          /* Loading skeleton */
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-border/40 bg-card/40 p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="h-3 w-32 rounded bg-muted/50" />
                    <div className="h-2.5 w-24 rounded bg-muted/30" />
                  </div>
                  <div className="h-5 w-10 rounded-full bg-muted/40" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="h-8 rounded-lg bg-muted/30" />
                  <div className="h-8 rounded-lg bg-muted/30" />
                  <div className="h-8 rounded-lg bg-muted/30" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-sm text-muted-foreground">No projects match these filters.</p>
            <button
              onClick={() => { setTiming(""); setStress(""); setArea(""); setDeveloper(""); setMinPrice(""); setMaxPrice(""); setActivePreset(0); applyPreset(0) }}
              className="mt-4 text-xs text-primary underline underline-offset-2"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground/50">
                <span className="font-semibold tabular-nums text-foreground">{total.toLocaleString()}</span> results
                {sortBy !== "god_metric" && (
                  <span className="ml-2">· sorted by {SORT_OPTIONS.find(s => s.value === sortBy)?.label.toLowerCase()}</span>
                )}
              </p>
              <p className="text-[10px] text-muted-foreground/30 uppercase tracking-wider">Click a card to go deeper</p>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {results.map((project, i) => {
                const name = String(project.name ?? "Unnamed project")
                const devName = String(project.developer ?? "")
                const areaName = String(project.final_area ?? project.area ?? "")
                const price = typeof project.l1_canonical_price === "number"
                  ? `${(project.l1_canonical_price / 1_000_000).toFixed(2)}M`
                  : null
                const yieldVal = typeof project.l1_canonical_yield === "number"
                  ? `${Number(project.l1_canonical_yield).toFixed(1)}%`
                  : null
                const score = typeof project.god_metric === "number"
                  ? Math.round(Number(project.god_metric))
                  : null
                const signal = typeof project.l3_timing_signal === "string" ? project.l3_timing_signal : null
                const grade = typeof project.l2_stress_test_grade === "string" ? project.l2_stress_test_grade : null
                const slug = String(project.slug ?? "")
                const styles = signal ? signalStyle(signal) : null

                return (
                  <Link
                    key={i}
                    href={slug ? `/properties/${slug}` : "/properties"}
                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-lg hover:shadow-black/10"
                  >
                    {/* Signal accent bar */}
                    {styles && (
                      <div className={`h-0.5 w-full ${styles.bar} opacity-60 transition-opacity group-hover:opacity-100`} />
                    )}

                    <div className="flex flex-1 flex-col p-5">
                      {/* Header */}
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground group-hover:text-foreground">
                            {name}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                            {devName && <span className="truncate">{devName}</span>}
                            {devName && areaName && <span className="text-muted-foreground/30">·</span>}
                            {areaName && (
                              <span className="flex items-center gap-0.5 truncate">
                                <MapPin className="h-2.5 w-2.5 shrink-0" />
                                {areaName}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {signal && (
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${styles!.badge}`}>
                              {signal}
                            </span>
                          )}
                          {grade && (
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${gradeStyle(grade)}`}>
                              {grade}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Metrics strip */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg border border-border/30 bg-background/40 px-3 py-2 text-center">
                          <p className="text-[9px] uppercase tracking-wider text-muted-foreground/40">Price</p>
                          <p className="mt-0.5 text-xs font-semibold tabular-nums text-foreground">
                            {price ? `AED ${price}` : "—"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border/30 bg-background/40 px-3 py-2 text-center">
                          <p className="text-[9px] uppercase tracking-wider text-muted-foreground/40">Yield</p>
                          <p className={`mt-0.5 text-xs font-semibold tabular-nums ${yieldVal ? "text-emerald-400" : "text-foreground"}`}>
                            {yieldVal ?? "—"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border/30 bg-background/40 px-3 py-2 text-center">
                          <p className="text-[9px] uppercase tracking-wider text-muted-foreground/40">Score</p>
                          <p className={`mt-0.5 text-xs font-semibold tabular-nums ${score && score >= 70 ? "text-primary" : "text-foreground"}`}>
                            {score ?? "—"}
                          </p>
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="mt-4 flex items-center justify-end gap-1 text-[11px] font-medium text-muted-foreground/40 transition-colors group-hover:text-primary">
                        View project
                        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  onClick={() => runQuery(page - 1)}
                  disabled={page <= 1}
                  className="flex items-center gap-1.5 rounded-xl border border-border/60 px-4 py-2 text-xs text-muted-foreground transition hover:border-border hover:text-foreground disabled:opacity-30"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </button>
                <span className="text-xs text-muted-foreground/50">
                  {page} <span className="text-muted-foreground/30">of</span> {totalPages}
                </span>
                <button
                  onClick={() => runQuery(page + 1)}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1.5 rounded-xl border border-border/60 px-4 py-2 text-xs text-muted-foreground transition hover:border-border hover:text-foreground disabled:opacity-30"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </>
        )}

      </div>
      <Footer />
    </main>
  )
}
