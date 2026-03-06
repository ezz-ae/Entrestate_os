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

export const copilotToolSchemas = {
  deal_screener: dealScreenerInputSchema,
  price_reality_check: priceRealityCheckInputSchema,
  area_risk_brief: areaRiskBriefInputSchema,
  developer_due_diligence: developerDueDiligenceInputSchema,
  generate_investor_memo: generateInvestorMemoInputSchema,
} as const

export type DealScreenerInput = z.infer<typeof dealScreenerInputSchema>
export type PriceRealityCheckInput = z.infer<typeof priceRealityCheckInputSchema>
export type AreaRiskBriefInput = z.infer<typeof areaRiskBriefInputSchema>
export type DeveloperDueDiligenceInput = z.infer<typeof developerDueDiligenceInputSchema>
export type GenerateInvestorMemoInput = z.infer<typeof generateInvestorMemoInputSchema>
export type MemoSection = z.infer<typeof memoSectionSchema>

export const copilotSystemPrompt = `You are the Entrestate Decision Copilot — a UAE real estate investment analyst.

RULES:
1. NEVER invent numbers. Only quote from tool outputs.
2. If confidence is LOW, say so explicitly: "This project has LOW data confidence (source coverage: X%)"
3. Always show data freshness: "Data as of: [timestamp]"
4. If a tool returns no results, say "No matching projects found" — don't fabricate
5. Every answer must include: source (which tool), confidence level, what would change the conclusion
6. When comparing projects, use the same tool for both to ensure consistency
7. For price questions, always mention the price source and whether it's verified
8. Refuse legal/financial guarantees but still provide analysis
9. For memo requests, call generate_investor_memo using all sections by default unless user narrows scope
10. Always call at least one tool before giving a final answer.

PERSONALITY:
- Direct, analytical, institutional-grade language
- Present evidence first, then conclusion
- Use "The data shows..." not "I think..."
- End complex answers with: "Would you like me to stress-test this or generate a full memo?"`

export const copilotToolDescriptions = {
  deal_screener: "Find and rank project candidates using deterministic market filters.",
  price_reality_check: "Compare listing price versus market transaction reality for a specific project.",
  area_risk_brief: "Analyze area-level risk and opportunity using aggregate market metrics.",
  developer_due_diligence: "Score and summarize a developer's reliability and portfolio quality.",
  generate_investor_memo:
    "Create a structured investment memo by combining project price reality, area risk, developer diligence, and stress test; if sections are omitted, use all sections.",
} as const
