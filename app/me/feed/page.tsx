import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { Card, CardContent } from "@/components/ui/card"
import { PaidUpsell } from "@/components/me/paid-upsell"

export const dynamic = "force-dynamic"

export default async function FeedPage() {
  const entitlement = await getCurrentEntitlement()
  if (entitlement.tier === "free") return <PaidUpsell capability="alerts" />

  // Alerts will read from MarketAlert (added in this PR's schema).
  // Until alerts have been generated, render an empty state — never fake data.
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Alerts</h1>
        <p className="text-sm text-muted-foreground">Email + push when something changes on your saved areas, watched projects, or your own listings.</p>
      </header>
      <Card>
        <CardContent className="p-10 text-center text-muted-foreground">
          No alerts yet. Save an area or project to start receiving updates.
        </CardContent>
      </Card>
    </div>
  )
}
