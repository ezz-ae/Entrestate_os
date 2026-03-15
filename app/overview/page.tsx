import Link from "next/link"
import {
  Sparkles,
  Building2,
  Map as MapIcon,
  Users2,
  BarChart3,
  Activity,
  TrendingUp,
  ShieldCheck,
  CircleDot,
  ArrowUpRight,
  Zap,
  Target,
  Filter,
  Database,
  Bot,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { TrustBar } from "@/components/decision/trust-bar"
import { getHomepageContentSections, getMarketPulseSummary, getOutcomeIntentCounts } from "@/lib/frontend-content"
import { formatAed } from "@/components/decision/formatters"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

const INTENT_FALLBACKS: Record<string, number> = {
  yield_seeking: 1510,
  golden_visa: 1055,
  capital_growth: 1177,
  first_time_buyer: 3887,
  trophy_asset: 483,
  conservative: 1806,
}

const INTENT_META: Record<string, { label: string; description: string }> = {
  yield_seeking:    { label: "Yield Seeking",      description: "Rental income focus, 6%+ target" },
  golden_visa:      { label: "Golden Visa",         description: "AED 2M+ eligible inventory" },
  capital_growth:   { label: "Capital Growth",      description: "Price appreciation potential" },
  first_time_buyer: { label: "First-Time Buyer",    description: "Entry-point projects, <AED 1.5M" },
  trophy_asset:     { label: "Trophy Asset",        description: "Landmark & luxury positioning" },
  conservative:     { label: "Conservative",        description: "Grade A, low-stress, long hold" },
}

const NAV_MODULES = [
  { label: "AI Chat", description: "Get scored answers instantly", href: "/chat", icon: Sparkles, accent: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200/60 dark:border-blue-500/20", tag: "Decision engine" },
  { label: "AI Scientist", description: "Advanced data modeling & EDA", href: "/workspace/data-scientist", icon: Database, accent: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-500/10", border: "border-cyan-200/60 dark:border-cyan-500/20", tag: "Analysis" },
  { label: "Agent Builder", description: "Design automated execution agents", href: "/apps/agent-builder", icon: Bot, accent: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10", border: "border-rose-200/60 dark:border-rose-500/20", tag: "Automation" },
  { label: "Properties", description: "Every project, fully scored", href: "/properties", icon: Building2, accent: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10", border: "border-indigo-200/60 dark:border-indigo-500/20", tag: "Inventory" },
  { label: "Areas", description: "Yield & supply by location", href: "/areas", icon: MapIcon, accent: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-500/10", border: "border-teal-200/60 dark:border-teal-500/20", tag: "Geography" },
  { label: "Developers", description: "Reliability index & track record", href: "/developers", icon: Users2, accent: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-200/60 dark:border-violet-500/20", tag: "Counterparty" },
  { label: "Market Data", description: "Pulse, timing, stress, supply", href: "/top-data", icon: BarChart3, accent: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200/60 dark:border-amber-500/20", tag: "Intelligence" },
  { label: "System Status", description: "Data freshness & pipeline", href: "/status", icon: Activity, accent: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200/60 dark:border-emerald-500/20", tag: "Health" },
]

const QUICK_FILTERS = [
  { label: "BUY signal · Grade A", href: "/properties?timing=BUY&stress=A", color: "border-emerald-400/40 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/15" },
  { label: "High yield >6%", href: "/properties?yieldMin=6", color: "border-amber-400/40 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/15" },
  { label: "Golden Visa eligible", href: "/properties?intent=golden_visa", color: "border-violet-400/40 text-violet-700 bg-violet-50 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:hover:bg-violet-500/15" },
  { label: "Conservative · Grade A/B", href: "/properties?intent=conservative&stress=A", color: "border-blue-400/40 text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/15" },
  { label: "First-Time Buyer", href: "/properties?intent=first_time_buyer", color: "border-sky-400/40 text-sky-700 bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/15" },
]

function normalizeIntentKey(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_")
}

function marketSentiment(buyPct: number) {
  if (buyPct >= 38) return { label: "Bullish", sub: "Strong entry window", color: "border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400", dot: "bg-emerald-500" }
  if (buyPct >= 28) return { label: "Neutral", sub: "Selective opportunities", color: "border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400", dot: "bg-amber-500" }
  return { label: "Cautious", sub: "Hold & monitor phase", color: "border-red-400/40 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400", dot: "bg-red-400" }
}

function formatRelativeTime(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const h = Math.floor(diff / 3_600_000)
    if (h < 1) return "Updated just now"
    if (h < 24) return `Updated ${h}h ago`
    return `Updated ${Math.floor(h / 24)}d ago`
  } catch {
    return "Recently updated"
  }
}

function generateInsight(buyPct: number, avgYield: number | null, highConfidencePct: number, topIntent: string) {
  const parts: string[] = []
  parts.push(`${buyPct.toFixed(0)}% of inventory is BUY-rated`)
  if (avgYield !== null) parts.push(`avg yield ${avgYield.toFixed(1)}%`)
  if (highConfidencePct >= 8) parts.push(`${highConfidencePct.toFixed(0)}% verified HIGH confidence`)
  parts.push(`largest segment — ${INTENT_META[topIntent]?.label ?? topIntent}`)
  return parts.join(" · ")
}

export default async function OverviewPage() {
  const [homepage, pulse, intents] = await Promise.all([
    getHomepageContentSections().catch(() => ({ data_as_of: new Date().toISOString(), sections: [] })),
    getMarketPulseSummary().catch(() => ({
      data_as_of: new Date().toISOString(),
      summary: { total: 0, avg_price: null, avg_yield: null, buy_signals: 0, high_confidence: 0 },
    })),
    getOutcomeIntentCounts().catch(() => ({ data_as_of: new Date().toISOString(), rows: [] })),
  ])

  const totalProjects = pulse.summary.total || 1216
  const highConfidence = pulse.summary.high_confidence || 593
  const buySignals = pulse.summary.buy_signals || 2667
  const avgPrice = pulse.summary.avg_price
  const avgYield = pulse.summary.avg_yield
  const highConfidencePct = totalProjects > 0 ? (highConfidence / totalProjects) * 100 : 0
  const buyPct = totalProjects > 0 ? (buySignals / totalProjects) * 100 : 0

  const intentCountMap = new Map<string, number>()
  for (const row of intents.rows) {
    intentCountMap.set(normalizeIntentKey(row.intent), row.count)
  }

  const intentCards = Object.keys(INTENT_META).map((key) => ({
    key,
    ...INTENT_META[key],
    count: intentCountMap.get(key) ?? INTENT_FALLBACKS[key],
  })).sort((a, b) => b.count - a.count)

  const topIntent = intentCards[0]?.key ?? "first_time_buyer"
  const notBuy = Math.max(totalProjects - buySignals, 0)
  const holdEst = Math.round(notBuy * 0.45)
  const waitEst = notBuy - holdEst

  const timingBars = [
    { label: "BUY", count: buySignals, pct: buyPct, bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", desc: "Active entry window" },
    { label: "HOLD", count: holdEst, pct: totalProjects > 0 ? (holdEst / totalProjects) * 100 : 0, bar: "bg-amber-400", text: "text-amber-600 dark:text-amber-400", desc: "Monitor, not yet" },
    { label: "WAIT", count: waitEst, pct: totalProjects > 0 ? (waitEst / totalProjects) * 100 : 0, bar: "bg-red-400", text: "text-red-600 dark:text-red-400", desc: "Avoid current window" },
  ]

  const sentiment = marketSentiment(buyPct)
  const insightText = generateInsight(buyPct, avgYield, highConfidencePct, topIntent)
  const updatedLabel = formatRelativeTime(homepage.data_as_of)

  const kpis = [
    { label: "Total Projects", value: totalProjects.toLocaleString(), icon: Building2, iconClass: "text-primary", sub: "Active UAE inventory", href: "/properties" },
    { label: "BUY Signals", value: buySignals.toLocaleString(), icon: TrendingUp, iconClass: "text-emerald-600 dark:text-emerald-400", sub: `${buyPct.toFixed(0)}% of total inventory`, href: "/properties?timing=BUY" },
    { label: "HIGH Confidence", value: highConfidence.toLocaleString(), icon: ShieldCheck, iconClass: "text-blue-600 dark:text-blue-400", sub: `${highConfidencePct.toFixed(0)}% data verified`, href: "/properties" },
    { label: "Avg Asking Price", value: formatAed(avgPrice), icon: CircleDot, iconClass: "text-violet-600 dark:text-violet-400", sub: "L1 canonical pricing", href: "/properties" },
    { label: "Avg Gross Yield", value: typeof avgYield === "number" ? `${avgYield.toFixed(1)}%` : "—", icon: BarChart3, iconClass: "text-amber-600 dark:text-amber-400", sub: "Across all inventory", href: "/top-data" },
  ]

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-32">
        <header className="mb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">UAE Real Estate</p>
                <span className="text-muted-foreground/30">·</span>
                <p className="text-xs text-muted-foreground">{updatedLabel}</p>
              </div>
              <h1 className="mt-1.5 text-2xl font-bold text-foreground md:text-3xl tracking-tight">Decision Engine</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider ${sentiment.color} backdrop-blur-sm shadow-sm`}>
                <span className={`h-2 w-2 rounded-full ${sentiment.dot} animate-pulse`} />
                {sentiment.label}
              </span>
              <Button variant="intelligent" size="sm" asChild className="h-9 shadow-lg">
                <Link href="/chat">
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Ask AI
                </Link>
              </Button>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5">
            <Zap className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">{insightText}</p>
          </div>
        </header>

        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {kpis.map((kpi) => {
            const Icon = kpi.icon
            return (
              <Link key={kpi.label} href={kpi.href} className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)]">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
                  <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${kpi.iconClass}`} />
                </div>
                <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">{kpi.value}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{kpi.sub}</p>
              </Link>
            )
          })}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            <Filter className="h-3 w-3" />
            Quick filters
          </span>
          {QUICK_FILTERS.map((f) => (
            <Link key={f.label} href={f.href} className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${f.color}`}>{f.label}</Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <article className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Market Timing Signals</h2>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sentiment.color}`}>{sentiment.label}</span>
              </div>
              <p className="mb-4 text-[11px] text-muted-foreground">{totalProjects.toLocaleString()} projects scored</p>
              <div className="space-y-4">
                {timingBars.map((t) => (
                  <div key={t.label}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${t.text}`}>{t.label}</span>
                        <span className="text-[10px] text-muted-foreground">{t.desc}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold tabular-nums text-foreground">{t.count.toLocaleString()}</span>
                        <span className="ml-1 text-[10px] text-muted-foreground">({t.pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50">
                      <div className={`h-full rounded-full ${t.bar}`} style={{ width: `${t.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-border/60 pt-3">
                <Link href="/properties?timing=BUY" className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
                  View all BUY-rated projects <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </article>
            <article className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Data Quality</h2>
                <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">{highConfidencePct.toFixed(0)}% HIGH confidence</span>
              </div>
              <TrustBar verifiedRows={totalProjects} highConfidencePct={highConfidencePct} updatedAt={homepage.data_as_of} />
              <div className="mt-3 grid grid-cols-5 gap-0.5 overflow-hidden rounded-lg">
                {(["L1", "L2", "L3", "L4", "L5"] as const).map((layer, i) => (
                  <div key={layer} className="flex flex-col items-center py-2" style={{ background: `rgba(59,130,246,${0.18 - i * 0.03})` }}>
                    <span className="text-[9px] font-bold text-blue-700 dark:text-blue-300">{layer}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">Canonical → Derived → Dynamic → External → Raw</p>
            </article>
          </div>

          <div className="grid grid-cols-2 gap-3 content-start">
            {NAV_MODULES.map((mod) => {
              const Icon = mod.icon
              return (
                <Link key={mod.label} href={mod.href} className={`group flex flex-col justify-between rounded-2xl border ${mod.border} ${mod.bg} p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)]`}>
                  <div className="flex items-start justify-between">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${mod.border} bg-white/60 dark:bg-black/20`}>
                      <Icon className={`h-4 w-4 ${mod.accent}`} />
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="mt-6">
                    <span className={`mb-1 inline-block rounded-full border ${mod.border} px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider ${mod.accent} opacity-70`}>{mod.tag}</span>
                    <p className="text-sm font-semibold text-foreground">{mod.label}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{mod.description}</p>
                  </div>
                </Link>
              )
            })}
          </div>

          <article className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Investor Profiles</h2>
              <Target className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className="mb-4 text-[11px] text-muted-foreground">Browse inventory by investment goal</p>
            <div className="space-y-2">
              {intentCards.map((intent, i) => {
                const pct = totalProjects > 0 ? (intent.count / totalProjects) * 100 : 0
                const maxCount = intentCards[0].count
                const barPct = maxCount > 0 ? (intent.count / maxCount) * 100 : 0
                return (
                  <Link key={intent.key} href={`/properties?intent=${encodeURIComponent(intent.key)}`} className="group block rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 transition-all duration-200 hover:border-primary/40 hover:bg-primary/5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {i === 0 ? <span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">TOP</span> : null}
                          <span className="truncate text-xs font-semibold text-foreground">{intent.label}</span>
                        </div>
                        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{intent.description}</p>
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1">
                        <span className="text-sm font-bold tabular-nums text-foreground">{intent.count.toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted/60">
                      <div className="h-full rounded-full bg-primary/50 transition-all group-hover:bg-primary" style={{ width: `${barPct}%` }} />
                    </div>
                  </Link>
                )
              })}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
              <Link href="/properties" className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">Browse all projects <ArrowUpRight className="h-3 w-3" /></Link>
              <Link href="/chat" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><Sparkles className="h-3 w-3" />Open AI chat</Link>
            </div>
          </article>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/chat" className="group flex items-center justify-between rounded-2xl border border-primary/25 bg-primary/5 px-5 py-4 transition-all hover:bg-primary/10 hover:-translate-y-0.5">
            <div>
              <p className="text-sm font-semibold text-foreground">AI Decision Chat</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Shortlist projects · Compare areas · Review V1 stress signals</p>
            </div>
            <div className="ml-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md transition group-hover:scale-105">
              <Sparkles className="h-4 w-4" />
            </div>
          </Link>
          <Link href="/top-data" className="group flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.10)]">
            <div>
              <p className="text-sm font-semibold text-foreground">Market Intelligence Board</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Pulse · Timing · Stress · Area depth · Developer reliability</p>
            </div>
            <div className="ml-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 transition group-hover:bg-muted/70">
              <BarChart3 className="h-4 w-4 text-foreground" />
            </div>
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  )
}
