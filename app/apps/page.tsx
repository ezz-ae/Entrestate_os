import type { Metadata } from "next"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ExplainWithChat } from "@/components/explain-with-chat"
import {
  ArrowRight,
  Workflow,
  PhoneCall,
  MessageCircle,
  BookOpen,
  Clapperboard,
  Clock,
  Image,
  Sparkles,
  Plus,
  Shield,
  FileText,
  FolderSearch,
  PieChart,
  Gauge,
  ClipboardCheck,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Apps - Entrestate",
  description:
    "Launch focused real estate workflows for marketing, client intake, market research, and execution.",
}

const apps = [
  {
    title: "Storyboard Builder",
    description: "Turn project media into a cinematic storyboard in minutes.",
    flipLine: "Auto-assemble a launch story with ready-to-share panels.",
    href: "/storyboard",
    learnHref: "/apps/docs/storyboard-builder",
    icon: Clapperboard,
    tag: "Media",
    highlight: "Best for: launch storyboards",
    cta: "Build storyboard",
  },
  {
    title: "Launch Timeline",
    description: "Build a timed media sequence for project launches and ads.",
    flipLine: "Map scenes, transitions, and delivery timing in one flow.",
    href: "/timeline",
    learnHref: "/apps/docs/launch-timeline",
    icon: Clock,
    tag: "Media",
    highlight: "Best for: campaign timelines",
    cta: "Plan the launch",
  },
  {
    title: "Image Studio",
    description: "Create listing-ready visuals from your project media library.",
    flipLine: "Refine visuals, formats, and variants for every channel.",
    href: "/image-playground",
    learnHref: "/apps/docs/image-playground",
    icon: Image,
    tag: "Media",
    highlight: "Best for: listing visuals",
    cta: "Open image studio",
  },
  {
    title: "Client Intake Builder",
    description: "Build client intake flows with a guided setup and clear business rules.",
    flipLine: "Launch a client-ready intake flow with clear qualification stages.",
    href: "/apps/agent-builder",
    learnHref: "/apps/docs/agent-first-builder",
    icon: Workflow,
    tag: "Client Desk",
    highlight: "Best for: qualification + matching",
    cta: "Open intake builder",
  },
  {
    title: "Cold Calling",
    description: "Run outbound calling with scripts, lead queues, and outcome logging.",
    flipLine: "Keep calling sessions structured, tracked, and report-ready.",
    href: "/apps/coldcalling",
    learnHref: "/apps/docs/cold-calling",
    icon: PhoneCall,
    tag: "Sales",
    highlight: "Best for: outbound pipelines",
    cta: "Open call desk",
  },
  {
    title: "Insta DM Lead Desk",
    description: "Qualify real estate leads inside Instagram DMs, sites, QR codes, and landing pages.",
    flipLine: "Turn inbound messages into qualified leads with clear next steps.",
    href: "/apps/lead-agent",
    learnHref: "/apps/docs/insta-dm-lead-agent",
    icon: MessageCircle,
    tag: "Lead Desk",
    highlight: "Best for: inbound capture",
    cta: "Open lead desk",
  },
  {
    title: "Deal Screener",
    description: "Rank projects by god metric, stress, timing, and affordability.",
    flipLine: "Deterministic filtering on inventory_full with evidence-ready results.",
    href: "/market-score",
    learnHref: "/docs",
    icon: FolderSearch,
    tag: "Investment Desk",
    highlight: "Best for: sourcing candidates",
    cta: "Open screener",
  },
  {
    title: "Golden Visa Qualifier",
    description: "Identify high-confidence AED 2M+ candidates for visa pathways.",
    flipLine: "Filter by area, developer, stress grade, and timing signal.",
    href: "/golden-visa",
    learnHref: "/docs",
    icon: Shield,
    tag: "Investment Desk",
    highlight: "Best for: visa workflows",
    cta: "Open qualifier",
  },
  {
    title: "Stress Test Engine",
    description: "Review stress grade and resilience scenarios across projects.",
    flipLine: "Surface downside survivability before commitment.",
    href: "/tools/stress-test",
    learnHref: "/docs",
    icon: Gauge,
    tag: "Investment Desk",
    highlight: "Best for: risk controls",
    cta: "Run stress tests",
  },
  {
    title: "Investor Memo Generator",
    description: "Generate institutional-grade due diligence memos.",
    flipLine: "Combine price reality, area risk, developer DD, and stress tests.",
    href: "/tools/memo",
    learnHref: "/docs",
    icon: FileText,
    tag: "Investment Desk",
    highlight: "Best for: IC-ready memos",
    cta: "Generate memo",
  },
  {
    title: "Evidence Drawer",
    description: "Inspect sources, exclusions, assumptions, and confidence.",
    flipLine: "Verify every claim before making a decision.",
    href: "/tools/evidence",
    learnHref: "/docs",
    icon: ClipboardCheck,
    tag: "Investment Desk",
    highlight: "Best for: auditability",
    cta: "Open evidence",
  },
  {
    title: "Portfolio Builder",
    description: "Assemble multi-project portfolios by risk and intent.",
    flipLine: "Blend assets into conservative or growth baskets.",
    href: "/tools/portfolio",
    learnHref: "/docs",
    icon: PieChart,
    tag: "Investment Desk",
    highlight: "Best for: allocation",
    cta: "Build portfolio",
  },
]

const featuredApps = apps.filter((app) =>
  ["Client Intake Builder", "Storyboard Builder", "Insta DM Lead Desk"].includes(app.title),
)

const cardTones = [
  "from-slate-50 via-white to-slate-200 dark:from-slate-800/60 dark:via-slate-900/70 dark:to-slate-950/80",
  "from-slate-100 via-slate-50 to-slate-200 dark:from-slate-700/50 dark:via-slate-800/60 dark:to-slate-900/70",
  "from-slate-200 via-slate-100 to-white dark:from-slate-900/60 dark:via-slate-800/70 dark:to-slate-950/85",
]

const dataPillars = [
  {
    title: "Live inventory + media",
    detail: "Workflows pull from the same verified listings, media, and pricing spine.",
  },
  {
    title: "Decision-ready outputs",
    detail: "Every tool ends with a clear next step you can act on.",
  },
  {
    title: "Team-safe handoff",
    detail: "Share outputs with brokers, marketing, and leadership instantly.",
  },
]

const dataAccordions = [
  {
    title: "How workflows stay synced with the data spine",
    detail:
      "Each workflow reads the same live inventory, pricing, and media feeds, so every output aligns with what you can actually sell.",
  },
  {
    title: "What happens after a workflow creates a result",
    detail:
      "Results can be saved to your dashboard, exported to client decks, or moved into your CRM with consistent formatting.",
  },
  {
    title: "How updates reach your team",
    detail:
      "New listings, media, and market changes appear across apps without manual refreshes or rework.",
  },
]

export default function AppsPage() {
  return (
    <main id="main-content">
      <Navbar />
      <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-24 bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.22),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(71,85,105,0.24),transparent_65%)]" />
        <div className="mx-auto w-full max-w-[1440px] px-6 relative">
          <div className="max-w-3xl mb-10">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Real Estate Workflows
            </p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight text-balance animate-fade-in-up">
              Choose the surface for the decision you need to make.
            </h1>
            <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed animate-fade-in-up-1">
              Entrestate workflows translate market evidence into focused execution. Each surface is built for a
              single, high-stakes job.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dataPillars.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-2xl border border-border/70 bg-card/60 p-5 text-sm text-muted-foreground"
              >
                <p className="text-sm font-medium text-foreground mb-2">{pillar.title}</p>
                <p className="text-xs leading-relaxed">{pillar.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-6 pb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Featured apps</p>
            <h2 className="text-xl font-semibold text-foreground mt-2">Start fast with the most used workflows</h2>
          </div>
          <Link href="/apps" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            View all workflows
          </Link>
        </div>
        <div className="mt-6 overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max snap-x snap-mandatory">
            {featuredApps.map((app) => (
              <div
                key={app.title}
                className="snap-start min-w-[260px] rounded-2xl border border-border/70 bg-card/70 p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl border border-border/60 bg-muted/40 flex items-center justify-center">
                    <app.icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{app.tag}</p>
                    <p className="text-sm font-medium text-foreground">{app.title}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground leading-relaxed">{app.flipLine}</p>
                <Link
                  href={app.href}
                  className="mt-5 inline-flex items-center gap-2 text-xs text-foreground hover:text-muted-foreground transition-colors"
                >
                  {app.cta}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {apps.map((app, index) => {
            const tone = cardTones[index % cardTones.length]
            return (
              <div key={app.title} className="group relative aspect-square [perspective:1200px]">
                <div className="relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] group-focus-within:[transform:rotateY(180deg)]">
                  <div
                    className={`absolute inset-0 rounded-2xl border border-border/70 bg-gradient-to-br ${tone} p-8 [backface-visibility:hidden]`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="h-12 w-12 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-center">
                        <app.icon className="h-5 w-5 text-foreground" />
                      </div>
                      <Link
                        href={app.learnHref}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={`Learn about ${app.title}`}
                      >
                        <BookOpen className="h-4 w-4" />
                      </Link>
                    </div>
                    <div className="mt-6">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">{app.tag}</p>
                      <p className="mt-2 text-xl font-serif text-foreground">{app.title}</p>
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{app.description}</p>
                    </div>
                    <div className="mt-6 text-xs text-muted-foreground">{app.highlight}</div>
                  </div>

                  <div
                    className={`absolute inset-0 rounded-2xl border border-border/70 bg-gradient-to-br ${tone} p-8 [transform:rotateY(180deg)] [backface-visibility:hidden]`}
                  >
                    <div className="flex h-full flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                          <Sparkles className="h-3.5 w-3.5" />
                          Quick summary
                        </div>
                        <p className="mt-4 text-base text-foreground leading-relaxed">{app.flipLine}</p>
                        <p className="mt-4 text-xs text-muted-foreground">{app.highlight}</p>
                      </div>
                      <div className="space-y-3">
                        <Link
                          href={app.href}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border/70 bg-secondary/60 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          Open workflow
                        </Link>
                        <Link
                          href={app.learnHref}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border/60 px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Learn how it works
                        </Link>
                        <ExplainWithChat
                          prompt={`Explain the ${app.title} app, when to use it, and the best first step.`}
                          label="Explain this workflow"
                          variant="ghost"
                          size="sm"
                          className="w-full justify-center text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-6 pb-20">
        <div className="rounded-2xl border border-border/70 bg-card/70 p-8 md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Lead desk setup</p>
              <h2 className="text-2xl md:text-3xl font-serif text-foreground mt-2">
                Build a client-ready lead flow in under five minutes.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Choose a role, add business inputs, and publish a lead-ready flow for your team.
              </p>
            </div>
            <Link
              href="/apps/agent-builder"
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-5 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Open lead builder
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Connected market data</p>
            <h2 className="text-2xl font-semibold text-foreground mt-2">
              Every workflow speaks the same market language.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Use one data spine with multiple workflows so your team never works from different truths.
            </p>
          </div>
          <div className="space-y-3">
            {dataAccordions.map((item) => (
              <details
                key={item.title}
                className="group rounded-xl border border-border/60 bg-card/60 px-5 py-4 open:bg-card/80 transition"
              >
                <summary className="flex cursor-pointer items-center justify-between text-sm text-foreground">
                  {item.title}
                  <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
