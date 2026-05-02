import Link from "next/link"
import { ArrowRight, Sparkles, MapPin, BarChart3, Zap } from "lucide-react"
import { getPersonalHomeBundle } from "@/lib/me/personal-home"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { VerdictPill } from "@/components/me/verdict-pill"
import { formatAed } from "@/lib/format/currency"

export const dynamic = "force-dynamic"

export default async function MeHomePage() {
  const bundle = await getPersonalHomeBundle()
  if (!bundle) return null

  return (
    <div className="space-y-8">
      {/* HERO */}
      <header className="rounded-2xl border border-border bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 p-8 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-sky-300">{bundle.tier === "free" ? "Free" : bundle.tier} member</p>
            <h1 className="mt-2 text-3xl font-bold">{bundle.greeting}</h1>
            <p className="mt-2 max-w-xl text-slate-300">
              {bundle.tier === "free"
                ? "All public data is yours to read. Connect your inventory to make Entrestate work on your deals."
                : "Your inventory, your saved areas, your alerts — all in one personal site."}
            </p>
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

      {/* MARKET PULSE — personalised summary band */}
      <section aria-label="Market pulse">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

      {/* SAVED AREAS */}
      <section aria-label="Your saved areas">
        <SectionHeader title="Areas you watch" subtitle="Pulse from the areas you've saved." action={{ label: "Browse all areas", href: "/areas" }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {bundle.savedAreas.length === 0 && <EmptyTile message="No saved areas yet — add areas from a search to see their pulse here." />}
          {bundle.savedAreas.map((a) => (
            <Card key={a.slug}>
              <CardContent className="p-4">
                <div className="flex items-baseline justify-between">
                  <Link href={`/areas/${a.slug}`} className="font-semibold hover:underline">{a.name}</Link>
                  <span className="text-xs text-muted-foreground">{a.pulse.avg_yield != null ? `${a.pulse.avg_yield.toFixed(1)}%` : "—"}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{formatAed(a.pulse.avg_price, "en", { compact: true, fallback: "—" })}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* YOUR LISTINGS — paid */}
      <section aria-label="Your listings">
        <SectionHeader
          title="Your listings"
          subtitle={bundle.tier === "free" ? "Upgrade to push your own inventory." : `${bundle.listingsCount} listing${bundle.listingsCount === 1 ? "" : "s"}`}
          action={bundle.tier === "free" ? { label: "Upgrade", href: "/pricing" } : { label: "Add listing", href: "/me/listings/new" }}
        />
        {bundle.tier === "free" ? (
          <UpgradePanel
            headline="Connect your inventory"
            body="Push your own listings via CSV, JSON, brochure or portal connector. We score every one with the same 5-Layer Evidence Stack used on the public site."
            href="/pricing"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {bundle.listings.length === 0 && <EmptyTile message="No listings yet — add one or connect a portal." />}
            {bundle.listings.map((l) => (
              <Card key={l.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/me/listings/${l.id}`} className="font-semibold hover:underline line-clamp-1">{l.name}</Link>
                    <VerdictPill verdict={l.verdict} confidence={l.confidence} />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">Updated {new Date(l.updatedAt).toLocaleDateString()}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* CONNECT YOUR PLATFORM — paid */}
      <section aria-label="Connections">
        <SectionHeader title="Connect your platform" subtitle="Bayut · Property Finder · CRMs · webhooks · SFTP" action={{ label: "Open connections", href: "/me/connections" }} />
        <Card>
          <CardContent className="p-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground max-w-2xl">
              Pull listings from portals, sync deals to your CRM, or set up custom webhooks. Activity-tracked, signed payloads, audit logs.
            </p>
            <Link href="/me/connections" className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
              Set up <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* UPGRADE NUDGE — free only */}
      {bundle.upgradeNudge && (
        <section aria-label="Upgrade">
          <Card>
            <CardContent className="p-6 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 rounded-md">
              <div>
                <h3 className="font-semibold">{bundle.upgradeNudge.headline}</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{bundle.upgradeNudge.body}</p>
              </div>
              <Button asChild>
                <Link href={bundle.upgradeNudge.cta.href}>{bundle.upgradeNudge.cta.label}</Link>
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
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action && (
        <Link href={action.href} className="text-xs font-semibold text-primary hover:underline">
          {action.label} →
        </Link>
      )}
    </div>
  )
}

function EmptyTile({ message }: { message: string }) {
  return (
    <Card><CardContent className="p-6 text-sm text-muted-foreground">{message}</CardContent></Card>
  )
}

function UpgradePanel({ headline, body, href }: { headline: string; body: string; href: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold">{headline}</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{body}</p>
        <Button asChild className="mt-4">
          <Link href={href}>View plans</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
