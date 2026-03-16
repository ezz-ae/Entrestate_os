import Link from "next/link"
import { ArrowRight, Puzzle, Handshake, Server, Database, Shield, Layers, Users, Code } from "lucide-react"

import { getRequestLocale } from "@/i18n/request"
import { ArabicDocPage } from "@/components/docs/arabic-doc-page"
import { getArabicDocsPage } from "@/lib/docs-arabic-pages"
const partnerTracks = [
  {
    icon: Database,
    title: "Data Partners",
    subtitle: "Feed the Evidence Stack",
    details:
      "Integrate market, valuation, transaction, or geospatial feeds into the Evidence Stack with traceable source lineage. Every incoming data point is tagged to an L-layer (L4 External) and adjudicated through the 10-Phase Pipeline to reach L1 Canonical status.",
    examples: [
      "DLD transaction history feeds",
      "RERA regulatory compliance data",
      "Property Finder and Bayut listing sensors",
      "Geospatial and satellite imagery providers",
    ],
  },
  {
    icon: Users,
    title: "Brokerage Partners",
    subtitle: "Decision Desks for Advisory Teams",
    details:
      "Use Entrestate as decision infrastructure for advisory desks, investor memos, and lead qualification workflows. The Broker Empowerment Suite transforms brokerage operations from manual entry to intelligent sales coaching powered by the Evidence Stack.",
    examples: [
      "Brochure-to-Listing AI automation (PDF to L1 data)",
      "AI Lead Scoring (Hot/Warm/Cold prioritization)",
      "Sales Communication Coach for international buyers",
      "Profile-calibrated investor memo generation",
    ],
  },
  {
    icon: Code,
    title: "Distribution & Ecosystem",
    subtitle: "Embed Intelligence Modules",
    details:
      "Embed selected intelligence modules into partner products via the Embed SDK and API integration surfaces. White-label capabilities allow partners to surface Entrestate evidence-backed scoring within their own platforms.",
    examples: [
      "market_card: area-level intelligence snapshot",
      "area_table: comparative market data grid",
      "score_badge: investment score with confidence indicator",
      "market_pulse: live market movement signals",
    ],
  },
]

const apiCapabilities = [
  {
    category: "Market Intelligence",
    endpoints: [
      "GET /api/markets — Market overview with scoring and traction signals",
      "GET /api/market-score/summary — Composite scoring breakdown by area",
      "GET /api/inventory — Full project inventory with L1-L5 provenance tags",
    ],
  },
  {
    category: "Decision Engine",
    endpoints: [
      "POST /api/chat — Intent resolution, evidence collection, and scored recommendations",
      "POST /api/reports/generate — Decision Object factory (PDF memos with evidence footnotes)",
      "GET /api/embed — White-label widget data with tier-gated column access",
    ],
  },
  {
    category: "Profile & Scoring",
    endpoints: [
      "Profile-aware ranking and recommendation flow",
      "65/35 Market Score + Match Score weighting engine",
      "Evidence drawer and confidence metadata per response",
    ],
  },
]

const integrationModel = [
  {
    step: "1",
    title: "Onboard & Authenticate",
    description: "API key provisioning, tier selection, and data schema alignment. Partners receive sandbox access with full Evidence Stack visibility.",
  },
  {
    step: "2",
    title: "Integrate Data Feeds",
    description: "For data partners: establish ingestion pipeline with L-layer tagging. For brokerage partners: configure Decision Desk surfaces and profile templates.",
  },
  {
    step: "3",
    title: "Configure Embed Surfaces",
    description: "Select widget types (market_card, area_table, score_badge, market_pulse), apply branding, and configure tier-gated column access.",
  },
  {
    step: "4",
    title: "Attribution & Analytics",
    description: "Attribution engine tracks widget_view, widget_signup, and widget_upgrade events with 7-day and 90-day conversion windows.",
  },
]

export default async function PartnersApisDocsPage() {
  const locale = await getRequestLocale()
  if (locale === "ar") {
    return <ArabicDocPage locale={locale} content={getArabicDocsPage("partners-apis")} />
  }

  return (
    <>
      {/* Hero */}
      <header className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-10">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Platform Docs / Partners & APIs</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground md:text-5xl">Partners & APIs</h1>
        <p className="mt-4 max-w-3xl text-base text-muted-foreground leading-relaxed">
          Partnership architecture, integration blueprint, and API surfaces for ecosystem collaboration. Entrestate is
          designed as <strong className="text-foreground">infrastructure partners build on</strong> — not a closed
          product competing with its ecosystem.
        </p>
      </header>

      {/* Partnership Tracks */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Partnership Tracks</h2>
        <div className="space-y-4">
          {partnerTracks.map((track) => (
            <article key={track.title} className="rounded-2xl border border-border/70 bg-card/70 p-6">
              <div className="flex items-center gap-2">
                <track.icon className="h-5 w-5 text-accent" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{track.title}</h3>
                  <p className="text-xs text-muted-foreground">{track.subtitle}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{track.details}</p>
              <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                {track.examples.map((example) => (
                  <div key={example} className="rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-sm text-muted-foreground">
                    {example}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* API Capabilities */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">API Capability Coverage</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Every API response includes <code className="rounded bg-background/60 px-1.5 py-0.5 text-xs">request_id</code>,{" "}
          <code className="rounded bg-background/60 px-1.5 py-0.5 text-xs">evidence</code>, and{" "}
          <code className="rounded bg-background/60 px-1.5 py-0.5 text-xs">provenance</code> metadata. Tier gating is enforced
          server-side — gated columns are removed silently with an upgrade CTA.
        </p>
        <div className="mt-5 space-y-4">
          {apiCapabilities.map((group) => (
            <div key={group.category} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <h3 className="text-sm font-semibold text-foreground">{group.category}</h3>
              <ul className="mt-2 space-y-1.5">
                {group.endpoints.map((endpoint) => (
                  <li key={endpoint} className="text-sm text-muted-foreground font-mono">
                    {endpoint}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Embed SDK */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Puzzle className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Embed SDK</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Self-contained, CSP-safe embed widgets that surface Entrestate intelligence within partner products. No
          eval(), no external dependencies. Four widget types with tier-gated column access.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Widget Types</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li><strong className="text-foreground">market_card</strong> — Area-level intelligence snapshot</li>
              <li><strong className="text-foreground">area_table</strong> — Comparative market data grid</li>
              <li><strong className="text-foreground">score_badge</strong> — Investment score + confidence</li>
              <li><strong className="text-foreground">market_pulse</strong> — Live movement signals</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border/60 bg-background/40 p-4">
            <h3 className="text-sm font-semibold text-foreground">Specifications</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>Cache: <code className="rounded bg-background/60 px-1 text-xs">public, max-age=3600</code></li>
              <li>Rate limit: 100 req/min authenticated, 10 unauthenticated</li>
              <li>Free tier: &quot;Powered by Entrestate&quot; (non-removable)</li>
              <li>Pro: Custom accent color via <code className="rounded bg-background/60 px-1 text-xs">data-accent</code></li>
            </ul>
          </div>
        </div>
      </section>

      {/* Integration Model */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-semibold text-foreground">Integration Model</h2>
        </div>
        <div className="mt-5 space-y-4">
          {integrationModel.map((step) => (
            <div key={step.step} className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/20 font-mono text-sm font-bold text-accent">
                {step.step}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Commercial Plans */}
      <section className="mb-8 rounded-2xl border border-border/70 bg-card/70 p-6">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Commercial Plans</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Plans are structured by throughput, data breadth, and support model. Partnership and investment discussions
          can combine API access with strategic co-build lanes. Tier gating is enforced server-side via JWT — client
          claims are never trusted.
        </p>
        <Link
          href="/pricing"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent"
        >
          View plans and tiers
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Navigation */}
      <section className="rounded-2xl border border-border/70 bg-card/70 p-6">
        <h2 className="text-lg font-semibold text-foreground">Related Documentation</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/docs/investors-relations"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Investor Package
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/docs/documentation"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-accent/40"
          >
            Platform Architecture
          </Link>
          <Link
            href="/docs/data-information"
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-accent/40"
          >
            Data & Evidence Model
          </Link>
        </div>
      </section>
    </>
  )
}