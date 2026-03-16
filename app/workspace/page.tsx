"use client"

import { useEffect, useMemo, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import Link from "next/link"
import {
  BarChart3,
  Search,
  Bookmark,
  GitCompare,
  Import,
  Calculator,
  ArrowRight,
  TrendingUp,
  ChevronRight,
  Activity,
  Bot,
  Database,
  Layers,
  ShieldCheck,
  Menu,
} from "lucide-react"
import type { MarketScoreCharts, MarketScoreSummary } from "@/lib/market-score/types"

const tools = [
  { icon: BarChart3, label: "Dashboards", description: "Layered market views", href: "/workspace/dashboards" },
  { icon: Database, label: "Market Research Desk", description: "Explore market signals and build briefs", href: "/workspace/data-scientist" },
  { icon: ShieldCheck, label: "Market Score", description: "Score validation and match checks", href: "/market-score" },
  { icon: TrendingUp, label: "Investor Match Desk", description: "Match client profiles to the right inventory", href: "/agent-runtime" },
  { icon: Layers, label: "Market Data Packs", description: "Data products and download packs", href: "/workspace/daas" },
  { icon: Bot, label: "Lead Flow Builder", description: "Set up client intake and routing flows", href: "/workspace/agent-creator" },
  { icon: Search, label: "Search", description: "City, area, project search", href: "/workspace/search" },
  { icon: Bookmark, label: "Saved Searches", description: "Your bookmarked queries", href: "/workspace/saved-searches" },
  { icon: GitCompare, label: "Comparisons", description: "Side-by-side scenarios", href: "/workspace/comparisons" },
  { icon: Import, label: "Data Sources", description: "Managed ingestion and governance", href: "/workspace/imports" },
  { icon: Calculator, label: "Math Tools", description: "Calculators and builders", href: "/workspace/math-tools" },
]

type DashboardResponse = {
  source: string
  overview: {
    total_projects: number
    portfolio_value: number
    avg_price: number | null
    avg_yield: number | null
    avg_appreciation: number | null
  }
  market_health: {
    undersupplied_pct: number | null
    high_confidence_pct: number | null
    avg_liquidity: number | null
  }
  top_areas_by_yield: Array<{ label: string; value: number | null }>
  alerts: string[]
}

function PulseChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const max = data.length ? Math.max(...data.map((item) => item.value)) : 1

  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((item) => (
        <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
          <div
            className="w-full bg-accent/30 rounded-t-sm hover:bg-accent/50 transition-colors"
            style={{ height: `${(item.value / max) * 100}%` }}
          />
          <span className="text-[10px] text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

const formatNumber = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return "—"
  return value.toLocaleString()
}

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "activity">("overview")
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false)
  const [scoreSummary, setScoreSummary] = useState<MarketScoreSummary | null>(null)
  const [scoreCharts, setScoreCharts] = useState<MarketScoreCharts | null>(null)
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [dataError, setDataError] = useState<string | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  const coreToolLabels = [
    "Market Research Desk",
    "Market Score",
    "Investor Match Desk",
    "Dashboards",
  ]
  const coreTools = tools.filter((tool) => coreToolLabels.includes(tool.label))
  const [featuredTool, ...primaryTools] = coreTools
  const supportTools = tools.filter((tool) => !coreToolLabels.includes(tool.label))

  const pulseData = useMemo(() => {
    if (!scoreCharts?.avgScoreByStatus?.length) return []
    return scoreCharts.avgScoreByStatus.slice(0, 6).map((item) => ({
      label: item.label,
      value: Number(item.avgScore.toFixed(1)),
    }))
  }, [scoreCharts])

  const topCities = useMemo(() => {
    if (!scoreCharts?.countByCity?.length) return []
    return scoreCharts.countByCity.slice(0, 4)
  }, [scoreCharts])

  const totalCityCount = useMemo(() => {
    if (!scoreCharts?.countByCity?.length) return 0
    return scoreCharts.countByCity.reduce((sum, row) => sum + row.count, 0)
  }, [scoreCharts])

  const activityItems = useMemo(() => {
    const items: Array<{ action: string; detail: string; time: string }> = []
    if (scoreSummary) {
      items.push({
        action: "Scoring update",
        detail: `${scoreSummary.totalAssets.toLocaleString()} assets scored · Avg ${scoreSummary.avgScore.toFixed(1)}`,
        time: "Live",
      })
    }
    if (dashboard) {
      items.push({
        action: "Portfolio coverage",
        detail: `${dashboard.overview.total_projects.toLocaleString()} projects tracked · Avg price AED ${formatNumber(
          dashboard.overview.avg_price,
        )}`,
        time: "Live",
      })
    }
    if (dashboard?.alerts?.length) {
      dashboard.alerts.slice(0, 3).forEach((alert) => {
        items.push({ action: "Market alert", detail: alert, time: "Signal" })
      })
    }
    return items
  }, [scoreSummary, dashboard])

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setDataLoading(true)
      setDataError(null)
      try {
        const [summaryRes, chartsRes, dashboardRes] = await Promise.all([
          fetch("/api/market-score/summary", { signal: controller.signal }),
          fetch("/api/market-score/charts", { signal: controller.signal }),
          fetch("/api/daas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product: "dashboard", params: {} }),
            signal: controller.signal,
          }),
        ])

        if (!summaryRes.ok || !chartsRes.ok || !dashboardRes.ok) {
          throw new Error("Live feed unavailable")
        }

        const [summaryData, chartsData, dashboardData] = await Promise.all([
          summaryRes.json(),
          chartsRes.json(),
          dashboardRes.json(),
        ])
        setScoreSummary(summaryData as MarketScoreSummary)
        setScoreCharts(chartsData as MarketScoreCharts)
        setDashboard((dashboardData as { result: DashboardResponse }).result)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        setDataError(error instanceof Error ? error.message : "Live feed unavailable")
      } finally {
        setDataLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [])

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="mx-auto w-full max-w-[1440px] px-6">
          {/* Header */}
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6 mb-12">
            <div className="max-w-xl">
              <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Investor Desk</p>
              <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight">
                Choose your next focus.
              </h1>
              <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                Keep it simple: start with the core workflows, then open advanced work only when you need it.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Sheet open={isWorkspaceMenuOpen} onOpenChange={setIsWorkspaceMenuOpen}>
                <SheetTrigger asChild>
                  <button className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary md:hidden">
                    <Menu className="h-4 w-4" />
                    Workspace menu
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[88vw] max-w-sm border-r border-border bg-background p-0">
                  <SheetHeader className="border-b border-border/70 px-5 py-4 text-left">
                    <SheetTitle>Workspace menu</SheetTitle>
                    <SheetDescription>
                      Jump between core desks, tools, and utilities on mobile.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex h-full flex-col overflow-y-auto px-4 pb-6">
                    <div className="pt-4">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Core workstations
                      </p>
                      <div className="space-y-2">
                        {coreTools.map((tool) => (
                          <SheetClose asChild key={tool.href}>
                            <Link
                              href={tool.href}
                              className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/70 px-3 py-3 transition-colors hover:bg-accent/40"
                            >
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                                <tool.icon className="h-5 w-5" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-medium text-foreground">{tool.label}</span>
                                <span className="mt-1 block text-xs text-muted-foreground">{tool.description}</span>
                              </span>
                            </Link>
                          </SheetClose>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        More tools
                      </p>
                      <div className="space-y-2">
                        {supportTools.map((tool) => (
                          <SheetClose asChild key={tool.href}>
                            <Link
                              href={tool.href}
                              className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-3 py-2.5 transition-colors hover:bg-secondary"
                            >
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                                <tool.icon className="h-4 w-4" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-medium text-foreground">{tool.label}</span>
                                <span className="block truncate text-xs text-muted-foreground">{tool.description}</span>
                              </span>
                            </Link>
                          </SheetClose>
                        ))}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "overview" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "activity" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                Activity
              </button>
            </div>
          </div>

          {activeTab === "overview" ? (
            <>
              <section className="rounded-2xl border border-border/70 bg-card/60 p-7 mb-10">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Start here</p>
                    <h2 className="text-xl font-semibold text-foreground">Core workstations</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                  {featuredTool && (
                    <Link
                      key={featuredTool.label}
                      href={featuredTool.href}
                      className="group md:col-span-2 xl:col-span-2 flex items-start gap-4 p-7 border border-primary/30 rounded-2xl bg-gradient-to-br from-primary/15 via-background/40 to-background/60 hover:border-primary/50 transition-colors"
                    >
                      <div className="p-3 bg-primary/20 rounded-md">
                        <featuredTool.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-foreground">{featuredTool.label}</h3>
                          <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{featuredTool.description}</p>
                        <p className="text-xs text-muted-foreground mt-3">
                          Best starting point for daily market work.
                        </p>
                      </div>
                    </Link>
                  )}
                  {primaryTools.map((tool) => (
                    <Link
                      key={tool.label}
                      href={tool.href}
                      className="group flex items-start gap-4 p-6 bg-background/40 border border-border rounded-xl hover:border-accent/40 transition-colors"
                    >
                      <div className="p-3 bg-secondary rounded-md">
                        <tool.icon className="w-5 h-5 text-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-foreground">{tool.label}</h3>
                          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="mb-12 grid grid-cols-1 xl:grid-cols-[0.7fr_1.3fr] gap-6">
                <div className="rounded-2xl border border-border/70 bg-card/70 p-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">More tools</p>
                  <h3 className="text-lg font-medium text-foreground mt-2">Deep dives & utilities</h3>
                  <p className="text-sm text-muted-foreground mt-3">
                    Use these when you need a specific output. Each workflow is focused and short.
                  </p>
                  <div className="mt-6 space-y-3 text-sm text-muted-foreground">
                    <p>• Quick searches for listings and inventory.</p>
                    <p>• Comparisons and saved decision notes.</p>
                    <p>• Data sources, math tools, and intake flows.</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/40 p-6">
                  <div className="divide-y divide-border/60">
                    {supportTools.map((tool) => (
                      <Link
                        key={tool.label}
                        href={tool.href}
                        className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                      >
                        <div className="p-2.5 bg-secondary rounded-md">
                          <tool.icon className="w-5 h-5 text-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-foreground">{tool.label}</h3>
                            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-6">
                <div className="p-7 md:p-8 bg-gradient-to-br from-card via-card to-secondary/40 border border-border rounded-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-medium text-foreground">Market signal pulse</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">Average score by delivery band</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-accent" />
                      <span className="text-sm font-mono text-foreground">
                        {scoreSummary?.totalAssets?.toLocaleString() ?? "—"}
                      </span>
                    </div>
                  </div>
                  {dataLoading && !pulseData.length ? (
                    <p className="text-sm text-muted-foreground">Loading market pulse...</p>
                  ) : pulseData.length > 0 ? (
                    <PulseChart data={pulseData} />
                  ) : (
                    <p className="text-sm text-muted-foreground">{dataError ?? "Pulse data not available yet."}</p>
                  )}
                </div>

                <div className="p-7 md:p-8 bg-card/90 border border-border rounded-2xl">
                  <h3 className="font-medium text-foreground mb-1">Market snapshot</h3>
                  <p className="text-xs text-muted-foreground mb-6">Top cities by inventory coverage</p>
                  {dataLoading && topCities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Loading city coverage...</p>
                  ) : topCities.length > 0 ? (
                    <div className="space-y-4">
                      {topCities.map((city) => {
                        const share = totalCityCount ? (city.count / totalCityCount) * 100 : 0
                        return (
                          <div
                            key={city.label}
                            className="flex items-center justify-between py-2 border-b border-border last:border-0"
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground">{city.label}</p>
                              <p className="text-xs text-muted-foreground">
                                {city.count.toLocaleString()} assets · {share.toFixed(1)}% share
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <TrendingUp className="w-4 h-4 text-emerald-500/70" />
                              Live
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{dataError ?? "City coverage not available yet."}</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Activity Tab */
            <div className="max-w-2xl">
              <div className="border border-border rounded-lg overflow-hidden">
                {dataLoading ? (
                  <div className="px-6 py-6 text-sm text-muted-foreground">Loading live feed…</div>
                ) : activityItems.length > 0 ? (
                  activityItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-4 px-6 py-4 border-b border-border last:border-0">
                      <div className="w-2 h-2 mt-2 rounded-full bg-accent flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">{item.action}</p>
                          <span className="text-xs text-muted-foreground">{item.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{item.detail}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-6 text-sm text-muted-foreground">
                    {dataError ?? "No live updates available yet."}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  )
}
