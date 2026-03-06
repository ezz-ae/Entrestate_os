import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AccountIdentity } from "@/components/account-identity"
import { AccountBillingControls } from "@/components/account-billing-controls"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { listBillingEventsByAccountKey, type BillingActivityEvent } from "@/lib/billing-entitlements"
import Link from "next/link"
import { Building2, ShieldCheck, CreditCard, Users, Boxes, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Account - Entrestate",
  description:
    "Manage your Entrestate account, team access, security preferences, and connected workflows in one place.",
}

const PLAN_LABELS: Record<"free" | "pro" | "team" | "institutional", string> = {
  free: "Starter (Free)",
  pro: "Pro",
  team: "Team",
  institutional: "Institutional",
}

function formatEventType(eventType: string | null) {
  if (!eventType) return "Unknown event"
  return eventType.replaceAll("_", " ").toLowerCase()
}

function getActivityDescription(event: BillingActivityEvent) {
  if (!event.payload || typeof event.payload !== "object") return null

  const payload = event.payload as Record<string, unknown>
  const status = typeof payload.subscription_status === "string" ? payload.subscription_status : null
  const tier = typeof payload.tier === "string" ? payload.tier : null

  if (status && tier) return `Status ${status} · Tier ${tier}`
  if (status) return `Status ${status}`
  if (tier) return `Tier ${tier}`
  return null
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = (await searchParams) ?? {}
  const billingState = Array.isArray(params.billing) ? params.billing[0] : params.billing

  const entitlement = await getCurrentEntitlement()
  const billingActivity = entitlement.accountKey ? await listBillingEventsByAccountKey(entitlement.accountKey, 8) : []

  const planLabel = PLAN_LABELS[entitlement.tier]
  const statusLabel = entitlement.status ? entitlement.status.replaceAll("_", " ").toLowerCase() : "not subscribed"

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mb-12">
            <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">Account</p>
            <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight">Your account profile</h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Update your organization profile, manage access, and control how workflows connect to your data.
            </p>
            {billingState === "success" ? (
              <p className="mt-3 text-sm text-emerald-600">PayPal subscription synced successfully.</p>
            ) : null}
            {billingState === "cancelled" ? (
              <p className="mt-3 text-sm text-amber-600">Checkout was cancelled before activation.</p>
            ) : null}
            {billingState === "error" || billingState === "missing_subscription" ? (
              <p className="mt-3 text-sm text-red-600">We could not verify the PayPal subscription return flow.</p>
            ) : null}
          </div>
          <div className="max-w-3xl mb-10">
            <AccountIdentity />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-8">
            <div className="space-y-6">
              <section id="profile" className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="h-5 w-5 text-accent" />
                  <div>
                    <h2 className="text-lg font-medium text-foreground">Organization profile</h2>
                    <p className="text-sm text-muted-foreground">Name, markets, and contact identity.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="rounded-lg border border-border/60 bg-secondary/40 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Primary market</p>
                    <p className="text-foreground">UAE · Dubai</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-secondary/40 p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Company type</p>
                    <p className="text-foreground">Brokerage / Investment</p>
                  </div>
                </div>
              </section>

              <section id="team" className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="h-5 w-5 text-accent" />
                  <div>
                    <h2 className="text-lg font-medium text-foreground">Team access</h2>
                    <p className="text-sm text-muted-foreground">Invite team members and control access levels.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1">Owners: 1</span>
                  <span className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1">Editors: 4</span>
                  <span className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1">Viewers: 6</span>
                </div>
              </section>

              <section id="apps" className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Boxes className="h-5 w-5 text-accent" />
                  <div>
                    <h2 className="text-lg font-medium text-foreground">Connected workflows</h2>
                    <p className="text-sm text-muted-foreground">
                      Media workflows, client intake workflows, and market data services live under the same account.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  {["Media Studio", "Client Intake Builder", "Market Research Desk", "Cold Calling"].map((app) => (
                    <div key={app} className="rounded-lg border border-border/60 bg-secondary/40 p-4">
                      <p className="text-foreground">{app}</p>
                      <p className="text-xs text-muted-foreground mt-1">Active</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section id="billing" className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="h-5 w-5 text-accent" />
                  <div>
                    <h2 className="text-lg font-medium text-foreground">Billing</h2>
                    <p className="text-sm text-muted-foreground">Manage subscriptions and invoices.</p>
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-secondary/40 p-4 text-sm text-muted-foreground">
                  Plan: {planLabel}
                  <div className="mt-2 text-xs uppercase tracking-wide">Status: {statusLabel}</div>
                  {entitlement.subscriptionId ? (
                    <div className="mt-1 text-xs">Subscription ID: {entitlement.subscriptionId}</div>
                  ) : (
                    <div className="mt-1 text-xs">No active PayPal subscription linked.</div>
                  )}
                </div>
                <AccountBillingControls
                  tier={entitlement.tier}
                  subscriptionId={entitlement.subscriptionId}
                  status={entitlement.status}
                />

                <div className="mt-5 rounded-lg border border-border/60 bg-secondary/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Billing activity</p>
                    <Link href="/account/billing-activity" className="text-xs text-accent hover:text-accent/80">
                      View full activity
                    </Link>
                  </div>
                  {billingActivity.length === 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">No billing activity recorded yet.</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {billingActivity.map((event) => {
                        const detail = getActivityDescription(event)
                        return (
                          <div key={event.event_id} className="rounded-md border border-border/50 bg-background/80 p-2">
                            <p className="text-xs text-foreground">{formatEventType(event.event_type)}</p>
                            {detail ? <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p> : null}
                            <p className="mt-1 text-[11px] text-muted-foreground">{event.received_at}</p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <Link
                  href="/contact"
                  className="mt-4 inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80"
                >
                  Talk to billing
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </section>

              <section id="security" className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck className="h-5 w-5 text-accent" />
                  <div>
                    <h2 className="text-lg font-medium text-foreground">Security</h2>
                    <p className="text-sm text-muted-foreground">Controls for access and compliance.</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="rounded-lg border border-border/60 bg-secondary/40 p-4">
                    Session controls and audit trails are enabled.
                  </div>
                  <div className="rounded-lg border border-border/60 bg-secondary/40 p-4">
                    Data access is restricted by team roles.
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
