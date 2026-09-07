import "server-only"
import { dbQuery, Prisma } from "@/lib/db"
import { PLATFORM_METRICS_FALLBACK, withPlatformMetricFallback, type PlatformMetrics } from "@/lib/platform-metrics"
import { platformStats } from "@/lib/stats/platformStats"
import { sharedRead } from "@/lib/read-cache"

type CoverageRow = {
  count: number
  /** max(transaction_date) — the newest event the table actually holds. */
  through: Date | string | null
}

const DLD_COUNT_TABLES = [
  "api.dld_transactions_v1",
  "public.dld_transactions_v1",
  "dld_transactions_arvo",
  "public.dld_transactions_arvo",
] as const

function isMissingRelationError(error: unknown, relation: string) {
  if (!error || typeof error !== "object") return false
  const candidate = error as { code?: string; message?: string; meta?: { message?: string } }
  const message = candidate.meta?.message ?? candidate.message ?? ""
  return (
    candidate.code === "42P01"
    || (candidate.code === "P2010" && message.includes("42P01"))
    || message.includes(`relation "${relation}" does not exist`)
    || message.includes(`relation '${relation}' does not exist`)
  )
}

type DldCoverage = {
  count: number
  /** ISO date of the newest transaction, or null when it cannot be read. */
  through: string | null
}

function toIsoDate(value: Date | string | null | undefined): string | null {
  if (!value) return null
  const at = value instanceof Date ? value : new Date(value)
  return Number.isFinite(at.getTime()) ? at.toISOString() : null
}

/**
 * HOW MANY TRANSACTIONS, AND HOW RECENT THE NEWEST ONE IS — asked together.
 *
 * The count and the coverage date come out of the SAME row of the SAME table,
 * which is the point: a count from one relation printed beside a date derived
 * from somewhere else is two facts pretending to be one. When this read fails,
 * the count degrades to a last-known figure and the date degrades to null —
 * they are allowed to fail differently because a stale count is a stale count,
 * while a wrong freshness date actively misleads.
 */
async function readDldCoverage(): Promise<DldCoverage> {
  for (const tableName of DLD_COUNT_TABLES) {
    try {
      const rows = await dbQuery<CoverageRow>(Prisma.sql`
        SELECT COUNT(*)::int AS count, MAX(transaction_date) AS through
        FROM ${Prisma.raw(tableName)}
      `)

      const count = rows[0]?.count
      if (typeof count === "number" && Number.isFinite(count) && count > 0) {
        return { count, through: toIsoDate(rows[0]?.through) }
      }
    } catch (error) {
      if (isMissingRelationError(error, tableName)) continue
      throw error
    }
  }

  return { count: PLATFORM_METRICS_FALLBACK.dldTransactions, through: null }
}

/**
 * The two reads behind every metric on the product, shared for a window. They
 * are pure aggregates over the curated inventory and the DLD table — no
 * cookies, no session, nothing per-person — and they are what made
 * /en/overview take nine and a half seconds cold. See lib/read-cache.ts.
 */
const readStats = sharedRead("platform-stats", () => platformStats())
const readCoverage = sharedRead("dld-coverage", () => readDldCoverage())

export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const [stats, dld] = await Promise.all([
    readStats().catch(() => null),
    readCoverage().catch(() => ({
      count: PLATFORM_METRICS_FALLBACK.dldTransactions,
      through: null,
    })),
  ])

  return withPlatformMetricFallback({
    // Still "now" on failure, and that is correct for THIS field — it dates the
    // response, not the data. The freshness claim lives in coverageThrough.
    // Deliberately outside the shared read: this dates the RESPONSE, not the
    // data, so it is stamped per request even when the counts came from the
    // window. The freshness claim a reader sees is coverageThrough, which is
    // a data date and correctly cached with the data it describes.
    dataAsOf: new Date().toISOString(),
    coverageThrough: dld.through,
    totalProjects: stats?.totalProjects,
    totalAreas: stats?.totalAreas,
    ratedDevelopers: stats?.ratedDevelopers,
    strongBuySignals: stats?.strongBuyCount,
    buySignals: (stats?.strongBuyCount ?? 0) + (stats?.buyCount ?? 0),
    holdSignals: stats?.holdCount,
    waitSignals: stats?.waitCount,
    avoidSignals: stats?.avoidCount,
    highConfidence: stats?.highConfidence,
    dldTransactions: dld.count,
    avgPrice: stats?.avgPrice,
    avgYield: stats?.avgYield,
  })
}
