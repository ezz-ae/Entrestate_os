import { getPersonalHomeBundle } from "@/lib/me/personal-home"
import { getBusinessStore } from "@/lib/business-store"
import { getBusinessAccountSummary } from "@/lib/business-account"
import { getPlatformMetrics } from "@/lib/platform-metrics.server"
import { coverageLabel } from "@/lib/platform-metrics"
import { formatAed } from "@/lib/format/currency"
import { getRequestLocale } from "@/i18n/request"
import { AccountHome } from "@/components/me/account-home"

export const dynamic = "force-dynamic"

/**
 * THE ACCOUNT HOME.
 *
 * The owner's ruling: the account is everything. Apps install here; the
 * workspace opens from here; the market is asked from here. And the page
 * greets a stranger, so it speaks in their nouns — see
 * lib/me/account-home-copy.ts for the words, and the words that never appear.
 *
 * This file only gathers: the personal bundle (greeting, tier, market pulse,
 * saved areas, listings, alerts), the store catalogue and the account summary
 * (both served by the business and rendered here, never kept here — phase 5
 * of docs/ACCOUNT-FOUNDATION.md on the platform side), and the DLD coverage
 * date so the market numbers say what they stand on. Fail-soft throughout: a
 * bridge that does not answer costs its door a row, never the page.
 */
export default async function MeHomePage() {
  const locale = await getRequestLocale()
  const bundle = await getPersonalHomeBundle()
  if (!bundle) return null
  const [store, account, metrics] = await Promise.all([
    getBusinessStore().catch(() => null),
    getBusinessAccountSummary().catch(() => null),
    getPlatformMetrics().catch(() => null),
  ])

  const summary = (bundle.marketPulse.summary ?? {}) as { projects?: unknown; avg_yield?: unknown; avg_price?: unknown }
  const buy = bundle.marketPulse.timing_signals?.find?.((s: { label?: unknown }) => String(s.label ?? "").toUpperCase() === "BUY") as { count?: unknown } | undefined
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null)
  const firstName = (bundle.user.name ?? "").trim().split(/\s+/)[0] || (bundle.user.email ?? "").split("@")[0] || "there"

  return (
    <AccountHome
      locale={locale}
      firstName={firstName}
      greeting={bundle.greeting}
      tier={bundle.tier}
      pulse={{
        projects: num(summary.projects) != null ? Number(summary.projects).toLocaleString("en") : "—",
        yield: num(summary.avg_yield) != null ? `${Number(summary.avg_yield).toFixed(1)}%` : "—",
        price: formatAed(num(summary.avg_price), "en", { compact: true, fallback: "—" }),
        buy: num(buy?.count) != null ? Number(buy?.count).toLocaleString("en") : "—",
        coverage: coverageLabel(metrics?.coverageThrough ?? null, locale === "ar"),
      }}
      yours={{
        savedAreas: bundle.savedAreas.map((a) => ({
          name: a.name,
          slug: a.slug,
          yieldLabel: a.pulse.avg_yield != null ? `${a.pulse.avg_yield.toFixed(1)}%` : "—",
          priceLabel: formatAed(a.pulse.avg_price, "en", { compact: true, fallback: "—" }),
        })),
        watchedProjects: bundle.watchedProjects.map((p) => ({ name: p.name, slug: p.slug })),
        listingsCount: bundle.listingsCount,
        alertsCount: bundle.alerts.length,
        apps: account?.apps.map((a) => ({ id: a.id, name: a.name, status: a.status })) ?? [],
        wallet: account?.wallet ? { balanceAed: account.wallet.balanceAed } : null,
        workspaces: account?.workspaces.map((w) => ({ company: w.company, url: w.url, enterUrl: w.enterUrl })) ?? [],
        canCreateWorkspace: account?.canCreateWorkspace ?? false,
        accountUrl: account?.accountUrl ?? null,
        storeUrl: account?.storeUrl ?? store?.storeUrl ?? null,
      }}
      store={store ? {
        storeUrl: store.storeUrl,
        products: store.products.map((p) => ({ id: p.id, name: p.name, tagline: p.tagline, status: p.status })),
      } : null}
    />
  )
}
