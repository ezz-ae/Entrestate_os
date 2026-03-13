import type { Metadata } from "next"
import Link from "next/link"
import {
  Building2,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  MessageSquareText,
  BarChart3,
  MapPin,
  FileText,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { AccountIdentity } from "@/components/account-identity"
import { AccountBillingControls } from "@/components/account-billing-controls"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { listBillingEventsByAccountKey, type BillingActivityEvent } from "@/lib/billing-entitlements"
import { getCopilotDailyLimit, getCopilotDailyUsage } from "@/lib/copilot-usage"

export const metadata: Metadata = {
  title: "Account - Entrestate",
  description: "Manage your Entrestate account, subscription, and AI usage.",
}

const PLAN_LABELS: Record<"free" | "pro" | "team" | "institutional", string> = {
  free: "Starter",
  pro: "Pro",
  team: "Team",
  institutional: "Institutional",
}

const PLAN_COLORS: Record<"free" | "pro" | "team" | "institutional", string> = {
  free: "text-muted-foreground",
  pro: "text-blue-500",
  team: "text-violet-500",
  institutional: "text-amber-500",
}

const QUICK_ACCESS = [
  {
    label: "AI Chat",
    description: "Decision sessions, deal screener, memos",
    href: "/chat",
    icon: MessageSquareText,
    tiers: ["free", "pro", "team", "institutional"],
  },
  {
    label: "Market Data",
    description: "Top-data tables and market pulse",
    href: "/top-data",
    icon: BarChart3,
    tiers: ["free", "pro", "team", "institutional"],
  },
  {
    label: "Area Intelligence",
    description: "Area trust maps and supply pressure",
    href: "/areas",
    icon: MapPin,
    tiers: ["free", "pro", "team", "institutional"],
  },
  {
    label: "Investor Memo",
    description: "Generate PDF-ready investment memos",
    href: "/chat",
    icon: FileText,
    tiers: ["pro", "team", "institutional"],
  },
]

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

function UsageMeter({
  limit,
  blocked,
}: {
  limit: number | null
  blocked: boolean
}) {
  if (limit === null) {
    return (
      <div className="flex items-center gap-1.5">
        <Zap className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-sm font-semibold text-foreground">Unlimited access</span>
      </div>
    )
  }
  return (
    <div>
      <div className="flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-sm font-semibold text-foreground">Free access</span>
      </div>
      {blocked ? (
        <p className="mt-1.5 text-[11px] text-red-400">Usage is cooling down. Please try again soon.</p>
      ) : null}
    </div>
  )
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = (await searchParams) ?? {}
  const billingState = Array.isArray(params.billing) ? params.billing[0] : params.billing

  const entitlement = await getCurrentEntitlement()
  const [billingActivity, usage] = await Promise.all([
    entitlement.accountKey ? listBillingEventsByAccountKey(entitlement.accountKey, 6) : Promise.resolve([]),
    entitlement.accountKey
      ? getCopilotDailyUsage(entitlement.accountKey, entitlement.tier)
      : Promise.resolve({
          used: 0,
          limit: getCopilotDailyLimit(entitlement.tier),
          remaining: getCopilotDailyLimit(entitlement.tier),
          blocked: false,
          cooldownSecondsRemaining: null,
        }),
  ])

  const planLabel = PLAN_LABELS[entitlement.tier]
  const planColor = PLAN_COLORS[entitlement.tier]
  const statusLabel = entitlement.status ? entitlement.status.replaceAll("_", " ").toLowerCase() : "not subscribed"
  const isActive = entitlement.tier !== "free" && entitlement.status === "active"
  const accessibleFeatures = QUICK_ACCESS.filter((f) => f.tiers.includes(entitlement.tier))
  const lockedFeatures = QUICK_ACCESS.filter((f) => !f.tiers.includes(entitlement.tier))

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1100px] px-6 pb-24 pt-28 md:pt-36">

        {/* Billing state banners */}
        {billingState === "success" ? (
          <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
            PayPal subscription activated successfully. Your plan has been upgraded.
          </div>
        ) : null}
        {billingState === "cancelled" ? (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
            Checkout was cancelled. No charge was made.
          </div>
        ) : null}
        {billingState === "error" || billingState === "missing_subscription" ? (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">
            We could not verify your PayPal subscription. Contact support if you were charged.
          </div>
        ) : null}

        {/* Identity header */}
        <div className="mb-8">
          <AccountIdentity />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          {/* Left column */}
          <div className="space-y-6">

            {/* Plan + Usage card */}
            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Current plan</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${planColor}`}>{planLabel}</span>
                    {isActive ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        <Clock className="h-3 w-3" /> {statusLabel}
                      </span>
                    )}
                  </div>
                </div>
                {entitlement.tier === "free" ? (
                  <Link
                    href="/pricing"
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground transition hover:bg-muted/70"
                  >
                    Upgrade plan <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </div>

              {/* AI usage meter */}
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">AI Chat · Free usage window</p>
                <UsageMeter
                  limit={usage.limit}
                  blocked={usage.blocked}
                />
              </div>

              {/* Billing controls */}
              <div className="mt-4">
                <AccountBillingControls
                  tier={entitlement.tier}
                  subscriptionId={entitlement.subscriptionId}
                  status={entitlement.status}
                />
              </div>

              {entitlement.subscriptionId ? (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Subscription ID: <span className="font-mono">{entitlement.subscriptionId}</span>
                </p>
              ) : null}
            </section>

            {/* Quick access */}
            <section>
              <p className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">Quick access</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {accessibleFeatures.map((f) => {
                  const Icon = f.icon
                  return (
                    <Link
                      key={f.label}
                      href={f.href}
                      className="group flex items-start gap-3 rounded-xl border border-border/70 bg-card/70 p-4 transition hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-card hover:shadow-sm"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-muted/40">
                        <Icon className="h-4 w-4 text-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{f.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{f.description}</p>
                      </div>
                      <ArrowRight className="ml-auto h-4 w-4 flex-shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                    </Link>
                  )
                })}
                {lockedFeatures.map((f) => {
                  const Icon = f.icon
                  return (
                    <div
                      key={f.label}
                      className="flex items-start gap-3 rounded-xl border border-border/40 bg-muted/10 p-4 opacity-50"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-muted/20">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{f.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{f.description}</p>
                      </div>
                      <Link
                        href="/pricing"
                        className="ml-auto flex-shrink-0 rounded-full border border-border/60 bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                      >
                        Upgrade
                      </Link>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Organization */}
            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Organization</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Primary market</p>
                  <p className="mt-1 text-sm text-foreground">UAE · Dubai</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Company type</p>
                  <p className="mt-1 text-sm text-foreground">Brokerage / Investment</p>
                </div>
              </div>
            </section>

          </div>

          {/* Right column */}
          <aside className="space-y-6">

            {/* Billing activity */}
            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">Billing activity</h2>
                </div>
                <Link href="/account/billing-activity" className="text-[11px] text-muted-foreground hover:text-foreground">
                  View all →
                </Link>
              </div>
              {billingActivity.length === 0 ? (
                <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-6 text-center">
                  <p className="text-xs text-muted-foreground">No billing events yet.</p>
                  {entitlement.tier === "free" ? (
                    <Link href="/pricing" className="mt-2 inline-block text-xs text-foreground underline">
                      Explore plans
                    </Link>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-2">
                  {billingActivity.map((event) => {
                    const detail = getActivityDescription(event)
                    return (
                      <div key={event.event_id} className="rounded-xl border border-border/60 bg-muted/10 p-3">
                        <p className="text-xs font-medium text-foreground capitalize">{formatEventType(event.event_type)}</p>
                        {detail ? <p className="mt-0.5 text-[11px] text-muted-foreground">{detail}</p> : null}
                        <p className="mt-1 text-[10px] text-muted-foreground">{event.received_at}</p>
                      </div>
                    )
                  })}
                </div>
              )}
              <Link
                href="/contact"
                className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Billing support <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </section>

            {/* Security */}
            <section className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Security</h2>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">Session controls enabled</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                  <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">Data access restricted by role</p>
                </div>
                {entitlement.tier === "team" || entitlement.tier === "institutional" ? (
                  <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                    <p className="text-xs text-muted-foreground">Audit trail active</p>
                  </div>
                ) : null}
              </div>
            </section>

            {/* Upgrade prompt for free */}
            {entitlement.tier === "free" ? (
              <section className="rounded-2xl border border-border/70 bg-card/70 p-5">
                <p className="text-sm font-semibold text-foreground">Unlock the full platform</p>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  Pro gives you unlimited AI sessions, deal screener, timing signals, and PDF exports.
                </p>
                <Link
                  href="/pricing"
                  className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted/70"
                >
                  View plans
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </section>
            ) : null}

          </aside>
        </div>
      </div>
      <Footer />
    </main>
  )
}
