import Link from "next/link"
import {
  ArrowRight,
  Sparkles,
  MapPin,
  BarChart3,
  Zap,
  Search,
  Building2,
  Users2,
  FileText,
  Plug,
  KeyRound,
  Bell,
} from "lucide-react"
import { getPersonalHomeBundle } from "@/lib/me/personal-home"
import { getBusinessStore } from "@/lib/business-store"
import { getBusinessAccountSummary } from "@/lib/business-account"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { VerdictPill } from "@/components/me/verdict-pill"
import { formatAed } from "@/lib/format/currency"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"

export const dynamic = "force-dynamic"

export default async function MeHomePage() {
  const locale = await getRequestLocale()
  const bundle = await getPersonalHomeBundle()
  if (!bundle) return null
  const businessStore = await getBusinessStore()
  // Phase 5: the business account, rendered here — never kept here. Fail-soft:
  // no summary, no card, and /me is exactly the page it was.
  const businessAccount = await getBusinessAccountSummary()
  const terminalHref = prefixLocalePath("/me?openChat=true", locale)

  const publicSurfaces = [
    { title: "Decision terminal", body: "Ask directly and get an evidence-backed verdict.", href: "/me?openChat=true", icon: Sparkles },
    { title: "Search & screening", body: "Screen projects, areas, and developers from one surface.", href: "/search", icon: Search },
    { title: "Projects", body: "Full scored inventory across the public market surface.", href: "/properties", icon: Building2 },
    { title: "Areas", body: "Area-level yield, pricing, and supply readouts.", href: "/areas", icon: MapPin },
    { title: "Developers", body: "Delivery track record and reliability profiles.", href: "/developers", icon: Users2 },
    { title: "Reports", body: "Research, briefs, and publishable market reads.", href: "/reports/library", icon: FileText },
  ]

  const paidLayer = [
    {
      title: "Listings layer",
      body: bundle.tier === "free"
        ? "Bring your own listings into Entrestate and score them with the same evidence stack."
        : "Your own listings sit inside the same scored environment as the public market.",
      href: bundle.tier === "free" ? "/pricing" : "/me/listings",
      icon: Building2,
      cta: bundle.tier === "free" ? "Upgrade for listings" : "Open listings",
    },
    {
      title: "Connection layer",
      body: bundle.tier === "free"
        ? "Portal sync, CRM sync, and webhook feeds start when you move into paid plans."
        : "Connect Bayut, Property Finder, CRMs, or custom feeds to keep your platform in sync.",
      href: bundle.tier === "free" ? "/pricing" : "/me/connections",
      icon: Plug,
      cta: bundle.tier === "free" ? "View connection plans" : "Open connections",
    },
    {
      title: "API layer",
      body: bundle.tier === "free"
        ? "Public market data is open; paid tiers add API keys for your own listings and integrations."
        : "Use API keys for public market data plus your private listings, writes, and downstream integrations.",
      href: "/me/api-access",
      icon: KeyRound,
      cta: bundle.tier === "free" ? "See API access" : "Manage API access",
    },
  ]

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-border bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white dark:from-slate-950 dark:to-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">
              {/* The included level is NAMED, never called free — the owner's
                  word ban: the badge says what the account holds. */}
              {bundle.tier === "free" ? "Discovery" : bundle.tier} member
            </p>
            <h1 className="mt-2 text-3xl font-bold">{bundle.greeting}</h1>
            <p className="mt-2 max-w-2xl text-slate-300">
              {bundle.tier === "free"
                ? "This is your signed-in home. The full discovery layer stays open — search, data, and the advisor — and the working tools the business sells plug in from the App Store when you want them."
                : "This is your personal Entrestate site: the full public read surface plus your own listings, connectors, alerts, and programmable access."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href={terminalHref}>Open terminal</Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link href={prefixLocalePath("/search", locale)}>Search the market</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href={prefixLocalePath(bundle.tier === "free" ? "/pricing" : "/me/listings", locale)}>
                  {bundle.tier === "free" ? "Upgrade for paid layer" : "Open your listings"}
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Avatar initials={bundle.user.initials} />
            <div className="text-right">
              <div className="text-sm font-semibold">{bundle.user.name ?? bundle.user.email}</div>
              <div className="text-xs text-slate-400">{bundle.user.email}</div>
            </div>
          </div>
        </div>
      </header>

      <section aria-label="Market pulse">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <PulseTile icon={BarChart3} label="Projects" value={String((bundle.marketPulse.summary as any)?.projects ?? "—")} />
          <PulseTile
            icon={MapPin}
            label="Avg yield"
            value={typeof (bundle.marketPulse.summary as any)?.avg_yield === "number" ? `${((bundle.marketPulse.summary as any).avg_yield as number).toFixed(1)}%` : "—"}
          />
          <PulseTile
            icon={Zap}
            label="Avg price"
            value={formatAed((bundle.marketPulse.summary as any)?.avg_price ?? null, "en", { compact: true, fallback: "—" })}
          />
          <PulseTile
            icon={Sparkles}
            label="BUY signals"
            value={String(bundle.marketPulse.timing_signals?.find?.((s: any) => String(s.label ?? "").toUpperCase() === "BUY")?.count ?? "—")}
          />
        </div>
      </section>

      <section aria-label="Open data surface">
        <SectionHeader
          title="Your read surface"
          subtitle="Everything here stays open to you as a signed-in user. Paid starts only when you connect your own platform and inventory."
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {publicSurfaces.map((surface) => (
            <Card key={surface.href}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="rounded-xl border border-border/60 bg-muted/40 p-2">
                    <surface.icon className="h-4 w-4 text-foreground" />
                  </div>
                  <Link href={prefixLocalePath(surface.href, locale)} className="text-xs font-semibold text-primary hover:underline">
                    Open →
                  </Link>
                </div>
                <h3 className="mt-4 font-semibold">{surface.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{surface.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-label="Your saved areas">
        <SectionHeader
          title="Areas you watch"
          subtitle="Pulse from the areas you've saved."
          action={{ label: "Browse all areas", href: prefixLocalePath("/areas", locale) }}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bundle.savedAreas.length === 0 && <EmptyTile message="No saved areas yet — add areas from a search to see their pulse here." />}
          {bundle.savedAreas.map((area) => (
            <Card key={area.slug}>
              <CardContent className="p-4">
                <div className="flex items-baseline justify-between">
                  <Link href={prefixLocalePath(`/areas/${area.slug}`, locale)} className="font-semibold hover:underline">
                    {area.name}
                  </Link>
                  <span className="text-xs text-muted-foreground">{area.pulse.avg_yield != null ? `${area.pulse.avg_yield.toFixed(1)}%` : "—"}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {formatAed(area.pulse.avg_price, "en", { compact: true, fallback: "—" })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-label="Your listings">
        <SectionHeader
          title="Your listings"
          subtitle={bundle.tier === "free" ? "Upgrade to push your own inventory." : `${bundle.listingsCount} listing${bundle.listingsCount === 1 ? "" : "s"}`}
          action={bundle.tier === "free"
            ? { label: "Upgrade", href: prefixLocalePath("/pricing", locale) }
            : { label: "Add listing", href: prefixLocalePath("/me/listings/new", locale) }}
        />
        {bundle.tier === "free" ? (
          <UpgradePanel
            headline="Connect your inventory"
            body="Push your own listings via CSV, JSON, brochure, connector, or API. We score each one with the same 5-Layer Evidence Stack used on the public site."
            href={prefixLocalePath("/pricing", locale)}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bundle.listings.length === 0 && <EmptyTile message="No listings yet — add one or connect a portal." />}
            {bundle.listings.map((listing) => (
              <Card key={listing.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={prefixLocalePath(`/me/listings/${listing.id}`, locale)} className="line-clamp-1 font-semibold hover:underline">
                      {listing.name}
                    </Link>
                    <VerdictPill verdict={listing.verdict} confidence={listing.confidence} />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">Updated {new Date(listing.updatedAt).toLocaleDateString()}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-label="Paid connection layer">
        <SectionHeader
          title="Paid connection layer"
          subtitle="Public data is open. Connections, your listings, and programmatic ownership live here."
        />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {paidLayer.map((item) => (
            <Card key={item.title}>
              <CardContent className="p-5">
                <div className="rounded-xl border border-border/60 bg-muted/40 p-2 w-fit">
                  <item.icon className="h-4 w-4 text-foreground" />
                </div>
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                <Link href={prefixLocalePath(item.href, locale)} className="mt-4 inline-flex items-center text-sm font-semibold text-primary hover:underline">
                  {item.cta} <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {businessAccount ? (
        <section aria-label="Your business account">
          <SectionHeader
            title="Your business account"
            subtitle="The wallet and the apps live on the business side of the same account — this is the live read."
            action={{ label: "Open the account", href: businessAccount.accountUrl }}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ads Coin wallet</p>
                {businessAccount.wallet ? (
                  <>
                    <p className="mt-2 text-2xl font-bold tabular-nums">AED {businessAccount.wallet.balanceAed}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{businessAccount.wallet.accountNo}</p>
                    {businessAccount.wallet.pendingTopUps > 0 ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {businessAccount.wallet.pendingTopUps === 1
                          ? "One top-up is waiting for the team's confirmation."
                          : `${businessAccount.wallet.pendingTopUps} top-ups are waiting for the team's confirmation.`}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">The wallet opens with your first top-up or app.</p>
                )}
                <a href={businessAccount.accountUrl} className="mt-4 inline-flex items-center text-sm font-semibold text-primary hover:underline">
                  Top up / see movements <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Apps on this account</p>
                {businessAccount.apps.length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Market discovery is already on. Add the selling work below — each app lands on this same account.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {businessAccount.apps.map((app) => (
                      <li key={app.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{app.name}</span>
                        <span className={`text-[11px] font-semibold uppercase tracking-wide ${app.status === "active" ? "text-emerald-500" : "text-muted-foreground"}`}>
                          {app.status === "active" ? "Active" : app.status === "declined" ? "Declined" : "Requested"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <a href={businessAccount.storeUrl} className="mt-4 inline-flex items-center text-sm font-semibold text-primary hover:underline">
                  Open the App Store <ArrowRight className="ml-1 h-4 w-4" />
                </a>
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      {businessStore ? (
        <section aria-label="Entrestate App Store">
          <SectionHeader
            title="App Store"
            subtitle="The discovery layer comes with the account. These are the working tools the business sells — one account, one place to add them."
            action={{ label: "Open the store", href: businessStore.storeUrl }}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {businessStore.products.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{product.name}</h3>
                    <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {product.status === "planned" ? "In build" : product.tier === "lite" ? "Lite" : "Full"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{product.tagline}</p>
                  {product.status === "live" ? (
                    // Phase 2's deep link: straight into the install flow, so
                    // the click that starts here lands on this same account.
                    <a
                      href={`${businessStore.storeUrl}/start?app=${product.id}`}
                      className="mt-4 inline-flex items-center text-sm font-semibold text-primary hover:underline"
                    >
                      Add to your account <ArrowRight className="ml-1 h-4 w-4" />
                    </a>
                  ) : (
                    <p className="mt-4 text-xs text-muted-foreground">Being built — it will appear here the day it opens.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-label="Alerts">
        <SectionHeader
          title="Recent alerts"
          subtitle={bundle.tier === "free" ? "Alerts unlock on paid plans once you start watching areas, projects, or listings." : "Changes on your watched areas, projects, and listings appear here first."}
          action={{
            label: bundle.tier === "free" ? "See alert plans" : "Open alerts",
            href: prefixLocalePath(bundle.tier === "free" ? "/pricing" : "/me/feed", locale),
          }}
        />
        {bundle.tier === "free" ? (
          <UpgradePanel
            headline="Turn market movement into alerts"
            body="Paid plans notify you when saved areas shift, watched projects move, or your own listings change verdict."
            href={prefixLocalePath("/pricing", locale)}
          />
        ) : bundle.alerts.length === 0 ? (
          <EmptyTile message="No alerts yet — save an area or watch a project to start receiving updates." />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {bundle.alerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-xl border border-border/60 bg-muted/40 p-2">
                      <Bell className="h-4 w-4 text-foreground" />
                    </div>
                    <span className="text-[11px] text-muted-foreground">{new Date(alert.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="mt-4 font-semibold">{alert.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{alert.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {bundle.upgradeNudge && (
        <section aria-label="Upgrade">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 rounded-md bg-gradient-to-br from-indigo-50 to-blue-50 p-6 dark:from-indigo-950/40 dark:to-blue-950/40">
              <div>
                <h3 className="font-semibold">{bundle.upgradeNudge.headline}</h3>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{bundle.upgradeNudge.body}</p>
              </div>
              <Button asChild>
                <Link href={prefixLocalePath(bundle.upgradeNudge.cta.href, locale)}>{bundle.upgradeNudge.cta.label}</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 text-sm font-bold text-white">
      {initials}
    </div>
  )
}

function PulseTile({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  )
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: { label: string; href: string } }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action ? (
        <Link href={action.href} className="text-xs font-semibold text-primary hover:underline">
          {action.label} →
        </Link>
      ) : null}
    </div>
  )
}

function EmptyTile({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-6 text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  )
}

function UpgradePanel({ headline, body, href }: { headline: string; body: string; href: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold">{headline}</h3>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{body}</p>
        <Button asChild className="mt-4">
          <Link href={href}>View plans</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
