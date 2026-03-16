"use client"

import { useEffect, useMemo, useState } from "react"
import { useLocale } from "next-intl"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import Link from "next/link"
import {
  BarChart3,
  Search,
  Bookmark,
  GitCompare,
  Import,
  Calculator,
  ArrowRight,
  TrendingUp,
  ChevronRight,
  Activity,
  Bot,
  Database,
  Layers,
  ShieldCheck,
  Menu,
} from "lucide-react"
import type { MarketScoreCharts, MarketScoreSummary } from "@/lib/market-score/types"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"
import { getNumberLocale } from "@/lib/format/locale"

function getWorkspaceTools(locale: AppLocale) {
  const isArabic = locale === "ar"

  return [
    { icon: BarChart3, label: isArabic ? "لوحة السوق" : "Dashboards", description: isArabic ? "قراءات مركبة لحركة السوق" : "Layered market views", href: "/workspace/dashboards" },
    { icon: Database, label: isArabic ? "أبحاث السوق" : "Market Research Desk", description: isArabic ? "استكشف الإشارات وابنِ ملخصاتك" : "Explore market signals and build briefs", href: "/workspace/data-scientist" },
    { icon: ShieldCheck, label: isArabic ? "قراءة المشروع" : "Market Score", description: isArabic ? "تحقق من الدرجة والملاءمة قبل القرار" : "Score validation and match checks", href: "/market-score" },
    { icon: TrendingUp, label: isArabic ? "مطابقة المستثمر" : "Investor Match Desk", description: isArabic ? "اربط ملف العميل بالمخزون الأنسب" : "Match client profiles to the right inventory", href: "/agent-runtime" },
    { icon: Layers, label: isArabic ? "حزم البيانات" : "Market Data Packs", description: isArabic ? "منتجات بيانات وحزم جاهزة للتحميل" : "Data products and download packs", href: "/workspace/daas" },
    { icon: Bot, label: isArabic ? "مسار العملاء" : "Lead Flow Builder", description: isArabic ? "ابنِ مسارات الاستقبال والتحويل" : "Set up client intake and routing flows", href: "/workspace/agent-creator" },
    { icon: Search, label: isArabic ? "البحث" : "Search", description: isArabic ? "ابحث في المدن والمناطق والمشاريع" : "City, area, project search", href: "/workspace/search" },
    { icon: Bookmark, label: isArabic ? "المحفوظات" : "Saved Searches", description: isArabic ? "عمليات البحث التي رجعت إليها" : "Your bookmarked queries", href: "/workspace/saved-searches" },
    { icon: GitCompare, label: isArabic ? "المقارنات" : "Comparisons", description: isArabic ? "ضع سيناريوهين جنبًا إلى جنب" : "Side-by-side scenarios", href: "/workspace/comparisons" },
    { icon: Import, label: isArabic ? "مصادر البيانات" : "Data Sources", description: isArabic ? "إدارة الإدخال والحوكمة" : "Managed ingestion and governance", href: "/workspace/imports" },
    { icon: Calculator, label: isArabic ? "حاسبات سريعة" : "Math Tools", description: isArabic ? "حسابات سريعة وبناة مساعدة" : "Calculators and builders", href: "/workspace/math-tools" },
  ]
}

const CITY_LABELS: Record<string, string> = {
  dubai: "دبي",
  "abu dhabi": "أبوظبي",
  sharjah: "الشارقة",
  ajman: "عجمان",
  fujairah: "الفجيرة",
  "ras al khaimah": "رأس الخيمة",
  "umm al quwain": "أم القيوين",
  "al ain": "العين",
}

function localizeCityLabel(value: string, locale: AppLocale) {
  if (locale !== "ar") return value
  return CITY_LABELS[value.trim().toLowerCase()] ?? value
}

type DashboardResponse = {
  source: string
  overview: {
    total_projects: number
    portfolio_value: number
    avg_price: number | null
    avg_yield: number | null
    avg_appreciation: number | null
  }
  market_health: {
    undersupplied_pct: number | null
    high_confidence_pct: number | null
    avg_liquidity: number | null
  }
  top_areas_by_yield: Array<{ label: string; value: number | null }>
  alerts: string[]
}

function PulseChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const max = data.length ? Math.max(...data.map((item) => item.value)) : 1

  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((item) => (
        <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
          <div
            className="w-full bg-accent/30 rounded-t-sm hover:bg-accent/50 transition-colors"
            style={{ height: `${(item.value / max) * 100}%` }}
          />
          <span className="text-[10px] text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

const formatNumber = (value: number | null, locale?: string) => {
  if (value === null || !Number.isFinite(value)) return "—"
  return value.toLocaleString(getNumberLocale(locale))
}

export default function WorkspacePage() {
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const numberLocale = getNumberLocale(locale)
  const tools = useMemo(() => getWorkspaceTools(locale), [locale])
  const [activeTab, setActiveTab] = useState<"overview" | "activity">("overview")
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false)
  const [scoreSummary, setScoreSummary] = useState<MarketScoreSummary | null>(null)
  const [scoreCharts, setScoreCharts] = useState<MarketScoreCharts | null>(null)
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [dataError, setDataError] = useState<string | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  const coreToolLabels = useMemo(
    () => (isArabic ? ["أبحاث السوق", "قراءة المشروع", "مطابقة المستثمر", "لوحة السوق"] : ["Market Research Desk", "Market Score", "Investor Match Desk", "Dashboards"]),
    [isArabic],
  )
  const coreTools = useMemo(() => tools.filter((tool) => coreToolLabels.includes(tool.label)), [tools, coreToolLabels])
  const [featuredTool, ...primaryTools] = coreTools
  const supportTools = useMemo(() => tools.filter((tool) => !coreToolLabels.includes(tool.label)), [tools, coreToolLabels])

  const pulseData = useMemo(() => {
    if (!scoreCharts?.avgScoreByStatus?.length) return []
    return scoreCharts.avgScoreByStatus.slice(0, 6).map((item) => ({
      label: item.label,
      value: Number(item.avgScore.toFixed(1)),
    }))
  }, [scoreCharts])

  const topCities = useMemo(() => {
    if (!scoreCharts?.countByCity?.length) return []
    return scoreCharts.countByCity.slice(0, 4)
  }, [scoreCharts])

  const totalCityCount = useMemo(() => {
    if (!scoreCharts?.countByCity?.length) return 0
    return scoreCharts.countByCity.reduce((sum, row) => sum + row.count, 0)
  }, [scoreCharts])

  const activityItems = useMemo(() => {
    const items: Array<{ action: string; detail: string; time: string }> = []
    if (scoreSummary) {
      items.push({
        action: isArabic ? "تحديث قراءة المشاريع" : "Scoring update",
        detail: isArabic
          ? `${scoreSummary.totalAssets.toLocaleString(numberLocale)} مشروعًا مقروءًا · متوسط ${scoreSummary.avgScore.toFixed(1)}`
          : `${scoreSummary.totalAssets.toLocaleString(numberLocale)} assets scored · Avg ${scoreSummary.avgScore.toFixed(1)}`,
        time: isArabic ? "مباشر" : "Live",
      })
    }
    if (dashboard) {
      items.push({
        action: isArabic ? "اتساع التغطية" : "Portfolio coverage",
        detail: isArabic
          ? `${dashboard.overview.total_projects.toLocaleString(numberLocale)} مشروعًا تحت المتابعة · متوسط السعر AED ${formatNumber(
              dashboard.overview.avg_price,
              locale,
            )}`
          : `${dashboard.overview.total_projects.toLocaleString(numberLocale)} projects tracked · Avg price AED ${formatNumber(
          dashboard.overview.avg_price,
            locale,
          )}`,
        time: isArabic ? "مباشر" : "Live",
      })
    }
    if (dashboard?.alerts?.length) {
      dashboard.alerts.slice(0, 3).forEach((alert) => {
        items.push({ action: isArabic ? "تنبيه سوقي" : "Market alert", detail: alert, time: isArabic ? "إشارة" : "Signal" })
      })
    }
    return items
  }, [scoreSummary, dashboard, isArabic, locale, numberLocale])

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setDataLoading(true)
      setDataError(null)
      try {
        const [summaryRes, chartsRes, dashboardRes] = await Promise.all([
          fetch("/api/market-score/summary", { signal: controller.signal }),
          fetch("/api/market-score/charts", { signal: controller.signal }),
          fetch("/api/daas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ product: "dashboard", params: {} }),
            signal: controller.signal,
          }),
        ])

        if (!summaryRes.ok || !chartsRes.ok || !dashboardRes.ok) {
          throw new Error(isArabic ? "التغذية الحية غير متاحة الآن" : "Live feed unavailable")
        }

        const [summaryData, chartsData, dashboardData] = await Promise.all([
          summaryRes.json(),
          chartsRes.json(),
          dashboardRes.json(),
        ])
        setScoreSummary(summaryData as MarketScoreSummary)
        setScoreCharts(chartsData as MarketScoreCharts)
        setDashboard((dashboardData as { result: DashboardResponse }).result)
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        setDataError(error instanceof Error ? error.message : isArabic ? "التغذية الحية غير متاحة الآن" : "Live feed unavailable")
      } finally {
        setDataLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [isArabic])

  return (
    <main id="main-content">
      <Navbar />
      <div className="pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="mx-auto w-full max-w-[1440px] px-6">
          {/* Header */}
          <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6 mb-12">
            <div className="max-w-xl">
              <p className="text-xs font-medium uppercase tracking-wider text-accent mb-3">{isArabic ? "مساحة العمل" : "Investor Desk"}</p>
              <h1 className="text-3xl md:text-5xl font-serif text-foreground leading-tight">
                {isArabic ? "ابدأ من المسار المناسب الآن." : "Choose your next focus."}
              </h1>
              <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                {isArabic
                  ? "ابدأ بالأساسيات، ثم افتح الأدوات المتقدمة عند الحاجة."
                  : "Keep it simple: start with the core workflows, then open advanced work only when you need it."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Sheet open={isWorkspaceMenuOpen} onOpenChange={setIsWorkspaceMenuOpen}>
                <SheetTrigger asChild>
                  <button className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary md:hidden">
                    <Menu className="h-4 w-4" />
                    {isArabic ? "قائمة المسارات" : "Workspace menu"}
                  </button>
                </SheetTrigger>
                <SheetContent side={isArabic ? "right" : "left"} className="w-[88vw] max-w-sm border-r border-border bg-background p-0">
                  <SheetHeader className={`border-b border-border/70 px-5 py-4 ${isArabic ? "text-right" : "text-left"}`}>
                    <SheetTitle>{isArabic ? "قائمة المسارات" : "Workspace menu"}</SheetTitle>
                    <SheetDescription>
                      {isArabic ? "تنقّل بين المسارات الأساسية والأدوات من الجوال بسهولة." : "Jump between core desks, tools, and utilities on mobile."}
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex h-full flex-col overflow-y-auto px-4 pb-6">
                    <div className="pt-4">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {isArabic ? "المسارات الأساسية" : "Core workstations"}
                      </p>
                      <div className="space-y-2">
                        {coreTools.map((tool) => (
                          <SheetClose asChild key={tool.href}>
                            <Link
                              href={prefixLocalePath(tool.href, locale)}
                              className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/70 px-3 py-3 transition-colors hover:bg-accent/40"
                            >
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                                <tool.icon className="h-5 w-5" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-medium text-foreground">{tool.label}</span>
                                <span className="mt-1 block text-xs text-muted-foreground">{tool.description}</span>
                              </span>
                            </Link>
                          </SheetClose>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {isArabic ? "أدوات مساندة" : "More tools"}
                      </p>
                      <div className="space-y-2">
                        {supportTools.map((tool) => (
                          <SheetClose asChild key={tool.href}>
                            <Link
                              href={prefixLocalePath(tool.href, locale)}
                              className="flex items-center gap-3 rounded-xl border border-border/60 bg-background px-3 py-2.5 transition-colors hover:bg-secondary"
                            >
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                                <tool.icon className="h-4 w-4" />
                              </span>
                              <span className="min-w-0">
                                <span className="block text-sm font-medium text-foreground">{tool.label}</span>
                                <span className="block truncate text-xs text-muted-foreground">{tool.description}</span>
                              </span>
                            </Link>
                          </SheetClose>
                        ))}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "overview" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {isArabic ? "نظرة عامة" : "Overview"}
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "activity" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
              >
                {isArabic ? "التحديثات" : "Activity"}
              </button>
            </div>
          </div>

          {activeTab === "overview" ? (
            <>
              <section className="rounded-2xl border border-border/70 bg-card/60 p-7 mb-10">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{isArabic ? "ابدأ من هنا" : "Start here"}</p>
                    <h2 className="text-xl font-semibold text-foreground">{isArabic ? "المسارات الأساسية" : "Core workstations"}</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                  {featuredTool && (
                    <Link
                      key={featuredTool.label}
                      href={prefixLocalePath(featuredTool.href, locale)}
                      className="group md:col-span-2 xl:col-span-2 flex items-start gap-4 p-7 border border-primary/30 rounded-2xl bg-gradient-to-br from-primary/15 via-background/40 to-background/60 hover:border-primary/50 transition-colors"
                    >
                      <div className="p-3 bg-primary/20 rounded-md">
                        <featuredTool.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-foreground">{featuredTool.label}</h3>
                          <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{featuredTool.description}</p>
                        <p className="text-xs text-muted-foreground mt-3">
                          {isArabic ? "هذا هو المسار الأنسب لبداية يومك." : "Best starting point for daily market work."}
                        </p>
                      </div>
                    </Link>
                  )}
                  {primaryTools.map((tool) => (
                    <Link
                      key={tool.label}
                      href={prefixLocalePath(tool.href, locale)}
                      className="group flex items-start gap-4 p-6 bg-background/40 border border-border rounded-xl hover:border-accent/40 transition-colors"
                    >
                      <div className="p-3 bg-secondary rounded-md">
                        <tool.icon className="w-5 h-5 text-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-foreground">{tool.label}</h3>
                          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="mb-12 grid grid-cols-1 xl:grid-cols-[0.7fr_1.3fr] gap-6">
                <div className="rounded-2xl border border-border/70 bg-card/70 p-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{isArabic ? "أدوات مساندة" : "More tools"}</p>
                  <h3 className="text-lg font-medium text-foreground mt-2">{isArabic ? "قراءات متخصصة وأدوات مساندة" : "Deep dives & utilities"}</h3>
                  <p className="text-sm text-muted-foreground mt-3">
                    {isArabic
                      ? "استخدم هذه الوحدات عندما تحتاج مخرجًا محددًا. كل مسار هنا واضح ومباشر."
                      : "Use these when you need a specific output. Each workflow is focused and short."}
                  </p>
                  <div className="mt-6 space-y-3 text-sm text-muted-foreground">
                    <p>{isArabic ? "• بحث سريع في المشاريع والمخزون." : "• Quick searches for listings and inventory."}</p>
                    <p>{isArabic ? "• مقارنات وملاحظات قرار محفوظة." : "• Comparisons and saved decision notes."}</p>
                    <p>{isArabic ? "• مصادر بيانات وأدوات حساب ومسارات استقبال." : "• Data sources, math tools, and intake flows."}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/40 p-6">
                  <div className="divide-y divide-border/60">
                    {supportTools.map((tool) => (
                      <Link
                        key={tool.label}
                        href={prefixLocalePath(tool.href, locale)}
                        className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                      >
                        <div className="p-2.5 bg-secondary rounded-md">
                          <tool.icon className="w-5 h-5 text-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-foreground">{tool.label}</h3>
                            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-6">
                <div className="p-7 md:p-8 bg-gradient-to-br from-card via-card to-secondary/40 border border-border rounded-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-medium text-foreground">{isArabic ? "نبض السوق" : "Market signal pulse"}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{isArabic ? "متوسط الدرجة حسب موعد التسليم" : "Average score by delivery band"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-accent" />
                      <span className="text-sm font-mono text-foreground">
                        {scoreSummary?.totalAssets?.toLocaleString(numberLocale) ?? "—"}
                      </span>
                    </div>
                  </div>
                  {dataLoading && !pulseData.length ? (
                    <p className="text-sm text-muted-foreground">{isArabic ? "جارٍ تحميل نبض السوق..." : "Loading market pulse..."}</p>
                  ) : pulseData.length > 0 ? (
                    <PulseChart data={pulseData} />
                  ) : (
                    <p className="text-sm text-muted-foreground">{dataError ?? (isArabic ? "نبض السوق غير متاح الآن." : "Pulse data not available yet.")}</p>
                  )}
                </div>

                <div className="p-7 md:p-8 bg-card/90 border border-border rounded-2xl">
                  <h3 className="font-medium text-foreground mb-1">{isArabic ? "لقطة السوق" : "Market snapshot"}</h3>
                  <p className="text-xs text-muted-foreground mb-6">{isArabic ? "أعلى المدن من حيث تغطية المخزون" : "Top cities by inventory coverage"}</p>
                  {dataLoading && topCities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{isArabic ? "جارٍ تحميل تغطية المدن..." : "Loading city coverage..."}</p>
                  ) : topCities.length > 0 ? (
                    <div className="space-y-4">
                      {topCities.map((city) => {
                        const share = totalCityCount ? (city.count / totalCityCount) * 100 : 0
                        return (
                          <div
                            key={city.label}
                            className="flex items-center justify-between py-2 border-b border-border last:border-0"
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground">{localizeCityLabel(city.label, locale)}</p>
                              <p className="text-xs text-muted-foreground">
                                {isArabic
                                  ? `${city.count.toLocaleString(numberLocale)} أصلًا · حصة ${share.toFixed(1)}%`
                                  : `${city.count.toLocaleString(numberLocale)} assets · ${share.toFixed(1)}% share`}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <TrendingUp className="w-4 h-4 text-emerald-500/70" />
                              {isArabic ? "مباشر" : "Live"}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{dataError ?? (isArabic ? "تغطية المدن غير متاحة الآن." : "City coverage not available yet.")}</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Activity Tab */
            <div className="max-w-2xl">
              <div className="border border-border rounded-lg overflow-hidden">
                {dataLoading ? (
                  <div className="px-6 py-6 text-sm text-muted-foreground">{isArabic ? "جارٍ تحميل التحديثات..." : "Loading live feed…"}</div>
                ) : activityItems.length > 0 ? (
                  activityItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-4 px-6 py-4 border-b border-border last:border-0">
                      <div className="w-2 h-2 mt-2 rounded-full bg-accent flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground">{item.action}</p>
                          <span className="text-xs text-muted-foreground">{item.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{item.detail}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-6 text-sm text-muted-foreground">
                    {dataError ?? (isArabic ? "لا توجد تحديثات مباشرة الآن." : "No live updates available yet.")}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  )
}
