import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getTopDataRows } from "@/lib/frontend-content"
import { TopDataSection } from "@/components/top-data/top-data-section"
import { getRequestLocale } from "@/i18n/request"
import { getTranslations } from "next-intl/server"

export const dynamic = "force-dynamic"

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
    }
  }

  const rowsBySection = new Map<RequiredSection, (typeof topData.sections)[number]>()
  for (const row of topData.sections) {
    const sectionKey = toRequiredSection(row.id) ?? toRequiredSection(row.section)
    if (!sectionKey || rowsBySection.has(sectionKey)) continue
    rowsBySection.set(sectionKey, row)
  }

  const availableSections = REQUIRED_SECTIONS.filter((sectionKey) => rowsBySection.has(sectionKey))
  const missingSections = REQUIRED_SECTIONS.filter((key) => !rowsBySection.has(key))

  return (
    <main id="main-content">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 md:pt-36">
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
            {isArabic
              ? "محرك الإشارات V1 - 4 أبعاد تقييم - مبني على الأدلة"
              : "Signal Engine V1 - 4 Score Dimensions - Evidence-Backed"}
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-foreground md:text-5xl">
            {isArabic ? "محرك الإشارات - بث مباشر" : "Signal Engine V1 - Live"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isArabic ? "كل قسم يعرض مخرجات API كما تُستهلك في المنتجات المؤسسية." : "Every section renders the API outputs consumed by enterprise products."}
          </p>
        </header>

        <section className="mb-6 flex flex-wrap items-center gap-3">
          {availableSections.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.4)]" />
              <span className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{availableSections.length}</span>
                {isArabic ? `/${REQUIRED_SECTIONS.length} أقسام محمّلة` : `/${REQUIRED_SECTIONS.length} sections loaded`}
              </span>
            </div>
          )}
          <div className="rounded-xl border border-border/60 bg-card/70 px-4 py-2.5 text-xs text-muted-foreground">
            {isArabic ? (
              <>
                ابدأ بـ <span className="font-medium text-foreground">نبض السوق</span> ← افحص <span className="font-medium text-foreground">التوقيت</span> و <span className="font-medium text-foreground">الضغط</span> ← تعمّق في <span className="font-medium text-foreground">أفضل المشاريع</span>
              </>
            ) : (
              <>
                Start with <span className="font-medium text-foreground">Market Pulse</span> - scan <span className="font-medium text-foreground">Timing</span> & <span className="font-medium text-foreground">Stress</span> - drill into <span className="font-medium text-foreground">Top Projects</span>
              </>
            )}
          </div>
          {missingSections.length > 0 ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-2.5 text-xs text-amber-400">
              <span className="font-medium">{missingSections.length}</span> {isArabic ? "أقسام قيد التجهيز" : "sections pending"}
            </div>
          ) : null}
          {availableSections.length === 0 ? (
            <div className="rounded-xl border border-border/60 bg-card/70 px-4 py-2.5 text-xs text-muted-foreground">
              {isArabic
                ? "يتم تحديث بيانات المؤشرات الآن. أعد المحاولة بعد دقائق."
                : "Signal data is refreshing. Please check back in a few minutes."}
            </div>
          ) : null}
        </section>

        <div className="grid grid-cols-1 gap-12">
          {REQUIRED_SECTIONS.map((sectionId) => {
            const sectionData = rowsBySection.get(sectionId)
            if (!sectionData) return null

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
