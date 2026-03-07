import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { formatAed, formatScore, formatYield } from "@/components/decision/formatters"

type ProjectCardProps = {
  slug: string
  name: string
  area?: string | null
  developer?: string | null
  l1_canonical_price?: number | null
  l1_canonical_yield?: number | null
  l2_stress_test_grade?: string | null
  l3_timing_signal?: string | null
  engine_god_metric?: number | null
  l1_confidence?: string | null
}

function timingAccent(signal: string | null | undefined) {
  const s = (signal ?? "").toUpperCase()
  if (s === "BUY") return { border: "border-l-emerald-500", dot: "bg-emerald-500", label: "border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" }
  if (s === "HOLD") return { border: "border-l-amber-500", dot: "bg-amber-500", label: "border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" }
  if (s === "WAIT") return { border: "border-l-red-400", dot: "bg-red-400", label: "border-red-400/40 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300" }
  return { border: "border-l-border/40", dot: "bg-muted-foreground/30", label: "border-border/40 bg-muted/30 text-muted-foreground" }
}

function gradeColor(grade: string | null | undefined) {
  const g = (grade ?? "").toUpperCase()
  if (g === "A") return "text-emerald-600 dark:text-emerald-400"
  if (g === "B") return "text-emerald-500 dark:text-emerald-300"
  if (g === "C") return "text-amber-600 dark:text-amber-400"
  if (g === "D") return "text-orange-600 dark:text-orange-400"
  return "text-muted-foreground"
}

export function ProjectCard(project: ProjectCardProps) {
  const accent = timingAccent(project.l3_timing_signal)
  const signal = (project.l3_timing_signal ?? "—").toUpperCase()
  const grade = project.l2_stress_test_grade?.toUpperCase() ?? null

  return (
    <Link
      href={`/properties/${project.slug}`}
      className={`group relative block overflow-hidden rounded-2xl border border-border bg-card border-l-4 ${accent.border} transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.4)]`}
    >
      {/* Top section — always visible */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          {/* Signal badge */}
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${accent.label}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />
            {signal}
          </span>
          {/* Arrow — appears on hover */}
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 opacity-0 transition-all duration-200 group-hover:opacity-100">
            <ArrowUpRight className="h-3.5 w-3.5 text-foreground" />
          </span>
        </div>

        {/* Project name */}
        <p className="mt-3 text-base font-semibold leading-snug text-foreground line-clamp-2">{project.name}</p>

        {/* Location + developer */}
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {[project.area, project.developer].filter(Boolean).join(" · ") || "Details pending"}
        </p>

        {/* Price — always visible */}
        <p className="mt-4 text-xl font-bold tabular-nums text-foreground">
          {formatAed(project.l1_canonical_price)}
        </p>
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-border/60" />

      {/* Hover-reveal section */}
      <div className="translate-y-2 overflow-hidden opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <div className="grid grid-cols-3 gap-px bg-border/40 border-t-0">
          <div className="bg-card px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Yield</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{formatYield(project.l1_canonical_yield)}</p>
          </div>
          <div className="bg-card px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Grade</p>
            <p className={`mt-0.5 text-sm font-bold tabular-nums ${gradeColor(grade)}`}>{grade ?? "—"}</p>
          </div>
          <div className="bg-card px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">{formatScore(project.engine_god_metric)}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
