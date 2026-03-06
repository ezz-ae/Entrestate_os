import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CheckCircle2, AlertTriangle, Clock, Database } from "lucide-react"
import { getMarketPulse } from "@/lib/decision-infrastructure"

const services = [
  {
    name: "Market data feed",
    status: "Operational",
    detail: "Live delivery running",
    icon: CheckCircle2,
  },
  {
    name: "Investor desk insights",
    status: "Operational",
    detail: "Market views online",
    icon: CheckCircle2,
  },
  {
    name: "Media workflows",
    status: "Operational",
    detail: "Storyboards and timelines stable",
    icon: CheckCircle2,
  },
  {
    name: "Data desk",
    status: "Operational",
    detail: "Reports and briefs available",
    icon: CheckCircle2,
  },
]

const incidents = [
  {
    date: "Feb 18, 2026",
    title: "Historic data refresh",
    summary: "Large market refresh completed. Coverage is back to normal.",
    status: "Monitoring",
  },
  {
    date: "Feb 11, 2026",
    title: "Media export delay",
    summary: "Video export slowed briefly. Resolved after pipeline adjustment.",
    status: "Resolved",
  },
]

async function getSnapshotSummary() {
  const pulse = await getMarketPulse()
  const summary = pulse.summary as Record<string, unknown> | null
  const projects = typeof summary?.projects === "number" ? summary.projects : null
  const highConfidence = pulse.confidence_distribution.find((item) => String(item.label ?? "").toUpperCase() === "HIGH")
  const buySignals = pulse.timing_signals.find((item) => String(item.label ?? "").toUpperCase() === "BUY")

  return {
    generated: pulse.data_as_of,
    masterCount: projects,
    mediaCount: highConfidence?.count ?? null,
    scoredCount: buySignals?.count ?? null,
  }
}

export default async function StatusPage() {
  const snapshot = await getSnapshotSummary()
  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Status</p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance">
              Entrestate market health
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Live availability for market coverage, investor workflows, and media production.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {services.map((service) => (
              <div key={service.name} className="p-6 bg-card border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{service.name}</p>
                    <p className="text-lg font-medium text-foreground mt-1">{service.status}</p>
                  </div>
                  <service.icon className="w-5 h-5 text-accent" />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{service.detail}</p>
              </div>
            ))}
          </div>

          <div className="mb-12 rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-accent" />
              <h2 className="text-lg font-medium text-foreground">Market data snapshot</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-border/60 bg-secondary/30 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Projects in master</p>
                <p className="text-xl font-semibold text-foreground mt-2">
                  {snapshot?.masterCount?.toLocaleString() ?? "—"}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-secondary/30 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">High confidence rows</p>
                  <p className="text-xl font-semibold text-foreground mt-2">
                    {snapshot?.scoredCount?.toLocaleString() ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-secondary/30 p-4">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">BUY timing signals</p>
                  <p className="text-xl font-semibold text-foreground mt-2">
                    {snapshot?.mediaCount?.toLocaleString() ?? "—"}
                  </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Latest snapshot: {snapshot?.generated ?? "Not available yet"}
            </p>
          </div>

          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-accent" />
              <h2 className="text-lg font-medium text-foreground">Recent incidents</h2>
            </div>
            <div className="space-y-4">
              {incidents.map((incident) => (
                <div key={incident.title} className="p-5 border border-border rounded-lg bg-secondary/30">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{incident.title}</p>
                    <span className="text-xs text-muted-foreground">{incident.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{incident.summary}</p>
                  <span className="inline-flex items-center px-2 py-0.5 mt-3 rounded-full text-xs bg-primary/10 text-primary">
                    {incident.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
