import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { widenSteps } from "@/lib/copilot/executor"

/**
 * NEVER END AT "NOT FOUND".
 *
 * Asked "Emaar off-plan vs secondary market in Dubai Marina — which is the
 * better entry under AED 2M?", the live chat on 2026-09-05 ran three raw SQL
 * queries (deal_screener had no developer filter to land on), got 2813 / 0 /
 * 0, and answered: "we could not find any Emaar off-plan or secondary market
 * properties in Dubai Marina priced under AED 2M. This means we cannot
 * provide a direct comparison." Nothing about what Emaar does have in the
 * Marina, nothing about what the Marina has under 2M, nothing from the
 * 46,161 recorded transactions that ARE the secondary market.
 *
 * Two mechanics fix that, and this file pins both:
 *   1. deal_screener widens on its own, in a stated order — budget, then
 *      bedrooms, then area, then developer — and names what it dropped, so
 *      the model can say "without the budget cap, three Emaar projects start
 *      at 2.3M" instead of "nothing".
 *   2. The prompt routes "secondary / resale / ready" to the recorded
 *      transactions (reg_type Ready) and "off-plan" to the inventory plus the
 *      Off-Plan records — the two markets have two sources.
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")

describe("the screener lets go in a stated order", () => {
  it("drops budget, then bedrooms (both ends), then area, then developer", () => {
    const steps = widenSteps({ developer: "Emaar", area: "Dubai Marina", budget_max_aed: 2_000_000, beds_min: 2, beds_max: 3 })
    expect(steps.map((s) => s.dropped)).toEqual([
      ["budget_max_aed"],
      ["budget_max_aed", "beds_min", "beds_max"],
      ["budget_max_aed", "beds_min", "beds_max", "area"],
      ["budget_max_aed", "beds_min", "beds_max", "area", "developer"],
    ])
    expect(steps[0].filters).toEqual({ developer: "Emaar", area: "Dubai Marina", beds_min: 2, beds_max: 3 })
    expect(steps.at(-1)?.filters).toEqual({})
  })

  it("skips filters that were never set — no phantom steps", () => {
    const steps = widenSteps({ area: "JVC" })
    expect(steps).toHaveLength(1)
    expect(steps[0].dropped).toEqual(["area"])
    expect(widenSteps({})).toEqual([])
    expect(widenSteps(undefined)).toEqual([])
  })

  it("never drops golden_visa, timing or stress — those are the reader's requirements, not their guesses", () => {
    const steps = widenSteps({ area: "Downtown", golden_visa_required: true, timing_label: "BUY", stress_grade_min: "B" })
    for (const step of steps) {
      expect(step.filters.golden_visa_required).toBe(true)
      expect(step.filters.timing_label).toBe("BUY")
      expect(step.filters.stress_grade_min).toBe("B")
    }
  })
})

describe("the executor and the prompt agree", () => {
  const executor = read("lib/copilot/executor.ts")
  const tools = read("lib/copilot/tools.ts")

  it("deal_screener returns `widened` and the exact filters it started from", () => {
    expect(executor).toMatch(/widened: step\.dropped/)
    expect(executor).toMatch(/exact_filters: input\.filters/)
    expect(executor).toMatch(/LOWER\(developer\) LIKE LOWER/)
  })

  it("the model is told what `widened` means, in both languages", () => {
    expect(tools).toContain('returns "widened" (the filters it dropped)')
    expect(tools).toContain('ويعيد "widened"')
  })

  it("the closing line is a decision from the record, and the identity is not an advisor", () => {
    expect(tools).toContain('starting with "Decision:"')
    expect(tools).toContain('يبدأ بـ"القرار:"')
    expect(tools).not.toMatch(/You are Entrestate's market advisor|أنت مستشار Entrestate/)
    const finalText = read("lib/chat/final-text.ts")
    expect(finalText).toContain('"Decision:"')
    expect(finalText).toContain('"القرار:"')
  })
})
