import { describe, expect, it } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  EXCLUDED_SUB_TYPES,
  RESIDENTIAL_PROP_SUB_TYPES,
  RESIDENTIAL_PROP_TYPES,
  RESIDENTIAL_SALE_SUB_TYPES,
  SALES_BASIS,
  residentialSaleFilter,
  unrecognisedSaleTypesSql,
} from "@/lib/dld/sales"

/**
 * THE AVERAGE PRICE WAS 78% TOO HIGH BECAUSE NOTHING SAID WHAT A SALE WAS.
 *
 * `executeDldMarketPulse` ran AVG(amount) and SUM(amount) over the whole DLD
 * table — 46,161 rows of apartments, land plots, whole towers, offices, shops,
 * hotel rooms, mortgage registrations and developer filings, averaged together.
 * Measured 2026-09-03:
 *
 *     average   AED 3,586,141  →  AED 2,019,588   (was +78%)
 *     volume    AED 165.5 bn   →  AED  66.2 bn    (was +150%)
 *
 * Six `Sale On Payment Plan` land rows, averaging AED 768m each, were moving
 * the mean of the entire market on their own.
 *
 * These tests hold two lines. The first is the taxonomy — and especially the
 * TWO VOCABULARIES, because the table's January load and August load name the
 * same events differently, and the obvious filter (`sub_type = 'Sale'`,
 * `prop_type = 'Unit'`) silently returns zero August rows. That mistake was
 * made here first, on a cohort query that came back empty and looked like a
 * data problem.
 *
 * The second is structural, and it is the one that matters in a year: no price
 * statistic anywhere in the executor may be computed on the DLD table without
 * this filter. A definition one caller forgets is not a definition.
 */

const ROOT = process.cwd()
const executor = fs.readFileSync(path.join(ROOT, "lib/copilot/executor.ts"), "utf8")

/** Prose explains the rule; only real code may satisfy it. */
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

const filter = residentialSaleFilter()

describe("both vocabularies, because the table speaks two", () => {
  it("keeps the January spelling and the August spelling of a sale", () => {
    expect(RESIDENTIAL_SALE_SUB_TYPES).toContain("Sale")
    expect(RESIDENTIAL_SALE_SUB_TYPES).toContain("Sales")
    expect(filter).toContain("'Sale'")
    expect(filter).toContain("'Sales'")
  })

  it("keeps both spellings of an individual home", () => {
    expect(RESIDENTIAL_PROP_TYPES).toEqual(expect.arrayContaining(["Unit", "Apartment"]))
    expect(filter).toMatch(/prop_type IN \([^)]*'Unit'[^)]*'Apartment'[^)]*\)/)
  })

  it("keeps off-plan pre-registration, the largest bucket in the table", () => {
    expect(RESIDENTIAL_SALE_SUB_TYPES).toContain("Sell - Pre registration")
  })
})

describe("what is not a sale stays out", () => {
  it("a mortgage is a loan, not a transfer", () => {
    expect(RESIDENTIAL_SALE_SUB_TYPES).not.toContain("Mortgages")
    expect(EXCLUDED_SUB_TYPES).toContain("Mortgages")
    expect(filter).not.toContain("'Mortgages'")
  })

  it("every development and lease-to-own form is named as excluded", () => {
    for (const kind of ["Development Registration", "Sell Development", "Lease to Own Registration"]) {
      expect(EXCLUDED_SUB_TYPES).toContain(kind)
      expect(RESIDENTIAL_SALE_SUB_TYPES).not.toContain(kind as never)
    }
  })

  it("land and whole buildings cannot enter through prop_type", () => {
    expect(RESIDENTIAL_PROP_TYPES).not.toContain("Land" as never)
    expect(RESIDENTIAL_PROP_TYPES).not.toContain("Building" as never)
  })

  it("commercial and hotel stock cannot enter through prop_sub_type, which is where they hide", () => {
    // These all carry prop_type = 'Unit', so only the sub-type keeps them out.
    for (const kind of ["Office", "Shop", "Warehouse", "Workshop", "Show Rooms", "Hotel Apartment", "Hotel Rooms"]) {
      expect(RESIDENTIAL_PROP_SUB_TYPES).not.toContain(kind as never)
      expect(filter).not.toContain(`'${kind}'`)
    }
  })

  it("a row with no price is not averaged", () => {
    expect(filter).toContain("amount > 0")
  })
})

describe("it is an allow-list, so new vocabulary falls out instead of in", () => {
  it("a sub-type nobody has classified is not matched", () => {
    expect(filter).not.toContain("Auction")
    expect(filter).not.toContain("Gift")
    // The shape itself is what guarantees it: membership, never absence.
    expect(filter).toContain("sub_type IN (")
    expect(filter).not.toMatch(/sub_type NOT IN|sub_type\s*(!=|<>)/)
  })

  it("and drift can be asked about", () => {
    const sql = unrecognisedSaleTypesSql("raw.dld_transactions_arvo")
    expect(sql).toContain("NOT IN")
    // Every classified value, kept or dropped, must be in the known set —
    // otherwise the drift report shouts about types somebody already ruled on.
    for (const t of [...RESIDENTIAL_SALE_SUB_TYPES, ...EXCLUDED_SUB_TYPES]) {
      expect(sql).toContain(`'${t}'`)
    }
  })
})

describe("no price statistic escapes the basis", () => {
  const src = stripComments(executor)

  /** Every SELECT in the file that aggregates money, with its FROM/WHERE tail. */
  const moneyAggregates = src
    .split(/\bSELECT\b/)
    .filter((chunk) => /AVG\(amount\)|SUM\(amount\)|PERCENTILE_CONT\(0\.5\)/.test(chunk))

  it("there are money aggregates to check (the test is not vacuous)", () => {
    expect(moneyAggregates.length).toBeGreaterThan(0)
  })

  it("each one that reads the DLD transactions table applies the filter", () => {
    for (const chunk of moneyAggregates) {
      const readsDld = /DLD_TRANSACTIONS_SQL|DLD_TRANSACTIONS_TABLE/.test(chunk)
      if (!readsDld) continue
      expect(
        /RESIDENTIAL_SALE_SQL|residentialSaleFilter\(\)|statsWhere/.test(chunk),
        `a money aggregate over the DLD table with no residential-sale filter:\n${chunk.slice(0, 400)}`,
      ).toBe(true)
    }
  })

  it("the market pulse states its basis and the size of the correction", () => {
    expect(src).toContain("basis: SALES_BASIS")
    expect(src).toContain("rows_in_basis")
    expect(src).toContain("rows_outside_basis")
  })

  it("the transaction search names the basis its stats were computed on", () => {
    expect(src).toContain("stats_basis: SALES_BASIS")
  })

  it("the basis count is taken directly, never by subtraction", () => {
    // total − excluded silently invents rows when a NULL prop_sub_type makes
    // the IN test NULL and the row lands in neither count.
    expect(src).toMatch(/COUNT\(\*\) FILTER \(WHERE \$\{RESIDENTIAL_SALE_SQL\}\)/)
  })
})

describe("the basis says what it is, in words a reader can act on", () => {
  it("names what is excluded rather than only what is included", () => {
    for (const word of ["mortgage", "land", "office", "hotel"]) {
      expect(SALES_BASIS.toLowerCase()).toContain(word)
    }
  })

  it("says apartments, because that is what this feed almost entirely is", () => {
    expect(SALES_BASIS.toLowerCase()).toContain("apartment")
  })
})

describe("the fragment is composable and carries no caller input", () => {
  it("has no WHERE keyword of its own", () => {
    expect(filter.trim().toUpperCase().startsWith("WHERE")).toBe(false)
    expect(filter.trim().toUpperCase().startsWith("AND")).toBe(false)
  })

  it("qualifies with an alias when asked", () => {
    const aliased = residentialSaleFilter("t")
    expect(aliased).toContain("t.prop_type IN")
    expect(aliased).toContain("t.amount > 0")
  })

  it("is built only from this module's constants", () => {
    const literals = filter.match(/'[^']*'/g) ?? []
    const known = new Set<string>([
      ...RESIDENTIAL_PROP_TYPES,
      ...RESIDENTIAL_PROP_SUB_TYPES,
      ...RESIDENTIAL_SALE_SUB_TYPES,
    ])
    for (const literal of literals) {
      expect(known.has(literal.slice(1, -1))).toBe(true)
    }
  })
})
