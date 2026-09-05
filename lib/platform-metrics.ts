export type PlatformMetrics = {
  /**
   * WHEN THIS RESPONSE WAS BUILT — not when the data was collected.
   *
   * Every read model in lib/decision-infrastructure.ts stamps
   * `data_as_of: new Date().toISOString()`, so this field has always meant
   * "now". That is a fine thing for a cache header and a terrible thing to
   * print under the word "refreshed", which is exactly what the homepage and
   * the library did: on 3 September they read "Data refreshed Sep 03, 22:14
   * GST" while the newest DLD transaction in the database was 21 August, with
   * a five-month hole from 8 March to 3 August sitting inside the range.
   *
   * The label was most confident precisely when the pipeline was most stale,
   * because the clock never fails. Use `coverageThrough` for any claim about
   * how current the data is; this field answers a different question.
   */
  dataAsOf: string
  /**
   * THE NEWEST EVENT THE DATA ACTUALLY CONTAINS — max(transaction_date) over
   * the DLD table, or null when it cannot be read.
   *
   * Null is a real answer and must render as silence, never as a date. A
   * surface that cannot tell how current its data is says nothing about it;
   * that is the same rule this repo already applies to numbers
   * (lib/freehold/min-evidence.ts on the platform side, and the freshness
   * badge in components/top-data/top-data-section.tsx, whose header states it
   * plainly: "LIVE" IS A CLAIM, AND IT HAS TO BE TRUE).
   */
  coverageThrough: string | null
  totalProjects: number
  totalAreas: number
  ratedDevelopers: number
  strongBuySignals: number
  buySignals: number
  holdSignals: number
  waitSignals: number
  avoidSignals: number
  highConfidence: number
  dldTransactions: number
  avgPrice: number | null
  avgYield: number | null
}

/**
 * WHAT TO SHOW WHEN THE DATABASE CANNOT BE READ.
 *
 * Every count here is a last-known figure, not a reading. `coverageThrough` is
 * therefore null and MUST stay null: the one thing a deployment that cannot
 * reach its database certainly does not know is how current its data is, and
 * inventing a date here would put the lie back on the page through a different
 * door. Silence is the honest fallback for a freshness claim.
 */
export const PLATFORM_METRICS_FALLBACK: PlatformMetrics = {
  dataAsOf: "2026-09-05T00:00:00.000Z",
  coverageThrough: null,
  // Read from the curated inventory (api.projects_v1) and the DLD table on
  // 2026-09-05 — the same population every surface now counts. Before this
  // date the set mixed a March snapshot (2,813 · 136 BUY · 36,841) with
  // nothing for HOLD/WAIT/AVOID, so a failed read printed a confident zero.
  totalProjects: 2813,
  totalAreas: 166,
  ratedDevelopers: 481,
  strongBuySignals: 126,
  buySignals: 357,
  holdSignals: 268,
  waitSignals: 1162,
  avoidSignals: 1026,
  highConfidence: 2421,
  dldTransactions: 46161,
  avgPrice: null,
  avgYield: null,
}

function pickPositiveNumber(value: number | null | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback
}

function pickNullableNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function pickCount(value: number | null | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback
}

export function withPlatformMetricFallback(metrics?: Partial<PlatformMetrics> | null): PlatformMetrics {
  return {
    dataAsOf: metrics?.dataAsOf ?? PLATFORM_METRICS_FALLBACK.dataAsOf,
    // No `??` fallback on purpose: an unreadable coverage date stays null and
    // the surface renders nothing, rather than inheriting a constant that
    // would read as a measurement.
    coverageThrough: metrics?.coverageThrough ?? null,
    totalProjects: pickPositiveNumber(metrics?.totalProjects, PLATFORM_METRICS_FALLBACK.totalProjects),
    totalAreas: pickPositiveNumber(metrics?.totalAreas, PLATFORM_METRICS_FALLBACK.totalAreas),
    ratedDevelopers: pickPositiveNumber(metrics?.ratedDevelopers, PLATFORM_METRICS_FALLBACK.ratedDevelopers),
    strongBuySignals: pickCount(metrics?.strongBuySignals, PLATFORM_METRICS_FALLBACK.strongBuySignals),
    buySignals: pickCount(metrics?.buySignals, PLATFORM_METRICS_FALLBACK.buySignals),
    holdSignals: pickCount(metrics?.holdSignals, PLATFORM_METRICS_FALLBACK.holdSignals),
    waitSignals: pickCount(metrics?.waitSignals, PLATFORM_METRICS_FALLBACK.waitSignals),
    avoidSignals: pickCount(metrics?.avoidSignals, PLATFORM_METRICS_FALLBACK.avoidSignals),
    highConfidence: pickCount(metrics?.highConfidence, PLATFORM_METRICS_FALLBACK.highConfidence),
    dldTransactions: pickPositiveNumber(metrics?.dldTransactions, PLATFORM_METRICS_FALLBACK.dldTransactions),
    avgPrice: pickNullableNumber(metrics?.avgPrice),
    avgYield: pickNullableNumber(metrics?.avgYield),
  }
}

/**
 * THE FRESHNESS LINE, OR NOTHING.
 *
 * Returns null when the coverage date is unknown or unparseable, and every
 * caller renders null as silence. That is the whole discipline: the surfaces
 * that used to print "Data refreshed <now>" printed it most confidently when
 * the pipeline was most stale, because they were reading a clock. A surface
 * that cannot tell how current its data is now says nothing, which is a
 * smaller claim and a true one.
 *
 * DATE ONLY, NO TIME. The underlying value is a transaction DATE — there is no
 * hour in it — so printing "22:14 GST" beside it invents precision the column
 * does not carry. That was half of why the old label read as live.
 */
export function coverageLabel(coverageThrough: string | null, isArabic: boolean): string | null {
  if (!coverageThrough) return null
  const at = new Date(coverageThrough)
  if (!Number.isFinite(at.getTime())) return null
  const date = at.toLocaleDateString(isArabic ? "ar-AE-u-nu-latn" : "en-AE", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Dubai",
  })
  // Names the source, because "through 21 Aug" alone invites the reader to
  // assume it covers everything the platform knows. It covers the DLD feed.
  return isArabic ? `صفقات دائرة الأراضي حتى ${date}` : `DLD transactions through ${date}`
}
