import type { Metadata } from "next"
export const dynamic = 'force-dynamic'
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getSyncedUser } from "@/lib/auth/sync"
import { ShieldCheck, Key, Zap, Globe, Copy, Trash, ExternalLink } from "lucide-react"
import ApiKeyManager from "@/components/account/api-key-manager"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "API Connections - Entrestate",
  description: "Connect Entrestate market data to your own sites and dashboards.",
}

export default async function ApiKeysPage() {
  const user = await getSyncedUser()
  if (!user) redirect("/login")

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-12 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-500">
            <Zap className="h-3 w-3" />
            Institutional External Feed
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-foreground md:text-5xl tracking-tight">
            API Connections
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Generate secure keys to connect our live market data to your external sites, 
            dashboards, and listing pages.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Main Content Area */}
          <div className="lg:col-span-8">
            <div className="rounded-2xl border border-border bg-card/50 p-8 shadow-sm">
              <ApiKeyManager />
            </div>
          </div>

          {/* Sidebar Area */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-border bg-secondary/30 p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Globe className="h-4 w-4 text-accent" />
                External Feed Documentation
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Use your API key in the `x-api-key` header to access these endpoints:
              </p>
              <div className="mt-4 space-y-4">
                <div className="rounded-lg bg-background p-3">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">Live Dashboard</p>
                  <code className="text-[10px] font-mono text-foreground break-all">
                    GET /api/v1/market-feed?type=dashboard
                  </code>
                </div>
                <div className="rounded-lg bg-background p-3">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">Market Listings</p>
                  <code className="text-[10px] font-mono text-foreground break-all">
                    GET /api/v1/market-feed?type=listings
                  </code>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                Security & Access
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Institutional keys give full access to the market feed. Never share your 
                raw key (`ent_live_...`) in client-side code. Use a secure backend proxy to fetch data.
              </p>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </main>
  )
}
