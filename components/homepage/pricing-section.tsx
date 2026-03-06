import Link from "next/link"
import { Button } from "@/components/ui/button"

type Tier = {
  name: string
  price: string
  description: string
  href: string
  cta: string
}

const DEFAULT_TIERS: Tier[] = [
  {
    name: "Starter",
    price: "Free",
    description: "3 decision sessions/day, limited screening, core market pulse",
    href: "/pricing",
    cta: "Start Free",
  },
  {
    name: "Pro",
    price: "$299/mo",
    description: "Unlimited Decision Tunnel sessions and deal screening",
    href: "/api/billing/paypal/checkout?tier=pro",
    cta: "Pay with PayPal",
  },
  {
    name: "Team",
    price: "$999/mo",
    description: "Shared watchlists, reports, collaboration workflows",
    href: "/api/billing/paypal/checkout?tier=team",
    cta: "Pay with PayPal",
  },
  {
    name: "Institutional",
    price: "$4,000/mo",
    description: "Portfolio monitoring, fund reporting, and enterprise reliability",
    href: "/api/billing/paypal/checkout?tier=institutional",
    cta: "Pay with PayPal",
  },
]

export function PricingSection({ tiers = DEFAULT_TIERS }: { tiers?: Tier[] }) {
  return (
    <section className="mt-8 rounded-2xl border border-border/70 bg-card/70 p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">Pricing</p>
      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tiers.slice(0, 4).map((tier) => (
          <article key={tier.name} className="rounded-xl border border-border/60 bg-background/40 p-4">
            <p className="text-sm font-semibold text-foreground">{tier.name}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{tier.price}</p>
            <p className="mt-2 text-xs text-muted-foreground">{tier.description}</p>
            <Button className="mt-4 w-full" variant={tier.name === "Starter" ? "outline" : "default"} asChild>
              <Link href={tier.href}>{tier.cta}</Link>
            </Button>
          </article>
        ))}
      </div>
    </section>
  )
}
