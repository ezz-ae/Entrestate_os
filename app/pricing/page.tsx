"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Minus, ChevronDown, ChevronUp } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"

const tiers = [
  {
    name: "Starter",
    price: "Free",
    sub: "Always free",
    blurb: "Start exploring. 3 AI sessions per day, core market data.",
    cta: "Get started",
    checkoutTier: null,
    popular: false,
  },
  {
    name: "Pro",
    price: "$299",
    sub: "per month",
    blurb: "Unlimited AI sessions, full deal screener, CSV exports.",
    cta: "Subscribe with PayPal",
    checkoutTier: "pro",
    popular: true,
  },
  {
    name: "Team",
    price: "$999",
    sub: "per month",
    blurb: "Team seats, shared watchlists, report generation, audit trail.",
    cta: "Subscribe with PayPal",
    checkoutTier: "team",
    popular: false,
  },
  {
    name: "Institutional",
    price: "$4,000",
    sub: "per month",
    blurb: "Portfolio monitoring, risk oversight, enterprise-grade support.",
    cta: "Subscribe with PayPal",
    checkoutTier: "institutional",
    popular: false,
  },
]

type FeatureValue = boolean | string

const FEATURE_GROUPS: {
  group: string
  rows: { label: string; values: [FeatureValue, FeatureValue, FeatureValue, FeatureValue] }[]
}[] = [
  {
    group: "AI Chat",
    rows: [
      { label: "AI messages", values: ["Free window + cooldown", "Unlimited", "Unlimited", "Unlimited"] },
      { label: "Deal screener", values: [false, true, true, true] },
      { label: "Price reality check", values: [false, true, true, true] },
      { label: "Area risk brief", values: [false, true, true, true] },
      { label: "Developer due diligence", values: [false, true, true, true] },
      { label: "Investor memo generation", values: [false, true, true, true] },
    ],
  },
  {
    group: "Market Intelligence",
    rows: [
      { label: "Market pulse overview", values: [true, true, true, true] },
      { label: "Top-data tables", values: ["Read-only", true, true, true] },
      { label: "Area trust map", values: [true, true, true, true] },
      { label: "Developer reliability scores", values: [true, true, true, true] },
      { label: "Timing signals (BUY / HOLD / WAIT)", values: [false, true, true, true] },
      { label: "Supply pressure heatmaps", values: [false, false, true, true] },
    ],
  },
  {
    group: "Data & Exports",
    rows: [
      { label: "CSV export", values: [false, true, true, true] },
      { label: "PDF investor memo", values: [false, true, true, true] },
      { label: "Saved watchlists", values: ["1", "10", "Unlimited", "Unlimited"] },
      { label: "Shared team watchlists", values: [false, false, true, true] },
      { label: "Audit trail", values: [false, false, true, true] },
      { label: "API access", values: [false, false, false, true] },
    ],
  },
  {
    group: "Account",
    rows: [
      { label: "Team seats", values: ["1", "1", "5", "25+"] },
      { label: "Priority support", values: [false, false, true, true] },
      { label: "Dedicated account manager", values: [false, false, false, true] },
      { label: "Custom onboarding", values: [false, false, false, true] },
    ],
  },
]

const FAQ_GROUPS = [
  {
    group: "The Platform",
    items: [
      {
        q: "What is Entrestate, exactly?",
        a: "Entrestate is a real estate intelligence operating system — not a listing portal. It takes raw UAE property data and transforms it into institutional-grade investment intelligence through a ten-phase data pipeline and five-layer evidence stack. Think of it as a decision engine: it tells you not just what exists, but what to do and why.",
      },
      {
        q: "How is this different from Property Finder or Bayut?",
        a: "Property Finder and Bayut are listing portals — they show you what's available. Entrestate scores every project against timing signals, stress resilience, yield benchmarks, and data confidence, then matches them to your specific investor profile. External portals are treated as 'sensors' in our architecture — data inputs we validate, not sources we trust blindly.",
      },
      {
        q: "What is the Decision Tunnel?",
        a: "The Decision Tunnel is Entrestate's four-stage intelligence pipeline: Intent (parsing your natural language goals), Evidence (collecting high-integrity verified records), Judgment (ranking candidates via a 65/35 Market Score + Personal Match weighting), and Action (generating defensible outputs like investor memos and reports). It transforms a question into a deployable decision.",
      },
      {
        q: "What is the 5-Layer Evidence Stack?",
        a: "Every data point in the system is tagged by reliability tier — from L1 Canonical (audited static truths: verified locations, cleaned developer names, official launch dates) down to L5 Raw (unverified, unprocessed). This means every metric comes with a known confidence level. If a number hasn't reached L1 or L2, the system flags it rather than hiding the uncertainty.",
      },
    ],
  },
  {
    group: "Signals & Scoring",
    items: [
      {
        q: "What does a BUY signal mean?",
        a: "A BUY signal means a project has passed through the full Decision Tunnel and scored high enough on both the 65% Market Score (timing, stress resilience, yield, data confidence) and the 35% Personal Match (your risk profile and time horizon). Out of 7,015 active UAE projects, approximately 2,667 currently hold a BUY signal — roughly 38% of total inventory.",
      },
      {
        q: "How is the 65% Market Score calculated?",
        a: "The Market Score evaluates four objective signals: (1) Timing Signal — identifying the optimal investment window based on price momentum, lifecycle state, and secondary market flow; (2) Stress Resilience — measuring delivery risk, developer track record, and volatility resistance; (3) Yield — comparing gross yield against the UAE market average (currently ~6.6%); (4) Data Confidence — scoring how verified the underlying data is using the 5-Layer Evidence Stack.",
      },
      {
        q: "What is the Stress Resilience grade and how is it determined?",
        a: "The Stress Resilience grade measures a project's ability to withstand market volatility, delivery risk, and execution pressure. It is primarily driven by developer reliability (historical on-time delivery, specification adherence), the project's current lifecycle state (from Market Context through Delivery Risk to Exit Reality), and scenario modeling via the Scenario Reasoning Engine. A poor developer track record directly lowers a project's stress grade even if its yield is attractive.",
      },
      {
        q: "How does my investor profile change what I see?",
        a: "Your profile acts as a Decision Lens applied to the 35% Personal Match component. A Conservative investor sees only the 99 projects that prioritize capital preservation and low volatility. A Balanced investor gets yield-optimized results. A Speculative investor can explore the 71% of market inventory flagged as higher-risk. Two people asking the same question receive fundamentally different ranked results — this prevents what we call 'intent collapse'.",
      },
      {
        q: "What is a Timing Signal?",
        a: "The Timing Signal identifies the optimal entry or exit window for a project by treating it as a dynamic lifecycle state rather than a static listing. It analyzes price momentum tiers (from Deep Discount to High Premium), secondary market resale rates, flip patterns, supply-demand dynamics, and handover timelines. This tells you not just if a project is good — but if now is the right time.",
      },
    ],
  },
  {
    group: "AI & Reports",
    items: [
      {
        q: "What can the AI Copilot actually do?",
        a: "The AI Copilot can screen properties by budget, area, and risk profile using live scored data; compare markets side-by-side on price, yield, and stress grade; stress-test investments with custom vacancy, interest rate, and operating cost assumptions; generate full investor memos with price reality checks, developer due diligence, and final verdicts; and save structured reports to your account. It answers from live UAE market data, not generic knowledge.",
      },
      {
        q: "What are slash commands?",
        a: "Slash commands are quick shortcuts inside the AI chat. Type /screen to run a deal screener, /compare for a market comparison, /memo for an investor memo, /simulate to model a cash flow scenario, or /price for a price reality check. They auto-complete as you type and execute pre-built intelligence workflows instantly.",
      },
      {
        q: "What is a Decision Canvas?",
        a: "The Decision Canvas is a live workspace panel alongside the AI chat. It surfaces workspace cards (matched projects, avg price, timing signal, data confidence), performance sparkline charts (investor score and gross yield curves across results), a project comparison table with bar charts, and an Investment Simulator with sliders for down payment, interest rate, vacancy, and operating costs — with live DSCR and cash flow calculations.",
      },
      {
        q: "Can I export reports?",
        a: "Yes. Pro and above tiers can save AI sessions as structured investor reports (PDF or branded format), download via direct link, and share via the built-in Share modal which supports direct links, social media (X/Twitter, LinkedIn, WhatsApp, Telegram), AI-generated social posts for each platform, portal embed codes, and press release formatting.",
      },
    ],
  },
  {
    group: "Broker & Team Features",
    items: [
      {
        q: "What does the Broker Dashboard include?",
        a: "The Broker Dashboard is built for sales teams and includes: CRM Intelligence (AI-powered lead scoring categorizing leads as hot, warm, or cold based on engagement depth, budget alignment, and conversion probability), Brochure-to-Listing Automation (drag and drop a PDF brochure; Gemini 1.5 extracts payment plans, coordinates, unit specs, and handover dates to create a complete listing in minutes), competitive analysis, and a Sales Communication Coach for objection handling and buyer persona customization.",
      },
      {
        q: "How does AI lead scoring work?",
        a: "The system automatically calculates a priority score for each lead based on: pages viewed and time on site (engagement depth), how specific their inquiry is, response time to broker communications, budget match against available inventory, historical conversion patterns, and lead source quality (website vs. social vs. referral). High-scoring hot leads surface in a dedicated alert widget with the AI's reasoning for the prioritization.",
      },
      {
        q: "What is Brochure-to-Listing Automation?",
        a: "A broker drags and drops a developer PDF brochure into the Add New Project interface. Gemini 1.5 parses the document and extracts payment plan structures, unit specifications, coordinates, handover dates, and pricing data — auto-populating a structured listing form. Missing fields are highlighted for human review before the project is published as a standalone SEO-optimized landing page. What used to take hours takes minutes.",
      },
    ],
  },
  {
    group: "Pricing & Billing",
    items: [
      {
        q: "How does billing work?",
        a: "All plans are monthly subscriptions processed via PayPal. There are no contracts, no cancellation fees, and no card details stored on our servers. You can upgrade or cancel at any time — upgrades take effect immediately.",
      },
      {
        q: "What is the free tier?",
        a: "The Starter tier is always free. It includes a free message window with cooldown (a set number of AI sessions per day before a cooldown period), read-only access to top data tables, area trust maps, developer reliability scores, and 1 saved watchlist. It's designed to let you explore the platform's intelligence before committing.",
      },
      {
        q: "What does Pro add over Starter?",
        a: "Pro ($299/mo) unlocks unlimited AI messages, the full deal screener, price reality checks, area risk briefs, developer due diligence, investor memo generation, timing signals (BUY/HOLD/WAIT), CSV exports, PDF investor memos, up to 10 saved watchlists, and 1 user seat.",
      },
      {
        q: "When does Team tier make sense?",
        a: "Team ($999/mo) is for brokerage firms and analyst teams. It adds 5 seats, shared team watchlists, supply pressure heatmaps, report generation, audit trails, and priority support. It's the minimum tier required for report export via the API and for Broker Dashboard features.",
      },
      {
        q: "What is included in Institutional?",
        a: "Institutional ($4,000/mo) is for funds, family offices, and enterprise real estate operators. It includes 25+ seats, full API access for integration with internal systems, portfolio monitoring and risk oversight tooling, a dedicated account manager, and custom onboarding.",
      },
    ],
  },
]

function FaqGroup({ group, items }: { group: string; items: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  return (
    <div>
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">{group}</p>
      <div className="space-y-2">
        {items.map((item, i) => {
          const isOpen = openIndex === i
          return (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-border/60 bg-card/60 transition-colors hover:border-border"
            >
              <button
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <span className="text-sm font-medium text-foreground">{item.q}</span>
                {isOpen
                  ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
              </button>
              {isOpen && (
                <div className="border-t border-border/40 px-5 pb-5 pt-4">
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FeatureCell({ value }: { value: FeatureValue }) {
  if (value === true)
    return (
      <span className="flex justify-center">
        <Check className="h-4 w-4 text-emerald-500" />
      </span>
    )
  if (value === false)
    return (
      <span className="flex justify-center">
        <Minus className="h-4 w-4 text-muted-foreground/40" />
      </span>
    )
  return <span className="block text-center text-xs text-muted-foreground">{value}</span>
}

export default function PricingPage() {
  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1100px] px-6 pb-24 pt-28 md:pt-36">
        {/* Header */}
        <header className="mb-12 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Pricing</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-4xl">
            Plans for every stage
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
            Monthly PayPal subscriptions. Cancel anytime. No contracts.
          </p>
        </header>

        {/* Tier cards */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mb-16">
          {tiers.map((tier) => (
            <article
              key={tier.name}
              className={`relative rounded-2xl border p-5 flex flex-col ${
                tier.popular
                  ? "border-foreground/30 bg-card shadow-md"
                  : "border-border/70 bg-card/70"
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-background">
                  Most popular
                </span>
              )}
              <p className="text-sm font-semibold text-foreground">{tier.name}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">{tier.price}</span>
                <span className="text-xs text-muted-foreground">{tier.sub}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground flex-1">{tier.blurb}</p>
              {tier.checkoutTier ? (
                <Button className="mt-5 w-full" variant={tier.popular ? "default" : "outline"} asChild>
                  <Link href={`/api/billing/paypal/checkout?tier=${tier.checkoutTier}`}>
                    {tier.cta}
                  </Link>
                </Button>
              ) : (
                <Button className="mt-5 w-full" variant="outline">
                  {tier.cta}
                </Button>
              )}
            </article>
          ))}
        </section>

        {/* Feature comparison table */}
        <section>
          <h2 className="mb-6 text-sm font-semibold text-foreground">Full feature comparison</h2>
          <div className="rounded-2xl border border-border/70 bg-card/70 overflow-hidden">
            {/* Column headers */}
            <div className="grid grid-cols-5 border-b border-border/70 bg-muted/20">
              <div className="col-span-1 px-4 py-3" />
              {tiers.map((t) => (
                <div key={t.name} className="px-2 py-3 text-center">
                  <p className="text-xs font-semibold text-foreground">{t.name}</p>
                </div>
              ))}
            </div>

            {FEATURE_GROUPS.map((group, gi) => (
              <div key={group.group} className={gi > 0 ? "border-t border-border/50" : ""}>
                {/* Group label */}
                <div className="grid grid-cols-5 bg-muted/10 px-4 py-2">
                  <p className="col-span-5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                    {group.group}
                  </p>
                </div>
                {/* Rows */}
                {group.rows.map((row, ri) => (
                  <div
                    key={row.label}
                    className={`grid grid-cols-5 items-center px-4 py-2.5 ${
                      ri % 2 === 0 ? "" : "bg-muted/5"
                    }`}
                  >
                    <p className="col-span-1 text-xs text-muted-foreground pr-4">{row.label}</p>
                    {row.values.map((val, vi) => (
                      <div key={vi} className="px-2">
                        <FeatureCell value={val} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Trust strip */}
        <footer className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          <span>Payments via PayPal — no card stored on our servers</span>
          <span className="hidden sm:block text-border">|</span>
          <span>Cancel anytime, no cancellation fee</span>
          <span className="hidden sm:block text-border">|</span>
          <span>Upgrades take effect immediately</span>
        </footer>

        {/* FAQ */}
        <section className="mt-24">
          <div className="mb-12 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">Everything you need to know</p>
            <h2 className="mt-3 text-2xl font-semibold text-foreground md:text-3xl">Frequently Asked Questions</h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
              From how the scoring engine works to what each plan includes — answered in plain language.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
            {FAQ_GROUPS.map((faqGroup) => (
              <FaqGroup key={faqGroup.group} group={faqGroup.group} items={faqGroup.items} />
            ))}
          </div>

          <div className="mt-14 rounded-2xl border border-border/60 bg-card/60 px-8 py-10 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/50">Still have questions?</p>
            <h3 className="mt-3 text-xl font-semibold text-foreground">Talk to the team</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              For institutional inquiries, API integration, or custom enterprise pricing — reach us directly.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="default">
                <Link href="/chat">Open AI Copilot</Link>
              </Button>
              <Button asChild variant="outline">
                <a href="mailto:hello@entrestate.com">Email us</a>
              </Button>
            </div>
          </div>
        </section>

      </div>
      <Footer />
    </main>
  )
}
