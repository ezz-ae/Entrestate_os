import Link from "next/link"
import { Check, Minus } from "lucide-react"
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
    group: "AI Copilot",
    rows: [
      { label: "Daily AI sessions", values: ["3 / day", "Unlimited", "Unlimited", "Unlimited"] },
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
      </div>
      <Footer />
    </main>
  )
}
