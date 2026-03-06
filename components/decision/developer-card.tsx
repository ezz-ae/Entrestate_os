import Link from "next/link"
import { formatAed, formatScore } from "@/components/decision/formatters"

type DeveloperCardProps = {
  slug: string
  developer: string
  projects?: number | null
  reliability?: number | null
  avg_price?: number | null
  logo_url?: string | null
}

export function DeveloperCard(developer: DeveloperCardProps) {
  return (
    <Link
      href={`/developers/${developer.slug}`}
      className="block rounded-2xl border border-border/70 bg-card/70 p-4 transition hover:border-primary/40"
    >
      <div className="h-16 w-16 rounded-xl bg-muted/50" style={{ backgroundImage: developer.logo_url ? `url(${developer.logo_url})` : undefined }} />
      <p className="mt-3 text-base font-semibold text-foreground">{developer.developer}</p>
      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        <p>Reliability: {formatScore(developer.reliability)}</p>
        <p>Projects: {developer.projects?.toLocaleString() ?? "—"}</p>
        <p>Avg ticket: {formatAed(developer.avg_price)}</p>
      </div>
    </Link>
  )
}

