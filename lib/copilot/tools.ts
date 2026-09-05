import { z } from "zod"

export const dealScreenerInputSchema = z
  .object({
    filters: z
      .object({
        area: z.string().trim().min(1).optional(),
        /**
         * Missing until 2026-09-05. "Emaar off-plan in Dubai Marina under
         * AED 2M" had no honest tool to land on, so the model wrote raw SQL
         * through mcp_query, got 0, and told the reader nothing exists.
         */
        developer: z.string().trim().min(1).optional(),
        budget_max_aed: z.number().positive().optional(),
        beds_min: z.number().int().min(0).optional(),
        beds_max: z.number().int().min(0).optional(),
        golden_visa_required: z.boolean().optional(),
        timing_label: z.enum(["STRONG_BUY", "BUY", "HOLD", "WAIT", "AVOID"]).optional(),
        stress_grade_min: z.enum(["A", "B", "C", "D", "E"]).optional(),
      })
      .optional()
      .default({}),
    sort_by: z
      .enum(["investor_score_v1", "price_from_aed", "rental_yield", "developer_reliability_score"])
      .default("investor_score_v1"),
    limit: z.number().int().min(1).max(50).default(10),
  })
  .strict()

export const priceRealityCheckInputSchema = z
  .object({
    project_name: z.string().trim().min(1),
  })
  .strict()

export const areaRiskBriefInputSchema = z
  .object({
    area_name: z.string().trim().min(1),
  })
  .strict()

export const developerDueDiligenceInputSchema = z
  .object({
    developer_name: z.string().trim().min(1),
  })
  .strict()

export const memoSectionSchema = z.enum(["price_reality", "area_risk", "developer", "stress_test"])

const DEFAULT_MEMO_SECTIONS = ["price_reality", "area_risk", "developer", "stress_test"] as const

export const generateInvestorMemoInputSchema = z
  .object({
    project_name: z.string().trim().min(1),
    sections: z.array(memoSectionSchema).min(1).optional().default([...DEFAULT_MEMO_SECTIONS]),
  })
  .strict()

export const compareProjectsInputSchema = z
  .object({
    project_names: z.array(z.string().trim().min(1)).min(2).max(3),
  })
  .strict()

export const applyDecisionLensInputSchema = z
  .object({
    lens: z.enum(["CONSERVATIVE", "BALANCED", "YIELD_MAXIMIZER"]),
  })
  .strict()

export const listMarketEntitiesInputSchema = z
  .object({
    type: z.enum(["AREA", "DEVELOPER"]),
    query: z.string().trim().min(1).optional(),
    limit: z.number().int().min(1).max(50).default(20),
  })
  .strict()

export const generateDecisionObjectInputSchema = z
  .object({
    type: z.enum(["PDF_REPORT", "PPTX_DECK", "HTML_WIDGET"]),
    project_name: z.string().trim().min(1),
    title: z.string().trim().optional(),
  })
  .strict()

export const generateStrategicReportInputSchema = z
  .object({
    intent: z.string().trim().min(1),
    focus_areas: z.array(z.string()).optional(),
  })
  .strict()

export const generateInvestmentRoadmapInputSchema = z
  .object({
    initial_capital_aed: z.number().positive(),
    target_horizon_years: z.number().int().min(1).max(25).default(10),
  })
  .strict()

export const monitorMarketSegmentsInputSchema = z
  .object({
    areas: z.array(z.string()).min(1),
    alert_threshold_yield: z.number().optional().default(6.5),
  })
  .strict()

export const dldTransactionSearchInputSchema = z
  .object({
    area: z.string().trim().min(1).optional(),
    project: z.string().trim().min(1).optional(),
    min_amount: z.number().positive().optional(),
    max_amount: z.number().positive().optional(),
    reg_type: z.enum(["Off-Plan", "Ready"]).optional(),
    prop_type: z.enum(["Unit", "Land", "Building"]).optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    limit: z.number().int().min(1).max(50).default(20),
  })
  .strict()

export const dldAreaBenchmarkInputSchema = z
  .object({
    area_name: z.string().trim().min(1),
  })
  .strict()

export const dldMarketPulseInputSchema = z.object({}).strict()

export const dldNotableDealsInputSchema = z
  .object({
    badge: z.enum(["mega-deal", "golden-visa", "above-market", "off-plan"]).optional(),
    limit: z.number().int().min(1).max(50).default(20),
    days: z.number().int().min(1).max(90).default(7),
  })
  .strict()

export const refreshDldDataInputSchema = z.object({}).strict()

export const copilotToolSchemas = {
  deal_screener: dealScreenerInputSchema,
  price_reality_check: priceRealityCheckInputSchema,
  area_risk_brief: areaRiskBriefInputSchema,
  developer_due_diligence: developerDueDiligenceInputSchema,
  generate_investor_memo: generateInvestorMemoInputSchema,
  compare_projects: compareProjectsInputSchema,
  apply_decision_lens: applyDecisionLensInputSchema,
  list_market_entities: listMarketEntitiesInputSchema,
  generate_decision_object: generateDecisionObjectInputSchema,
  generate_strategic_report: generateStrategicReportInputSchema,
  generate_investment_roadmap: generateInvestmentRoadmapInputSchema,
  monitor_market_segments: monitorMarketSegmentsInputSchema,
  dld_transaction_search: dldTransactionSearchInputSchema,
  dld_area_benchmark: dldAreaBenchmarkInputSchema,
  dld_market_pulse: dldMarketPulseInputSchema,
  dld_notable_deals: dldNotableDealsInputSchema,
  refresh_dld_data: refreshDldDataInputSchema,
} as const

export type DealScreenerInput = z.infer<typeof dealScreenerInputSchema>
export type PriceRealityCheckInput = z.infer<typeof priceRealityCheckInputSchema>
export type AreaRiskBriefInput = z.infer<typeof areaRiskBriefInputSchema>
export type DeveloperDueDiligenceInput = z.infer<typeof developerDueDiligenceInputSchema>
export type GenerateInvestorMemoInput = z.infer<typeof generateInvestorMemoInputSchema>
export type CompareProjectsInput = z.infer<typeof compareProjectsInputSchema>
export type ApplyDecisionLensInput = z.infer<typeof applyDecisionLensInputSchema>
export type ListMarketEntitiesInput = z.infer<typeof listMarketEntitiesInputSchema>
export type GenerateDecisionObjectInput = z.infer<typeof generateDecisionObjectInputSchema>
export type GenerateStrategicReportInput = z.infer<typeof generateStrategicReportInputSchema>
export type GenerateInvestmentRoadmapInput = z.infer<typeof generateInvestmentRoadmapInputSchema>
export type MonitorMarketSegmentsInput = z.infer<typeof monitorMarketSegmentsInputSchema>
export type DldTransactionSearchInput = z.infer<typeof dldTransactionSearchInputSchema>
export type DldAreaBenchmarkInput = z.infer<typeof dldAreaBenchmarkInputSchema>
export type DldMarketPulseInput = z.infer<typeof dldMarketPulseInputSchema>
export type DldNotableDealsInput = z.infer<typeof dldNotableDealsInputSchema>
export type RefreshDldDataInput = z.infer<typeof refreshDldDataInputSchema>
export type MemoSection = z.infer<typeof memoSectionSchema>

/**
 * THE PIVOT THIS PROMPT RECORDS. The first version of this prompt opened with
 * "YOU ARE NOT A CHATBOT. YOU ARE A DECISION ENGINE… NEVER write paragraphs…
 * Bloomberg terminal. Never greet. Just execute." Built for an imagined
 * terminal operator, it produced exactly what it asked for: enum codes, pipe
 * tables and blocks of internals on the screen of a person who wanted an
 * answer. The owner's verdict, after watching real users: the reader is a
 * wealthy investor whose tech ceiling is TikTok, or a working agent with
 * average schooling — "there is a big difference between a smart site and a
 * site that displays the intelligence's data." So the voice flipped: the model
 * still runs the same tools with the same honesty rules, and then speaks like
 * a trusted advisor, in paragraphs, in the reader's language, with exactly one
 * recommendation. The old personality is quoted here so nobody "restores" it
 * believing it was lost by accident.
 */
export const copilotSystemPrompt = `You are the Entrestate Decision Terminal for UAE real estate. You sit on top of the platform's scored inventory, official recorded transactions, and developer records, and you answer people, not analysts. You compute and you show the record; you hold no opinion and you give no financial advice — every statement you make is something a tool just returned.

WHO IS READING. An investor or a working real-estate agent. They judge the answer by whether they understood it and can act on it — never by how much data it shows. They do not know what an enum, a grade code, or a table is, and must never need to.

HOW YOU WORK (internal only — the reader never sees any of this):
Classify each question into one of these and call the tools that answer it:
SCREEN — find opportunities → deal_screener.
PROJECT — one project's picture → price_reality_check, generate_investor_memo.
AREA — one area's picture → area_risk_brief, dld_area_benchmark.
COMPARE — side by side. Three kinds, three tools:
  · projects   → compare_projects
  · areas      → dld_area_benchmark, once per area
  · developers → developer_due_diligence, once per developer
  A developer comparison contains no project name. "Compare Emaar vs Damac"
  is two developer_due_diligence calls — NEVER a deal_screener run.
RISK — stress the plan → price_reality_check, developer_due_diligence.
MEMO — a full written case → generate_investor_memo.
PULSE — the market right now → dld_market_pulse.

TWO MARKETS, TWO SOURCES. The scored inventory is DEVELOPER inventory — new and
off-plan projects with an entry price. The recorded transactions are the whole
market, each row marked Off-Plan or Ready.
  · "off-plan", "launch", "payment plan", "handover" → deal_screener (add
    developer / area / budget_max_aed as given) AND dld_transaction_search with
    reg_type "Off-Plan" for what actually traded there.
  · "secondary", "resale", "ready", "existing", "what do units trade at" →
    dld_transaction_search with reg_type "Ready" (and dld_area_benchmark for the
    area). There is no secondary listing inventory; say so in one clause and
    answer from the records.
  · A developer name + an area + a budget is ONE deal_screener call with all
    three filters — never a hand-written query.

NEVER END AT "NOT FOUND". deal_screener widens on its own: when the exact
filters match nothing it drops budget, then bedrooms, then area, then
developer, and returns "widened" (the filters it dropped) with the nearest
rows. Read "widened" and say it plainly — "nothing from Emaar in Dubai Marina
under AED 2M; without the budget cap, three Emaar projects there start at AED
2.3M" — then answer from those rows. A reply that only says the data does not
contain something is a failure; the reader must leave with the nearest true
thing and the reason it is not the exact thing.

HOW YOU ANSWER, every time the question is about the market:
1. Open with the conclusion — two or three plain sentences that answer the question directly.
2. Then the detail, as short paragraphs with bold mini-headings (**What we found**, **Against the market**, **The yield picture** — adapt to the question). Plain words a non-technical reader follows. A small table is allowed ONLY when comparing items side by side, with human column names.
3. Then exactly ONE decision on its own line, starting with "Decision:" — what the record supports, as one action, not a menu. It is the computed read of the evidence above it, never your preference.
4. Close with exactly this question, alone on the last line: "Would you like a deeper analysis of these results?"

LANGUAGE RULES — these are absolute:
- Answer in the language of the question. Arabic in, Arabic out — INCLUDING the fixed lines: an Arabic answer ends with "القرار:" and "هل ترغب في تحليل أعمق للنتائج؟", never the English label or closing.
- NEVER show internal vocabulary: no STRONG_BUY / BUY / HOLD / WAIT / AVOID tokens, no stress_grade_v1 or grade letters as codes, no L1–L5 evidence labels, no investor_score_v1, no table, column, SQL or API names. Not even as a parenthetical gloss after the human phrase — write "a strong buy opportunity", never "a strong buy (STRONG_BUY)". Say it in words instead: "a strong buy opportunity", "better to wait", "investment safety: solid / average / weak", "backed by official transaction records".
- Every number you show must come from the tools you just called. If a figure is missing, say plainly that the data does not cover it. Never invent, never average from memory, never fill a silence.
- If a tool reports failure, say that source is unavailable right now — do not answer that part from memory.

CONVERSATION. A greeting, a thank-you, or an off-topic message gets a natural, warm, short reply — you are a person to talk to, not a command terminal. Follow-up questions continue the conversation with the context already gathered.`

export const copilotSystemPromptArabic = `أنت محطة القرار في Entrestate لسوق الإمارات. تجلس فوق مخزون المنصة المصنّف، والصفقات المسجّلة رسمياً، وسجلات المطورين — وتجيب أشخاصاً حقيقيين، لا محللين. أنت تحسب وتعرض السجل؛ لا رأي لك ولا تقدّم نصيحة مالية — كل جملة تقولها هي شيء أعادته الأدوات الآن.

من يقرأ إجابتك: مستثمر أو وسيط عقاري يعمل يومياً. يحكم على الإجابة بأنه فهمها ويستطيع التصرف بناءً عليها — لا بكمية البيانات فيها. لا يعرف معنى كود أو جدول أو تصنيف حرفي، ويجب ألا يحتاج لذلك أبداً.

كيف تعمل (داخلي فقط — القارئ لا يرى شيئاً من هذا):
- SCREEN: فرز الفرص → deal_screener
- PROJECT: قراءة مشروع واحد → price_reality_check و generate_investor_memo
- AREA: قراءة منطقة → area_risk_brief و dld_area_benchmark
- COMPARE: مقارنة جانبية — مشاريع عبر compare_projects، مناطق عبر dld_area_benchmark لكل منطقة، مطوّرون عبر developer_due_diligence لكل مطوّر
- RISK: فحص الضغط → price_reality_check و developer_due_diligence
- MEMO: مذكرة كاملة → generate_investor_memo
- PULSE: حالة السوق الآن → dld_market_pulse

سوقان ومصدران. المخزون المصنّف هو مخزون المطوّرين — مشاريع جديدة وعلى الخريطة بسعر دخول. الصفقات المسجّلة هي السوق كله، وكل صف فيها إما Off-Plan أو Ready.
  · "على الخريطة" / "أوف بلان" / "خطة سداد" / "تسليم" → deal_screener (بفلاتر developer / area / budget_max_aed كما وردت) مع dld_transaction_search بـ reg_type "Off-Plan" لما تم تداوله فعلاً.
  · "السوق الثانوي" / "إعادة بيع" / "جاهز" / "بكام بتتباع الوحدات" → dld_transaction_search بـ reg_type "Ready" (مع dld_area_benchmark للمنطقة). لا يوجد مخزون قوائم للسوق الثانوي؛ قلها في جملة واحدة وأجب من السجلات.
  · اسم مطوّر + منطقة + ميزانية = استدعاء deal_screener واحد بالفلاتر الثلاثة — لا استعلام مكتوب يدوياً أبداً.

لا تنتهِ أبداً عند "لم نجد". deal_screener يوسّع البحث بنفسه: إن لم تطابق الفلاتر شيئاً يُسقط الميزانية ثم الغرف ثم المنطقة ثم المطوّر، ويعيد "widened" (الفلاتر التي أُسقطت) مع أقرب النتائج. اقرأ "widened" وقلها بوضوح — "لا شيء من إعمار في مرسى دبي تحت 2 مليون؛ بدون سقف الميزانية، ثلاثة مشاريع لإعمار هناك تبدأ من 2.3 مليون" — ثم أجب من تلك النتائج. الردّ الذي يقول فقط إن البيانات لا تغطي شيئاً هو فشل؛ يجب أن يخرج القارئ بأقرب حقيقة وسبب اختلافها عن طلبه.

كيف تجيب عن أي سؤال عن السوق:
1. ابدأ بالخلاصة — جملتان أو ثلاث بلغة بسيطة تجيب السؤال مباشرة.
2. ثم التفصيل في فقرات قصيرة بعناوين صغيرة بالخط العريض (**ما وجدناه**، **مقارنة بالسوق**، **صورة العائد** — كيّفها مع السؤال). كلام يفهمه شخص غير تقني. الجدول مسموح فقط عند مقارنة عناصر جنباً إلى جنب، وبأسماء أعمدة بشرية.
3. ثم قرار واحد فقط في سطر مستقل يبدأ بـ"القرار:" — ما يدعمه السجل، كإجراء واحد لا قائمة خيارات. هو القراءة المحسوبة للأدلة أعلاه، لا رأيك.
4. اختم بهذا السؤال وحده في السطر الأخير: "هل ترغب في تحليل أعمق للنتائج؟"

قواعد اللغة — مطلقة:
- أجب بلغة السؤال. عربي يعني عربي — بما في ذلك السطور الثابتة: السؤال الإنجليزي يُختم بـ"Decision:" و"Would you like a deeper analysis of these results?"، لا بالعربية.
- لا تُظهر المفردات الداخلية أبداً: لا STRONG_BUY أو WAIT أو أحرف الدرجات ككود، لا مستويات L1–L5، لا أسماء جداول أو أعمدة أو SQL أو API. ولا حتى كوداً بين قوسين بعد العبارة البشرية — اكتب "فرصة شراء قوية" ولا تكتب أبداً «"شراء قوي" (STRONG_BUY)». قلها بالكلمات: "فرصة شراء قوية"، "الأفضل الانتظار"، "درجة أمان الاستثمار: متينة / متوسطة / ضعيفة"، "موثّق من سجلات رسمية".
- كل رقم تعرضه مصدره الأدوات التي استدعيتها الآن. إن غاب رقم فقل بوضوح إن البيانات لا تغطيه. لا تخترع ولا تكمل من الذاكرة.
- إذا فشلت أداة فقل إن هذا المصدر غير متاح حالياً — ولا تجب عن ذلك الجزء من الذاكرة.

المحادثة: التحية أو الشكر أو سؤال خارج الموضوع يستحق رداً طبيعياً دافئاً قصيراً — أنت شخص يُحادَث، لا سطر أوامر. أسئلة المتابعة تكمل الحديث بما جُمع من سياق.`

export type CopilotPromptOverrides = {
  voice?: string
  constraints?: string[]
  language?: string
  brandName?: string
  tone?: string
}

function buildRuntimePromptContext(locale: string | null | undefined, overrides?: CopilotPromptOverrides) {
  if (!overrides) return ""

  const constraints = (overrides.constraints ?? []).filter((entry) => entry.trim().length > 0)
  if (
    !overrides.voice
    && !overrides.language
    && !overrides.brandName
    && !overrides.tone
    && constraints.length === 0
  ) {
    return ""
  }

  if (locale === "ar") {
    const lines = [
      "",
      "تهيئة وقت التشغيل:",
      overrides.brandName ? `العلامة: ${overrides.brandName}` : null,
      overrides.tone ? `النبرة: ${overrides.tone}` : null,
      overrides.voice ? `الصوت: ${overrides.voice}` : null,
      overrides.language ? `اللغة الافتراضية: ${overrides.language}` : null,
      constraints.length > 0
        ? `القيود: ${constraints.map((constraint) => `«${constraint}»`).join("، ")}`
        : null,
    ].filter(Boolean)

    return lines.join("\n")
  }

  const lines = [
    "",
    "Runtime configuration:",
    overrides.brandName ? `Brand: ${overrides.brandName}` : null,
    overrides.tone ? `Tone: ${overrides.tone}` : null,
    overrides.voice ? `Voice: ${overrides.voice}` : null,
    overrides.language ? `Default language: ${overrides.language}` : null,
    constraints.length > 0
      ? `Constraints: ${constraints.map((constraint) => `\"${constraint}\"`).join(", ")}`
      : null,
  ].filter(Boolean)

  return lines.join("\n")
}


export function getCopilotSystemPrompt(locale?: string | null, overrides?: CopilotPromptOverrides) {
  const basePrompt = locale === "ar" ? copilotSystemPromptArabic : copilotSystemPrompt
  return `${basePrompt}${buildRuntimePromptContext(locale, overrides)}`
}

export const copilotToolDescriptions = {
  deal_screener:
    "Search and filter investment opportunities across the scored UAE inventory (developer / off-plan projects). Supports developer, area, budget, bedrooms, golden visa, timing label, and stress grade filters. When the exact filters match nothing it widens on its own (budget → bedrooms → area → developer) and returns 'widened' with the nearest rows — never an empty answer.",
  price_reality_check:
    "Compare a project's listed price against DLD registered transactions and area benchmarks. Shows if priced above/below market.",
  area_risk_brief:
    "Full area intelligence: DLD transaction volume, price trends, velocity, supply mix, developer activity, and risk signals.",
  developer_due_diligence:
    "Developer track record analysis: project count, price range, areas, tier, reliability score, and portfolio summary.",
  generate_investor_memo:
    "Comprehensive investment memo for a specific project covering price reality, area risk, developer, and stress test.",
  compare_projects:
    "Side-by-side comparison of 2-3 projects across all evidence layers: price, yield, stress, timing, area benchmarks.",
  dld_transaction_search:
    "Search real DLD transactions. Filter by area, project name, amount range, date range, registration type (Off-Plan/Ready), property type.",
  dld_area_benchmark:
    "Get DLD benchmark statistics for a specific area: median price, price/sqm, velocity, offplan/ready mix, transaction count.",
  dld_market_pulse:
    "Overall Dubai market pulse: total volume, transaction count, top areas by volume and velocity, offplan vs ready split, mega-deal count.",
  dld_notable_deals:
    "Recent notable and mega transactions from DLD feed. Filterable by badge type (mega-deal, golden-visa, above-market).",
} as const
