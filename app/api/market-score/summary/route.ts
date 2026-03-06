import { NextResponse } from "next/server"
import { parseMarketScoreFilters } from "@/lib/market-score/filters"
import { getMarketScoreSummary } from "@/lib/market-score/service"
import type { MarketScoreSummary } from "@/lib/market-score/types"
import { filtersSchema, routingSchema } from "@/lib/market-score/validators"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SUMMARY_TIMEOUT_MS = 2500

function emptySummary(): MarketScoreSummary {
  return {
    totalAssets: 0,
    avgScore: 0,
    safetyDistribution: [],
    classificationDistribution: [],
    avgScoreByStatus: [],
    avgScoreBySafetyBand: [],
    avgScoreByPriceTier: [],
    conservativeReadyPool: 0,
    balancedDefaultPool: 0,
    available: {
      cities: [],
      areas: [],
      statusBands: [],
      priceTiers: [],
      safetyBands: [],
    },
    source: "view",
    truthChecks: {
      conservativeReady: [],
      balancedShort: [],
      horizonViolations: 0,
      speculativeLeak: 0,
    },
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const { filters, routing, overrideFlags } = parseMarketScoreFilters(searchParams)
    filtersSchema.parse(filters)
    routingSchema.parse(routing)
    const summary = await Promise.race([
      getMarketScoreSummary(filters, routing, overrideFlags),
      new Promise<MarketScoreSummary>((resolve) =>
        setTimeout(() => resolve({ ...emptySummary(), source: routing.riskProfile && routing.horizon ? "routed" : "view" }), SUMMARY_TIMEOUT_MS),
      ),
    ])
    return NextResponse.json(summary)
  } catch (error) {
    console.error("Market score summary error:", error)
    return NextResponse.json({ ...emptySummary(), warning: "Failed to load market score summary." })
  }
}
