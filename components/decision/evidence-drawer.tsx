"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ConfidenceBadge, ConfidenceLevel } from "@/components/trust/confidence-badge"
import { Database, Clock } from "lucide-react"
import { formatDate } from "@/lib/format/date"
import { TRUST_COPY } from "@/lib/copy/trust"

type EvidenceDrawerProps = {
  sources?: any[]
  exclusions?: any[]
  assumptions?: any[]
  steps?: any[]
  title?: string
  confidenceScore?: number
  confidenceLevel?: ConfidenceLevel
  snapshotId?: string
  timestamp?: string
  runId?: string
  snapshotTs?: string
  locale?: string
}

export function EvidenceDrawer({ 
  sources, 
  exclusions, 
  assumptions, 
  steps,
  title = "Evidence Drawer",
  confidenceScore,
  confidenceLevel,
  snapshotId = "v1.0.4-inventory-spine",
  timestamp,
  runId,
  snapshotTs,
  locale = "en",
}: EvidenceDrawerProps) {
  const [open, setOpen] = useState(false)
  const resolvedTimestamp = snapshotTs || timestamp || new Date().toISOString()
  const isArabic = locale === "ar"
  const copy = {
    title: isArabic ? "درج الأدلة" : TRUST_COPY.evidence_drawer.header,
    expose: isArabic ? "عرض الأدلة" : "Expose Evidence",
    collapse: isArabic ? "إخفاء الأدلة" : "Collapse Intelligence",
    sources: isArabic ? "المصادر" : TRUST_COPY.evidence_drawer.sources_label,
    exclusions: isArabic ? "الاستبعادات" : TRUST_COPY.evidence_drawer.exclusions_label,
    assumptions: isArabic ? "الافتراضات" : TRUST_COPY.evidence_drawer.assumptions_label,
    steps: isArabic ? "خطوات الحساب" : TRUST_COPY.evidence_drawer.steps_label,
    snapshot: isArabic ? "اللقطة" : "Snapshot",
    verified: isArabic ? "التحقق" : "Verified",
    run: isArabic ? "التشغيل" : "Run",
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm">
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/10" />
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">{title || copy.title}</h3>
          <ConfidenceBadge 
            score={confidenceScore} 
            level={confidenceLevel} 
            showLabel={false}
          />
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setOpen((prev) => !prev)}
          className="h-8 text-xs hover:bg-primary/5 hover:text-primary transition-colors"
        >
          {open ? copy.collapse : copy.expose}
        </Button>
      </div>

      {open && (
        <div className="mt-4 space-y-4 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {copy.sources}
              </p>
              <div className="rounded-lg border border-border/40 bg-background/40 p-2 max-h-40 overflow-auto custom-scrollbar">
                <pre className="whitespace-pre-wrap">{JSON.stringify(sources ?? [], null, 2)}</pre>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {copy.exclusions}
              </p>
              <div className="rounded-lg border border-border/40 bg-background/40 p-2 max-h-40 overflow-auto custom-scrollbar">
                <pre className="whitespace-pre-wrap">{JSON.stringify(exclusions ?? [], null, 2)}</pre>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> {copy.assumptions}
              </p>
              <div className="rounded-lg border border-border/40 bg-background/40 p-2 max-h-40 overflow-auto custom-scrollbar">
                <pre className="whitespace-pre-wrap">{JSON.stringify(assumptions ?? [], null, 2)}</pre>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500" /> {copy.steps}
              </p>
              <div className="rounded-lg border border-border/40 bg-background/40 p-2 max-h-40 overflow-auto custom-scrollbar">
                <pre className="whitespace-pre-wrap">{JSON.stringify(steps ?? [], null, 2)}</pre>
              </div>
            </div>
          </div>

          {/* Provenance Footer */}
          <div className="pt-3 border-t border-border/30 flex flex-wrap items-center justify-between gap-3 text-[10px] text-muted-foreground/60 italic">
            <div className="flex items-center gap-1.5">
              <Database className="w-3 h-3" />
              <span>{copy.snapshot}: <span className="font-mono text-foreground/70">{snapshotId}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>{copy.verified}: {formatDate(
                resolvedTimestamp,
                locale,
                { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" },
              )}</span>
            </div>
            {runId ? (
              <div className="flex items-center gap-1.5">
                <Database className="w-3 h-3" />
                <span>{copy.run}: <span className="font-mono text-foreground/70">{runId}</span></span>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
