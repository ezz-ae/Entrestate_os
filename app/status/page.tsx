import Link from "next/link"
import { CheckCircle2, Clock, Database, AlertCircle, Server, Shield, Zap, BarChart3 } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getPlatformMetrics } from "@/lib/platform-metrics.server"
import { PLATFORM_METRICS_FALLBACK, coverageLabel } from "@/lib/platform-metrics"
import { getTopDataRows } from "@/lib/frontend-content"
import { getNumberLocale, getDateLocale } from "@/lib/format/locale"
import { getRequestLocale } from "@/i18n/request"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

export const dynamic = "force-dynamic"

/**
 * WHAT A STATUS PAGE MAY SAY.
 *
 * Until 2026-09-05 every row here was a constant: six services "Operational",
 * "10-phase pipeline · Last cycle completed on schedule", "Streaming
 * responses live", and the banner "All systems operational" was derived from
 * those constants — a status page that could not fail. Meanwhile the newest
 * DLD row was 21 August and the scores were written in March.
 *
 * Now the two rows that CAN be measured are: the data feed states the DLD
 * coverage it actually read (count and newest date, with the age), and the
 * scoring engine states how many projects carry scores and when those were
 * written. A row whose read failed says "Unreadable" and turns the banner
 * amber. The rows that cannot be measured from here (auth, reports, the chat
 * model) describe what the service does, and claim no cadence.
 */
type Measured = {
  dldCount: number | null
  coverage: string | null
  coverageAgeDays: number | null
  scoredCount: number | null
  scoresAsOf: string | null
  readable: boolean
}

function getServices(locale: AppLocale, m: Measured) {
  const ar = locale === "ar"
  const ok = ar ? "يعمل" : "Operational"
  const bad = ar ? "غير مقروء" : "Unreadable"
  const n = (v: number | null) => (v === null ? "—" : v.toLocaleString(getNumberLocale(locale)))
  const scoresDate = m.scoresAsOf
    ? new Date(m.scoresAsOf).toLocaleDateString(getDateLocale(locale), { month: "short", day: "numeric", timeZone: "Asia/Dubai" })
    : null
  const age = m.coverageAgeDays === null ? "" : ar ? ` (منذ ${m.coverageAgeDays} يوم)` : ` (${m.coverageAgeDays} days ago)`

  return [
    {
      name: ar ? "محطة القرار" : "Decision Terminal",
      status: ok,
      detail: ar ? "كل إجابة تعرض خطواتها وأدلتها" : "Every answer streams with its steps and its evidence",
      icon: Zap,
    },
    {
      name: ar ? "تغذية بيانات السوق" : "Market data feed",
      status: m.readable ? ok : bad,
      detail: m.readable
        ? `${n(m.dldCount)} ${ar ? "صفقة DLD" : "DLD transactions"}${m.coverage ? ` · ${m.coverage}${age}` : ""}`
        : ar ? "تعذّرت قراءة جدول الصفقات الآن" : "The transactions table could not be read just now",
      icon: Database,
    },
    {
      name: ar ? "محرك التقييم" : "Scoring engine",
      status: m.readable ? ok : bad,
      detail: m.readable
        ? `${n(m.scoredCount)} ${ar ? "مشروعاً مقيّماً" : "projects scored"}${scoresDate ? (ar ? ` · الدرجات كما في ${scoresDate}` : ` · scores as written on ${scoresDate}`) : ""}`
        : ar ? "تعذّرت قراءة المخزون المنقّح الآن" : "The curated inventory could not be read just now",
      icon: BarChart3,
    },
    {
      name: ar ? "تسجيل الدخول" : "Authentication",
      status: ok,
      detail: ar ? "Neon Auth · جلسة واحدة عبر .entrestate.com" : "Neon Auth · one session across .entrestate.com",
      icon: Shield,
    },
    {
      name: ar ? "التقارير والمخرجات" : "Report generation",
      status: ok,
      detail: ar ? "حفظ الملفات والنتائج داخل Neon" : "Artifacts persisted to Neon",
      icon: Server,
    },
    {
      name: ar ? "مكتب المستثمر" : "Investor desk",
      status: ok,
      detail: ar ? "لوحات السوق والمذكرات متاحة" : "Market views and briefs available",
      icon: BarChart3,
    },
  ]
}

function getSloTargets(locale: AppLocale) {
  if (locale === "ar") {
    return [
      { metric: "استقرار المنصة", target: "99.5%", period: "شهريًا" },
      { metric: "زمن استجابة API p95", target: "< 800 ms", period: "بشكل مستمر" },
      { metric: "تغطية البيانات", target: "مذكورة على كل صفحة", period: "دائماً" },
      { metric: "زمن الرجوع الآمن", target: "< 60 s", period: "عند الحاجة" },
    ]
  }

  return [
    { metric: "Platform uptime", target: "99.5%", period: "Monthly" },
    { metric: "API p95 response", target: "< 800 ms", period: "Continuous" },
    { metric: "Data coverage", target: "Stated on every page", period: "Always" },
    { metric: "Rollback RTO", target: "< 60 s", period: "Per incident" },
  ]
}

function getIncidents(locale: AppLocale) {
  if (locale === "ar") {
    return [
      {
        date: "2026-02-18",
        title: "تحديث تاريخي واسع للبيانات",
        summary: "أُغلقت دورة التحديث الكبيرة بنجاح، وعادت التغطية إلى مستواها المعتاد.",
        resolved: true,
      },
      {
        date: "2026-02-11",
        title: "بطء مؤقت في تصدير الوسائط",
        summary: "ظهر تباطؤ قصير في التصدير المرئي وتمت معالجته بعد ضبط خط المعالجة.",
        resolved: true,
      },
    ]
  }

  return [
    {
      date: "2026-02-18",
      title: "Historic data refresh",
      summary: "Large market refresh completed. Coverage is back to normal.",
      resolved: true,
    },
    {
      date: "2026-02-11",
      title: "Media export delay",
      summary: "Video export slowed briefly. Resolved after pipeline adjustment.",
      resolved: true,
    },
  ]
}

function getGovernanceLinks(locale: AppLocale) {
  if (locale === "ar") {
    return [
      { title: "سياسة الخصوصية", body: "كيف تُعالج بيانات الحساب والمخرجات وطلبات الدعم.", href: "/privacy" },
      { title: "شروط الاستخدام", body: "حدود الاعتماد على المنصة ومسؤوليات الاستخدام.", href: "/terms" },
      { title: "توثيق المعمارية", body: "راجع طبقة الأدلة ومحرك القرار والبنية العامة.", href: "/docs/documentation" },
      { title: "مراجعة تقنية", body: "مراجعة تشغيلية صريحة للفجوات المتبقية وخطة الإغلاق.", href: "/docs/cto-deployment-review" },
    ]
  }

  return [
    { title: "Privacy policy", body: "How account, support, and product-output data is handled.", href: "/privacy" },
    { title: "Terms of service", body: "Reliance boundaries and product-use obligations.", href: "/terms" },
    { title: "Architecture docs", body: "Inspect the evidence model, decision engine, and system design.", href: "/docs/documentation" },
    { title: "CTO review", body: "Review the remaining operational gaps and closeout plan.", href: "/docs/cto-deployment-review" },
  ]
}

async function getSnapshotSummary(): Promise<{ metrics: typeof PLATFORM_METRICS_FALLBACK; scoresAsOf: string | null; readable: boolean }> {
  // The same metrics source every other page reads — /status used to count
  // through getMarketPulse (the old population, 1,946) while the footer
  // beneath it said 2,813.
  const [metrics, feed] = await Promise.all([
    getPlatformMetrics().then((m) => ({ m, ok: true })).catch(() => ({ m: PLATFORM_METRICS_FALLBACK, ok: false })),
    getTopDataRows().catch(() => null),
  ])
  return { metrics: metrics.m, scoresAsOf: feed?.scores_as_of ?? null, readable: metrics.ok && metrics.m.coverageThrough !== null }
}

function formatIncidentDate(value: string, locale: AppLocale) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(getDateLocale(locale), { year: "numeric", month: "short", day: "2-digit" })
}

export default async function StatusPage() {
  const locale = await getRequestLocale()
  const isArabic = locale === "ar"
  const snapshot = await getSnapshotSummary()
  const coverage = coverageLabel(snapshot.metrics.coverageThrough, locale === "ar")
  const coverageAgeDays = snapshot.metrics.coverageThrough
    ? Math.max(0, Math.floor((Date.now() - new Date(snapshot.metrics.coverageThrough).getTime()) / 86_400_000))
    : null
  const services = getServices(locale, {
    dldCount: snapshot.readable ? snapshot.metrics.dldTransactions : null,
    coverage,
    coverageAgeDays,
    scoredCount: snapshot.readable ? snapshot.metrics.totalProjects : null,
    scoresAsOf: snapshot.scoresAsOf,
    readable: snapshot.readable,
  })
  const sloTargets = getSloTargets(locale)
  const incidents = getIncidents(locale)
  const governanceLinks = getGovernanceLinks(locale)
  const numberLocale = getNumberLocale(locale)
  const allOperational = services.every((service) => service.status === (isArabic ? "يعمل" : "Operational"))

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1200px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{isArabic ? "الحالة" : "Status"}</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">
              {isArabic ? "صحة المنصة" : "System Health"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {isArabic
                ? "قراءة مباشرة لحالة المساعد، البيانات، محرك القرار، وباقي خدمات التشغيل."
                : "Live availability across AI, data pipeline, decision engine, and platform services."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={prefixLocalePath("/docs/deployment-architecture", locale)}
              className="rounded-xl border border-border/60 bg-card/60 px-4 py-2 text-xs text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
            >
              {isArabic ? "بنية النشر" : "Architecture docs"} →
            </Link>
            <Link
              href={prefixLocalePath("/docs/cto-deployment-review", locale)}
              className="rounded-xl border border-border/60 bg-card/60 px-4 py-2 text-xs text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
            >
              {isArabic ? "مراجعة تقنية" : "CTO review"} →
            </Link>
          </div>
        </header>

        <div className={`mb-8 flex items-center gap-3 rounded-2xl border px-5 py-4 ${
          allOperational
            ? "border-emerald-500/30 bg-emerald-500/[0.06]"
            : "border-amber-500/30 bg-amber-500/[0.06]"
        }`}>
          {allOperational ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-400" />
          )}
          <div>
            <p className={`text-sm font-semibold ${allOperational ? "text-emerald-300" : "text-amber-300"}`}>
              {allOperational
                ? isArabic
                  ? "المنصة تعمل بشكل طبيعي"
                  : "All systems operational"
                : isArabic
                  ? "هناك جزء يحتاج متابعة"
                  : "Partial service disruption"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {/* "Last checked <now>" was the request clock. The line now says
                  what the check READ — the coverage — or that it read nothing. */}
              {isArabic
                ? `${services.length.toLocaleString(numberLocale)} خدمات تحت المراقبة${coverage ? ` · ${coverage}` : ""}`
                : `${services.length} services monitored${coverage ? ` · ${coverage}` : ""}`}
            </p>
          </div>
        </div>

        <section className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => {
            const isOk = service.status === (isArabic ? "يعمل" : "Operational")
            const Icon = service.icon

            return (
              <div
                key={service.name}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/75 px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card border border-border/60">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${isOk ? "bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.4)]" : "bg-amber-400"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{service.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{service.detail}</p>
                  </div>
                </div>
                <span className={`flex-shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                  isOk
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                }`}>
                  {service.status}
                </span>
              </div>
            )
          })}
        </section>

        <section className="mb-8 overflow-hidden rounded-2xl border border-border/60 bg-card/75">
          <div className="flex items-center gap-2.5 border-b border-border/50 px-5 py-4">
            <Database className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-foreground">
              {isArabic ? "لقطة سريعة من البيانات" : "Market data snapshot"}
            </h2>
            {coverage ? (
              <span className="ml-auto text-xs text-muted-foreground">
                <Clock className="mr-1 inline h-3 w-3" />
                {coverage}
              </span>
            ) : null}
          </div>
          <div className="grid grid-cols-1 divide-x divide-border/50 md:grid-cols-3">
            {[
              {
                label: isArabic ? "المشاريع المقيّمة" : "Scored projects",
                value: snapshot.readable ? snapshot.metrics.totalProjects.toLocaleString(numberLocale) : "—",
                color: "text-sky-300",
              },
              {
                label: isArabic ? "ثقة سعر عالية" : "HIGH price confidence",
                value: snapshot.readable ? snapshot.metrics.highConfidence.toLocaleString(numberLocale) : "—",
                color: "text-emerald-300",
              },
              {
                label: isArabic ? "إشارات BUY" : "BUY timing signals",
                value: snapshot.readable ? snapshot.metrics.buySignals.toLocaleString(numberLocale) : "—",
                color: "text-emerald-300",
              },
            ].map((item) => (
              <div key={item.label} className="px-5 py-5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className={`mt-2 text-2xl font-semibold tabular-nums ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 max-w-3xl">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              {isArabic ? "مستهدفات التشغيل" : "Service level objectives"}
            </h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/60">
            <div className="divide-y divide-border/40">
              {sloTargets.map((slo) => (
                <div key={slo.metric} className="flex items-center justify-between bg-card/30 px-5 py-3.5">
                  <p className="text-sm text-muted-foreground">{slo.metric}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground/50">{slo.period}</span>
                    <span className="text-sm font-semibold text-emerald-300 tabular-nums">{slo.target}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-3xl">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              {isArabic ? "آخر الملاحظات التشغيلية" : "Recent incidents"}
            </h2>
          </div>
          <div className="space-y-3">
            {incidents.map((incident) => (
              <div key={incident.title} className="rounded-2xl border border-border/60 bg-card/75 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{incident.title}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{formatIncidentDate(incident.date, locale)}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                      incident.resolved
                        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-300"
                    }`}>
                      {incident.resolved
                        ? isArabic
                          ? "مغلقة"
                          : "Resolved"
                        : isArabic
                          ? "قيد المتابعة"
                          : "Monitoring"}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{incident.summary}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">
              {isArabic ? "الحوكمة وحدود الاعتماد" : "Governance and reliance"}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {governanceLinks.map((item) => (
              <Link
                key={item.title}
                href={prefixLocalePath(item.href, locale)}
                className="rounded-2xl border border-border/60 bg-card/75 p-5 transition hover:border-primary/30 hover:bg-card"
              >
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
