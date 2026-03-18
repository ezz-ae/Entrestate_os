import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { DeveloperCard } from "@/components/decision/developer-card"
import { listDevelopers } from "@/lib/decision-infrastructure"
import { TrendingUp, Building2, BarChart3, ShieldCheck, Users2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"
import { formatAed } from "@/lib/format/currency"
import { formatDate } from "@/lib/format/date"
import { formatInteger } from "@/lib/format/number"

export const dynamic = "force-dynamic"

type SearchParams = { filter?: string; sort?: string }

function tierOf(score: number | null): "excellent" | "good" | "watch" | "unknown" {
  if (score === null) return "unknown"
  if (score >= 80) return "excellent"
  if (score >= 60) return "good"
  return "watch"
}

export default async function DevelopersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { filter, sort = "reliability" } = await searchParams
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const data = await listDevelopers()

  const developers = data.developers

  // Derive tier counts
  const tierCounts = { excellent: 0, good: 0, watch: 0 }
  const withRel = developers.filter((d) => typeof d.reliability === "number")
  for (const d of withRel) {
    const t = tierOf(d.reliability as number)
    if (t === "excellent") tierCounts.excellent++
    else if (t === "good") tierCounts.good++
    else if (t === "watch") tierCounts.watch++
  }
  const avgRel = withRel.length > 0
    ? withRel.reduce((sum, d) => sum + (d.reliability as number), 0) / withRel.length
    : null
  const totalDevelopersCount = developers.length
  const totalProjects = developers.reduce((sum, d) => sum + (typeof d.projects === "number" ? d.projects : 0), 0)
  const avgPrice = (() => {
    const withPrice = developers.filter((d) => typeof d.avg_price === "number" && (d.avg_price as number) > 0)
    if (withPrice.length === 0) return null
    return withPrice.reduce((sum, d) => sum + (d.avg_price as number), 0) / withPrice.length
  })()

  // Sort
  const sorted = [...developers].sort((a, b) => {
    if (sort === "projects") return (typeof b.projects === "number" ? b.projects : 0) - (typeof a.projects === "number" ? a.projects : 0)
    if (sort === "price") return (typeof b.avg_price === "number" ? b.avg_price : 0) - (typeof a.avg_price === "number" ? a.avg_price : 0)
    return (typeof b.reliability === "number" ? b.reliability : 0) - (typeof a.reliability === "number" ? a.reliability : 0)
  })

  // Apply filter
  const filtered = filter && ["excellent", "good", "watch"].includes(filter)
    ? sorted.filter((d) => tierOf(typeof d.reliability === "number" ? d.reliability as number : null) === filter)
    : sorted

  const FILTER_TABS = [
    { key: "", label: isArabic ? "كل المطورين" : "All developers", count: developers.length },
    { key: "excellent", label: isArabic ? "ممتاز" : "Excellent", count: tierCounts.excellent, dot: "bg-emerald-500" },
    { key: "good", label: isArabic ? "جيد" : "Good", count: tierCounts.good, dot: "bg-amber-500" },
    { key: "watch", label: isArabic ? "قائمة المراقبة" : "Watch list", count: tierCounts.watch, dot: "bg-red-400" },
  ]

  const SORT_OPTIONS = [
    { key: "reliability", label: isArabic ? "حسب درجة الموثوقية" : "By reliability score" },
    { key: "projects", label: isArabic ? "حسب عدد المشاريع" : "By project count" },
    { key: "price", label: isArabic ? "حسب متوسط السعر" : "By avg price" },
  ]

  const freshnessLabel = data.data_as_of
    ? formatDate(data.data_as_of, locale)
    : null

  const copy = {
    audit: isArabic ? "تدقيق الأطراف المقابلة" : "Counterparty Audit",
    titleLead: isArabic ? "موثوقية" : "Developer",
    titleAccent: isArabic ? "المطورين" : "Reliability",
    headerBody: isArabic
      ? `${formatInteger(developers.length, locale)} مطوراً نشطاً في الإمارات مع تقييم لثبات التسليم وتوزيع درجات الضغط وجودة التنفيذ التاريخية.`
      : `${formatInteger(developers.length, locale)} active UAE developers scored for delivery consistency, stress-grade distribution, and historical execution quality.`,
    freshness: isArabic ? "تحديث التدقيق" : "Audit Freshness",
    trackedDevelopers: isArabic ? "المطورون المتابعون" : "Tracked Developers",
    trackedDevelopersSub: isArabic ? "نشطون في سوق الإمارات" : "Active in UAE market",
    totalProjects: isArabic ? "إجمالي المشاريع" : "Total Projects",
    totalProjectsSub: isArabic ? "عبر جميع المحافظ" : "Across all portfolios",
    avgReliability: isArabic ? "متوسط الموثوقية" : "Avg Reliability",
    avgReliabilityGood: isArabic ? "السوق صحي" : "Market is healthy",
    avgReliabilityMixed: isArabic ? "جودة التنفيذ متفاوتة" : "Mixed execution quality",
    insufficient: isArabic ? "بيانات غير كافية" : "Insufficient data",
    avgProjectPrice: isArabic ? "متوسط سعر المشروع" : "Avg Project Price",
    avgProjectPriceSub: isArabic ? "عبر المخزون المتابع" : "Across tracked inventory",
    reliabilityDistribution: isArabic ? "توزيع الموثوقية" : "Reliability Distribution",
    reliabilityScale: isArabic ? "الدرجات ≥80 = ممتاز · 60–79 = جيد · أقل من 60 = مراقبة" : "Scores ≥80 = Excellent · 60–79 = Good · <60 = Watch",
    sort: isArabic ? "الترتيب:" : "Sort:",
    showing: isArabic
      ? `عرض ${formatInteger(filtered.length, locale)} من ${formatInteger(developers.length, locale)} مطوراً${filter ? ` · تمت التصفية حسب ${filter}` : ""}`
      : `Showing ${formatInteger(filtered.length, locale)} of ${formatInteger(developers.length, locale)} developers${filter ? ` · filtered by ${filter}` : ""}`,
    emptyTitle: isArabic ? "لا يوجد مطورون في هذا التصنيف" : "No developers in this tier",
    emptyBody: isArabic ? "جرّب فلتر آخر أو اعرض كل المطورين." : "Try a different filter or view all developers.",
    clearFilter: isArabic ? "مسح الفلتر" : "Clear filter",
  }

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">

        {/* Header */}
        <header className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/5 rounded-full border border-primary/10">
              <Users2 className="w-3 h-3" />
              {copy.audit}
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground leading-tight tracking-tight">
              {copy.titleLead} <span className="text-muted-foreground/40 italic">{copy.titleAccent}</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl font-medium leading-relaxed">
              {copy.headerBody}
            </p>
          </div>
          {freshnessLabel && (
            <div className="flex flex-col md:items-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-1">{copy.freshness}</span>
              <p className="text-xs font-bold text-foreground bg-secondary/50 px-3 py-1 rounded-lg border border-border/40">
                {freshnessLabel}
              </p>
            </div>
          )}
        </header>

        {/* Metric cards */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: copy.trackedDevelopers, value: formatInteger(totalDevelopersCount, locale), sub: copy.trackedDevelopersSub, icon: Building2, color: "text-primary" },
            { label: copy.totalProjects, value: formatInteger(totalProjects, locale), sub: copy.totalProjectsSub, icon: BarChart3, color: "text-sky-500" },
            { label: copy.avgReliability, value: avgRel !== null ? `${avgRel.toFixed(0)} / 100` : "—", sub: avgRel !== null ? (avgRel >= 70 ? copy.avgReliabilityGood : copy.avgReliabilityMixed) : copy.insufficient, icon: ShieldCheck, color: avgRel !== null ? (avgRel >= 70 ? "text-emerald-500" : "text-amber-500") : "text-muted-foreground" },
            { label: copy.avgProjectPrice, value: formatAed(avgPrice, locale, { compact: true, fallback: "—" }), sub: copy.avgProjectPriceSub, icon: TrendingUp, color: "text-violet-500" },
          ].map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} className="rounded-2xl border border-border bg-card px-5 py-4">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${card.color}`} />
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{card.label}</p>
                </div>
                <p className={`mt-2 text-2xl font-bold tabular-nums ${card.color}`}>{card.value}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{card.sub}</p>
              </div>
            )
          })}
        </div>

        {/* Reliability tier bar */}
        <div className="mb-8 rounded-2xl border border-border/60 bg-card/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">{copy.reliabilityDistribution}</p>
            <p className="text-[10px] text-muted-foreground/50">
              {copy.reliabilityScale}
            </p>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
            {developers.length > 0 && (
              <>
                <div className="bg-emerald-500 transition-all" style={{ width: `${(tierCounts.excellent / developers.length) * 100}%` }} />
                <div className="bg-amber-500 transition-all" style={{ width: `${(tierCounts.good / developers.length) * 100}%` }} />
                <div className="bg-red-400 transition-all" style={{ width: `${(tierCounts.watch / developers.length) * 100}%` }} />
              </>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-4">
            {[
              { label: isArabic ? "ممتاز" : "Excellent", count: tierCounts.excellent, color: "bg-emerald-500" },
              { label: isArabic ? "جيد" : "Good", count: tierCounts.good, color: "bg-amber-500" },
              { label: isArabic ? "مراقبة" : "Watch", count: tierCounts.watch, color: "bg-red-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${item.color}`} />
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className="text-xs font-semibold text-foreground tabular-nums">{item.count}</span>
                <span className="text-[10px] text-muted-foreground/50">
                  ({developers.length > 0 ? ((item.count / developers.length) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters + sort row */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map((tab) => {
              const isActive = (tab.key === "" && !filter) || tab.key === filter
              const href = tab.key
                ? prefixLocalePath(`/developers?filter=${tab.key}${sort !== "reliability" ? `&sort=${sort}` : ""}`, locale)
                : prefixLocalePath(`/developers${sort !== "reliability" ? `?sort=${sort}` : ""}`, locale)
              return (
                <Link
                  key={tab.key}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-foreground/30 bg-foreground text-background"
                      : "border-border/60 bg-card/70 text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                  }`}
                >
                  {(tab as { dot?: string }).dot && (
                    <span className={`h-1.5 w-1.5 rounded-full ${(tab as { dot?: string }).dot}`} />
                  )}
                  {tab.label}
                  <span className={`tabular-nums text-[10px] ${isActive ? "text-background/60" : "text-muted-foreground"}`}>
                    {formatInteger(tab.count, locale)}
                  </span>
                </Link>
              )
            })}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{copy.sort}</span>
            <div className="flex gap-1.5">
              {SORT_OPTIONS.map((opt) => {
                const isActive = sort === opt.key || (opt.key === "reliability" && !sort)
                const href = filter
                  ? prefixLocalePath(`/developers?filter=${filter}&sort=${opt.key}`, locale)
                  : prefixLocalePath(`/developers?sort=${opt.key}`, locale)
                return (
                  <Link
                    key={opt.key}
                    href={href}
                    className={`rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                      isActive
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border/50 bg-card/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Showing count */}
        <p className="mb-4 text-xs text-muted-foreground/60">
          {copy.showing}
        </p>

        {/* Cards grid */}
        <section className="relative grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_50%_-10%,rgba(99,102,241,0.12),transparent_58%)]" />
          {filtered.map((developer) => (
            <DeveloperCard
              key={String(developer.slug)}
              slug={String(developer.slug)}
              developer={String(developer.developer ?? "Developer")}
              developer_ar={typeof developer.developer_ar === "string" ? developer.developer_ar : null}
              projects={typeof developer.projects === "number" ? developer.projects : null}
              reliability={typeof developer.reliability === "number" ? developer.reliability : null}
              avg_price={typeof developer.avg_price === "number" ? developer.avg_price : null}
              logo_url={typeof developer.logo_url === "string" ? developer.logo_url : null}
              top_areas={
                Array.isArray(developer.top_areas)
                  ? developer.top_areas.filter((item): item is string => typeof item === "string")
                  : null
              }
              top_projects={
                Array.isArray(developer.top_projects)
                  ? developer.top_projects.filter((item): item is string => typeof item === "string")
                  : null
              }
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 rounded-2xl border border-dashed border-border/60 bg-card/40 px-6 py-16 text-center">
              <p className="text-sm font-medium text-foreground">{copy.emptyTitle}</p>
              <p className="mt-1 text-xs text-muted-foreground">{copy.emptyBody}</p>
              <Link href={prefixLocalePath("/developers", locale)} className="mt-4 inline-block rounded-full border border-border/60 bg-card px-4 py-2 text-xs text-foreground transition hover:border-primary/40">
                {copy.clearFilter}
              </Link>
            </div>
          )}
        </section>
      </div>
      <Footer />
    </main>
  )
}
