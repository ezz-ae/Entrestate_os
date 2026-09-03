/**
 * THE DATA HAS A FIVE-MONTH HOLE IN IT, AND NOTHING SAID SO.
 *
 * Residential sales in the table on 2026-09-03, by month:
 *
 *     2026-01   12,254   days 1–31   complete
 *     2026-02   12,508   days 1–28   complete
 *     2026-03    1,817   days 1–7    PARTIAL — 23% of the month
 *     2026-04        —               ABSENT
 *     2026-05        —               ABSENT
 *     2026-06        —               ABSENT
 *     2026-07        —               ABSENT
 *     2026-08    6,224   days 4–21   PARTIAL — 58% of the month
 *
 * The market pulse reported "32,803 transactions this year". Two of those words
 * are doing damage. It is not a year; it is ten weeks and two and a half more.
 *
 * And the shape is worse than the total. Plot those months as a series and
 * February's 12,508 is followed by March's 1,817 — an 85% collapse that no
 * market did. It is the seventh of March, and nothing after it. Anyone reading
 * that chart concludes the Dubai market fell off a cliff in the spring, which
 * is a conclusion the data cannot support and did not intend to offer.
 *
 * ── WHY THE DETECTOR MEASURES DAYS, NOT ROW COUNTS ─────────────────────
 *
 * A row-count threshold needs a number nobody can justify — is 1,817 a quiet
 * month or half a month? Days answer it without a judgement call: this feed
 * records EVERY calendar day (January has rows on all 31, February on all 28 —
 * DLD publishes weekends too), so `days_with_data / days_in_month` is a clean
 * coverage ratio with no weekend noise to explain away. March is 7/31 because
 * the load stopped, not because Dubai stopped selling.
 *
 * ── WHY ABSENT MONTHS ARE MANUFACTURED ─────────────────────────────────
 *
 * `GROUP BY month` cannot return April: there are no rows to group. So a caller
 * that plots the query's output draws February, March and August as three
 * ADJACENT points and runs a line straight through a gap it never saw. The hole
 * has to be materialised as rows saying "nothing here" before it can be
 * rendered as a hole. That is what `summariseCoverage` does, and it is the
 * whole reason this module exists rather than a single SQL statement.
 *
 * ── SELF-CORRECTING ────────────────────────────────────────────────────
 *
 * Nothing here hardcodes March or August. The gap is derived from the data
 * every time, so when the missing months are loaded the warnings disappear on
 * their own, and if a future load stalls, the next one appears without anyone
 * editing this file.
 */

/** One month as the database can report it — months with no rows never appear. */
export type CoverageRow = {
  month: string // "2026-03"
  transactions: number
  daysWithData: number
  daysInMonth: number
}

export type MonthCoverage = {
  month: string
  transactions: number
  daysWithData: number
  daysInMonth: number
  /** 0–1. Zero for a month the load never delivered. */
  completeness: number
  state: "complete" | "partial" | "absent"
}

export type CoverageSummary = {
  /** Every month from the first with data to the last, gaps included. */
  months: MonthCoverage[]
  firstMonth: string | null
  lastMonth: string | null
  monthsComplete: number
  monthsPartial: number
  monthsAbsent: number
  /** True when every month in the span is complete. */
  continuous: boolean
  /** One sentence a surface can print, or null when there is nothing to warn about. */
  note: string | null
}

/**
 * Monthly rows for the coverage check.
 *
 * `where` is composed by the caller — pass `residentialSaleFilter()` to measure
 * coverage of the same rows a price statistic is computed on, which is the only
 * comparison that means anything. Both arguments are module constants or
 * caller-controlled SQL; no end-user text reaches this.
 */
export function monthlyCoverageSql(table: string, where?: string): string {
  return `
    SELECT
      to_char(date_trunc('month', transaction_date), 'YYYY-MM')            AS month,
      COUNT(*)::int                                                        AS transactions,
      COUNT(DISTINCT transaction_date)::int                                AS days_with_data,
      EXTRACT(day FROM (date_trunc('month', transaction_date)
                        + interval '1 month - 1 day'))::int                AS days_in_month
    FROM ${table}
    ${where ? `WHERE ${where}` : ""}
    GROUP BY date_trunc('month', transaction_date)
    ORDER BY 1
  `
}

/** "2026-03" → 2026 * 12 + 2, so month arithmetic never touches a Date. */
function monthIndex(month: string): number {
  const [y, m] = month.split("-").map(Number)
  return y * 12 + (m - 1)
}

function indexToMonth(index: number): string {
  const y = Math.floor(index / 12)
  const m = (index % 12) + 1
  return `${y}-${String(m).padStart(2, "0")}`
}

function daysInMonthOf(month: string): number {
  const [y, m] = month.split("-").map(Number)
  // Day 0 of the next month is the last day of this one.
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

/**
 * Turn the rows the database can produce into the span a reader needs, with the
 * missing months put back.
 *
 * PURE, so it is testable without a database — which matters, because the whole
 * value of this function is a case the database cannot produce: a month with no
 * rows at all.
 */
export function summariseCoverage(rows: CoverageRow[]): CoverageSummary {
  const present = [...rows]
    .filter((r) => r.month && r.transactions > 0)
    .sort((a, b) => a.month.localeCompare(b.month))

  if (present.length === 0) {
    return {
      months: [],
      firstMonth: null,
      lastMonth: null,
      monthsComplete: 0,
      monthsPartial: 0,
      monthsAbsent: 0,
      // No data is not the same as continuous data, and must never report as it.
      continuous: false,
      note: "No transactions in range.",
    }
  }

  const firstIndex = monthIndex(present[0].month)
  const lastIndex = monthIndex(present[present.length - 1].month)
  const byMonth = new Map(present.map((r) => [r.month, r]))

  const months: MonthCoverage[] = []
  for (let i = firstIndex; i <= lastIndex; i += 1) {
    const month = indexToMonth(i)
    const row = byMonth.get(month)
    if (!row) {
      // The manufactured row. Without it the gap is invisible to every caller.
      months.push({
        month,
        transactions: 0,
        daysWithData: 0,
        daysInMonth: daysInMonthOf(month),
        completeness: 0,
        state: "absent",
      })
      continue
    }
    const daysInMonth = row.daysInMonth > 0 ? row.daysInMonth : daysInMonthOf(month)
    const completeness = daysInMonth > 0 ? row.daysWithData / daysInMonth : 0
    months.push({
      month,
      transactions: row.transactions,
      daysWithData: row.daysWithData,
      daysInMonth,
      completeness,
      // A month is complete when every one of its days is present. This feed
      // records weekends, so there is no allowance to make and no threshold to
      // argue about — see the module header.
      state: row.daysWithData >= daysInMonth ? "complete" : "partial",
    })
  }

  const monthsComplete = months.filter((m) => m.state === "complete").length
  const monthsPartial = months.filter((m) => m.state === "partial").length
  const monthsAbsent = months.filter((m) => m.state === "absent").length
  const continuous = monthsPartial === 0 && monthsAbsent === 0

  return {
    months,
    firstMonth: months[0]?.month ?? null,
    lastMonth: months[months.length - 1]?.month ?? null,
    monthsComplete,
    monthsPartial,
    monthsAbsent,
    continuous,
    note: coverageNote({ months, monthsAbsent, monthsPartial }),
  }
}

/**
 * The sentence. Null when the span is continuous — a warning that fires on
 * healthy data is a warning people stop reading.
 */
function coverageNote(input: {
  months: MonthCoverage[]
  monthsAbsent: number
  monthsPartial: number
}): string | null {
  if (input.monthsAbsent === 0 && input.monthsPartial === 0) return null

  const parts: string[] = []

  if (input.monthsAbsent > 0) {
    const absent = input.months.filter((m) => m.state === "absent").map((m) => m.month)
    parts.push(
      absent.length === 1
        ? `${absent[0]} is missing entirely`
        : `${absent.length} months are missing entirely (${absent[0]}–${absent[absent.length - 1]})`,
    )
  }

  const partial = input.months.filter((m) => m.state === "partial")
  if (partial.length > 0) {
    parts.push(
      partial
        .map((m) => `${m.month} covers ${m.daysWithData} of ${m.daysInMonth} days`)
        .join(", "),
    )
  }

  // Says what it means for the reader, not just what is missing. A month-over-
  // month chart built on this is the specific thing that goes wrong.
  return `Coverage is not continuous: ${parts.join("; ")}. Month-on-month comparisons across these boundaries measure the gap, not the market.`
}
