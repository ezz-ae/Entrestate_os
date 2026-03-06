import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatAed } from "@/components/decision/formatters"

type Props = {
  totalProjects: number
  dataPoints: number
  highConfidence: number
  buySignals: number
  avgPrice: number | null
  avgYield: number | null
  headline?: string
  subheadline?: string
  primaryCtaLabel?: string
  primaryCtaHref?: string
  secondaryCtaLabel?: string
  secondaryCtaHref?: string
}

export function HeroSection({
  totalProjects,
  dataPoints,
  highConfidence,
  buySignals,
  avgPrice,
  avgYield,
  headline = "UAE Real Estate Decision Desk",
  subheadline = "Not a listing portal. Built for disciplined property decisions.",
  primaryCtaLabel = "Start Decision Tunnel",
  primaryCtaHref = "/chat",
  secondaryCtaLabel = "Explore Market Data",
  secondaryCtaHref = "/top-data",
}: Props) {
  return (
    <section className="rounded-2xl border border-border/70 bg-gradient-to-br from-slate-900/40 via-slate-950/50 to-black/60 p-8">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">Market Decision Desk</p>
      <h1 className="mt-3 text-3xl font-semibold text-foreground md:text-6xl">{headline}</h1>
      <p className="mt-3 text-sm text-muted-foreground md:text-base">{subheadline}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <article className="rounded-xl border border-border/60 bg-card/60 p-3">
          <p className="text-[11px] text-muted-foreground">Projects</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{totalProjects.toLocaleString()}</p>
        </article>
        <article className="rounded-xl border border-border/60 bg-card/60 p-3">
          <p className="text-[11px] text-muted-foreground">Verified metrics</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{dataPoints.toLocaleString()}</p>
        </article>
        <article className="rounded-xl border border-border/60 bg-card/60 p-3">
          <p className="text-[11px] text-muted-foreground">HIGH confidence</p>
          <p className="mt-1 text-xl font-semibold text-foreground">{highConfidence.toLocaleString()}</p>
        </article>
        <article className="rounded-xl border border-border/60 bg-card/60 p-3">
          <p className="text-[11px] text-muted-foreground">BUY signals</p>
          <p className="mt-1 text-xl font-semibold text-emerald-300">{buySignals.toLocaleString()}</p>
        </article>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-border/60 bg-card/50 px-3 py-1">Avg price: {formatAed(avgPrice ?? 0)}</span>
        <span className="rounded-full border border-border/60 bg-card/50 px-3 py-1">
          Avg yield: {typeof avgYield === "number" ? `${avgYield.toFixed(1)}%` : "—"}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild>
          <Link href={primaryCtaHref}>{primaryCtaLabel}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={secondaryCtaHref}>{secondaryCtaLabel}</Link>
        </Button>
      </div>
    </section>
  )
}
