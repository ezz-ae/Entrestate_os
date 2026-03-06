import Link from "next/link"
import { ConfidenceBadge, StressGradeBadge, TimingSignalBadge } from "@/components/decision/badges"
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

export function ProjectCard(project: ProjectCardProps) {
  return (
    <Link
      href={`/properties/${project.slug}`}
      className="block rounded-2xl border border-border/70 bg-card/70 p-4 transition hover:border-primary/40 hover:bg-card"
    >
      <p className="text-base font-semibold text-foreground">{project.name}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {[project.area, project.developer].filter(Boolean).join(" · ") || "Area and developer pending"}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Price</p>
          <p className="font-medium text-foreground">{formatAed(project.l1_canonical_price)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Yield</p>
          <p className="font-medium text-foreground">{formatYield(project.l1_canonical_yield)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">God metric</p>
          <p className="font-medium text-foreground">{formatScore(project.engine_god_metric)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <StressGradeBadge grade={project.l2_stress_test_grade} />
        <TimingSignalBadge signal={project.l3_timing_signal} />
        <ConfidenceBadge confidence={project.l1_confidence} />
      </div>
    </Link>
  )
}

