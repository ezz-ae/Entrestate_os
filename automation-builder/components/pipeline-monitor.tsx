"use client"

import React from "react"
import { Activity, ShieldCheck, Database, Zap, ArrowUpRight, ArrowDownRight, CheckCircle2 } from "lucide-react"

const PIPELINES = [
  { id: "1", name: "DLD Transaction Sync", type: "Ingestion", throughput: "1.2k/min", latency: "420ms", health: 98 },
  { id: "2", name: "Yield Recalculation", type: "Enrichment", throughput: "450/min", latency: "1.2s", health: 85 },
  { id: "3", name: "Developer Stress Grade", type: "Scoring", throughput: "200/min", latency: "2.5s", health: 99 },
  { id: "4", name: "L1 Canonical Validator", type: "Governance", throughput: "5.0k/min", latency: "80ms", health: 100 },
]

export function PipelineMonitor() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Data Pipeline Monitor</h2>
          <p className="text-sm text-muted-foreground">Live health and throughput metrics for the Enterprise data spine.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-500 uppercase border border-emerald-500/20">
          <Activity className="h-3.5 w-3.5 animate-pulse" />
          System Optimal
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PIPELINES.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30">
            <div className="flex items-start justify-between mb-4">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                 {p.type === "Ingestion" && <Database className="h-4 w-4" />}
                 {p.type === "Enrichment" && <Zap className="h-4 w-4" />}
                 {p.type === "Scoring" && <ShieldCheck className="h-4 w-4" />}
                 {p.type === "Governance" && <Activity className="h-4 w-4" />}
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                {p.health}% Health
              </div>
            </div>
            <h3 className="font-semibold text-sm mb-1">{p.name}</h3>
            <p className="text-xs text-muted-foreground mb-4">{p.type} Layer</p>

            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="text-muted-foreground">Throughput</p>
                <div className="flex items-center gap-1 text-foreground font-medium mt-0.5">
                   <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                   {p.throughput}
                </div>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">Latency</p>
                <div className="flex items-center gap-1 text-foreground font-medium mt-0.5 justify-end">
                   <ArrowDownRight className="h-3 w-3 text-blue-500" />
                   {p.latency}
                </div>
              </div>
            </div>

            <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
               <div className={`h-full rounded-full ${p.health > 90 ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${p.health}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-slate-900/40 p-6 backdrop-blur">
         <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <h3 className="font-semibold">{isArabic ? "سجل الأحداث الأخيرة" : "Recent Events"}</h3>
         </div>
         <div className="space-y-4">
            {[
              "L1 Canonical batch 8122 processed successfully",
              "Yield Recalculation trigger: Area 'Dubai South' price update",
              "Inventory spine re-indexed (2.8k projects active)",
              "API Gateway: 5,420 requests in last 10 mins (Tier-Gated)",
            ].map((event, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <p className="text-xs text-slate-400">{event}</p>
                <span className="text-[10px] font-mono text-slate-600">2m ago</span>
              </div>
            ))}
         </div>
      </div>
    </div>
  )
}

const isArabic = false; // Add real locale logic if needed
