"use client"

import Link from "next/link"
import { ArrowRight, Sparkles, TrendingUp, ShieldCheck, BarChart3, Layers } from "lucide-react"
import { formatAed } from "@/components/decision/formatters"

type Props = {
  totalProjects: number
  buySignals: number
  avgPrice: number | null
  avgYield: number | null
}

const EVIDENCE_LAYERS = [
  { id: "L1", label: "Canonical", color: "bg-primary" },
  { id: "L2", label: "Derived", color: "bg-blue-400" },
  { id: "L3", label: "Dynamic", color: "bg-violet-400" },
  { id: "L4", label: "External", color: "bg-amber-400" },
  { id: "L5", label: "Raw", color: "bg-muted-foreground/40" },
]

export function HeroSection({ totalProjects, buySignals, avgPrice, avgYield }: Props) {
  const buyPct = totalProjects > 0 ? ((buySignals / totalProjects) * 100).toFixed(0) : "—"

  return (
    <section className="relative">
      {/* Subtle grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">

        {/* ── Left: copy ── */}
        <div className="flex-1">
          {/* Live badge */}
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.5)]" />
            {totalProjects.toLocaleString()} projects scored · {buySignals.toLocaleString()} BUY signals live
          </p>

          <h1 className="font-serif text-4xl font-medium leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-6xl">
            The Real Estate<br />
            <span className="text-primary">Decision System</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-[17px]">
            Beyond portals. Entrestate is a proprietary intelligence engine that scores every project across timing, stress resilience, yield, and evidence quality through a five-layer data architecture — bringing precision to real estate investment.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/overview"
              className="hidden md:flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20"
            >
              Open Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/chat"
              className="flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              Ask the AI
            </Link>
          </div>

          {/* Proof strip */}
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2">
            {[
              { label: "Projects scored", value: totalProjects.toLocaleString() },
              { label: "BUY signals", value: `${buySignals.toLocaleString()} (${buyPct}%)`, accent: true },
              { label: "Avg gross yield", value: typeof avgYield === "number" ? `${avgYield.toFixed(1)}%` : "—" },
              { label: "Avg price", value: formatAed(avgPrice) },
            ].map((item) => (
              <div key={item.label} className="flex items-baseline gap-1.5">
                <span className={`text-sm font-semibold tabular-nums ${item.accent ? "text-emerald-400" : "text-foreground"}`}>
                  {item.value}
                </span>
                <span className="text-[11px] text-muted-foreground/50">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: decision output preview ── */}
        <div className="w-full shrink-0 lg:w-[340px] xl:w-[380px]">
          <div className="relative rounded-2xl border border-border/60 bg-card/50 p-5 shadow-2xl shadow-black/20 backdrop-blur-sm">
            {/* Glow accent line */}
            <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart3 className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Sample Output</p>
                  <p className="text-xs font-medium text-foreground">JVC · Studio · AED 1.1M</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                BUY
              </span>
            </div>

            {/* Score ring + metrics */}
            <div className="mb-4 flex items-center gap-4 rounded-xl border border-border/40 bg-background/40 p-4">
              {/* Score circle */}
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="3" className="text-border/30" />
                  <circle
                    cx="28" cy="28" r="24"
                    fill="none" stroke="currentColor" strokeWidth="3"
                    strokeDasharray={`${(82 / 100) * 150.8} 150.8`}
                    strokeLinecap="round"
                    className="text-emerald-400"
                  />
                </svg>
                <div className="text-center">
                  <p className="text-lg font-bold tabular-nums text-foreground leading-none">82</p>
                  <p className="text-[9px] text-muted-foreground/50">score</p>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                {[
                  { label: "Gross Yield", value: "8.1%", color: "text-emerald-400" },
                  { label: "Stress Grade", value: "A", color: "text-emerald-400" },
                  { label: "Price / sqft", value: "AED 1,100", color: "text-foreground" },
                ].map((m) => (
                  <div key={m.label} className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground/60">{m.label}</span>
                    <span className={`text-xs font-semibold tabular-nums ${m.color}`}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence layers */}
            <div className="mb-3">
              <div className="mb-2 flex items-center gap-1.5">
                <Layers className="h-3 w-3 text-muted-foreground/40" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Evidence layers</p>
              </div>
              <div className="flex items-center gap-1.5">
                {EVIDENCE_LAYERS.map((layer, i) => (
                  <div key={layer.id} className="flex flex-1 flex-col items-center gap-1">
                    <div className={`h-1.5 w-full rounded-full ${layer.color} opacity-80`} />
                    <span className="text-[9px] font-mono text-muted-foreground/40">{layer.id}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Developer + timing */}
            <div className="flex items-center justify-between rounded-lg border border-border/30 bg-background/20 px-3 py-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-primary/60" />
                <span className="text-[11px] text-muted-foreground/60">Ellington · Grade A</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-emerald-400/60" />
                <span className="text-[11px] text-emerald-400/80 font-medium">Absorption 94%</span>
              </div>
            </div>

            {/* Footer note */}
            <p className="mt-3 text-center text-[9px] text-muted-foreground/30">
              Scored across 5 data layers · Updated daily from DLD
            </p>
          </div>

          {/* Floating label */}
          <p className="mt-3 text-center text-[10px] text-muted-foreground/30 uppercase tracking-widest">
            Real output format · Data is live
          </p>
        </div>

      </div>
    </section>
  )
}
