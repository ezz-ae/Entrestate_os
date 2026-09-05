"use client"

import { ShieldCheck, Database, Clock } from "lucide-react"
import { useLocale } from "next-intl"

/**
 * The fourth cell used to print `updatedAt` — the request clock, formatted to
 * the minute — under the word "Updated". Every read model stamps that field
 * with `new Date()`, so the Decision Terminal's data-quality card said
 * "Updated Sep 05, 02:44 PM" while the scores it summarised were computed in
 * March and the newest DLD row was 21 August. The cell now takes the
 * coverage line from lib/platform-metrics.coverageLabel — a date the data
 * actually contains — and renders nothing when that is unknown.
 */
type TrustBarProps = {
  verifiedRows?: number
  highConfidencePct?: number
  /** coverageLabel(...) output: "DLD transactions through 21 Aug", or null. */
  coverage?: string | null
}

export function TrustBar({ verifiedRows, highConfidencePct, coverage }: TrustBarProps) {
  const locale = useLocale()
  const isArabic = locale === "ar"
  const highConfStr =
    typeof highConfidencePct === "number" && Number.isFinite(highConfidencePct)
      ? `${highConfidencePct.toFixed(1)}%`
      : "—"

  return (
    <div className="flex flex-wrap items-center gap-px overflow-hidden rounded-xl border border-border/60 bg-card/60 text-xs">
      <div className="flex items-center gap-2 px-4 py-2.5">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
        <span className="font-medium text-foreground">{isArabic ? "بيانات متحققة" : "Verified data"}</span>
      </div>
      <div className="h-4 w-px bg-border/60" />
      <div className="flex items-center gap-2 px-4 py-2.5 text-muted-foreground">
        <Database className="h-3.5 w-3.5 text-sky-400" />
        <span><span className="font-medium text-foreground">{verifiedRows?.toLocaleString(isArabic ? "ar-AE" : "en-US") ?? "—"}</span> {isArabic ? "صفوف" : "rows"}</span>
      </div>
      <div className="h-4 w-px bg-border/60" />
      <div className="flex items-center gap-2 px-4 py-2.5 text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span><span className="font-medium text-foreground">{highConfStr}</span> {isArabic ? "ثقة عالية" : "high confidence"}</span>
      </div>
      {coverage ? (
        <>
          <div className="h-4 w-px bg-border/60" />
          <div className="flex items-center gap-2 px-4 py-2.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{coverage}</span>
          </div>
        </>
      ) : null}
    </div>
  )
}
