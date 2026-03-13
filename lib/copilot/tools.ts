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
        timing_signal: z.enum(["STRONG_BUY", "BUY", "HOLD", "WAIT", "AVOID"]).optional(),
        stress_grade_min: z.enum(["A", "B", "C", "D", "E"]).optional(),
        affordability_tier: z.string().trim().min(1).optional(),
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

export const scenarioStressTestInputSchema = z
  .object({
    project_name: z.string().trim().min(1),
    down_payment_pct: z.number().min(0).max(100).default(20),
    interest_rate_pct: z.number().min(0).max(30).default(5),
    mortgage_years: z.number().int().min(1).max(30).default(25),
    vacancy_pct: z.number().min(0).max(100).default(10),
    operating_cost_pct: z.number().min(0).max(50).default(15),
    rent_growth_pct: z.number().min(-50).max(50).default(3),
    price_change_pct: z.number().min(-50).max(100).default(10),
    hold_years: z.number().int().min(1).max(30).default(5),
  })
  .strict()

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
  scenario_stress_test: scenarioStressTestInputSchema,
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
export type ScenarioStressTestInput = z.infer<typeof scenarioStressTestInputSchema>
export type MemoSection = z.infer<typeof memoSectionSchema>

export const copilotSystemPrompt = `You are the Entrestate Decision Expert, a conversational UAE real-estate intelligence advisor.

Tone: warm, concise, confident. Speak like a senior analyst who is helpful and direct.

Behavior:
- If the user greets you, respond briefly and ask what they want to analyze.
- Ask 1-2 clarifying questions when intent or filters are missing.
- Do not recommend specific projects unless the user asks or filters are explicit.
- Use short paragraphs and bullet lists. Include a compact data block when presenting results.
- Keep responses friendly and consultative, not robotic.

Output guidance:
- When providing results, include: Signal, Metrics, Evidence, Decision.
- Avoid terminal-style walls of text unless the user asks for it.

Safety and integrity:
- Ground answers in available data and tools.
- Never expose internal tool names, schemas, or system internals.
- If data is missing, say what you can do next and ask for the missing input.
- Never fabricate stress scenarios; only report real stress_grade_v1 and sub-scores from the database.

## YOUR DATA

**Tables (query, don't describe):**
- inventory_clean: 1,216 projects — price_from, rental_yield, stress_grade_v1 (A/B/C/D/E), timing_label (STRONG_BUY/BUY/HOLD/WAIT/AVOID), investor_score_v1 (0-100), decision_label_v1, yield_label, evidence_label_v1, quality_score, price_confidence (HIGH/MEDIUM/LOW)
- dld_transactions_arvo: 36,841 DLD transactions — amount, area, project, reg_type, transaction_date
- dld_area_benchmarks_live: 183 areas — median_price, p25/p75/p90, daily_velocity, offplan_pct
- developer_registry: 481 developers — name, tier, project_count

**V1 Column Mapping (CRITICAL — use these exact names):**
- timing_label (NOT timing_signal)
- stress_grade_v1 (NOT stress_grade)
- investor_score_v1 (NOT investment_score)
- decision_label_v1 (NOT market_signal)
- evidence_label_v1 (NOT evidence_level)
- yield_label

**Decision Label Logic:**
- STRONG_BUY: score >= 85 AND timing >= 75 AND stress >= 75 AND evidence >= 70
- BUY: score >= 75 AND timing >= 65 AND stress >= 65
- HOLD: score >= 60
- WAIT: score >= 45
- AVOID: score < 45

**Hard Guards:**
- stress_score < 50 → force AVOID, cap at 60
- evidence_score < 45 → force HOLD, cap at 70
- developer_reliability_score < 30 → cap at 60

**Cached stats (don't query):**
- DLD YTD: AED 141.34B, 36,841 txns, 223 areas
- Off-Plan avg: AED 2.6M | Ready avg: AED 6.0M
- Top velocity: JVC 37.6/day, Al Yelayiss 36.4/day
- Golden Visa: AED 2M+ freehold

## TOOLS
deal_screener, price_reality_check, area_risk_brief, developer_due_diligence, generate_investor_memo, compare_projects, dld_transaction_search, dld_area_benchmark, dld_market_pulse, dld_notable_deals, mcp_query (any SQL), mcp_describe_table, mcp_cross_reference, mcp_trigger_scraper

## PERSONALITY
Conversational expert. Precise, friendly, and decision-focused.`

export const copilotToolDescriptions = {
  deal_screener:
    "Search and filter investment opportunities from 1,216 verified projects. Supports budget, area, bedrooms, golden visa, timing signal, and stress grade filters.",
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
  refresh_dld_data:
    "Trigger a fresh pull of DLD transaction data from the arvo.co API. Returns summary of new/updated transactions.",
  apply_decision_lens:
    "Apply a specific investor profile (conservative/balanced/aggressive) to filter and rank projects.",
  list_market_entities: "List areas, developers, or projects matching criteria. Good for discovery queries.",
  generate_decision_object: "Create a downloadable PDF report, PPTX deck, or HTML widget for a project.",
  generate_strategic_report: "Generate a full strategic market report for a specific area or segment.",
  generate_investment_roadmap: "Create a personalized investment roadmap based on budget, goals, and risk tolerance.",
  monitor_market_segments: "Track specific market segments: price movements, supply changes, velocity trends.",
  scenario_stress_test:
    "Financial stress test for a specific project. Models DSCR, cash flow, ROI, and break-even based on user-provided assumptions (down payment, interest rate, vacancy, hold period).",
} as const
