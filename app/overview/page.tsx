import Link from "next/link"
import {
  Sparkles,
  Building2,
  Map as MapIcon,
  Users2,
  BarChart3,
  Activity,
  TrendingUp,
  ShieldCheck,
  CircleDot,
  ArrowUpRight,
  Zap,
  Target,
  Filter,
  Search,
  BookOpen,
  LayoutGrid,
  FileText,
  PenLine,
  Eye,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CopilotEntryLink } from "@/components/copilot-entry-link"
import { TrustBar } from "@/components/decision/trust-bar"
import { getInvestorProfileCounts } from "@/lib/decision-infrastructure"
import { INVESTOR_PROFILES } from "@/lib/investor-profiles"
import { formatAed } from "@/components/decision/formatters"
import { Button } from "@/components/ui/button"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath } from "@/i18n/locale"
import { getPlatformMetrics } from "@/lib/platform-metrics.server"
import { PLATFORM_METRICS_FALLBACK, coverageLabel } from "@/lib/platform-metrics"

export const dynamic = "force-dynamic"

/*
 * INTENT_FALLBACKS and INTENT_META used to live here: six hardcoded counts
 * (first_time_buyer: 3887, …) copied once from a 7,015-row ingest table and
 * printed whenever the live read returned nothing — which, on the curated
 * view, was always, because the column they counted does not exist there.
 * Against a 1,946-project total the top card read "3,887 · 200%". The
 * profiles are now definitions in lib/investor-profiles.ts, counted by
 * getInvestorProfileCounts over the same table /properties lists; when that
 * read fails the panel says so instead of printing a remembered number.
 */

const INPUT_MODULES = [
  { label: "AI Chat", labelAr: "الدردشة الذكية", description: "Get scored answers instantly", descAr: "احصل على إجابات مصنّفة فوراً", href: "/chat", icon: Sparkles, accent: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-200/60 dark:border-blue-500/20", tag: "Decision engine", tagAr: "محرك القرار" },
  { label: "Workspace", labelAr: "مساحة العمل", description: "Your guided hub for market work", descAr: "المركز الموجّه للعمل اليومي في السوق", href: "/workspace", icon: LayoutGrid, accent: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-500/10", border: "border-cyan-200/60 dark:border-cyan-500/20", tag: "Tools hub", tagAr: "مركز الأدوات" },
  { label: "Search & Screening", labelAr: "البحث والفرز", description: "Screen areas, projects, and developers", descAr: "افحص المناطق والمشاريع والمطورين", href: "/search", icon: Search, accent: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10", border: "border-purple-200/60 dark:border-purple-500/20", tag: "Analysis", tagAr: "تحليل" },
  { label: "Research Notebooks", labelAr: "دفاتر الأبحاث", description: "Keep briefs and market context under your account", descAr: "احفظ المذكرات وسياق السوق داخل الحساب", href: "/account/book", icon: BookOpen, accent: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10", border: "border-rose-200/60 dark:border-rose-500/20", tag: "Research", tagAr: "بحث" },
]

const OUTPUT_MODULES = [
  { label: "Properties", labelAr: "المشاريع", description: "Every project, fully scored", descAr: "كل مشروع، مصنّف بالكامل", href: "/properties", icon: Building2, accent: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10", border: "border-indigo-200/60 dark:border-indigo-500/20", tag: "Inventory", tagAr: "المخزون" },
  { label: "Areas", labelAr: "المناطق", description: "Yield & supply by location", descAr: "العائد والعرض حسب الموقع", href: "/areas", icon: MapIcon, accent: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-500/10", border: "border-teal-200/60 dark:border-teal-500/20", tag: "Geography", tagAr: "الجغرافيا" },
  { label: "Developers", labelAr: "المطورون", description: "Reliability index & track record", descAr: "مؤشر الموثوقية وسجل الأداء", href: "/developers", icon: Users2, accent: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-200/60 dark:border-violet-500/20", tag: "Counterparty", tagAr: "الطرف المقابل" },
  { label: "Market Data", labelAr: "بيانات السوق", description: "Pulse, timing, stress, supply", descAr: "نبض · توقيت · ضغط · عرض", href: "/top-data", icon: BarChart3, accent: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-200/60 dark:border-amber-500/20", tag: "Intelligence", tagAr: "استخبارات" },
  { label: "Market Score", labelAr: "قراءة السوق", description: "Score validation & match checks", descAr: "تحقق من الدرجة والملاءمة", href: "/market-score", icon: ShieldCheck, accent: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", border: "border-emerald-200/60 dark:border-emerald-500/20", tag: "Validation", tagAr: "تحقق" },
  { label: "Reports", labelAr: "التقارير", description: "Institutional briefs and research", descAr: "تقارير ومذكرات مؤسسية", href: "/reports/library", icon: FileText, accent: "text-sky-600 dark:text-sky-400", bg: "bg-sky-50 dark:bg-sky-500/10", border: "border-sky-200/60 dark:border-sky-500/20", tag: "Output", tagAr: "المخرجات" },
]

const QUICK_FILTERS = [
  { label: "BUY signal · Grade A", labelAr: "إشارة BUY · درجة A", href: "/properties?timing=BUY&stress=A", color: "border-emerald-400/40 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/15" },
  { label: "High yield >6%", labelAr: "عائد مرتفع >6%", href: "/properties?yieldMin=6", color: "border-amber-400/40 text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/15" },
  { label: "Golden Visa eligible", labelAr: "مؤهّل للإقامة الذهبية", href: "/properties?intent=golden_visa", color: "border-violet-400/40 text-violet-700 bg-violet-50 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:hover:bg-violet-500/15" },
  { label: "Conservative · Grade A/B", labelAr: "متحفّظ · درجة A/B", href: "/properties?intent=conservative", color: "border-blue-400/40 text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/15" },
  { label: "First-Time Buyer", labelAr: "المشتري الأول", href: "/properties?intent=first_time_buyer", color: "border-sky-400/40 text-sky-700 bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-500/15" },
]

/*
 * marketSentiment() used to live here: "Bullish" above 38% BUY, "Neutral"
 * above 28%, "Cautious" below — three opinion words on two thresholds nobody
 * documented, pulsing in green at the top of the Decision Terminal. The
 * product computes; it does not hold a view. The header now states the
 * distribution itself, which is the only honest form of that badge.
 */

/*
 * formatRelativeTime() used to live here and was deleted, not repaired.
 *
 * It measured `Date.now()` against `homepage.data_as_of`, and every read model
 * in lib/decision-infrastructure.ts stamps that field with `new Date()`. So the
 * difference was always under an hour and the Decision Terminal header always
 * said "Updated just now" — and when the read failed outright it said
 * "Recently updated", which is a claim with no reading behind it at all.
 *
 * There is no version of a relative time that is honest here, because the input
 * was never a measurement. The header now states the DLD coverage boundary from
 * PlatformMetrics.coverageThrough, and renders nothing when that is unknown.
 */

type Share = { label: string; count: number; pct: number }

function pctOf(count: number, total: number) {
  return total > 0 ? (count / total) * 100 : 0
}

/** The header's one line: what the V1 engine says about the whole inventory, as shares. */
function generateInsight(shares: Share[], avgYield: number | null, highConfidencePct: number, topProfile: string | null, isArabic: boolean) {
  const parts: string[] = [shares.map((s) => `${s.label} ${s.pct.toFixed(0)}%`).join(" · ")]
  if (avgYield !== null) parts.push(isArabic ? `متوسط العائد ${avgYield.toFixed(1)}%` : `avg yield ${avgYield.toFixed(1)}%`)
  parts.push(isArabic ? `${highConfidencePct.toFixed(0)}% ثقة سعر عالية` : `${highConfidencePct.toFixed(0)}% HIGH confidence`)
  if (topProfile) parts.push(isArabic ? `أكبر ملف — ${topProfile}` : `largest profile — ${topProfile}`)
  return parts.join(" · ")
}

export default async function OverviewPage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const [pulse, profiles] = await Promise.all([
    getPlatformMetrics().catch(() => PLATFORM_METRICS_FALLBACK),
    getInvestorProfileCounts().catch(() => null),
  ])

  const totalProjects = pulse.totalProjects
  const highConfidence = pulse.highConfidence
  const buySignals = pulse.buySignals
  const avgPrice = pulse.avgPrice
  const avgYield = pulse.avgYield
  const highConfidencePct = pctOf(highConfidence, totalProjects)
  const buyPct = pctOf(buySignals, totalProjects)

  // Every bar is a COUNT from the metrics source. Until 2026-09-05 HOLD and
  // WAIT were `Math.round(notBuy * 0.45)` and the remainder — an estimate
  // dressed as a reading, on a page whose footer says "no black-box scores".
  const timingBars = [
    { label: "BUY", count: buySignals, pct: buyPct, bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", desc: isArabic ? "نافذة دخول مفتوحة" : "Active entry window", href: "/properties?timing=BUY" },
    { label: "HOLD", count: pulse.holdSignals, pct: pctOf(pulse.holdSignals, totalProjects), bar: "bg-amber-400", text: "text-amber-600 dark:text-amber-400", desc: isArabic ? "راقب، ليس بعد" : "Monitor, not yet", href: "/properties?timing=HOLD" },
    { label: "WAIT", count: pulse.waitSignals, pct: pctOf(pulse.waitSignals, totalProjects), bar: "bg-orange-400", text: "text-orange-600 dark:text-orange-400", desc: isArabic ? "خارج النافذة" : "Outside the window", href: "/properties?timing=WAIT" },
    { label: "AVOID", count: pulse.avoidSignals, pct: pctOf(pulse.avoidSignals, totalProjects), bar: "bg-red-400", text: "text-red-600 dark:text-red-400", desc: isArabic ? "دون حدّ المحرك" : "Fails the engine's floor", href: "/properties?timing=AVOID" },
  ]

  // Profiles: a count per definition, from the same table /properties lists.
  // Null means the read failed and the panel says so — never a remembered number.
  const profileCards = profiles
    ? INVESTOR_PROFILES.map((profile) => ({
        ...profile,
        count: profiles.counts.find((c) => c.key === profile.key)?.count ?? 0,
      })).sort((a, b) => b.count - a.count)
    : null
  const topProfile = profileCards?.[0] ? (isArabic ? profileCards[0].labelAr : profileCards[0].label) : null

  const insightText = generateInsight(
    timingBars.map((t) => ({ label: t.label, count: t.count, pct: t.pct })),
    avgYield,
    highConfidencePct,
    topProfile,
    isArabic,
  )
  const updatedLabel = coverageLabel(pulse.coverageThrough, isArabic)

  const safeInt = (n: any) => {
    const v = Number(n)
    return isNaN(v) ? 0 : Math.floor(Math.abs(v))
  }

  const kpis = [
    { label: isArabic ? "إجمالي المشاريع" : "Total Projects", value: safeInt(totalProjects).toLocaleString(), icon: Building2, iconClass: "text-primary", sub: isArabic ? "المخزون المنقّح" : "Curated inventory", href: "/properties" },
    { label: isArabic ? "إشارات BUY" : "BUY Signals", value: safeInt(buySignals).toLocaleString(), icon: TrendingUp, iconClass: "text-emerald-600 dark:text-emerald-400", sub: isArabic ? `${buyPct.toFixed(0)}% من المخزون` : `${buyPct.toFixed(0)}% of total inventory`, href: "/properties?timing=BUY" },
    { label: isArabic ? "ثقة سعر عالية" : "HIGH Confidence", value: safeInt(highConfidence).toLocaleString(), icon: ShieldCheck, iconClass: "text-blue-600 dark:text-blue-400", sub: isArabic ? `${highConfidencePct.toFixed(0)}% من المشاريع` : `${highConfidencePct.toFixed(0)}% of scored projects`, href: "/properties" },
    { label: isArabic ? "متوسط سعر الدخول" : "Avg Entry Price", value: formatAed(avgPrice), icon: CircleDot, iconClass: "text-violet-600 dark:text-violet-400", sub: isArabic ? "متوسط عبر المشاريع المقيّمة" : "Mean across scored projects", href: "/properties" },
    { label: isArabic ? "متوسط العائد الإجمالي" : "Avg Gross Yield", value: typeof avgYield === "number" ? `${avgYield.toFixed(1)}%` : "—", icon: BarChart3, iconClass: "text-amber-600 dark:text-amber-400", sub: isArabic ? "عبر المشاريع المقيّمة" : "Across scored projects", href: "/top-data" },
  ]

  return (
    <main id="main-content" dir={isArabic ? "rtl" : "ltr"}>
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-32">
        <header className="mb-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">UAE Real Estate</p>
                {/* The separator belongs to the label, so a missing coverage
                    date leaves no orphaned dot hanging after the eyebrow. */}
                {updatedLabel ? (
                  <>
                    <span className="text-muted-foreground/30">·</span>
                    <p className="text-xs text-muted-foreground">{updatedLabel}</p>
                  </>
                ) : null}
              </div>
              <h1 className="mt-1.5 text-2xl font-bold text-foreground md:text-3xl tracking-tight">{isArabic ? "محطة القرار" : "Decision Terminal"}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="intelligent" size="sm" asChild className="h-9 shadow-lg">
                <CopilotEntryLink>
                  <Sparkles className="h-3.5 w-3.5 me-1" />
                  {isArabic ? "افتح المحطة" : "Open Terminal"}
                </CopilotEntryLink>
              </Button>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5">
            <Zap className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">{insightText}</p>
          </div>
        </header>

        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {kpis.map((kpi) => {
            const Icon = kpi.icon
            return (
              <Link key={kpi.label} href={prefixLocalePath(kpi.href, locale)} className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)]">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
                  <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${kpi.iconClass}`} />
                </div>
                <p className="mt-3 text-2xl font-bold tabular-nums text-foreground">{kpi.value}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{kpi.sub}</p>
              </Link>
            )
          })}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            <Filter className="h-3 w-3" />
            {isArabic ? "فلاتر سريعة" : "Quick filters"}
          </span>
          {QUICK_FILTERS.map((f) => (
            <Link key={f.label} href={prefixLocalePath(f.href, locale)} className={`rounded-full border px-3 py-1 text-[11px] font-medium transition ${f.color}`}>{isArabic ? f.labelAr : f.label}</Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <article className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">{isArabic ? "إشارات توقيت السوق" : "Market Timing Signals"}</h2>
                <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">{isArabic ? "محرك V1 · إشارة التوقيت" : "V1 engine · timing signal"}</span>
              </div>
              <p className="mb-4 text-[11px] text-muted-foreground">{safeInt(totalProjects).toLocaleString()} {isArabic ? "مشروعاً مقيّماً" : "projects scored"}</p>
              <div className="space-y-4">
                {timingBars.map((t) => (
                  <Link key={t.label} href={prefixLocalePath(t.href, locale)} className="block rounded-lg transition hover:bg-muted/30">
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${t.text}`}>{t.label}</span>
                        <span className="text-[10px] text-muted-foreground">{t.desc}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold tabular-nums text-foreground">{safeInt(t.count).toLocaleString()}</span>
                        <span className="ms-1 text-[10px] text-muted-foreground">({(isNaN(t.pct) ? 0 : t.pct).toFixed(0)}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50">
                      <div className={`h-full rounded-full ${t.bar}`} style={{ width: `${Math.min(100, t.pct)}%` }} />
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-4 border-t border-border/60 pt-3">
                <Link href={prefixLocalePath("/properties?timing=BUY", locale)} className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
                  {isArabic ? "عرض كل المشاريع المصنفة BUY" : "View all BUY-rated projects"} <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </article>
            <article className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">{isArabic ? "جودة البيانات" : "Data Quality"}</h2>
                <span className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">{highConfidencePct.toFixed(0)}% {isArabic ? "ثقة سعر عالية" : "HIGH confidence"}</span>
              </div>
              <TrustBar verifiedRows={totalProjects} highConfidencePct={highConfidencePct} coverage={updatedLabel} />
              <div className="mt-3 grid grid-cols-5 gap-0.5 overflow-hidden rounded-lg">
                {(["L1", "L2", "L3", "L4", "L5"] as const).map((layer, i) => (
                  <div key={layer} className="flex flex-col items-center py-2" style={{ background: `rgba(59,130,246,${0.18 - i * 0.03})` }}>
                    <span className="text-[9px] font-bold text-blue-700 dark:text-blue-300">{layer}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">{isArabic ? "مرجعي ← مشتق ← ديناميكي ← خارجي ← خام" : "Canonical → Derived → Dynamic → External → Raw"}</p>
            </article>
          </div>

          <div className="flex flex-col gap-4">
            {/* INPUT — Ask & Create */}
            <div>
              <div className="mb-2.5 flex items-center gap-2">
                <PenLine className="h-3.5 w-3.5 text-primary" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{isArabic ? "اسأل وأنشئ" : "Ask & Create"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {INPUT_MODULES.map((mod) => {
                  const Icon = mod.icon
                  const className = `group flex flex-col justify-between rounded-2xl border ${mod.border} ${mod.bg} p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)]`
                  const content = (
                    <>
                      <div className="flex items-start justify-between">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${mod.border} bg-white/60 dark:bg-black/20`}>
                          <Icon className={`h-4 w-4 ${mod.accent}`} />
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <div className="mt-6">
                        <span className={`mb-1 inline-block rounded-full border ${mod.border} px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider ${mod.accent} opacity-70`}>{isArabic ? mod.tagAr : mod.tag}</span>
                        <p className="text-sm font-semibold text-foreground">{isArabic ? mod.labelAr : mod.label}</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{isArabic ? mod.descAr : mod.description}</p>
                      </div>
                    </>
                  )

                  return mod.href === "/chat" ? (
                    <CopilotEntryLink key={mod.label} className={className}>
                      {content}
                    </CopilotEntryLink>
                  ) : (
                    <Link key={mod.label} href={prefixLocalePath(mod.href, locale)} className={className}>
                      {content}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* OUTPUT — View & Analyze */}
            <div>
              <div className="mb-2.5 flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">{isArabic ? "عرض وتحليل" : "View & Analyze"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {OUTPUT_MODULES.map((mod) => {
                  const Icon = mod.icon
                  return (
                    <Link key={mod.label} href={prefixLocalePath(mod.href, locale)} className={`group flex flex-col justify-between rounded-2xl border ${mod.border} ${mod.bg} p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)]`}>
                      <div className="flex items-start justify-between">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${mod.border} bg-white/60 dark:bg-black/20`}>
                          <Icon className={`h-4 w-4 ${mod.accent}`} />
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/30 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <div className="mt-6">
                        <span className={`mb-1 inline-block rounded-full border ${mod.border} px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider ${mod.accent} opacity-70`}>{isArabic ? mod.tagAr : mod.tag}</span>
                        <p className="text-sm font-semibold text-foreground">{isArabic ? mod.labelAr : mod.label}</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{isArabic ? mod.descAr : mod.description}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          <article className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">{isArabic ? "ملفات المستثمرين" : "Investor Profiles"}</h2>
              <Target className="h-4 w-4 text-muted-foreground/50" />
            </div>
            <p className="mb-4 text-[11px] text-muted-foreground">{isArabic ? "تصفّح المخزون حسب هدف الاستثمار" : "Browse inventory by investment goal"}</p>
            {profileCards ? (
              <div className="space-y-2">
                {profileCards.map((profile, i) => {
                  const pct = Math.min(100, pctOf(profile.count, totalProjects))
                  const maxCount = profileCards[0].count
                  const barPct = maxCount > 0 ? (profile.count / maxCount) * 100 : 0
                  return (
                    <Link key={profile.key} href={prefixLocalePath(`/properties?intent=${encodeURIComponent(profile.key)}`, locale)} className="group block rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 transition-all duration-200 hover:border-primary/40 hover:bg-primary/5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {i === 0 ? <span className="rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">TOP</span> : null}
                            <span className="truncate text-xs font-semibold text-foreground">{isArabic ? profile.labelAr : profile.label}</span>
                          </div>
                          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{isArabic ? profile.ruleAr : profile.rule}</p>
                        </div>
                        <div className="flex flex-shrink-0 flex-col items-end gap-1">
                          <span className="text-sm font-bold tabular-nums text-foreground">{safeInt(profile.count).toLocaleString()}</span>
                          <span className="text-[10px] text-muted-foreground">{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted/60">
                        <div className="h-full rounded-full bg-primary/50 transition-all group-hover:bg-primary" style={{ width: `${barPct}%` }} />
                      </div>
                    </Link>
                  )
                })}
                <p className="pt-1 text-[10px] text-muted-foreground">
                  {isArabic
                    ? "كل ملف هو قاعدة واحدة مطبّقة على المخزون المنقّح؛ المشروع الواحد قد يقع في أكثر من ملف."
                    : "Each profile is one rule applied to the curated inventory; a project can sit in more than one."}
                </p>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border/60 px-3 py-4 text-[11px] text-muted-foreground">
                {isArabic ? "تعذّرت قراءة الملفات الآن — لا أرقام بدون قراءة." : "The profiles could not be read just now — no figures without a reading."}
              </p>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
              <Link href={prefixLocalePath("/properties", locale)} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">{isArabic ? "تصفح كل المشاريع" : "Browse all projects"} <ArrowUpRight className="h-3 w-3" /></Link>
              <CopilotEntryLink className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><Sparkles className="h-3 w-3" />{isArabic ? "افتح الدردشة الذكية" : "Open AI chat"}</CopilotEntryLink>
            </div>
          </article>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <CopilotEntryLink className="group flex items-center justify-between rounded-2xl border border-primary/25 bg-primary/5 px-5 py-4 transition-all hover:bg-primary/10 hover:-translate-y-0.5">
            <div>
              <p className="text-sm font-semibold text-foreground">{isArabic ? "دردشة القرار الذكية" : "AI Decision Chat"}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{isArabic ? "قائمة مختصرة · مقارنة · مراجعة V1" : "Shortlist · Compare · Review V1"}</p>
            </div>
            <div className="ms-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md transition group-hover:scale-105">
              <Sparkles className="h-4 w-4" />
            </div>
          </CopilotEntryLink>
          <Link href={prefixLocalePath("/workspace", locale)} className="group flex items-center justify-between rounded-2xl border border-cyan-500/25 bg-cyan-500/5 px-5 py-4 transition-all hover:bg-cyan-500/10 hover:-translate-y-0.5">
            <div>
              <p className="text-sm font-semibold text-foreground">{isArabic ? "مساحة العمل" : "Investor Workspace"}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{isArabic ? "بحث · دفاتر · مقارنات · تقارير" : "Search · Notebooks · Comparisons · Reports"}</p>
            </div>
            <div className="ms-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 transition group-hover:bg-cyan-500/20">
              <LayoutGrid className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            </div>
          </Link>
          <Link href={prefixLocalePath("/top-data", locale)} className="group flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.10)]">
            <div>
              <p className="text-sm font-semibold text-foreground">{isArabic ? "لوحة السوق" : "Market Intelligence"}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{isArabic ? "نبض · توقيت · ضغط · عمق" : "Pulse · Timing · Stress · Depth"}</p>
            </div>
            <div className="ms-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 transition group-hover:bg-muted/70">
              <BarChart3 className="h-4 w-4 text-foreground" />
            </div>
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  )
}
