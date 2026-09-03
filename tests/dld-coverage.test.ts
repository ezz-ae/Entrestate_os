import { describe, expect, it } from "vitest"
import fs from "node:fs"
import path from "node:path"
import { monthlyCoverageSql, summariseCoverage, type CoverageRow } from "@/lib/dld/coverage"

/**
 * "32,803 TRANSACTIONS THIS YEAR" WAS TEN WEEKS AND TWO HALF-MONTHS.
 *
 * Residential sales in the table on 2026-09-03:
 *
 *     2026-01   12,254   days 1–31   complete
 *     2026-02   12,508   days 1–28   complete
 *     2026-03    1,817   days 1–7    partial
 *     2026-04 … 2026-07      —       absent
 *     2026-08    6,224   days 4–21   partial
 *
 * The total was misleading; the SHAPE was worse. Plotted as a series, February
 * at 12,508 is followed by March at 1,817 — an 85% collapse no market had. It
 * is the seventh of March and nothing after it.
 *
 * The case these tests exist for is the one a database cannot produce: April.
 * `GROUP BY month` returns no row for a month with no rows, so a caller plots
 * February, March and August as adjacent points and draws a line through five
 * months it never saw. The gap must be MANUFACTURED to be visible, and that is
 * what most of what follows checks.
 */

const ROOT = process.cwd()
const executor = fs.readFileSync(path.join(ROOT, "lib/copilot/executor.ts"), "utf8")
/**
 * Strips block comments and line comments — including TRAILING ones, which the
 * simpler start-of-line-only version misses. That mattered here: the first version of
 * this file passed a hardcoded-month check while `month: string // "2026-03"`
 * sat in the source, because the comment was not at the start of its line. The
 * negative-lookbehind guard keeps a protocol prefix inside a string from being
 * mistaken for the start of a comment.
 */
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(?<!:)\/\/.*$/gm, "")

/** Exactly what the live table returned on 2026-09-03. */
const LIVE: CoverageRow[] = [
  { month: "2026-01", transactions: 12254, daysWithData: 31, daysInMonth: 31 },
  { month: "2026-02", transactions: 12508, daysWithData: 28, daysInMonth: 28 },
  { month: "2026-03", transactions: 1817, daysWithData: 7, daysInMonth: 31 },
  { month: "2026-08", transactions: 6224, daysWithData: 18, daysInMonth: 31 },
]

describe("the months the database cannot report are put back", () => {
  const s = summariseCoverage(LIVE)

  it("returns the whole span, not only the months with rows", () => {
    expect(s.months.map((m) => m.month)).toEqual([
      "2026-01", "2026-02", "2026-03", "2026-04",
      "2026-05", "2026-06", "2026-07", "2026-08",
    ])
  })

  it("April through July are present as rows that say nothing is there", () => {
    for (const month of ["2026-04", "2026-05", "2026-06", "2026-07"]) {
      const row = s.months.find((m) => m.month === month)
      expect(row, `${month} missing from the span`).toBeDefined()
      expect(row!.state).toBe("absent")
      expect(row!.transactions).toBe(0)
      expect(row!.completeness).toBe(0)
      // Still carries a real month length, so a chart can size the gap.
      expect(row!.daysInMonth).toBeGreaterThan(27)
    }
  })

  it("counts four absent and two partial months", () => {
    expect(s.monthsAbsent).toBe(4)
    expect(s.monthsPartial).toBe(2)
    expect(s.monthsComplete).toBe(2)
    expect(s.continuous).toBe(false)
  })
})

describe("a half-loaded month is not a quiet month", () => {
  const s = summariseCoverage(LIVE)

  it("March is partial at 7 of 31 days, not complete with low volume", () => {
    const march = s.months.find((m) => m.month === "2026-03")!
    expect(march.state).toBe("partial")
    expect(march.completeness).toBeCloseTo(7 / 31, 5)
  })

  it("August is partial too — a recent month is not exempt", () => {
    const august = s.months.find((m) => m.month === "2026-08")!
    expect(august.state).toBe("partial")
    expect(august.daysWithData).toBe(18)
  })

  it("a month with every day present is complete, February included", () => {
    // 28/28 must not read as partial because 28 < 31.
    expect(s.months.find((m) => m.month === "2026-02")!.state).toBe("complete")
    expect(s.months.find((m) => m.month === "2026-01")!.state).toBe("complete")
  })
})

describe("the warning fires only when there is something to warn about", () => {
  it("says what is missing and what it does to a comparison", () => {
    const note = summariseCoverage(LIVE).note ?? ""
    expect(note).toContain("4 months are missing")
    expect(note).toContain("2026-03 covers 7 of 31 days")
    // The consequence, not just the fact — this is the misreading it prevents.
    expect(note.toLowerCase()).toContain("month-on-month")
  })

  it("is silent on continuous data", () => {
    const clean = summariseCoverage([
      { month: "2026-01", transactions: 100, daysWithData: 31, daysInMonth: 31 },
      { month: "2026-02", transactions: 100, daysWithData: 28, daysInMonth: 28 },
    ])
    expect(clean.continuous).toBe(true)
    expect(clean.note).toBeNull()
    expect(clean.monthsAbsent).toBe(0)
  })

  it("no data is not continuous data", () => {
    const empty = summariseCoverage([])
    expect(empty.continuous).toBe(false)
    expect(empty.note).toBeTruthy()
    expect(empty.months).toEqual([])
  })
})

describe("nothing about the gap is hardcoded, so it heals itself", () => {
  it("loading the missing months silences the warning without a code change", () => {
    const healed = summariseCoverage([
      ...LIVE.filter((r) => r.month !== "2026-03" && r.month !== "2026-08"),
      { month: "2026-03", transactions: 12000, daysWithData: 31, daysInMonth: 31 },
      { month: "2026-04", transactions: 12000, daysWithData: 30, daysInMonth: 30 },
      { month: "2026-05", transactions: 12000, daysWithData: 31, daysInMonth: 31 },
      { month: "2026-06", transactions: 12000, daysWithData: 30, daysInMonth: 30 },
      { month: "2026-07", transactions: 12000, daysWithData: 31, daysInMonth: 31 },
      { month: "2026-08", transactions: 12000, daysWithData: 31, daysInMonth: 31 },
    ])
    expect(healed.continuous).toBe(true)
    expect(healed.note).toBeNull()
  })

  it("a new stall appears on its own", () => {
    const stalled = summariseCoverage([
      { month: "2026-09", transactions: 100, daysWithData: 30, daysInMonth: 30 },
      { month: "2026-11", transactions: 100, daysWithData: 30, daysInMonth: 30 },
    ])
    expect(stalled.months.find((m) => m.month === "2026-10")!.state).toBe("absent")
    expect(stalled.note).toContain("2026-10")
  })

  it("the module names no specific month", () => {
    const src = stripComments(fs.readFileSync(path.join(ROOT, "lib/dld/coverage.ts"), "utf8"))
    expect(src).not.toMatch(/"2026-0[3-8]"|'2026-0[3-8]'/)
  })
})

describe("month arithmetic survives a year boundary", () => {
  it("December to February fills in January of the next year", () => {
    const s = summariseCoverage([
      { month: "2025-12", transactions: 10, daysWithData: 31, daysInMonth: 31 },
      { month: "2026-02", transactions: 10, daysWithData: 28, daysInMonth: 28 },
    ])
    expect(s.months.map((m) => m.month)).toEqual(["2025-12", "2026-01", "2026-02"])
    expect(s.months[1].state).toBe("absent")
    expect(s.months[1].daysInMonth).toBe(31)
  })

  it("a leap February is 29 days long when it has to be manufactured", () => {
    const s = summariseCoverage([
      { month: "2028-01", transactions: 10, daysWithData: 31, daysInMonth: 31 },
      { month: "2028-03", transactions: 10, daysWithData: 31, daysInMonth: 31 },
    ])
    expect(s.months[1].month).toBe("2028-02")
    expect(s.months[1].daysInMonth).toBe(29)
  })
})

describe("the pulse measures coverage of the rows it actually reports on", () => {
  const src = stripComments(executor)

  it("coverage is read on the residential-sale basis, not the whole table", () => {
    expect(src).toMatch(/monthlyCoverageSql\(\s*DLD_TRANSACTIONS_TABLE\s*,\s*residentialSaleFilter\(\)\s*\)/)
  })

  it("a failed coverage read reports null, never silence that reads as continuous", () => {
    expect(src).toMatch(/\.catch\(\(\) => null\)/)
    expect(src).toContain("coverage,")
  })

  it("the SQL counts distinct days, which is what makes a partial month visible", () => {
    const sql = monthlyCoverageSql("t")
    expect(sql).toContain("COUNT(DISTINCT transaction_date)")
    expect(sql).toContain("days_in_month")
  })
})
