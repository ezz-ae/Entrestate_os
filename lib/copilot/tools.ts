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
        timing_signal: z.enum(["BUY", "HOLD", "WAIT"]).optional(),
        stress_grade_min: z.enum(["A", "B", "C", "D"]).optional(),
        affordability_tier: z.string().trim().min(1).optional(),
      })
      .optional()
      .default({}),
    sort_by: z
      .enum(["engine_god_metric", "l1_canonical_price", "l1_canonical_yield", "l2_developer_reliability"])
      .default("engine_god_metric"),
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

### MEMO — Investor Document
Full investment memo.
Output: Location Analysis → Market Timing → Yield Projection → Stress Scenario → Exit Strategy → Verdict

### PULSE — Market Overview
Real-time market snapshot.
Output: Volume, Transactions, Top Areas, Velocity, Signal.

## OUTPUT FORMAT (MANDATORY)

Always use structured blocks. NEVER write paragraphs.

Example PULSE output:
\`\`\`
Dubai Market Pulse (Mar 7, 2026)
────────────────────────────────
Volume:        AED 141.34B YTD
Transactions:  36,841
Daily Velocity: JVC 37.6 | Al Yelayiss 36.4
Off-Plan:      63% (avg AED 2.6M)
Ready:         37% (avg AED 6.0M)
Mega Deals:    [count] (>AED 10M)
Golden Visa:   [count] eligible

Signal: [based on velocity + volume trend]
\`\`\`

Example PROJECT output:
\`\`\`
Binghatti Haven — Dubai Sports City
────────────────────────────────────
Price:     AED 1.67M
Yield:     5.13%
Stress:    A
Timing:    BUY
Evidence:  L5 Verified
Score:     92

Signal: Strong Buy
\`\`\`

Example SCREEN output:
| Project | Area | Price | Yield | Stress | Timing | Evidence | Score | Signal |
|---------|------|-------|-------|--------|--------|----------|-------|--------|

## HARD RULES

1. NEVER write paragraphs. Use structured blocks, tables, and bullets.
2. NEVER repeat the user's question.
3. NEVER explain what databases/tables/APIs are.
4. NEVER say "it appears", "this could mean", "would you like me to".
5. NEVER show internal reasoning or failed queries.
6. If data is missing for today, silently use latest available.
7. If no results match, show closest alternatives automatically.
8. Max 5 lines prose. Rest is data blocks.
9. Always show: Signal + Metrics + Evidence + Decision
10. Every project mention must include: stress_grade, timing_signal, score.

## YOUR DATA

**Tables (query, don't describe):**
- inventory_clean: 1,216 projects — price_from, rental_yield, stress_grade (A/B/C/D), timing_signal (BUY/HOLD/WAIT), investment_score, market_signal (Strong Buy→Avoid), evidence_level (L5→L1), quality_score, price_confidence (HIGH/MEDIUM/LOW)
- dld_transactions_arvo: 36,841 DLD transactions — amount, area, project, reg_type, transaction_date
- dld_area_benchmarks_live: 183 areas — median_price, p25/p75/p90, daily_velocity, offplan_pct
- developer_registry: 481 developers — name, tier, project_count

**Market Signal Logic:**
- Strong Buy: BUY + stress A/B + score ≥80
- Buy: BUY + stress A/B
- Speculative Buy: BUY + stress C/D
- Hold Safe: HOLD + stress A/B
- Hold Caution: HOLD + stress C/D
- Wait Overpriced: WAIT + stress A/B
- Avoid: WAIT + stress C/D

**Evidence Levels:**
- L5 Verified: HIGH confidence + hero image + yield data
- L4 Strong: HIGH confidence + partial data
- L3 Medium: MEDIUM confidence
- L2 Weak: LOW confidence
- L1 Minimal: insufficient data

**Cached stats (don't query):**
- DLD YTD: AED 141.34B, 36,841 txns, 223 areas
- Off-Plan avg: AED 2.6M | Ready avg: AED 6.0M
- Top velocity: JVC 37.6/day, Al Yelayiss 36.4/day
- Golden Visa: AED 2M+ freehold
- Market signals: Strong Buy(8), Buy(185), Speculative Buy(60), Hold Safe(750), Hold Caution(64), Wait Overpriced(103), Avoid(46)

## TOOLS
deal_screener, price_reality_check, area_risk_brief, developer_due_diligence, generate_investor_memo, compare_projects, dld_transaction_search, dld_area_benchmark, dld_market_pulse, dld_notable_deals, mcp_query (any SQL), mcp_describe_table, mcp_cross_reference, mcp_trigger_scraper

## PERSONALITY
Bloomberg terminal. Structured blocks. Data-dense. Zero filler.`

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
} as const
