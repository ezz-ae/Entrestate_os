import "server-only"
import { dbQuery, Prisma } from "@/lib/db"
import { MARKET_TABLES } from "@/lib/market-tables"
import { SALES_BASIS } from "./sales"
import { residentialSaleFilter } from "./sales"
import { monthlyCoverageSql, summariseCoverage, type CoverageSummary } from "./coverage"
import {
  areaPricingSql,
  shapeAreaPricing,
  MIN_SAMPLE,
  type AreaPricing,
  type AreaPricingRow,
} from "./area-pricing"

/**
 * The area pricing read, with everything a reader needs to judge it attached.
 *
 * Three facts travel WITH the numbers rather than beside them in a doc nobody
 * opens: what was counted (`basis`), how thin a cell may be before its median
 * is withheld (`minSample`), and whether the span these prices cover has holes
 * in it (`coverage`). A price table without those three is a table the reader
 * has to trust rather than check, and this product's whole claim is the
 * opposite.
 */
export type AreaPricingResult = {
  basis: string
  minSample: number
  areas: AreaPricing[]
  coverage: CoverageSummary | null
  /** How many areas the sample gate left with at least one usable median. */
  areasWithPrice: number
}

export async function getAreaPricing(minSample = MIN_SAMPLE): Promise<AreaPricingResult> {
  const table = MARKET_TABLES.dldTransactions

  // Coverage is read on the same filter the prices are, because coverage of a
  // different set answers a different question. It fails to null rather than to
  // "continuous" — absent evidence of a gap is not evidence of no gap.
  const [rows, coverage] = await Promise.all([
    dbQuery<AreaPricingRow & Record<string, unknown>>(
      Prisma.raw(areaPricingSql(table, minSample)) as unknown as Prisma.Sql,
    ),
    dbQuery<Record<string, unknown>>(
      Prisma.raw(monthlyCoverageSql(table, residentialSaleFilter())) as unknown as Prisma.Sql,
    )
      .then((r) =>
        summariseCoverage(
          r.map((x) => ({
            month: String(x.month ?? ""),
            transactions: Number(x.transactions ?? 0),
            daysWithData: Number(x.days_with_data ?? 0),
            daysInMonth: Number(x.days_in_month ?? 0),
          })),
        ),
      )
      .catch(() => null),
  ])

  const areas = shapeAreaPricing(rows as unknown as AreaPricingRow[], minSample)

  return {
    basis: SALES_BASIS,
    minSample,
    areas,
    coverage,
    areasWithPrice: areas.filter((a) => a.offPlan.medianPerSqm != null || a.ready.medianPerSqm != null).length,
  }
}
