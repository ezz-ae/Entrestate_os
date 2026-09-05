import "server-only"
import { dbQuery, Prisma } from "@/lib/db"
import { listAreas, listDevelopers } from "@/lib/decision-infrastructure"
import { getInventoryTableName, getInventoryTableSql } from "@/lib/inventory-table"
import { PLATFORM_METRICS_FALLBACK } from "@/lib/platform-metrics"

/**
 * ONE INVENTORY, ONE SET OF NUMBERS.
 *
 * Until 2026-09-05 this module counted the wide ingest table
 * (raw.inventory_full, 7,015 rows) through six quality clauses and the old
 * L3 engine's `l3_timing_signal`, and came back with 1,946 projects and 761
 * BUY. Every other surface counted the curated V1 inventory
 * (api.projects_v1 over canonical.inventory_clean — 2,813 rows, `timing_label`
 * from the V1 engine): /properties listed "showing 21 of 2,813" under a
 * <title> that said "1,946 Scored Dubai Projects"; the footer's snapshot said
 * 2,813 and 136 BUY beside a hero that said 1,946 and 761; the Signal Feed
 * said 0 BUY. Three populations, two engines, one product — and a reader who
 * compared any two pages had a reason to trust neither.
 *
 * The curated inventory is the population, because it is what the product
 * SHOWS: /properties lists it, the verdict cards read its columns
 * (investor_score_v1, timing_label, stress_grade_v1), and the V1 engine that
 * scores it is the one the docs describe. So every count here is taken from
 * that one table through `getInventoryTableName()` — the same resolver
 * /properties uses — with no quality filter of its own: the curated table IS
 * the filter. `tests/one-truth.test.ts` holds this module to that table and
 * to the V1 columns.
 */

export type PlatformStats = {
  dataAsOf: string
  totalProjects: number
  totalAreas: number
  ratedDevelopers: number
  strongBuyCount: number
  buyCount: number
  holdCount: number
  waitCount: number
  avoidCount: number
  highConfidence: number
  avgPrice: number | null
  avgYield: number | null
}

type InventoryCountRow = {
  projects: number | null
  strong_buy: number | null
  buy: number | null
  hold: number | null
  wait: number | null
  avoid: number | null
  high_confidence: number | null
  avg_price: number | string | null
  avg_yield: number | string | null
}

function count(value: unknown) {
  const n = typeof value === "string" ? Number(value) : value
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0
}

function nullableNumber(value: unknown) {
  const n = typeof value === "string" ? Number(value) : value
  return typeof n === "number" && Number.isFinite(n) ? n : null
}

/**
 * The curated inventory names its price `price_from` and its yield
 * `rental_yield`; the wide tables name the price `price_from_aed`. The
 * resolver in lib/market-tables.ts reads the shape off the table name the
 * same way — a bare override that points INVENTORY_TABLE at a wide table
 * gets the wide column, not a missing one.
 */
function priceColumnFor(tableName: string) {
  const hint = tableName.toLowerCase()
  return hint.includes("inventory_full") || hint.includes("inventory_spine") || hint.includes("entrestate_inventory")
    ? "price_from_aed"
    : "price_from"
}

/** Timing, confidence, price and yield — one row from the one table. */
export async function readInventoryCounts(): Promise<InventoryCountRow | null> {
  const tableName = getInventoryTableName()
  const priceColumn = Prisma.raw(priceColumnFor(tableName))
  const rows = await dbQuery<InventoryCountRow>(Prisma.sql`
    SELECT
      COUNT(*)::int AS projects,
      COUNT(*) FILTER (WHERE UPPER(timing_label) = 'STRONG_BUY')::int AS strong_buy,
      COUNT(*) FILTER (WHERE UPPER(timing_label) = 'BUY')::int AS buy,
      COUNT(*) FILTER (WHERE UPPER(timing_label) = 'HOLD')::int AS hold,
      COUNT(*) FILTER (WHERE UPPER(timing_label) = 'WAIT')::int AS wait,
      COUNT(*) FILTER (WHERE UPPER(timing_label) = 'AVOID')::int AS avoid,
      COUNT(*) FILTER (WHERE UPPER(price_confidence) = 'HIGH')::int AS high_confidence,
      ROUND(AVG(${priceColumn}) FILTER (WHERE ${priceColumn} > 0)) AS avg_price,
      ROUND(AVG(rental_yield::numeric) FILTER (WHERE rental_yield > 0), 1) AS avg_yield
    FROM ${getInventoryTableSql()}
  `)
  return rows[0] ?? null
}

export async function platformStats(): Promise<PlatformStats> {
  const [counts, areas, developers] = await Promise.all([
    readInventoryCounts().catch(() => null),
    listAreas().catch(() => null),
    listDevelopers().catch(() => null),
  ])

  const projects = count(counts?.projects)
  // A read that failed, or a table with no rows, is not a reading of zero
  // BUY signals: every inventory figure then degrades TOGETHER to the
  // last-known set, so the page never prints "2,813 projects · 0 BUY" over a
  // database it could not reach.
  const read = counts !== null && projects > 0

  return {
    // The request clock — it dates the response, not the data. Freshness is
    // PlatformMetrics.coverageThrough, read from the DLD table's newest row.
    dataAsOf: new Date().toISOString(),
    totalProjects: read ? projects : PLATFORM_METRICS_FALLBACK.totalProjects,
    totalAreas: areas?.areas.length ?? PLATFORM_METRICS_FALLBACK.totalAreas,
    ratedDevelopers: developers?.developers.length ?? PLATFORM_METRICS_FALLBACK.ratedDevelopers,
    strongBuyCount: read ? count(counts.strong_buy) : PLATFORM_METRICS_FALLBACK.strongBuySignals,
    buyCount: read ? count(counts.buy) : PLATFORM_METRICS_FALLBACK.buySignals - PLATFORM_METRICS_FALLBACK.strongBuySignals,
    holdCount: read ? count(counts.hold) : PLATFORM_METRICS_FALLBACK.holdSignals,
    waitCount: read ? count(counts.wait) : PLATFORM_METRICS_FALLBACK.waitSignals,
    avoidCount: read ? count(counts.avoid) : PLATFORM_METRICS_FALLBACK.avoidSignals,
    highConfidence: read ? count(counts.high_confidence) : PLATFORM_METRICS_FALLBACK.highConfidence,
    avgPrice: read ? nullableNumber(counts.avg_price) : null,
    avgYield: read ? nullableNumber(counts.avg_yield) : null,
  }
}
