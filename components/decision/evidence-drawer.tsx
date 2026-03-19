"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ConfidenceBadge, ConfidenceLevel } from "@/components/trust/confidence-badge"
import { Database, Clock } from "lucide-react"

type EvidenceDrawerProps = {
  sources?: any[]
  exclusions?: any[]
  assumptions?: any[]
  title?: string
  confidenceScore?: number
  confidenceLevel?: ConfidenceLevel
  snapshotId?: string
  timestamp?: string
  runId?: string
  snapshotTs?: string
}

export function EvidenceDrawer({ 
  sources, 
  exclusions, 
  assumptions, 
  title = "Evidence Drawer",
  confidenceScore,
  confidenceLevel,
  snapshotId = "v1.0.4-inventory-spine",
  timestamp,
  runId,
  snapshotTs,
}: EvidenceDrawerProps) {
  const [open, setOpen] = useState(false)
  const resolvedTimestamp = snapshotTs || timestamp || new Date().toISOString()

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm">
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/10" />
      
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
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
          {open ? "Collapse Intelligence" : "Expose Evidence"}
        </Button>
      </div>

      {open && (
        <div className="mt-4 space-y-4 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Sources
              </p>
              <div className="rounded-lg border border-border/40 bg-background/40 p-2 max-h-40 overflow-auto custom-scrollbar">
                <pre className="whitespace-pre-wrap">{JSON.stringify(sources ?? [], null, 2)}</pre>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Exclusions
              </p>
              <div className="rounded-lg border border-border/40 bg-background/40 p-2 max-h-40 overflow-auto custom-scrollbar">
                <pre className="whitespace-pre-wrap">{JSON.stringify(exclusions ?? [], null, 2)}</pre>
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Assumptions
              </p>
              <div className="rounded-lg border border-border/40 bg-background/40 p-2 max-h-40 overflow-auto custom-scrollbar">
                <pre className="whitespace-pre-wrap">{JSON.stringify(assumptions ?? [], null, 2)}</pre>
              </div>
            </div>
          </div>

          {/* Provenance Footer */}
          <div className="pt-3 border-t border-border/30 flex flex-wrap items-center justify-between gap-3 text-[10px] text-muted-foreground/60 italic">
            <div className="flex items-center gap-1.5">
              <Database className="w-3 h-3" />
              <span>Snapshot: <span className="font-mono text-foreground/70">{snapshotId}</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>Verified: {new Date(resolvedTimestamp).toLocaleString()}</span>
            </div>
            {runId ? (
              <div className="flex items-center gap-1.5">
                <Database className="w-3 h-3" />
                <span>Run: <span className="font-mono text-foreground/70">{runId}</span></span>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
