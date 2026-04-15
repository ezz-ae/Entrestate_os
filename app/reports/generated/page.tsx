"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { FileText, PenLine, CheckCircle2, Loader2, Download } from "lucide-react"

type Report = {
  id: string
  title: string
  createdAt: string
  payload: Record<string, unknown>
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => (res.ok ? res.json() : { reports: [] }))
      .then((data) => setReports(data.reports ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <header className="mb-8">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Reports</p>
            <h1 className="mt-3 text-3xl md:text-5xl font-serif text-foreground">Publish the decision trail.</h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-2xl">
              Reports are structured outputs built from Time Tables, notes, and verified evidence.
            </p>
          </header>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reports.length === 0 ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-dashed border-border/70 bg-card/30 p-12 text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No reports generated yet.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use the terminal to generate investor memos, strategic reports, or underwriting briefs.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: "Ready Templates", detail: "Underwriting, area comparisons, and SPA briefs.", icon: FileText },
                  { title: "Report Builder", detail: "Combine tables, notes, and charts into one output.", icon: PenLine },
                  { title: "Review Checklist", detail: "Evidence drawer, assumptions, and approval steps.", icon: CheckCircle2 },
                ].map((card) => (
                  <div key={card.title} className="rounded-2xl border border-border/70 bg-card/70 p-6">
                    <card.icon className="h-5 w-5 text-accent" />
                    <h2 className="mt-4 text-lg font-semibold text-foreground">{card.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{card.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/70 p-5"
                >
                  <div>
                    <h3 className="text-sm font-medium text-foreground">{report.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Generated {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground">
                    <Download className="h-3.5 w-3.5" /> Export
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  )
}
