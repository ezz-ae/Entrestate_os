import Link from "next/link"
import { Building2, ArrowUpRight } from "lucide-react"
import { formatAed } from "@/components/decision/formatters"

type DeveloperCardProps = {
  slug: string
  developer: string
  projects?: number | null
  reliability?: number | null
  avg_price?: number | null
  logo_url?: string | null
  top_areas?: string[] | null
  top_projects?: string[] | null
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

function reliabilityConfig(score: number | null) {
  if (score === null) return { bar: "bg-muted", text: "text-muted-foreground", label: "—", tier: "" }
  if (score >= 80) return { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", label: `${score.toFixed(0)}`, tier: "Excellent" }
  if (score >= 60) return { bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", label: `${score.toFixed(0)}`, tier: "Good" }
  return { bar: "bg-red-500", text: "text-red-600 dark:text-red-400", label: `${score.toFixed(0)}`, tier: "Watch" }
}

export function DeveloperCard(developer: DeveloperCardProps) {
  const topAreas = Array.isArray(developer.top_areas) ? developer.top_areas.slice(0, 3) : []
  const topProjects = Array.isArray(developer.top_projects) ? developer.top_projects.slice(0, 3) : []
  const relScore = typeof developer.reliability === "number" ? developer.reliability : null
  const relPct = relScore !== null ? Math.min(Math.max(relScore, 0), 100) : 0
  const rel = reliabilityConfig(relScore)

  return (
    <article className="group relative isolate block overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border/60 p-5 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Logo / icon */}
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/50 bg-cover bg-center"
            style={{ backgroundImage: developer.logo_url ? `url(${developer.logo_url})` : undefined }}
          >
            {!developer.logo_url ? <Building2 className="h-5 w-5 text-muted-foreground/50" /> : null}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">{developer.developer}</p>
            <p className="text-xs text-muted-foreground">
              {developer.projects?.toLocaleString() ?? "—"} completed projects
            </p>
          </div>
        </div>
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 opacity-0 transition-all duration-200 group-hover:opacity-100">
          <ArrowUpRight className="h-3.5 w-3.5 text-foreground" />
        </span>
      </div>

      {/* Body */}
      <div className="p-5">
        {/* Reliability bar */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Delivery Reliability</p>
            <div className="flex items-center gap-1.5">
              {rel.tier ? (
                <span className="text-[10px] text-muted-foreground">{rel.tier}</span>
              ) : null}
              <span className={`text-sm font-bold tabular-nums ${rel.text}`}>{rel.label}</span>
            </div>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${rel.bar}`}
              style={{ width: `${relPct}%` }}
            />
          </div>
        </div>

        {/* Avg ticket — always visible */}
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Ticket Size</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">{formatAed(developer.avg_price)}</p>
        </div>

        {/* Hover reveal — areas + projects */}
        {(topAreas.length > 0 || topProjects.length > 0) ? (
          <div className="mt-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="border-t border-border/60 pt-3 space-y-3">
              {topAreas.length > 0 ? (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Active Areas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {topAreas.map((areaName) => (
                      <Link
                        key={`${developer.slug}-area-${areaName}`}
                        href={`/areas/${slugify(areaName)}`}
                        className="relative z-30 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] text-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                      >
                        {areaName}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              {topProjects.length > 0 ? (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Key Projects</p>
                  <div className="flex flex-wrap gap-1.5">
                    {topProjects.map((projectName) => (
                      <Link
                        key={`${developer.slug}-project-${projectName}`}
                        href={`/properties/${slugify(projectName)}`}
                        className="relative z-30 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[11px] text-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                      >
                        {projectName}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <Link href={`/developers/${developer.slug}`} className="absolute inset-0 z-10" aria-label={`Open ${developer.developer} developer details`} />
    </article>
  )
}
