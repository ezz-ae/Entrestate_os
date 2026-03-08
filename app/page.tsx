import type { Metadata } from "next"
import Link from "next/link"
import {
  Sparkles,
  ArrowRight,
  Building2,
  Map,
  Users2,
  ShieldCheck,
  TrendingUp,
  FileText,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/homepage/hero-section"
import { DecisionTunnelStepper } from "@/components/homepage/decision-tunnel-stepper"
import { getMarketPulseSummary } from "@/lib/frontend-content"
import { SEO, absoluteUrl } from "@/lib/seo"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "UAE Real Estate Decision Intelligence",
  description:
    "Analyze UAE property markets with evidence-backed scoring, developer reliability signals, and investor-grade decision workflows.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SEO.defaultTitle,
    description:
      "Analyze UAE property markets with evidence-backed scoring, developer reliability signals, and investor-grade decision workflows.",
    url: "/",
    images: [absoluteUrl(SEO.defaultOgImagePath)],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO.defaultTitle,
    description:
      "Analyze UAE property markets with evidence-backed scoring, developer reliability signals, and investor-grade decision workflows.",
    images: [absoluteUrl(SEO.defaultOgImagePath)],
  },
}


const SURFACES = [
  {
    icon: Sparkles,
    label: "AI Decision Chat",
    description: "Describe your budget, goal, and constraints. Get a scored shortlist with clear reasoning — not listings.",
    href: "/chat",
    cta: "Start analysis",
    accent: "text-blue-400",
    bg: "bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40",
  },
  {
    icon: Building2,
    label: "Project Inventory",
    description: "Every active UAE project, fully scored. Filter by BUY/HOLD/WAIT signal, stress grade, yield, and area.",
    href: "/properties",
    cta: "Browse projects",
    accent: "text-indigo-400",
    bg: "bg-indigo-500/5 border-indigo-500/20 hover:border-indigo-500/40",
  },
  {
    icon: Map,
    label: "Area Intelligence",
    description: "Yield averages, supply pressure, pricing depth, and top projects across every UAE neighbourhood.",
    href: "/areas",
    cta: "Explore areas",
    accent: "text-teal-400",
    bg: "bg-teal-500/5 border-teal-500/20 hover:border-teal-500/40",
  },
  {
    icon: Users2,
    label: "Developer Reliability",
    description: "Delivery consistency, stress-grade distribution, and track record across every active developer.",
    href: "/developers",
    cta: "View developers",
    accent: "text-violet-400",
    bg: "bg-violet-500/5 border-violet-500/20 hover:border-violet-500/40",
  },
  {
    icon: TrendingUp,
    label: "Market Intelligence",
    description: "Live timing signals, affordability tiers, area rankings, and developer reliability in one board.",
    href: "/top-data",
    cta: "View signals",
    accent: "text-amber-400",
    bg: "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40",
  },
  {
    icon: FileText,
    label: "Research Library",
    description: "Long-form market deep-dives, area studies, and developer analyses — structured for decision-making.",
    href: "/reports/library",
    cta: "Read reports",
    accent: "text-rose-400",
    bg: "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/40",
  },
]

const WHO_FOR = [
  {
    audience: "Investors",
    description: "You need to know if the entry point is right, if the developer delivers, and whether the yield is real — before committing capital.",
  },
  {
    audience: "Advisors & Analysts",
    description: "You need structured evidence you can stand behind in a client meeting. Not a PDF brochure. An auditable decision object.",
  },
  {
    audience: "Institutions",
    description: "You need portfolio-level scoring, stress resilience at scale, and a data layer that can integrate with your internal workflows.",
  },
]

const structuredDataObj = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: SEO.siteName,
      url: absoluteUrl("/"),
      logo: absoluteUrl("/icon.svg"),
    },
    {
      "@type": "WebSite",
      name: SEO.siteName,
      url: absoluteUrl("/"),
      potentialAction: {
        "@type": "SearchAction",
        target: `${absoluteUrl("/search")}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
}

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredDataObj) }}
      />
      <Navbar />

      <div className="mx-auto max-w-[1100px] px-6 pb-28 pt-32 md:pt-44">

        {/* ── Hero ── */}
        <HeroSection
          totalProjects={totalProjects}
          buySignals={buySignals}
          avgPrice={avgPrice}
          avgYield={avgYield}
        />

        {/* ── Decision tunnel ── */}
        <section className="mt-20">
          <div className="mb-8 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">How it works</p>
            <h2 className="mt-2 font-serif text-2xl font-medium text-foreground md:text-3xl">
              The 4-stage decision tunnel
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
              Every signal passes through a structured pipeline. No raw listing data goes directly to a decision.
            </p>
          </div>
          <DecisionTunnelStepper />
        </section>

        {/* ── Intelligence surfaces ── */}
        <section className="mt-20">
          <div className="mb-8 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">The platform</p>
            <h2 className="mt-2 font-serif text-2xl font-medium text-foreground md:text-3xl">
              Six intelligence surfaces
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
              Each surface is a different entry point into the same underlying scored dataset.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {SURFACES.map((s) => {
              const Icon = s.icon
              return (
                <Link
                  key={s.label}
                  href={s.href}
                  className={`group flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/20 ${s.bg}`}
                >
                  <div>
                    <Icon className={`h-5 w-5 ${s.accent}`} />
                    <p className="mt-3 text-sm font-semibold text-foreground">{s.label}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.description}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                    {s.cta}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── Who it's for ── */}
        <section className="mt-20">
          <div className="mb-8 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">Who this is for</p>
            <h2 className="mt-2 font-serif text-2xl font-medium text-foreground md:text-3xl">
              Built for people who make real decisions
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {WHO_FOR.map((w) => (
              <div key={w.audience} className="rounded-2xl border border-border/60 bg-card/50 px-6 py-5">
                <p className="text-sm font-semibold text-foreground">{w.audience}</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{w.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Evidence trust bar ── */}
        <section className="mt-12 rounded-2xl border border-border bg-card px-6 py-5">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <ShieldCheck className="h-8 w-8 shrink-0 text-primary/60" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">5-Layer Evidence Stack — you always know how reliable a number is</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  { tag: "L1 Canonical", color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400" },
                  { tag: "L2 Derived", color: "border-blue-500/40 bg-blue-500/10 text-blue-400" },
                  { tag: "L3 Dynamic", color: "border-amber-500/40 bg-amber-500/10 text-amber-400" },
                  { tag: "L4 External", color: "border-orange-500/40 bg-orange-500/10 text-orange-400" },
                  { tag: "L5 Raw", color: "border-red-500/40 bg-red-500/10 text-red-400" },
                ].map((l) => (
                  <span key={l.tag} className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${l.color}`}>
                    {l.tag}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Raw external data never drives a decision directly. Every metric is adjudicated through the pipeline before reaching L1 Canonical status.
              </p>
            </div>
            <div className="shrink-0">
              <Link
                href="/docs/data-information"
                className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-primary hover:underline"
              >
                How data works <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>

      </div>
      <Footer />
    </main>
  )
}
