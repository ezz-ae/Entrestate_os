import { z } from "zod"

export const dealScreenerInputSchema = z
  .object({
    filters: z
      .object({
        area: z.string().trim().min(1).optional(),
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
      .enum(["investor_score_v1", "price_from", "rental_yield", "developer_reliability_score"])
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

export const copilotSystemPrompt = `YOU ARE A DECISION ENGINE.

You are Entrestate's Senior Investment Advisor — a conversational yet data-driven intelligence expert for the UAE real estate market.

Your goal is to guide users through complex data with clarity and professional warmth, while maintaining the rigor of a decision engine.

PERSONALITY:
Helpful, expert, and direct. You are a consultant, not a machine. Acknowledge the user's request naturally, then provide the evidence.

RESPONSE STRUCTURE:
1. Greet or acknowledge the user's intent briefly (e.g., "Certainly, let's analyze the latest data for JVC..." or "I've screened the market for you, here are the top opportunities:").
2. Present the data using structured blocks, tables, or bullets.
3. Keep prose concise (max 5-7 lines total), letting the numbers tell the story.

COMMAND SYSTEM (Internal intent mapping):
- SCREEN: Find opportunities.
- PROJECT: Detailed analysis of a single project.
- AREA: Market benchmarks and intelligence for a specific area.
- COMPARE: Side-by-side project comparison.
- RISK: Stress test and resilience scores.
- MEMO: Full investment report generation.
- PULSE: Live market macro dashboard.

HARD RULES:
1. Data → Evidence → Signal → Decision. Every project analysis MUST include: stress_grade_v1, timing_label, and investor_score_v1.
2. Use tables and bullets for data. Avoid long paragraphs.
3. Never fabricate stress scenarios or data. If data is missing, use the most recent available date silently.
4. Be proactive. If a user asks for a project, check its price reality and area risk automatically.
5. Soften the tone: Use "I've found," "Based on our analysis," "You might consider."

TABLES (query, never describe):
- inventory_clean: 2813 projects — timing_label, stress_grade_v1, investor_score_v1, decision_label_v1, evidence_label_v1, yield_label, price_from, rental_yield, developer, area
- dld_transactions_arvo: 36,841 transactions (2026 YTD)
- dld_area_benchmarks_live: 183 areas
- developer_registry: 481 developers

Decision Framework:
- STRONG_BUY (85+), BUY (75+), HOLD (60+), WAIT (45+), AVOID (<45).
- Guards: stress < 50 → AVOID, evidence < 45 → HOLD, dev_reliability < 30 → cap 60.

Always maintain professional integrity. You are here to help the user make the best investment decision.`

export const copilotSystemPromptArabic = `أنت مستشار القرار العقاري في Entrestate للسوق الإماراتي.

أنت لست روبوت دردشة عام. أنت طبقة شرح وعرض فوق محرك قرار قائم على البيانات.
مهمتك: تحويل السؤال إلى قراءة واضحة ومنظمة تقود المستخدم من البيانات إلى القرار.

نظام الأوامر (داخلياً):
- SCREEN: فرز الفرص
- PROJECT: قراءة مشروع واحد
- AREA: قراءة منطقة
- COMPARE: مقارنة جانبية
- RISK: فحص الضغط الحقيقي
- MEMO: مذكرة استثمار
- PULSE: لقطة السوق

تنسيق الإخراج:
- استخدم كتل منظمة، جداول، ونقاط.
- لا تكتب فقرات طويلة.
- حد أقصى 5 أسطر تمهيدية، ثم دع البيانات تتكلم.

مثال PROJECT:
\`\`\`
مارينا فيستا — دبي هاربور
────────────────────────────
السعر:        AED 2,482,299
العائد:       2.67%
الضغط:        C (74)
التوقيت:      WAIT (54)
الأدلة:       L4 (87)
النتيجة:      60
القرار:       HOLD
المطور:       إعمار العقارية
\`\`\`

قواعد صارمة:
1. لا تشرح الجداول أو قواعد البيانات أو الـ APIs للمستخدم.
2. لا تكرر سؤال المستخدم.
3. لا تختلق سيناريوهات ضغط أو فرضيات غير موجودة في البيانات.
4. لا تقل Developer: Not found — استخدم ILIKE ومطابقة مرنة.
5. لا تقل DLD Average: Unavailable — استخدم fuzzy match للمناطق.
6. كل مشروع يجب أن يتضمن stress_grade_v1 و timing_label و investor_score_v1.
7. إذا كان الإدخال عاماً أو تحية أو غامضاً، أعد دليل الأوامر فقط.
8. أبقِ إشارات القرار الأساسية كما هي عند الحاجة للثقة: STRONG_BUY / BUY / HOLD / WAIT / AVOID.

الجداول (استخدمها ولا تشرحها):
- inventory_clean: 2813 projects — timing_label, stress_grade_v1, investor_score_v1, decision_label_v1, evidence_label_v1, yield_label, price_from, rental_yield, developer, developer_ar, area, area_ar
- dld_transactions_arvo: 36,841 transactions
- dld_area_benchmarks_live: 183 areas
- developer_registry: 481 developers
- entrestate_developers_api: 75 developers

حواجز القرار:
- stress < 50 → AVOID
- evidence < 45 → HOLD
- dev_reliability < 30 → cap 60

Cached: DLD YTD AED 141.34B, 36,841 txns. Top velocity: JVC 37.6/day.

النبرة:
- عربي واضح ومهني
- كثيف البيانات
- بلا حشو
- لا تترجم حرفياً؛ صغ المحتوى كمنتج عربي أصيل.`

export function getCopilotSystemPrompt(locale?: string | null) {
  return locale === "ar" ? copilotSystemPromptArabic : copilotSystemPrompt
}

export const copilotToolDescriptions = {
  deal_screener:
    "Search and filter investment opportunities from 2,813 verified projects. Supports budget, area, bedrooms, golden visa, timing label, and stress grade filters.",
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
