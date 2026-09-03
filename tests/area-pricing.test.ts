import { describe, expect, it } from "vitest"
import { areaKey, pickAreaDisplayName } from "@/lib/dld/areas"
import {
  MIN_SAMPLE,
  areaPricingSql,
  shapeAreaPricing,
  type AreaPricingRow,
} from "@/lib/dld/area-pricing"

/**
 * THE GRAIN WAS CHOSEN FROM WHAT THE DATA SUPPORTS.
 *
 * A catalogue proposed for this table used `project × unit_type × bedrooms ×
 * size_band × month`. Measured: 6% of those cohorts reach ten transactions and
 * they cover 24% of the rows. `area × reg_type` reaches 174 cells at twenty or
 * more, covering 97.1%. Forty times the usable surface, same data.
 *
 * Two things make that number real rather than lucky, and both are tested here:
 *
 *   1. AREA NAMES ARE FOLDED. 189 raw strings are 123 areas — the Jan load
 *      writes `JUMEIRAH VILLAGE CIRCLE`, the Aug load writes `Jumeirah Village
 *      Circle`. Sixty-six areas are split that way and they hold 24,669 of the
 *      32,803 sales. Ungrouped, JVC appears twice in a ranked list with two
 *      different medians.
 *   2. A THIN CELL SAYS NOTHING. Below the sample gate the median is withheld,
 *      not shown small — and the off-plan premium is computed only when BOTH
 *      sides earned it. A 63% premium measured against 27 ready sales is
 *      arithmetic, not evidence.
 */

const row = (over: Partial<AreaPricingRow> = {}): AreaPricingRow => ({
  area_key: "BUSINESS BAY",
  area_display: "Business Bay",
  variants: 2,
  off_plan_n: 943,
  off_plan_median_sqm: 30786,
  ready_n: 744,
  ready_median_sqm: 20296,
  ...over,
})

describe("the same area does not appear twice, once shouting", () => {
  it("folds spellings that differ only by case", () => {
    expect(areaKey("JUMEIRAH VILLAGE CIRCLE")).toBe(areaKey("Jumeirah Village Circle"))
    expect(areaKey("  Business Bay  ")).toBe(areaKey("BUSINESS BAY"))
  })

  it("keeps genuinely different areas apart", () => {
    // The normaliser is minimal on purpose: anything cleverer eventually folds
    // "Al Barsha 1" into "Al Barsha".
    expect(areaKey("Al Barsha 1")).not.toBe(areaKey("Al Barsha"))
    expect(areaKey("Dubai Marina")).not.toBe(areaKey("Dubai Marine"))
  })

  it("shows the spelling a human wrote, not the shouted one", () => {
    expect(
      pickAreaDisplayName([
        { area: "JUMEIRAH VILLAGE CIRCLE", n: 2240 },
        { area: "Jumeirah Village Circle", n: 451 },
      ]),
    ).toBe("Jumeirah Village Circle")
  })

  it("falls back to the most frequent when every spelling shouts", () => {
    expect(
      pickAreaDisplayName([
        { area: "MADINAT AL MATAAR", n: 1393 },
        { area: "MADINAT AL MATAR", n: 3 },
      ]),
    ).toBe("MADINAT AL MATAAR")
  })

  it("never invents a name the data does not contain", () => {
    const chosen = pickAreaDisplayName([{ area: "DIFC", n: 10 }])
    // Title-casing programmatically would produce "Difc".
    expect(chosen).toBe("DIFC")
  })

  it("is stable — the same input always picks the same name", () => {
    const input = [
      { area: "Motor City", n: 100 },
      { area: "MOTOR CITY", n: 100 },
    ]
    expect(pickAreaDisplayName(input)).toBe(pickAreaDisplayName([...input].reverse()))
  })

  it("says how many spellings were folded rather than hiding it", () => {
    expect(shapeAreaPricing([row({ variants: 2 })])[0].sourceSpellings).toBe(2)
  })
})

describe("a thin cell is withheld, not shown small", () => {
  it("states both medians when both sides clear the gate", () => {
    const [a] = shapeAreaPricing([row()])
    expect(a.offPlan.medianPerSqm).toBe(30786)
    expect(a.ready.medianPerSqm).toBe(20296)
    expect(a.offPlan.withheld).toBe(false)
  })

  it("withholds the median below the gate but still reports the count", () => {
    const [a] = shapeAreaPricing([row({ ready_n: 4, ready_median_sqm: 9999 })])
    expect(a.ready.medianPerSqm).toBeNull()
    expect(a.ready.withheld).toBe(true)
    // The count survives: "four sales, no median" is more useful than silence.
    expect(a.ready.transactions).toBe(4)
  })

  it("a side with no transactions at all is not 'withheld', it is empty", () => {
    const [a] = shapeAreaPricing([row({ ready_n: 0, ready_median_sqm: null })])
    expect(a.ready.transactions).toBe(0)
    expect(a.ready.medianPerSqm).toBeNull()
    expect(a.ready.withheld).toBe(false)
  })

  it("exactly at the gate counts as enough", () => {
    const [a] = shapeAreaPricing([row({ ready_n: MIN_SAMPLE, ready_median_sqm: 12000 })])
    expect(a.ready.medianPerSqm).toBe(12000)
  })

  it("a zero median is not a price", () => {
    const [a] = shapeAreaPricing([row({ ready_n: 500, ready_median_sqm: 0 })])
    expect(a.ready.medianPerSqm).toBeNull()
  })
})

describe("the premium is only computed where both sides earned it", () => {
  it("computes it when both clear the gate", () => {
    const [a] = shapeAreaPricing([row()])
    // 30786 / 20296 − 1 = 51.7%
    expect(a.offPlanPremiumPct).toBeCloseTo(51.7, 1)
  })

  it("refuses when the ready side is thin, and still publishes the side that earned it", () => {
    const [a] = shapeAreaPricing([
      row({ off_plan_n: 1179, off_plan_median_sqm: 18492, ready_n: 12, ready_median_sqm: 11632 }),
    ])
    expect(a.ready.medianPerSqm).toBeNull()
    expect(a.offPlanPremiumPct).toBeNull()
    // …but the off-plan median it DID earn is still published. A withheld side
    // must not take the whole row down with it.
    expect(a.offPlan.medianPerSqm).toBe(18492)
  })

  it("folding the area is what rescues a cell that was thin only because it was split", () => {
    // Dubai South, live: grouped on the RAW string the ready side is 27 rows in
    // one spelling and 172 in the other, and the smaller half was reported
    // alone. Folded, it is 199 — comfortably over the gate, and the premium
    // becomes publishable. This is the practical payoff of lib/dld/areas.ts,
    // not a cosmetic tidy-up of names.
    const split = shapeAreaPricing([
      row({ area_display: "Dubai South", off_plan_n: 1038, off_plan_median_sqm: 18955, ready_n: 27, ready_median_sqm: 11593 }),
    ])[0]
    const folded = shapeAreaPricing([
      row({ area_display: "Dubai South", off_plan_n: 1179, off_plan_median_sqm: 18492, ready_n: 199, ready_median_sqm: 11632 }),
    ])[0]
    expect(split.ready.transactions).toBeLessThan(folded.ready.transactions)
    expect(folded.offPlanPremiumPct).not.toBeNull()
    expect(folded.sourceSpellings).toBe(2)
  })

  it("refuses when there is no ready side at all", () => {
    const [a] = shapeAreaPricing([row({ ready_n: 0, ready_median_sqm: null })])
    expect(a.offPlanPremiumPct).toBeNull()
  })

  it("reports a discount as a negative premium rather than dropping the sign", () => {
    const [a] = shapeAreaPricing([
      row({ off_plan_median_sqm: 10000, ready_n: 500, ready_median_sqm: 20000 }),
    ])
    expect(a.offPlanPremiumPct).toBe(-50)
  })
})

describe("the query asks the database the question this module claims to answer", () => {
  const sql = areaPricingSql("raw.dld_transactions_arvo")

  it("groups on the folded area key, never the raw string", () => {
    expect(sql).toContain("UPPER(TRIM(area))")
    expect(sql).not.toMatch(/GROUP BY\s+area\b/)
  })

  it("carries the residential-sale basis", () => {
    expect(sql).toContain("prop_sub_type IN")
    expect(sql).toContain("sub_type IN")
    expect(sql).not.toContain("Mortgages")
  })

  it("splits by registration type, which is where the decision lives", () => {
    expect(sql).toContain("'Off-Plan'")
    expect(sql).toContain("'Ready'")
  })

  it("takes a median, not a mean — one penthouse moves a mean", () => {
    expect(sql).toContain("PERCENTILE_CONT(0.5)")
    expect(sql).not.toMatch(/AVG\(price_per_sqm\)/)
  })

  it("uses DLD's own price_per_sqm rather than recomputing it", () => {
    expect(sql).toContain("price_per_sqm > 0")
    expect(sql).not.toMatch(/amount\s*\/\s*prop_size_sqm/)
  })

  it("the sample floor cannot be driven below one by a caller", () => {
    expect(areaPricingSql("t", 0)).toContain(">= 1")
    expect(areaPricingSql("t", -50)).toContain(">= 1")
  })
})
