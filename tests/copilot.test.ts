import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { buildDealScreenerQuery } from "@/lib/copilot/executor"
import { collectGuardrailWarnings, validateToolOutput } from "@/lib/copilot/guardrails"
import {
  copilotSystemPrompt,
  copilotSystemPromptArabic,
  dealScreenerInputSchema,
  developerDueDiligenceInputSchema,
  generateInvestorMemoInputSchema,
} from "@/lib/copilot/tools"

function sqlText(sql: unknown) {
  const fragment = sql as { strings?: string[] }
  if (fragment?.strings) return fragment.strings.join("")
  return String(sql)
}

describe("copilot schemas", () => {
  it("accepts screener request for 2BR under AED 2M with BUY signal", () => {
    const parsed = dealScreenerInputSchema.parse({
      filters: {
        budget_max_aed: 2_000_000,
        beds_min: 2,
        beds_max: 2,
        timing_label: "BUY",
      },
      sort_by: "investor_score_v1",
      limit: 10,
    })

    expect(parsed.filters.budget_max_aed).toBe(2_000_000)
    expect(parsed.filters.timing_label).toBe("BUY")
  })

  it("keeps the Decision Terminal identity and the one-decision contract", () => {
    // The prompt used to open "YOU ARE NOT A CHATBOT. YOU ARE A DECISION
    // ENGINE" and forbid paragraphs. The owner reversed that on purpose after
    // watching real users: the reader is an investor or a working agent, and
    // the answer is paragraphs, one closing line, one closing question. On
    // 2026-09-05 the closing line became "Decision:" — the computed read of
    // the record — because the product computes and does not advise, and
    // the identity stopped calling itself an advisor.
    expect(copilotSystemPrompt).toContain("Entrestate Decision Terminal")
    expect(copilotSystemPrompt).not.toContain("market advisor")
    expect(copilotSystemPrompt).toContain("no financial advice")
    expect(copilotSystemPrompt).toContain('starting with "Decision:"')
    expect(copilotSystemPrompt).toContain("Would you like a deeper analysis of these results?")
    expect(copilotSystemPrompt).toContain("NEVER show internal vocabulary")
  })

  it("routes off-plan to the inventory and secondary to the recorded Ready transactions", () => {
    for (const prompt of [copilotSystemPrompt, copilotSystemPromptArabic]) {
      expect(prompt).toContain('reg_type "Off-Plan"')
      expect(prompt).toContain('reg_type "Ready"')
      expect(prompt).toContain("deal_screener")
    }
    expect(copilotSystemPrompt).toContain("NEVER END AT \"NOT FOUND\"")
    expect(copilotSystemPrompt).toContain('"widened"')
    expect(copilotSystemPromptArabic).toContain('"widened"')
  })

  it("the screener takes a developer filter — 'Emaar in the Marina under 2M' is one call", () => {
    const parsed = dealScreenerInputSchema.parse({ filters: { developer: "Emaar", area: "Dubai Marina", budget_max_aed: 2_000_000 } })
    expect(parsed.filters.developer).toBe("Emaar")
  })

  it("accepts developer due diligence lookup", () => {
    const parsed = developerDueDiligenceInputSchema.parse({ developer_name: "Emaar" })
    expect(parsed.developer_name).toBe("Emaar")
  })

  it("accepts investor memo generation payload", () => {
    const parsed = generateInvestorMemoInputSchema.parse({
      project_name: "Marina Vista",
      sections: ["price_reality", "area_risk", "developer", "stress_test"],
    })
    expect(parsed.project_name).toBe("Marina Vista")
    expect(parsed.sections).toHaveLength(4)
  })
})

describe("copilot route", () => {
  it("lets the advisor converse — auto tools, never forced", () => {
    // The old pin here ENFORCED toolChoice: "required": the decision-engine
    // era, when every turn had to hit a database. Under the advisor contract
    // a person can say "شكراً" and get a sentence back; forcing a tool call
    // on every step made that impossible. "auto" is what /api/chat runs.
    const routePath = path.join(process.cwd(), "app/api/copilot/route.ts")
    const source = fs.readFileSync(routePath, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
    expect(source).toContain('toolChoice: "auto"')
    expect(source).not.toContain('toolChoice: "required"')
  })
})

describe("copilot SQL builder", () => {
  const screenerInput = () =>
    dealScreenerInputSchema.parse({
      filters: {
        budget_max_aed: 2_000_000,
        beds_min: 2,
        beds_max: 2,
        timing_label: "BUY",
      },
      sort_by: "investor_score_v1",
      limit: 10,
    })

  /**
   * This test used to assert `price_from_aed <=` and the bedrooms_min/max
   * filters unconditionally. Those columns belong to the WIDE inventory tables
   * (raw.inventory_full, public.inventory_spine, api.entrestate_inventory). The
   * configured table is canonical.inventory_clean — the curated V1 table, the
   * only one carrying stress_grade_v1 / investor_score_v1 / price_confidence —
   * and it names its price `price_from` and has no bedroom range at all.
   *
   * So the assertions passed while the query they described could not run. The
   * shape is now derived from the table name, and each shape is asserted as
   * itself rather than one being asserted for both.
   */
  it("builds deal screener SQL for the curated table it is configured against", () => {
    const text = sqlText(buildDealScreenerQuery(screenerInput()))

    expect(text).toContain("FROM")
    expect(text).toContain("price_from <=")
    // No bedroom range on this table: filtering on it threw, it did not narrow.
    expect(text).not.toContain("bedrooms_min IS NULL OR bedrooms_min BETWEEN")
    expect(text).toContain("COALESCE(price_confidence, 'LOW') IN ('MEDIUM', 'HIGH')")
    expect(text).toContain("TRIM(COALESCE(developer, '')) <>")
    expect(text).toContain("timing_label =")
    expect(text).toContain("ORDER BY investor_score_v1 DESC")
    expect(text).toContain("LIMIT")
    // The result still reports a price_from_aed field, so callers and the UI are
    // unchanged by which column the table happens to use.
    expect(text).toContain("AS price_from_aed")
  })

  it("still filters on the bedroom range when the table has one", () => {
    const text = sqlText(buildDealScreenerQuery(screenerInput(), true))

    expect(text).toContain("COALESCE(bedrooms_max, bedrooms_min) >=")
    expect(text).toContain("COALESCE(bedrooms_min, bedrooms_max) <=")
  })
})

describe("copilot guardrails", () => {
  it("flags low confidence and missing DLD overlays", () => {
    expect(validateToolOutput({ l1_confidence: "LOW" }).warning).toContain("LOW confidence")
    expect(validateToolOutput({ l4_dld_avg_txn_price: null }).warning).toContain("No DLD transaction")
  })

  it("collects warnings recursively from arrays", () => {
    const warnings = collectGuardrailWarnings({
      rows: [
        { l1_confidence: "LOW" },
        { l1_canonical_price: null },
        { l4_dld_avg_txn_price: null },
      ],
    })

    expect(warnings).toContain("LOW confidence — limited data sources")
    expect(warnings).toContain("Price data unavailable")
    expect(warnings).toContain("No DLD transaction overlay available")
  })
})
