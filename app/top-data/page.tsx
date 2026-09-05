import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getTopDataRows } from "@/lib/frontend-content"
import { getPlatformMetrics } from "@/lib/platform-metrics.server"
import { PLATFORM_METRICS_FALLBACK, coverageLabel } from "@/lib/platform-metrics"
import { TopDataSection, shouldRenderTopDataSection, deriveDistributionInsight, freshnessOf } from "@/components/top-data/top-data-section"
import { buildDataSyncMeta } from "@/lib/data-sync-contract"
import { getRequestLocale } from "@/i18n/request"
import { getTranslations } from "next-intl/server"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()

  return {
    title:
      locale === "ar"
        ? "بيانات السوق"
        : "Dubai Market Signal Feed — timing, stress, yield and evidence, computed",
    description:
      locale === "ar"
        ? "بيانات السوق الحية: المشاريع المصنفة، إشارات التوقيت، درجات الضغط، ومستويات الأدلة من مخزون يتم تحديثه طوال اليوم."
        : "Dubai market data across scored projects, timing signals, stress grades and evidence levels — computed from the curated inventory and DLD transactions on every request.",
  }
}

const REQUIRED_SECTIONS = [
  "market-pulse",
  "timing-signals",
  "stress-grades",
  "yield-labels",
  "evidence-levels",
  "decision-labels",
  "affordability",
  "outcome-intents",
  "top-projects",
  "area-intelligence",
  "developer-reliability",
  "golden-visa",
  "trust-bar",
  "dld-market",
] as const

type RequiredSection = (typeof REQUIRED_SECTIONS)[number]

const SECTION_ALIASES: Record<string, RequiredSection> = {
  market_pulse: "market-pulse",
  timing_signals: "timing-signals",
  stress_grades: "stress-grades",
  yield_labels: "yield-labels",
  evidence_levels: "evidence-levels",
  decision_labels: "decision-labels",
  affordability: "affordability",
  outcome_intents: "outcome-intents",
  top_projects: "top-projects",
  area_intelligence: "area-intelligence",
  developer_reliability: "developer-reliability",
  golden_visa: "golden-visa",
  trust_bar: "trust-bar",
  confidence: "trust-bar",
  dld_market: "dld-market",
}

function normalizeSectionKey(value: string | null | undefined) {
  if (!value) return ""
  return value.trim().toLowerCase().replace(/[_\s]+/g, "-")
}

function toRequiredSection(value: string | null | undefined): RequiredSection | null {
  const normalized = normalizeSectionKey(value)
  if (!normalized) return null

  const aliased = SECTION_ALIASES[normalized] ?? normalized
  return (REQUIRED_SECTIONS as readonly string[]).includes(aliased) ? (aliased as RequiredSection) : null
}

export default async function TopDataPage() {
  const locale = await getRequestLocale()
  const t = await getTranslations({ locale, namespace: "topData" })
  const isArabic = locale === "ar"
  let topData: Awaited<ReturnType<typeof getTopDataRows>>
  try {
    topData = await getTopDataRows()
  } catch (error) {
    console.error("Top-data page failed to load; rendering empty state.", { error })
    topData = {
      data_as_of: new Date().toISOString(),
      sections: [],
      source: "empty",
      scores_as_of: null,
    }
  }
  const metrics = await getPlatformMetrics().catch(() => PLATFORM_METRICS_FALLBACK)

  const rowsBySection = new Map<RequiredSection, (typeof topData.sections)[number]>()
  for (const row of topData.sections) {
    const sectionKey = toRequiredSection(row.id) ?? toRequiredSection(row.section)
    if (!sectionKey || rowsBySection.has(sectionKey)) continue
    rowsBySection.set(sectionKey, row)
  }

  const availableSections = REQUIRED_SECTIONS.filter((sectionKey) => {
    const sectionData = rowsBySection.get(sectionKey)
    return sectionData ? shouldRenderTopDataSection(sectionKey, sectionData.data_json) : false
  })
  const visibleSectionCount = availableSections.length
  const missingSections = REQUIRED_SECTIONS.filter((key) => {
    const sectionData = rowsBySection.get(key)
    return !sectionData || !shouldRenderTopDataSection(key, sectionData.data_json)
  })
  const timingSection = rowsBySection.get("timing-signals")
  const timingInsight = timingSection
    ? deriveDistributionInsight(timingSection.data_json, "timing-signals", locale)
    : null
  const stressSection = rowsBySection.get("stress-grades")
  const stressInsight = stressSection
    ? deriveDistributionInsight(stressSection.data_json, "stress-grades", locale)
    : null
  const regimeLine = timingInsight ?? stressInsight
  /**
   * HOW OLD THE FRESHEST SECTION IS.
   *
   * The headline said "Live market data, right now" and the line under it said
   * "updated throughout the day", over sections whose own badges now read "171
   * DAYS OLD" — the per-section badge had been made honest and the page around
   * it had not, which is a worse look than the original lie because the page
   * contradicts itself in one screenful.
   *
   * data_as_of is set to new Date() by getTopDataRows on every request, so it
   * says when the PAGE was built, never when the DATA was written. The only
   * honest number is the newest last_updated across the sections actually shown.
   */
  const freshestUpdate = availableSections
    .map((key) => rowsBySection.get(key)?.last_updated)
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value))
    .reduce<number | null>((newest, at) => (newest === null || at > newest ? at : newest), null)
  const headerFreshness = freshnessOf(
    freshestUpdate === null ? null : new Date(freshestUpdate).toISOString(),
  )
  const headerIsLive = headerFreshness.state === "live"
  const headerAgeDays = headerFreshness.ageHours === null ? null : Math.floor(headerFreshness.ageHours / 24)

  /**
   * WHAT THE COMPUTATION READ. A section computed this minute from scores
   * written in March is live as a computation and six months old as a score;
   * both are true and the page says both. The dates come from the tables
   * (max(updated_at) on the curated inventory, max(transaction_date) on DLD),
   * never from the clock, and an unknown date renders as silence.
   */
  const scoresAsOf = topData.scores_as_of ? new Date(topData.scores_as_of) : null
  const scoresLabel = scoresAsOf && Number.isFinite(scoresAsOf.getTime())
    ? scoresAsOf.toLocaleDateString(isArabic ? "ar-AE-u-nu-latn" : "en-AE", { month: "short", day: "numeric", timeZone: "Asia/Dubai" })
    : null
  const dldCoverage = coverageLabel(metrics.coverageThrough, isArabic)
  const vintageLine = topData.source === "computed"
    ? [
        scoresLabel ? (isArabic ? `الدرجات كما في ${scoresLabel}` : `Scores as written on ${scoresLabel}`) : null,
        dldCoverage,
      ].filter(Boolean).join(" · ") || null
    : null

  const syncMeta = buildDataSyncMeta("topData", topData.data_as_of)
  const syncTimestamp = new Date(syncMeta.syncedAt).toLocaleString(isArabic ? "ar-AE-u-nu-latn" : "en-AE", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Dubai",
  })

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
            {isArabic
              ? "بيانات السوق"
              : "Market Signal Engine"}
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-foreground md:text-5xl">
            {isArabic
              ? "بيانات السوق"
              : headerIsLive
                ? "Live market data, right now"
                : "Market data, as last scored"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isArabic
              ? headerIsLive
                ? "كل مقطع أدناه يعكس الحالة الحالية للمخزون المصنّف، ويتم تحديثه طوال اليوم من بيانات DLD ومصادر القوائم."
                : `كل مقطع أدناه يحمل تاريخ آخر تسجيل له. أحدثها${headerAgeDays !== null ? ` عمره ${headerAgeDays} يوم` : ""}.`
              : headerIsLive
                ? "Every section below is computed from the curated inventory and the DLD table on this request — the badge says when; the line under it says what the data covers."
                : `Every section below carries the date it was last scored${headerAgeDays !== null ? `; the newest is ${headerAgeDays} days old` : ""}.`}
          </p>
          {vintageLine ? (
            <p className="mt-2 text-xs text-muted-foreground/80">{vintageLine}</p>
          ) : null}
          {regimeLine ? (
            <p className="mt-3 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-1.5 text-xs font-medium text-emerald-300/90">
              {regimeLine}
            </p>
          ) : null}
        </header>

        <section className="mb-6 flex flex-wrap items-center gap-3">
          {availableSections.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-4 py-2.5">
              {/* "live sections" counted sections that RENDER, which is a
                  different claim from sections that are live. It said 14/14
                  while nine of them drew zeros, and it stayed green over data
                  five months old. */}
              <span
                className={`h-2 w-2 rounded-full ${headerIsLive ? "bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.4)]" : "bg-amber-400"}`}
              />
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{availableSections.length}</span>
                {isArabic
                  ? `/${visibleSectionCount} ${headerIsLive ? "أقسام مباشرة" : "أقسام مقروءة"}`
                  : `/${visibleSectionCount} sections ${headerIsLive ? "live" : "readable"}`}
              </span>
            </div>
          )}
          <div className="rounded-xl border border-border/60 bg-card/70 px-4 py-2.5 text-xs text-muted-foreground">
            {isArabic ? (
              <>
                ابدأ بـ <span className="font-medium text-foreground">نبض السوق</span> ثم افحص <span className="font-medium text-foreground">التوقيت</span> و <span className="font-medium text-foreground">الضغط</span>
              </>
            ) : (
              <>
                Start with <span className="font-medium text-foreground">Market Pulse</span>, then scan <span className="font-medium text-foreground">Timing</span> and <span className="font-medium text-foreground">Stress</span>
              </>
            )}
          </div>
          {missingSections.length > 0 ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-2.5 text-xs text-amber-400">
              <span className="font-medium">{missingSections.length}</span> {isArabic ? "أقسام قيد المزامنة" : "sections syncing"}
            </div>
          ) : null}
          {availableSections.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card/70 px-4 py-2.5 text-xs text-muted-foreground">
              {isArabic
                ? "يتم تحديث بيانات المؤشرات الآن. أعد المحاولة بعد دقائق."
                : "Signal data is refreshing. Please check back in a few minutes."}
            </div>
          ) : null}
          <div className="rounded-xl border border-border/60 bg-card/70 px-4 py-2.5 text-[11px] text-muted-foreground/70">
            {/* The chip used to print `api.market_pulse_v1` — an internal view
                name — on a customer page. The reader needs when, not where. */}
            {isArabic
              ? `آخر مزامنة للبيانات · ${syncTimestamp} GST`
              : `Data synced · ${syncTimestamp} GST`}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-12">
          {REQUIRED_SECTIONS.map((sectionId) => {
            const sectionData = rowsBySection.get(sectionId)
            if (!sectionData) return null

            if (!shouldRenderTopDataSection(sectionId, sectionData.data_json)) return null

            return (
              <TopDataSection
                key={sectionId}
                section={sectionId}
                locale={locale}
                title={t(`sections.${sectionId}.title`)}
                subtitle={t(`sections.${sectionId}.subtitle`)}
                confidence={sectionData.confidence ?? null}
                lastUpdated={sectionData.last_updated ?? null}
                data={sectionData.data_json}
              />
            )
          })}
        </div>
      </div>
      <Footer />
    </main>
  )
}
