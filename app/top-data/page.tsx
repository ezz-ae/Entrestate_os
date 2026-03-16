import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getTopDataRows } from "@/lib/frontend-content"
import { TopDataSection } from "@/components/top-data/top-data-section"
import { getRequestLocale } from "@/i18n/request"

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

const SECTION_COPY: Record<
  (typeof REQUIRED_SECTIONS)[number],
  { title: string; subtitle: string }
> = {
  "market-pulse": {
    title: "Market Pulse",
    subtitle: "Big-picture snapshot: active projects, average price, average yield, and BUY opportunities.",
  },
  "timing-signals": {
    title: "Timing Signals",
    subtitle: "Distribution of STRONG_BUY / BUY / HOLD / WAIT / AVOID signals with price and yield context.",
  },
  "stress-grades": {
    title: "Stress Grades",
    subtitle: "Portfolio resilience distribution from grade A through E.",
  },
  "yield-labels": {
    title: "Yield Labels",
    subtitle: "Yield tier distribution with pricing context.",
  },
  "evidence-levels": {
    title: "Evidence Levels",
    subtitle: "Data confidence mix and verified evidence coverage.",
  },
  "decision-labels": {
    title: "Decision Labels",
    subtitle: "STRONG_BUY to AVOID distribution across scored inventory.",
  },
  affordability: {
    title: "Affordability Tiers",
    subtitle: "Project mix by affordability segment and yield profile.",
  },
  "outcome-intents": {
    title: "Outcome Intents",
    subtitle: "What investor goals the current inventory best serves.",
  },
  "top-projects": {
    title: "Top Projects",
    subtitle: "Ranked projects table with price, yield, stress, timing, and score fields.",
  },
  "area-intelligence": {
    title: "Area Intelligence",
    subtitle: "Area-level project depth, pricing, efficiency, and supply pressure.",
  },
  "developer-reliability": {
    title: "Developer Reliability",
    subtitle: "Developer-level consistency, safe-project count, and track record.",
  },
  "golden-visa": {
    title: "Golden Visa",
    subtitle: "Eligible inventory counts and quality profile for AED 2M+ buyers.",
  },
  "trust-bar": {
    title: "Trust Bar",
    subtitle: "Data hierarchy, engine stack, and confidence distribution across the dataset.",
  },
  "dld-market": {
    title: "DLD Market",
    subtitle: "Transaction snapshots and notable deal flow from DLD feeds.",
  },
}

const SECTION_COPY_AR: Record<(typeof REQUIRED_SECTIONS)[number], { title: string; subtitle: string }> = {
  "market-pulse": { title: "نبض السوق", subtitle: "نظرة شاملة للمشاريع النشطة، متوسط الأسعار، متوسط العوائد، وفرص الشراء المتاحة." },
  "timing-signals": { title: "إشارات التوقيت", subtitle: "توزيع إشارات الشراء والانتظار (STRONG_BUY / BUY / HOLD / WAIT / AVOID) مع سياق الأسعار والعوائد." },
  "stress-grades": { title: "تصنيفات الضغط", subtitle: "تحليل مرونة المحفظة العقارية وتوزيعها من الدرجة A حتى E." },
  "yield-labels": { title: "شرائح العائد", subtitle: "توزيع فئات العائد الاستثماري بناءً على سياق التسعير." },
  "evidence-levels": { title: "مستويات الموثوقية", subtitle: "مؤشر دقة البيانات وتغطية الأدلة الميدانية المتحققة." },
  "decision-labels": { title: "مؤشرات القرار", subtitle: "توزيع تقييمات الوحدات من الشراء القوي إلى التجنب عبر كامل المخزون." },
  affordability: { title: "فئات الملاءة المالية", subtitle: "تصنيف المشاريع حسب القدرة الشرائية وملف العائد الاستثماري." },
  "outcome-intents": { title: "الأهداف الاستثمارية", subtitle: "تحديد الأهداف الاستثمارية التي يخدمها المخزون الحالي بأفضل شكل." },
  "top-projects": { title: "أبرز المشاريع", subtitle: "ترتيب المشاريع الأعلى أداءً بناءً على السعر، العائد، مؤشر الضغط، والتوقيت." },
  "area-intelligence": { title: "تحليل المناطق", subtitle: "مقارنة دقيقة بين المناطق من حيث عمق المشاريع، التنافسية السعرية، وضغط المعروض." },
  "developer-reliability": { title: "موثوقية المطورين", subtitle: "تحليل سجل الإنجاز، معدلات التسليم، وعدد المشاريع المصنفة كفرص آمنة." },
  "golden-visa": { title: "تأشيرة المستثمر", subtitle: "رصد المشاريع المؤهلة للحصول على الإقامة الذهبية (فوق 2 مليون درهم)." },
  "trust-bar": { title: "معيار الثقة", subtitle: "هيكلية البيانات ومصادرها، وتوزيع مستويات اليقين عبر منصة التحليل." },
  "dld-market": { title: "بيانات دائرة الأراضي", subtitle: "رصد فوري لأحدث صفقات البيع والتدفقات المالية من سجلات دائرة الأراضي والأملاك." },
}

function sectionLayoutClass(section: (typeof REQUIRED_SECTIONS)[number]) {
  if (section === "market-pulse") return "xl:col-span-3"
  if (section === "top-projects") return "xl:col-span-3"
  if (section === "outcome-intents") return "xl:col-span-2"
  if (section === "area-intelligence") return "xl:col-span-2"
  if (section === "trust-bar") return "xl:col-span-2"
  if (section === "dld-market") return "xl:col-span-2"
  return "xl:col-span-1"
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
  const isArabic = locale === "ar"
  const topData = await getTopDataRows()
  const sectionCopy = isArabic ? SECTION_COPY_AR : SECTION_COPY

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
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{isArabic ? "تحليلات السوق" : "Market Data"}</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground md:text-5xl">{isArabic ? "رصد السوق العقاري الإماراتي" : "UAE Market Intelligence"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isArabic
              ? "منصة تحليلية شاملة تجمع بيانات التسعير، توقيت السوق، مؤشرات الضغط، وموثوقية المطورين لدعم القرار الاستثماري."
              : "A guided intelligence board for pricing, timing, stress, developer quality, and opportunity signals."}
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
                Start with <span className="font-medium text-foreground">Market Pulse</span> → scan <span className="font-medium text-foreground">Timing</span> & <span className="font-medium text-foreground">Stress</span> → drill into <span className="font-medium text-foreground">Top Projects</span>
              </>
            )}
          </div>
          {missingSections.length > 0 ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-2.5 text-xs text-amber-400">
              {isArabic ? "مفقود: " : "Missing: "}{missingSections.map((key) => sectionCopy[key].title).join(", ")}
            </div>
          ) : null}
        </section>

        {availableSections.length === 0 && (
          <div className="mb-8 rounded-2xl border border-dashed border-border/60 bg-card/40 px-6 py-16 text-center">
            <p className="text-sm font-medium text-foreground">{isArabic ? "يتم تحديث ذكاء السوق" : "Market intelligence is refreshing"}</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
              {isArabic
                ? "يقوم خط البيانات بمعالجة أحدث إشارات السوق في الإمارات. ستظهر الأقسام فور اكتمال الدورة الحالية — عادة خلال بضع ساعات."
                : "The data pipeline is processing the latest UAE market signals. Sections will appear once the current cycle completes — typically within a few hours."}
            </p>
          </div>
        )}

        <section className="relative grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_50%_-10%,rgba(245,158,11,0.18),transparent_58%)]" />
          {REQUIRED_SECTIONS.map((sectionKey) => {
            const section = rowsBySection.get(sectionKey)
            const nowIso = new Date().toISOString()
            const fallback = sectionCopy[sectionKey]

            return (
              <div key={sectionKey} className={sectionLayoutClass(sectionKey)}>
                <TopDataSection
                  section={sectionKey}
                  locale={locale}
                  title={section?.title ?? fallback.title}
                  subtitle={section?.subtitle ?? fallback.subtitle}
                  confidence={section?.confidence ?? "LOW"}
                  lastUpdated={section?.last_updated ?? nowIso}
                  data={section?.data_json ?? { message: isArabic ? "لا توجد بيانات متاحة لهذا القسم" : "No section data available" }}
                />
              </div>
            )
          })}
        </section>
      </div>
      <Footer />
    </main>
  )
}
