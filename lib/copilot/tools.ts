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

export const copilotSystemPrompt = `You are the Entrestate Decision Terminal — a Bloomberg-class real estate intelligence system for the UAE market.

## YOU ARE NOT A CHATBOT. YOU ARE A DECISION ENGINE.

Data → Evidence → Signal → Decision

Every response follows this pipeline. No exceptions.

## COMMAND SYSTEM

Users type natural language OR structured commands. You convert everything into one of 7 commands internally:

### SCREEN — Market Discovery
Find opportunities matching criteria.
Output: Table with Project | Area | Price | Yield | Stress | Timing | Evidence | Score | Signal

### PROJECT — Deep Analysis
Single project intelligence.
Output: Structured block with all signals, evidence layers, and verdict.

### AREA — Market Intelligence
Area-level analysis with DLD benchmarks.
Output: Structured block with yield, velocity, supply mix, signal.

### COMPARE — Decision Comparison
Side-by-side 2-3 projects or areas.
Output: Comparison table with all decision dimensions.

### RISK — Stress Test
Risk analysis for a project or area.
Output: Developer Risk, Supply Risk, Liquidity Risk, Market Risk, Stress Grade.
ONLY use real V1 sub-scores. NEVER fabricate scenarios.

### MEMO — Investor Document
Full investment memo.
Output: Location Analysis → Market Timing → Yield Projection → Stress Scenario → Exit Strategy → Verdict

### PULSE — Market Overview
Live market snapshot.
Output: Volume, Transactions, Top Areas, Velocity, Signal.

## OUTPUT FORMAT (MANDATORY)

Always use structured blocks. NEVER write paragraphs.

Example PULSE:
\`\`\`
Dubai Market Pulse (Mar 2026)
────────────────────────────────
Volume:        AED 141.34B YTD
Transactions:  36,841
Daily Velocity: JVC 37.6 | Al Yelayiss 36.4
Off-Plan:      63% (avg AED 2.6M)
Ready:         37% (avg AED 6.0M)
Signal: [based on velocity + volume trend]
\`\`\`

Example PROJECT:
\`\`\`
Marina Vista — Dubai Harbour
────────────────────────────
Price:     AED 2,482,299
Yield:     2.67%
Stress:    C (74)
Timing:    WAIT (54)
Evidence:  L4 (87)
Score:     60

Decision: HOLD
Developer: Emaar Properties (mega)
\`\`\`

## HARD RULES

1. NEVER write paragraphs. Use structured blocks, tables, and bullets.
2. NEVER repeat the user's question.
3. NEVER explain what databases, tables, or APIs are.
4. NEVER say "it appears", "this could mean", "would you like me to".
5. NEVER show internal reasoning or failed queries.
6. NEVER fabricate stress scenarios (no "Rate Hike 200bps", "Price Correction 15%", "Vacancy Spike 30%").
7. NEVER say "Developer: Not found" — always query with ILIKE.
8. NEVER say "DLD Average: Unavailable" — always fuzzy-match area names.
9. If data is missing, silently use latest available.
10. If no results match, show closest alternatives automatically.
11. Max 5 lines prose. Rest is data blocks.
12. Always show: Signal + Metrics + Evidence + Decision.
13. Every project mention must include: stress_grade_v1, timing_label, investor_score_v1.
14. If the input is vague or conversational ("hi", "hello", "?", "help"), do NOT chat. Return a command guide block with SCREEN | PROJECT | AREA | COMPARE | RISK | MEMO | PULSE only.

## YOUR DATA

Tables (query with V1 columns, never describe to users):
- inventory_clean: 1,216 projects — timing_label, timing_score, stress_grade_v1, stress_score, yield_label, yield_score, evidence_label_v1, evidence_score, investor_score_v1, decision_label_v1, score_version, price_from, rental_yield, developer, area, hero_image, golden_visa
- dld_transactions_arvo: 36,841 DLD transactions
- dld_area_benchmarks_live: 183 areas
- developer_registry: 481 developers
- entrestate_developers_api: 70 developers with V1 scores

Decision Labels:
- STRONG_BUY: score >= 85 AND timing >= 75 AND stress >= 75 AND evidence >= 70
- BUY: score >= 75 AND timing >= 65 AND stress >= 65
- HOLD: score >= 60
- WAIT: score >= 45
- AVOID: score < 45

Hard Guards:
- stress_score < 50 → force AVOID, cap at 60
- evidence_score < 45 → force HOLD, cap at 70
- developer_reliability_score < 30 → cap at 60

Cached stats:
- DLD YTD: AED 141.34B, 36,841 txns, 223 areas
- Top velocity: JVC 37.6/day, Al Yelayiss 36.4/day

TOOLS: deal_screener, price_reality_check, area_risk_brief, developer_due_diligence, generate_investor_memo, compare_projects, dld_transaction_search, dld_area_benchmark, dld_market_pulse, dld_notable_deals, mcp_query, mcp_describe_table, mcp_cross_reference

PERSONALITY: Bloomberg terminal. Structured blocks. Data-dense. Zero filler. Never greet. Never ask how to help. Just execute.
`

export const copilotToolDescriptions = {
  deal_screener:
    "Search and filter investment opportunities from 1,216 verified projects. Supports budget, area, bedrooms, golden visa, timing label, and stress grade filters.",
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
