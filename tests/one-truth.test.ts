import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { INVESTOR_PROFILES, INVESTOR_PROFILE_KEYS, normalizeInvestorProfileKey } from "@/lib/investor-profiles"
import { PLATFORM_METRICS_FALLBACK, withPlatformMetricFallback } from "@/lib/platform-metrics"

/**
 * ONE INVENTORY, ONE SET OF NUMBERS, NO INVENTED FIGURES.
 *
 * On 2026-09-05 the product disagreed with itself on every page a reader
 * could open. The hero counted the wide ingest table through an old engine
 * (1,946 projects · 761 BUY); the footer and /pricing printed a March
 * fallback (2,813 · 136 BUY · 36,841); /properties listed "21 of 2,813"
 * under a <title> that said 1,946; the Signal Feed replayed a snapshot
 * written on 12 March (0 BUY · "177 days old"); and the Decision Terminal
 * estimated HOLD as `notBuy * 0.45`, printed six hardcoded profile counts
 * against the wrong total ("3,887 · 200%"), and called the market "Bullish"
 * on an undocumented threshold.
 *
 * Three rules, each pinned below:
 *   1. EVERY COUNT COMES FROM THE CURATED INVENTORY, through the same
 *      resolver /properties uses, and the V1 columns (timing_label,
 *      price_confidence). No second population, no second engine.
 *   2. NOTHING IS ESTIMATED OR REMEMBERED ON A PAGE: no `* 0.45`, no
 *      fallback tables of counts, no sentiment words. A read that fails
 *      says so.
 *   3. THE SIGNAL FEED IS COMPUTED on request; the stored snapshot is the
 *      fallback for a database that cannot be read, never the first answer.
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:'"`])\/\/.*$/gm, "$1")

describe("1. every count comes from the curated inventory", () => {
  const stats = stripComments(read("lib/stats/platformStats.ts"))

  it("platformStats counts the table /properties lists, through the same resolver", () => {
    expect(stats).toContain("getInventoryTableSql()")
    expect(stats).not.toMatch(/getMarketPulse|DETAIL_TABLE|raw\.inventory_full|buildQualityClauses/)
  })

  it("the timing distribution is the V1 engine's timing_label, all five states", () => {
    for (const label of ["STRONG_BUY", "BUY", "HOLD", "WAIT", "AVOID"]) {
      expect(stats).toContain(`UPPER(timing_label) = '${label}'`)
    }
    expect(stats).not.toContain("l3_timing_signal")
    expect(stats).toContain("UPPER(price_confidence) = 'HIGH'")
  })

  it("a failed read degrades every figure together — never '2,813 projects · 0 BUY'", () => {
    expect(stats).toMatch(/const read = counts !== null && projects > 0/)
    expect(stats).toMatch(/holdCount: read \? count\(counts\.hold\) : PLATFORM_METRICS_FALLBACK\.holdSignals/)
  })

  it("the fallback set is one consistent reading of that inventory", () => {
    const f = PLATFORM_METRICS_FALLBACK
    expect(f.strongBuySignals + (f.buySignals - f.strongBuySignals) + f.holdSignals + f.waitSignals + f.avoidSignals).toBe(f.totalProjects)
    expect(f.buySignals).toBeGreaterThanOrEqual(f.strongBuySignals)
    expect(f.highConfidence).toBeLessThanOrEqual(f.totalProjects)
    expect(f.coverageThrough).toBeNull()
  })

  it("withPlatformMetricFallback keeps a real zero and rejects a missing count", () => {
    const m = withPlatformMetricFallback({ totalProjects: 10, avoidSignals: 0 })
    expect(m.avoidSignals).toBe(0)
    expect(m.holdSignals).toBe(PLATFORM_METRICS_FALLBACK.holdSignals)
  })
})

describe("2. nothing on a page is estimated, remembered or opined", () => {
  const overview = stripComments(read("app/overview/page.tsx"))

  it("HOLD, WAIT and AVOID are counts from the metrics source, not a share of the remainder", () => {
    expect(overview).not.toMatch(/\*\s*0\.45|holdEst|waitEst|notBuy/)
    expect(overview).toContain("count: pulse.holdSignals")
    expect(overview).toContain("count: pulse.waitSignals")
    expect(overview).toContain("count: pulse.avoidSignals")
  })

  it("no table of remembered profile counts, and the panel says so when the read fails", () => {
    expect(overview).not.toMatch(/INTENT_FALLBACKS|INTENT_META|first_time_buyer:\s*\d/)
    expect(overview).toContain("getInvestorProfileCounts()")
    expect(overview).toMatch(/could not be read just now/)
  })

  it("no sentiment badge — the market is not 'Bullish', it is a distribution", () => {
    expect(overview).not.toMatch(/Bullish|Cautious|marketSentiment|animate-pulse/)
  })

  it("the data-quality card carries the coverage date, never the request clock", () => {
    expect(overview).toContain("coverage={updatedLabel}")
    expect(overview).not.toMatch(/updatedAt=\{/)
    const trustBar = stripComments(read("components/decision/trust-bar.tsx"))
    expect(trustBar).not.toMatch(/updatedAt|formatUpdatedAt|new Date\(/)
  })

  it("a profile share can never exceed 100% of the inventory", () => {
    expect(overview).toContain("Math.min(100, pctOf(profile.count, totalProjects))")
  })

  it("the chat landing states the count on record, not a fixed 'AED 4.2B today'", () => {
    for (const lang of ["en", "ar"]) {
      const messages = read(`messages/${lang}.json`)
      expect(messages).not.toMatch(/4\.2B|4\.2 مليار|Transacted .* Today/)
      expect(messages).toContain("{count}")
    }
    const chat = stripComments(read("components/ChatInterface.tsx"))
    expect(chat).toContain("usePlatformMetrics()")
    expect(chat).toContain('t("chatLanding.dldStat", {')
  })

  it("the pricing page does not call the chat an advisor", () => {
    for (const rel of ["app/pricing/page.tsx", "app/pricing/layout.tsx"]) {
      expect(stripComments(read(rel))).not.toMatch(/the advisor|المستشار/)
    }
  })
})

describe("investor profiles are definitions, applied once", () => {
  it("six profiles, each with a rule in both languages", () => {
    expect(INVESTOR_PROFILES).toHaveLength(6)
    for (const profile of INVESTOR_PROFILES) {
      expect(profile.rule.length).toBeGreaterThan(10)
      expect(profile.ruleAr.length).toBeGreaterThan(5)
      expect(INVESTOR_PROFILE_KEYS).toContain(profile.key)
    }
  })

  it("the URL spelling and the key are one thing", () => {
    expect(normalizeInvestorProfileKey("First-Time Buyer")).toBe("first_time_buyer")
    expect(normalizeInvestorProfileKey("golden visa")).toBe("golden_visa")
    expect(normalizeInvestorProfileKey("whale")).toBeNull()
  })

  it("the list behind /properties?intent= is the same rule the card counts", () => {
    const di = stripComments(read("lib/decision-infrastructure.ts"))
    expect(di).toContain("export function curatedProfileClause(key: InvestorProfileKey)")
    expect(di).toContain("export async function getInvestorProfileCounts()")
    expect(di).toMatch(/const key = normalizeInvestorProfileKey\(filters\.intent\)\s*\n\s*if \(key\) clauses\.push\(curatedProfileClause\(key\)\)/)
    // one count per profile, in one pass, from the properties table
    expect(di).toMatch(/COUNT\(\*\) FILTER \(WHERE \$\{curatedProfileClause\(profile\.key\)\}\)::int/)
  })

  it("BUY on the list includes STRONG_BUY, as the count does", () => {
    const di = stripComments(read("lib/decision-infrastructure.ts"))
    expect(di).toMatch(/signal === "BUY" \? \["BUY", "STRONG_BUY"\] : \[signal\]/)
    const properties = stripComments(read("app/properties/page.tsx"))
    expect(properties).toContain('["BUY", "HOLD", "WAIT", "AVOID"] as const')
  })
})

describe("3. the Signal Feed is computed, the snapshot is the fallback", () => {
  const content = stripComments(read("lib/frontend-content.ts"))

  it("getTopDataRows computes first and reads api.entrestate_top_data only after", () => {
    const computedAt = content.indexOf('source: "computed"')
    const snapshotAt = content.indexOf("async function readTopDataSnapshot")
    expect(computedAt).toBeGreaterThan(-1)
    expect(snapshotAt).toBeGreaterThan(computedAt)
    expect(content).toMatch(/const computed = await buildSafeTopDataFallback\(inventoryTotal\)/)
  })

  it("the live build reads the curated table that carries every V1 column", () => {
    expect(content).toContain("async function getCuratedInventoryContext()")
    expect(content).toMatch(/const tableName = MARKET_TABLES\.inventory/)
    expect(content).toMatch(/const context = await getCuratedInventoryContext\(\)/)
  })

  it("the intents section is the six profile definitions, not ingest tags", () => {
    expect(content).toContain("getInvestorProfileCounts()")
    expect(content).not.toMatch(/unnest\(COALESCE\(\$\{Prisma\.raw\(outcomeColumn\)\}/)
  })

  it("the page states what the computation read — scores date and DLD coverage — from the tables", () => {
    const page = stripComments(read("app/top-data/page.tsx"))
    expect(page).toContain("topData.scores_as_of")
    expect(page).toContain("coverageLabel(metrics.coverageThrough, isArabic)")
    expect(page).not.toMatch(/BUY\/HOLD\/AVOID Feed \| Entrestate/)
  })

  it("no nested layout doubles the brand in the tab", () => {
    for (const rel of ["app/top-data/layout.tsx", "app/markets/layout.tsx"]) {
      expect(read(rel)).not.toMatch(/- Entrestate"/)
    }
  })
})

describe("the brand is appended once", () => {
  it("no page title carries its own ' | Entrestate' — the root template adds it", () => {
    const walk = (dir: string, out: string[] = []): string[] => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) walk(full, out)
        else if (/^(page|layout)\.tsx$/.test(entry.name) && full !== path.join(ROOT, "app", "layout.tsx")) out.push(full)
      }
      return out
    }
    const offenders = walk(path.join(ROOT, "app"))
      .filter((file) => / \| Entrestate["`]/.test(stripComments(fs.readFileSync(file, "utf8"))))
      .map((file) => path.relative(ROOT, file))
    expect(offenders).toEqual([])
  })
})

describe("the overview speaks Arabic when asked, and pricing says computed, not analysed", () => {
  it("every label on the Decision Terminal has an Arabic form", () => {
    const overview = stripComments(read("app/overview/page.tsx"))
    for (const en of ["Total Projects", "BUY Signals", "HIGH Confidence", "Avg Entry Price", "Avg Gross Yield", "Market Timing Signals", "Data Quality", "Investor Profiles", "Browse inventory by investment goal"]) {
      expect(overview, en).toMatch(new RegExp(`isArabic \\? "[^"]+" : "${en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`))
    }
    expect(overview).toContain("labelAr:")
    expect(overview).toContain("isArabic ? f.labelAr : f.label")
  })

  it("pricing does not call the product analysis — it computes", () => {
    for (const rel of ["app/pricing/page.tsx", "app/pricing/layout.tsx"]) {
      expect(stripComments(read(rel)), rel).not.toMatch(/market analysis|the analysis with your account|تحليل السوق/)
    }
  })
})
