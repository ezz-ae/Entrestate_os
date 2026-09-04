"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowUp,
  ArrowUpRight,
  Bell,
  Building2,
  Compass,
  LayoutGrid,
  MapPin,
  Sparkles,
  Store,
  Users2,
  type LucideIcon,
} from "lucide-react"
import { useCopilot } from "@/components/copilot-provider"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"
import { ACCOUNT_HOME_COPY as C, type AccountHomeDoorId } from "@/lib/me/account-home-copy"

/**
 * THE ACCOUNT HOME — one question, one composer, seven doors, two panels.
 *
 * Same composition as the workspace home on the platform (the owner's
 * screenshot: a greeting as a question, a composer, a row of doors that each
 * open three starters, two live panels under them), because it is the same
 * person and the same account. What differs is the audience: this page is
 * the first thing a stranger sees after signing up, so every word on it is a
 * noun they already own (lib/me/account-home-copy.ts keeps the list of words
 * that never appear here).
 *
 * A starter is either an ASK — its own title is sent to the chat, so what was
 * read is what was asked — or a LINK. The doors for the market, areas,
 * developers and projects are asks; alerts, apps and the workspace are links,
 * because those are places, not questions.
 */

export type AccountHomeProps = {
  locale: AppLocale
  firstName: string
  greeting: string
  tier: "free" | "pro" | "team" | "institutional"
  pulse: {
    projects: string
    yield: string
    price: string
    buy: string
    /** "DLD transactions through 21 Aug" — null when the source has no date; then silence. */
    coverage: string | null
  }
  yours: {
    savedAreas: Array<{ name: string; slug: string; yieldLabel: string; priceLabel: string }>
    watchedProjects: Array<{ name: string; slug: string }>
    listingsCount: number
    alertsCount: number
    apps: Array<{ id: string; name: string; status: string }>
    wallet: { balanceAed: string } | null
    workspaces: Array<{ company: string; url: string; enterUrl: string }>
    canCreateWorkspace: boolean
    accountUrl: string | null
    storeUrl: string | null
  }
  store: {
    storeUrl: string
    products: Array<{ id: string; name: string; tagline: string; status: string }>
  } | null
}

type Starter = { t: string; s: string } & ({ kind: "ask" } | { kind: "href"; href: string; external?: boolean })
type Door = { id: AccountHomeDoorId; label: string; Icon: LucideIcon; starters: Starter[] }

const FULL_SYSTEM_URL = "https://entrestate.com/business"

export function AccountHome(props: AccountHomeProps) {
  const { locale, firstName, greeting, tier, pulse, yours, store } = props
  const router = useRouter()
  const { sendMessage, openSidebar } = useCopilot()
  const [value, setValue] = useState("")
  const [open, setOpen] = useState<AccountHomeDoorId | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const isFree = tier === "free"
  const L = (p: string) => prefixLocalePath(p, locale)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null) }
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(null)
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("mousedown", onDown)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("mousedown", onDown)
    }
  }, [open])

  function ask(text: string) {
    const message = text.trim()
    if (!message) return
    openSidebar()
    void sendMessage({ text: message })
    setValue("")
  }

  const asks = (id: "market" | "areas" | "developers" | "projects"): Starter[] =>
    C.doors[id].s.map((x) => ({ ...x, kind: "ask" as const }))

  const alertsHome = isFree ? L("/pricing") : L("/me/feed")
  const liveProducts = store?.products.filter((p) => p.status === "live").slice(0, 2) ?? []
  const appStarters: Starter[] = store
    ? [
        ...liveProducts.map<Starter>((p) => ({ t: p.name, s: p.tagline, kind: "href", href: `${store.storeUrl}/start?app=${p.id}`, external: true })),
        { t: C.doors.apps.seeAll, s: C.doors.apps.s[2].s, kind: "href", href: store.storeUrl, external: true },
      ]
    : C.doors.apps.s.map((x, i) =>
        i === 2 && yours.storeUrl
          ? { ...x, kind: "href" as const, href: yours.storeUrl, external: true }
          : { ...x, kind: "ask" as const },
      )

  const workspaceStarters: Starter[] = [
    ...(yours.workspaces.length > 0
      ? yours.workspaces.slice(0, 2).map<Starter>((w) => ({
          t: C.doors.workspace.open.replace("{company}", w.company),
          s: C.doors.workspace.openSub,
          kind: "href", href: w.enterUrl, external: true,
        }))
      : yours.canCreateWorkspace && yours.accountUrl
        ? [{ t: C.doors.workspace.create, s: C.doors.workspace.createSub, kind: "href" as const, href: yours.accountUrl, external: true }]
        : []),
    { t: C.doors.workspace.full, s: C.doors.workspace.fullSub, kind: "href", href: FULL_SYSTEM_URL, external: true },
  ]

  const doors: Door[] = [
    { id: "market", label: C.doors.market.label, Icon: Compass, starters: asks("market") },
    { id: "areas", label: C.doors.areas.label, Icon: MapPin, starters: asks("areas") },
    { id: "developers", label: C.doors.developers.label, Icon: Users2, starters: asks("developers") },
    { id: "projects", label: C.doors.projects.label, Icon: Building2, starters: asks("projects") },
    {
      id: "alerts", label: C.doors.alerts.label, Icon: Bell,
      starters: [
        { ...C.doors.alerts.s[0], kind: "href", href: L("/areas") },
        { ...C.doors.alerts.s[1], kind: "href", href: L("/properties") },
        { ...C.doors.alerts.s[2], kind: "href", href: alertsHome },
      ],
    },
    { id: "apps", label: C.doors.apps.label, Icon: Store, starters: appStarters },
    { id: "workspace", label: C.doors.workspace.label, Icon: LayoutGrid, starters: workspaceStarters },
  ]
  const door = doors.find((d) => d.id === open) ?? null

  function run(s: Starter) {
    setOpen(null)
    if (s.kind === "ask") { ask(s.t); return }
    if (s.external) { window.location.assign(s.href); return }
    router.push(s.href)
  }

  const yoursRows = [
    yours.savedAreas.length > 0 && { k: "areas", label: C.yoursSavedAreas, value: yours.savedAreas.slice(0, 3).map((a) => a.name).join(" · ") + (yours.savedAreas.length > 3 ? ` +${yours.savedAreas.length - 3}` : ""), href: L("/areas") },
    yours.watchedProjects.length > 0 && { k: "watched", label: C.yoursWatched, value: yours.watchedProjects.slice(0, 3).map((p) => p.name).join(" · "), href: L("/properties") },
    !isFree && { k: "listings", label: C.yoursListings, value: String(yours.listingsCount), href: L("/me/listings") },
    !isFree && yours.alertsCount > 0 && { k: "alerts", label: C.yoursAlerts, value: String(yours.alertsCount), href: L("/me/feed") },
    yours.apps.length > 0 && { k: "apps", label: C.yoursApps, value: yours.apps.map((a) => a.name).join(" · "), href: yours.accountUrl ?? undefined, external: true },
    yours.wallet && { k: "wallet", label: C.yoursWallet, value: `AED ${yours.wallet.balanceAed}`, href: yours.accountUrl ?? undefined, external: true },
    yours.workspaces.length > 0 && { k: "workspace", label: C.yoursWorkspace, value: yours.workspaces.map((w) => w.company).join(" · "), href: yours.workspaces[0].enterUrl, external: true },
  ].filter(Boolean) as Array<{ k: string; label: string; value: string; href?: string; external?: boolean }>

  return (
    <div className="mx-auto max-w-3xl">
      {/* ── The question ─────────────────────────────────────────────────── */}
      <p className="text-center text-sm text-muted-foreground">{greeting}</p>
      <h1 className="mx-auto mt-3 max-w-[24ch] text-balance text-center text-2xl font-semibold tracking-tight sm:text-[2rem] sm:leading-tight">
        {C.title.replace("{name}", firstName)}
      </h1>

      {/* ── The composer — the one chat, opened from here ─────────────────── */}
      <div
        className="mt-6 cursor-text rounded-2xl border border-border bg-card p-2 shadow-sm transition focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20"
        onClick={(e) => { if (e.target === e.currentTarget) taRef.current?.focus() }}
      >
        <div className="flex items-end gap-3 px-3 py-2">
          <Sparkles className="mt-1.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return
              e.preventDefault(); ask(value)
            }}
            rows={1}
            placeholder={C.placeholder}
            aria-label={C.placeholder}
            className="max-h-40 min-h-[2.5rem] flex-1 resize-none bg-transparent text-base leading-7 outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => ask(value)}
            disabled={!value.trim()}
            aria-label="Ask"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-30"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Seven doors ──────────────────────────────────────────────────── */}
      <div ref={rootRef} className="relative mt-8">
        {door && (
          <div
            role="dialog"
            aria-label={door.label}
            className="absolute inset-x-0 bottom-full z-20 mx-auto mb-3 w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <door.Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
              {door.label}
              <span className="ml-auto font-normal normal-case tracking-normal">{C.starters}</span>
            </div>
            <div className="p-1.5">
              {door.starters.map((s) => (
                <button
                  key={s.t}
                  type="button"
                  onClick={() => run(s)}
                  className="group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-muted/60"
                >
                  <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                    {s.kind === "href" ? <ArrowUpRight className="h-3 w-3" aria-hidden /> : <Sparkles className="h-3 w-3" aria-hidden />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{s.t}</span>
                    <span className="block text-xs leading-relaxed text-muted-foreground">{s.s}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:justify-center sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {doors.map((d) => {
            const active = open === d.id
            return (
              <button
                key={d.id}
                type="button"
                aria-expanded={active}
                aria-haspopup="dialog"
                onClick={() => setOpen(active ? null : d.id)}
                className={`flex w-[5.5rem] shrink-0 flex-col items-center gap-2 rounded-2xl px-2 py-3 transition ${active ? "bg-muted" : "hover:bg-muted/60"}`}
              >
                <span className={`grid h-11 w-11 place-items-center rounded-2xl border transition ${active ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card text-foreground"}`}>
                  <d.Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                </span>
                <span className={`text-xs ${active ? "text-foreground" : "text-muted-foreground"}`}>{d.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── The market right now · Yours ─────────────────────────────────── */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <section aria-label={C.pulseTitle} className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="px-5 pt-4 pb-3">
            <div className="text-sm font-semibold">{C.pulseTitle}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{C.pulseSub}</div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-border border-t border-border">
            {[
              { label: C.pulseProjects, value: pulse.projects },
              { label: C.pulseYield, value: pulse.yield },
              { label: C.pulsePrice, value: pulse.price },
              { label: C.pulseBuy, value: pulse.buy },
            ].map((tile) => (
              <div key={tile.label} className="px-5 py-3.5">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{tile.label}</div>
                <div className="mt-1 text-xl font-semibold tabular-nums">{tile.value}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-border px-5 py-2.5 text-xs text-muted-foreground">
            {C.pulseBasis}{pulse.coverage ? <> · {pulse.coverage}</> : null}
          </div>
        </section>

        <section aria-label={C.yoursTitle} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
          <div className="px-5 pt-4 pb-3">
            <div className="text-sm font-semibold">{C.yoursTitle}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{C.yoursSub}</div>
          </div>
          {yoursRows.length > 0 ? (
            <div className="divide-y divide-border border-t border-border">
              {yoursRows.map((r) => {
                const inner = (
                  <>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] uppercase tracking-wider text-muted-foreground">{r.label}</span>
                      <span className="block truncate text-sm">{r.value}</span>
                    </span>
                    {r.href ? <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden /> : null}
                  </>
                )
                const cls = "flex items-center gap-3 px-5 py-3 transition hover:bg-muted/60"
                if (!r.href) return <div key={r.k} className={cls}>{inner}</div>
                return r.external
                  ? <a key={r.k} href={r.href} className={cls}>{inner}</a>
                  : <Link key={r.k} href={r.href} className={cls}>{inner}</Link>
              })}
            </div>
          ) : (
            <div className="m-5 mt-1 rounded-xl border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
              {C.yoursEmpty}
            </div>
          )}
          {isFree ? (
            <div className="mt-auto flex items-center justify-between gap-3 border-t border-border px-5 py-3 text-xs text-muted-foreground">
              <span>{C.proNudge}</span>
              <Link href={L("/pricing")} className="shrink-0 font-semibold text-primary hover:underline">{C.proCta}</Link>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}
