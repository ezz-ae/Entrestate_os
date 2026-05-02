import Link from "next/link"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PaidUpsell } from "@/components/me/paid-upsell"
import { CodeIcon, ShieldCheck, ExternalLink } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ApiAccessPage() {
  const entitlement = await getCurrentEntitlement()
  if (entitlement.tier === "free") return <PaidUpsell capability="api_keys" />

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">API access</h1>
        <p className="text-sm text-muted-foreground">Programmatic access to public data + your own listings.</p>
      </header>

      <Card>
        <CardContent className="p-6 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Manage API keys</h2>
          <p className="text-sm text-muted-foreground">Keys are hashed at rest and scoped: <code>read:market</code>, <code>read:listings</code>, <code>write:listings</code>.</p>
          <Button asChild>
            <Link href="/account/api-keys">Open API keys</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-2">
          <h2 className="font-semibold flex items-center gap-2"><CodeIcon className="h-4 w-4" /> Quickstart</h2>
          <pre className="text-xs font-mono bg-muted/40 rounded p-3 overflow-x-auto">{`# Read market pulse (all tiers, rate-limited)
curl https://entrestate.com/api/v1/market-feed?type=dashboard \\
  -H "x-api-key: ent_live_..."

# List YOUR listings (paid)
curl https://entrestate.com/api/v1/listings \\
  -H "x-api-key: ent_live_..."

# Push a listing (paid)
curl -X POST https://entrestate.com/api/v1/listings \\
  -H "x-api-key: ent_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Marina Heights 2BR","area":"Dubai Marina","priceAed":2500000,"yieldPct":7.2,"source":"api"}'`}</pre>
          <Link href="/docs/api" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            Full API reference <ExternalLink className="h-3 w-3" />
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
