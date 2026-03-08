import Link from "next/link"
import { Sparkles, ArrowRight, Building2, Map, Users2, BarChart3, ShieldCheck } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getMarketPulseSummary } from "@/lib/frontend-content"
import { formatAed } from "@/components/decision/formatters"

export const dynamic = "force-dynamic"

const SURFACES = [
  {
    icon: Sparkles,
    label: "AI Decision Chat",
    description: "Describe your budget, goal, and constraints. Get a shortlist of scored projects with clear reasoning — not listings.",
    href: "/chat",
    cta: "Start analysis",
    accent: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200/60 dark:border-blue-500/20",
  },
  {
    icon: Building2,
    label: "Project Inventory",
    description: "Every UAE project, fully scored. Filter by timing signal, stress grade, yield, and area. No noise.",
    href: "/properties",
    cta: "Browse projects",
    accent: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-200/60 dark:border-indigo-500/20",
  },
  {
    icon: Map,
    label: "Area Intelligence",
    description: "Yield averages, supply pressure, pricing depth, and top projects by neighbourhood.",
    href: "/areas",
    cta: "Explore areas",
    accent: "text-teal-600 dark:text-teal-400",
    border: "border-teal-200/60 dark:border-teal-500/20",
  },
  {
    icon: Users2,
    label: "Developer Reliability",
    description: "Track records, delivery consistency, and stress-grade distribution across every active developer.",
    href: "/developers",
    cta: "View developers",
    accent: "text-violet-600 dark:text-violet-400",
    border: "border-violet-200/60 dark:border-violet-500/20",
  },
]

export default async function HomePage() {
  const pulse = await getMarketPulseSummary().catch(() => ({
    data_as_of: new Date().toISOString(),
    summary: { total: 7015, avg_price: null, avg_yield: null, buy_signals: 2667, high_confidence: 593 },
  }))

  const totalProjects = pulse.summary.total || 7015
  const buySignals = pulse.summary.buy_signals || 2667
  const avgYield = pulse.summary.avg_yield
  const avgPrice = pulse.summary.avg_price

  return (
    <main id="main-content">
      <Navbar />

      <div className="mx-auto max-w-[1100px] px-6 pb-24 pt-32 md:pt-44">

        {/* Hero */}
        <section className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">UAE Property Intelligence</p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Real estate decisions,<br />
            <span className="text-primary">backed by data.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
            Not a listing portal. A decision engine — every project scored for timing, stress resilience, yield, and data confidence.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/overview"
              className="hidden md:flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-lg"
            >
              Open Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/chat"
              className="flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              Open AI Chat
            </Link>
          </div>
        </section>

        {/* Stats strip */}
        <section className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Projects Scored", value: totalProjects.toLocaleString(), sub: "Active UAE inventory", highlight: false },
            { label: "BUY Signals", value: buySignals.toLocaleString(), sub: `${((buySignals / totalProjects) * 100).toFixed(0)}% of total`, highlight: true },
            { label: "Avg Asking Price", value: formatAed(avgPrice), sub: "L1 canonical", highlight: false },
            { label: "Avg Gross Yield", value: typeof avgYield === "number" ? `${avgYield.toFixed(1)}%` : "—", sub: "Across all inventory", highlight: false },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border bg-card px-5 py-4 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <p className={`mt-2 text-2xl font-bold tabular-nums ${stat.highlight ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                {stat.value}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{stat.sub}</p>
            </div>
          ))}
        </section>

        {/* Four surfaces */}
        <section className="mt-12">
          <p className="mb-5 text-center text-xs uppercase tracking-widest text-muted-foreground">What you can do</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {SURFACES.map((s) => {
              const Icon = s.icon
              return (
                <Link
                  key={s.label}
                  href={s.href}
                  className={`group flex flex-col justify-between rounded-2xl border ${s.border} bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.35)]`}
                >
                  <div>
                    <Icon className={`h-6 w-6 ${s.accent}`} />
                    <p className="mt-4 text-base font-semibold text-foreground">{s.label}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
                  </div>
                  <div className="mt-5 flex items-center gap-1.5 text-sm font-medium text-primary">
                    {s.cta}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Data trust note */}
        <section className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-5 text-center md:flex-row md:text-left">
          <ShieldCheck className="h-8 w-8 flex-shrink-0 text-primary/60" />
          <div>
            <p className="text-sm font-semibold text-foreground">5-Layer Evidence Stack</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Every data point is tagged L1 Canonical → L2 Derived → L3 Dynamic → L4 External → L5 Raw.
              You always know how reliable a number is before acting on it.
            </p>
          </div>
          <div className="flex-shrink-0 md:ml-auto">
            <Link href="/overview" className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-primary hover:underline">
              See live data <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </section>

      </div>
      <Footer />
    </main>
  )
}
