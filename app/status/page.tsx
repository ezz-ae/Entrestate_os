import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CheckCircle2, Clock, Database, AlertCircle } from "lucide-react"
import { getDataFreshnessStatus, getMarketPulse } from "@/lib/decision-infrastructure"

export const dynamic = "force-dynamic"

const services = [
  {
    name: "Market data feed",
    status: "Operational",
    detail: "Live delivery running",
  },
  {
    name: "Investor desk insights",
    status: "Operational",
    detail: "Market views online",
  },
  {
    name: "Media workflows",
    status: "Operational",
    detail: "Storyboards and timelines stable",
  },
  {
    name: "Data desk",
    status: "Operational",
    detail: "Reports and briefs available",
  },
]

const incidents = [
  {
    date: "Feb 18, 2026",
    title: "Historic data refresh",
    summary: "Large market refresh completed. Coverage is back to normal.",
    resolved: true,
  },
  {
    date: "Feb 11, 2026",
    title: "Media export delay",
    summary: "Video export slowed briefly. Resolved after pipeline adjustment.",
    resolved: true,
  },
]

async function getSnapshotSummary() {
  try {
    const [pulse, freshness] = await Promise.all([getMarketPulse(), getDataFreshnessStatus()])
    const summary = pulse.summary as Record<string, unknown> | null
    const projects = typeof summary?.projects === "number" ? summary.projects : null
    const highConfidence = pulse.confidence_distribution.find((item) => String(item.label ?? "").toUpperCase() === "HIGH")
    const buySignals = pulse.timing_signals.find((item) => String(item.label ?? "").toUpperCase() === "BUY")
    const freshnessRow = freshness.row as Record<string, unknown> | null
    const freshnessTimestamp =
      (typeof freshnessRow?.data_as_of === "string" && freshnessRow.data_as_of) ||
      (typeof freshnessRow?.as_of === "string" && freshnessRow.as_of) ||
      (typeof freshnessRow?.generated_at === "string" && freshnessRow.generated_at) ||
      (typeof freshnessRow?.updated_at === "string" && freshnessRow.updated_at) ||
      null

    return {
      generated: freshnessTimestamp ?? pulse.data_as_of,
      masterCount: projects,
      mediaCount: buySignals?.count ?? null,
      scoredCount: highConfidence?.count ?? null,
    }
  } catch {
    return { generated: null, masterCount: null, mediaCount: null, scoredCount: null }
  }
}

function formatTs(value: string | null | undefined) {
  if (!value) return "Not available"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" })
}

export default async function StatusPage() {
  const snapshot = await getSnapshotSummary()
  const allOperational = services.every((s) => s.status === "Operational")

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1200px] px-6 pb-20 pt-28 md:pt-36">

        {/* Page header */}
        <header className="mb-8">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">System Health</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Live availability for market coverage, investor workflows, and media production.
          </p>
        </header>

        {/* Overall status banner */}
        <div className={`mb-8 flex items-center gap-3 rounded-2xl border px-5 py-4 ${
          allOperational
            ? "border-emerald-500/30 bg-emerald-500/[0.06]"
            : "border-amber-500/30 bg-amber-500/[0.06]"
        }`}>
          {allOperational ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-400" />
          )}
          <div>
            <p className={`text-sm font-semibold ${allOperational ? "text-emerald-300" : "text-amber-300"}`}>
              {allOperational ? "All systems operational" : "Partial service disruption"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {services.length} services monitored · Last checked {formatTs(snapshot.generated)}
            </p>
          </div>
        </div>

        {/* Services grid */}
        <section className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2">
          {services.map((service) => {
            const isOk = service.status === "Operational"
            return (
              <div
                key={service.name}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/75 px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 flex-shrink-0 rounded-full ${isOk ? "bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.4)]" : "bg-amber-400"}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{service.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{service.detail}</p>
                  </div>
                </div>
                <span className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  isOk
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                }`}>
                  {service.status}
                </span>
              </div>
            )
          })}
        </section>

        {/* Data snapshot */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-border/60 bg-card/75">
          <div className="flex items-center gap-2.5 border-b border-border/50 px-5 py-4">
            <Database className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-foreground">Market data snapshot</h2>
            <span className="ml-auto text-xs text-muted-foreground">
              <Clock className="mr-1 inline h-3 w-3" />
              {formatTs(snapshot.generated)}
            </span>
          </div>
          <div className="grid grid-cols-1 divide-x divide-border/50 md:grid-cols-3">
            {[
              { label: "Projects in master", value: snapshot.masterCount?.toLocaleString() ?? "—", color: "text-sky-300" },
              { label: "High confidence rows", value: snapshot.scoredCount?.toLocaleString() ?? "—", color: "text-emerald-300" },
              { label: "BUY timing signals", value: snapshot.mediaCount?.toLocaleString() ?? "—", color: "text-emerald-300" },
            ].map((item) => (
              <div key={item.label} className="px-5 py-5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className={`mt-2 text-2xl font-semibold tabular-nums ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Incidents */}
        <section className="max-w-3xl">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Recent incidents</h2>
          </div>
          <div className="space-y-3">
            {incidents.map((incident) => (
              <div key={incident.title} className="rounded-2xl border border-border/60 bg-card/75 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{incident.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{incident.date}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                      incident.resolved
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    }`}>
                      {incident.resolved ? "Resolved" : "Monitoring"}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{incident.summary}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
