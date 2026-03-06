import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"

const tiers = [
  {
    name: "Starter",
    price: "Free",
    blurb: "3 decision sessions/day, limited screenings, core market pulse.",
    cta: "Start free",
    checkoutTier: null,
  },
  {
    name: "Pro",
    price: "$299/mo",
    blurb: "Unlimited Decision Tunnel sessions, deal screener, and exports.",
    cta: "Pay with PayPal",
    checkoutTier: "pro",
  },
  {
    name: "Team",
    price: "$999/mo",
    blurb: "Team seats, shared watchlists, report generation, audit trail.",
    cta: "Pay with PayPal",
    checkoutTier: "team",
  },
  {
    name: "Institutional",
    price: "$4,000/mo",
    blurb: "Portfolio monitoring, risk oversight, and enterprise-grade support.",
    cta: "Pay with PayPal",
    checkoutTier: "institutional",
  },
]

export default function PricingPage() {
  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1200px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-8 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Pricing</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">Real Estate Decision Plans</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a plan based on session volume, report generation, and portfolio depth. Paid plans run as monthly
            PayPal subscriptions.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tiers.map((tier) => (
            <article key={tier.name} className="rounded-2xl border border-border/70 bg-card/70 p-5">
              <p className="text-sm font-semibold text-foreground">{tier.name}</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{tier.price}</p>
              <p className="mt-3 text-sm text-muted-foreground">{tier.blurb}</p>
              {tier.checkoutTier ? (
                <Button className="mt-5 w-full" asChild>
                  <Link href={`/api/billing/paypal/checkout?tier=${tier.checkoutTier}`}>{tier.cta}</Link>
                </Button>
              ) : (
                <Button className="mt-5 w-full">{tier.cta}</Button>
              )}
            </article>
          ))}
        </section>
      </div>
      <Footer />
    </main>
  )
}
