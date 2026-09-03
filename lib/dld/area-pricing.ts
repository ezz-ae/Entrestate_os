/**
 * WHAT A SQUARE METRE COSTS, BY AREA, OFF-PLAN AGAINST READY.
 *
 * The grain matters more than the calculation, so here is why this one:
 *
 * A catalogue proposed for this data used `project × unit_type × bedrooms ×
 * size_band × month`. Measured against the table, only **6%** of those cohorts
 * reach ten transactions, and they cover **24%** of the rows. The other 94% of
 * cells would each report a "median" computed from two or three sales, which is
 * not a median, it is a coin toss with decimal places.
 *
 * `area × reg_type` reaches **174 cells at twenty or more transactions,
 * covering 97.1% of the rows**. Same data, same discipline, forty times the
 * usable surface — because the grain was chosen from what the data can support
 * rather than from what would be nice to know.
 *
 * ── WHY OFF-PLAN AGAINST READY IS THE SPLIT WORTH MAKING ───────────────
 *
 * `reg_type` is the cleanest column in this table: two values, no drift between
 * the two loads, no nulls. And the split is where the decision lives. Blended,
 * Business Bay reports one number; split, it is AED 31,258 per sqm off-plan
 * against 20,118 ready — a 55% premium for buying a floor plan. That gap is the
 * product. The blend hides it.
 *
 * ── THE SAMPLE GATE ────────────────────────────────────────────────────
 *
 * Twenty transactions per side, and a side below it reports its COUNT and a
 * null median rather than a number. The premium is computed only when BOTH
 * sides clear the gate: a 63% premium measured against 27 ready sales in Dubai
 * South is arithmetic, not evidence, and this repository's standing rule is
 * that numbers shown to users are evidence-gated — the bound facing the
 * threshold or a stated withheld, never a bare point estimate.
 *
 * ── MEDIAN, NOT MEAN ───────────────────────────────────────────────────
 *
 * Established the hard way one commit earlier: six land rows averaging AED 768m
 * moved the mean of the whole table. Even inside a single clean area, one
 * penthouse does the same thing at smaller scale. The median is what a buyer
 * would actually meet in the market.
 */

import { residentialSaleFilter } from "./sales"
import { areaNamesCte, AREA_KEY_SQL } from "./areas"

/** Below this many transactions a side reports its count and no median. */
export const MIN_SAMPLE = 20

export type AreaPricingRow = {
  area_key: string
  area_display: string
  variants: number
  off_plan_n: number
  off_plan_median_sqm: number | null
  ready_n: number
  ready_median_sqm: number | null
}

export type SideStat = {
  transactions: number
  /** Null when the side is below MIN_SAMPLE — withheld, not zero. */
  medianPerSqm: number | null
  /** True when the number was withheld for want of evidence. */
  withheld: boolean
}

export type AreaPricing = {
  area: string
  /** How many source spellings were folded into this area. */
  sourceSpellings: number
  offPlan: SideStat
  ready: SideStat
  /**
   * Off-plan median over ready median, as a percentage. Null unless BOTH sides
   * clear MIN_SAMPLE — a premium against four sales is not a premium.
   */
  offPlanPremiumPct: number | null
  transactions: number
}

/**
 * Median AED per square metre by area and registration type.
 *
 * Grouped on the normalised area key (see lib/dld/areas.ts — 189 raw strings
 * are 123 real areas) and filtered to residential sales (see lib/dld/sales.ts —
 * the unfiltered version overstated the average by 78%).
 *
 * `price_per_sqm > 0` is required rather than derived from amount/size: the
 * column is populated on every one of the 32,803 residential sales, and
 * recomputing it would silently disagree with DLD's own figure wherever the
 * size field is wrong.
 */
export function areaPricingSql(table: string, minSample = MIN_SAMPLE): string {
  const sale = residentialSaleFilter()
  const priced = `${sale} AND price_per_sqm > 0`
  return `
    WITH ${areaNamesCte(table, priced)},
    cells AS (
      SELECT ${AREA_KEY_SQL} AS area_key,
             reg_type,
             COUNT(*)::int AS n,
             PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY price_per_sqm)::int AS median_sqm
      FROM ${table}
      WHERE ${priced}
      GROUP BY ${AREA_KEY_SQL}, reg_type
    )
    SELECT
      n.area_key,
      n.area_display,
      n.variants,
      COALESCE(MAX(c.n)      FILTER (WHERE c.reg_type = 'Off-Plan'), 0) AS off_plan_n,
      MAX(c.median_sqm)      FILTER (WHERE c.reg_type = 'Off-Plan')     AS off_plan_median_sqm,
      COALESCE(MAX(c.n)      FILTER (WHERE c.reg_type = 'Ready'), 0)    AS ready_n,
      MAX(c.median_sqm)      FILTER (WHERE c.reg_type = 'Ready')        AS ready_median_sqm
    FROM area_names n
    JOIN cells c ON c.area_key = n.area_key
    GROUP BY n.area_key, n.area_display, n.variants
    HAVING COALESCE(MAX(c.n) FILTER (WHERE c.reg_type = 'Off-Plan'), 0)
         + COALESCE(MAX(c.n) FILTER (WHERE c.reg_type = 'Ready'), 0) >= ${Math.max(1, Math.floor(minSample))}
    ORDER BY (COALESCE(MAX(c.n) FILTER (WHERE c.reg_type = 'Off-Plan'), 0)
            + COALESCE(MAX(c.n) FILTER (WHERE c.reg_type = 'Ready'), 0)) DESC
  `
}

function side(n: number, median: number | null, minSample: number): SideStat {
  const enough = n >= minSample && median != null && median > 0
  return {
    transactions: n,
    // Withheld rather than shown small: a median of four sales reads exactly
    // like a median of four hundred once it is on a page.
    medianPerSqm: enough ? median : null,
    withheld: n > 0 && !enough,
  }
}

/**
 * Shape the rows, apply the gate, and compute the premium only where both sides
 * earned it. PURE — the gate is the whole product here, so it is tested without
 * a database.
 */
export function shapeAreaPricing(rows: AreaPricingRow[], minSample = MIN_SAMPLE): AreaPricing[] {
  return rows.map((r) => {
    const offPlan = side(Number(r.off_plan_n ?? 0), r.off_plan_median_sqm ?? null, minSample)
    const ready = side(Number(r.ready_n ?? 0), r.ready_median_sqm ?? null, minSample)
    const bothEarned = offPlan.medianPerSqm != null && ready.medianPerSqm != null
    return {
      area: r.area_display,
      sourceSpellings: Number(r.variants ?? 1),
      offPlan,
      ready,
      offPlanPremiumPct: bothEarned
        ? Math.round(((offPlan.medianPerSqm! - ready.medianPerSqm!) / ready.medianPerSqm!) * 1000) / 10
        : null,
      transactions: offPlan.transactions + ready.transactions,
    }
  })
}
