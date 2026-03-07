"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Activity, ArrowUpRight, ShieldCheck } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import type { MarketScoreSummary, SystemHealthcheckRow } from "@/lib/market-score/types"

export function MarketPulsePopover({ className, compact = false }: { className?: string; compact?: boolean }) {
  const [mounted, setMounted] = useState(false)
  const [summary, setSummary] = useState<MarketScoreSummary | null>(null)
  const [healthcheck, setHealthcheck] = useState<SystemHealthcheckRow | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    let isMounted = true

    const loadPulse = async () => {
      try {
        const [summaryRes, healthRes] = await Promise.all([
          fetch("/api/market-score/summary", { cache: "no-store" }),
          fetch("/api/market-score/healthcheck", { cache: "no-store" }),
        ])
        if (!summaryRes.ok || !healthRes.ok) throw new Error("Pulse fetch failed")
        const summaryData = await summaryRes.json()
        const healthData = await healthRes.json()
        if (!isMounted) return
        setSummary(summaryData)
        setHealthcheck(healthData.healthcheck || null)
      } catch (error) {
        console.error("Market pulse error:", error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadPulse()
    return () => {
      isMounted = false
    }
  }, [])

  const topBands = useMemo(() => {
    if (!summary?.safetyDistribution) return []
    return [...summary.safetyDistribution]
      .sort((a, b) => b.count - a.count)
      .slice(0, 2)
  }, [summary])

  const triggerClasses = compact
    ? `inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors ${
        className ?? ""
      }`
    : `hidden lg:inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 ${
        className ?? ""
      }`

  if (!mounted) {
    return (
      <button
        className={triggerClasses}
        aria-label="Market pulse"
      >
        <Activity className="h-3.5 w-3.5 text-accent" />
        {!compact ? "Market pulse" : null}
      </button>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={triggerClasses}
          aria-label="Market pulse"
        >
          <Activity className="h-3.5 w-3.5 text-accent" />
          {!compact ? "Market pulse" : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Market pulse</p>
            <p className="text-sm font-semibold text-foreground">Live inventory snapshot</p>
          </div>
          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            {healthcheck?.passing_count ?? "—"}/{healthcheck?.total_count ?? "—"}
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-3">
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading pulse...</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Assets scored</span>
                <span className="text-sm font-semibold text-foreground">
                  {summary?.totalAssets?.toLocaleString() ?? "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Average score</span>
                <span className="text-sm font-semibold text-foreground">
                  {summary ? Math.round(summary.avgScore) : "—"}
                </span>
              </div>
              {topBands.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {topBands.map((band) => (
                    <Badge key={band.label} className="bg-secondary text-foreground" variant="secondary">
                      {band.label}: {band.count}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Updated {healthcheck?.created_at ? new Date(healthcheck.created_at).toLocaleString() : "recently"}.
        </p>

        <div className="mt-4 flex items-center justify-between">
          <Link href="/market-score" className="text-xs text-accent hover:text-accent/80">
            View score dashboard
          </Link>
          <Link href="/agent-runtime" className="inline-flex items-center gap-1 text-xs text-foreground">
            Open match desk
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
