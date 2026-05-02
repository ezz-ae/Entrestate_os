import Link from "next/link"
import { ExternalLink, Sparkles, ShieldCheck } from "lucide-react"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { listConnectors, type ConnectorDefinition } from "@/lib/connectors/registry"
import { tierMeets } from "@/lib/entitlement-gates"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PaidUpsell } from "@/components/me/paid-upsell"

export const dynamic = "force-dynamic"

export default async function ConnectionsPage() {
  const entitlement = await getCurrentEntitlement()
  if (entitlement.tier === "free") return <PaidUpsell capability="portal_connections" />

  const all = listConnectors()
  const portal = all.filter((c) => c.family === "portal")
  const crm = all.filter((c) => c.family === "crm")
  const feed = all.filter((c) => c.family === "feed")

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Connect your platform</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Pull listings from portals, sync your CRM, or set up custom webhooks. Everything is signed, auditable, and stored encrypted at rest.
        </p>
      </header>
      <Family title="Property portals" subtitle="Pull live inventory from Bayut, Property Finder, Dubizzle." connectors={portal} userTier={entitlement.tier} />
      <Family title="CRMs" subtitle="Push verdicts into your sales pipeline; pull contacts back." connectors={crm} userTier={entitlement.tier} />
      <Family title="Custom feeds" subtitle="Inbound webhooks, outbound webhooks, SFTP drops." connectors={feed} userTier={entitlement.tier} />
    </div>
  )
}

function Family({ title, subtitle, connectors, userTier }: { title: string; subtitle: string; connectors: ConnectorDefinition[]; userTier: "free" | "pro" | "team" | "institutional" }) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {connectors.map((c) => {
          const allowed = tierMeets(userTier, c.minTier)
          return (
            <Card key={c.id} className={allowed ? "" : "opacity-75"}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground" aria-hidden>
                    {/* Logos drop into /public/connectors/{id}.svg — fallback to monogram */}
                    <span className="text-sm font-bold">{c.name[0]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{c.name}</h3>
                      {!allowed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                          <Sparkles className="h-3 w-3" /> {c.minTier}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{c.description}</p>
                    <ul className="mt-2 text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                      {c.capabilities.slice(0, 3).map((cap) => <li key={cap}>{cap}</li>)}
                    </ul>
                    <div className="mt-3 flex gap-2 items-center">
                      {allowed ? (
                        <Button asChild size="sm">
                          <Link href={`/me/connections/${c.id}`}>Connect</Link>
                        </Button>
                      ) : (
                        <Button asChild size="sm" variant="outline">
                          <Link href="/pricing">Upgrade to use</Link>
                        </Button>
                      )}
                      {c.docsUrl && (
                        <Link href={c.docsUrl} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                          Docs <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
