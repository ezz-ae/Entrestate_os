import Link from "next/link"
import { formatAed, formatYield } from "@/components/decision/formatters"

type AreaCardProps = {
  slug: string
  area: string
  projects?: number | null
  avg_price?: number | null
  avg_yield?: number | null
  image_url?: string | null
}

export function AreaCard(area: AreaCardProps) {
  return (
    <Link
      href={`/areas/${area.slug}`}
      className="block rounded-2xl border border-border/70 bg-card/70 p-4 transition hover:border-primary/40"
    >
      <div className="h-28 rounded-xl bg-muted/40" style={{ backgroundImage: area.image_url ? `url(${area.image_url})` : undefined }} />
      <p className="mt-3 text-base font-semibold text-foreground">{area.area}</p>
      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        <p>Projects: {area.projects?.toLocaleString() ?? "—"}</p>
        <p>Avg price: {formatAed(area.avg_price)}</p>
        <p>Avg yield: {formatYield(area.avg_yield)}</p>
      </div>
    </Link>
  )
}

