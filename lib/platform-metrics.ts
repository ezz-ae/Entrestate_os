export type PlatformMetrics = {
  dataAsOf: string
  totalProjects: number
  totalAreas: number
  ratedDevelopers: number
  buySignals: number
  highConfidence: number
  dldTransactions: number
  avgPrice: number | null
  avgYield: number | null
}

export const PLATFORM_METRICS_FALLBACK: PlatformMetrics = {
  dataAsOf: "2026-04-28T00:00:00.000Z",
  totalProjects: 2813,
  totalAreas: 167,
  ratedDevelopers: 74,
  buySignals: 136,
  highConfidence: 0,
  dldTransactions: 36841,
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
    totalProjects: pickPositiveNumber(metrics?.totalProjects, PLATFORM_METRICS_FALLBACK.totalProjects),
    totalAreas: pickPositiveNumber(metrics?.totalAreas, PLATFORM_METRICS_FALLBACK.totalAreas),
    ratedDevelopers: pickPositiveNumber(metrics?.ratedDevelopers, PLATFORM_METRICS_FALLBACK.ratedDevelopers),
    buySignals: pickCount(metrics?.buySignals, PLATFORM_METRICS_FALLBACK.buySignals),
    highConfidence: pickCount(metrics?.highConfidence, PLATFORM_METRICS_FALLBACK.highConfidence),
    dldTransactions: pickPositiveNumber(metrics?.dldTransactions, PLATFORM_METRICS_FALLBACK.dldTransactions),
    avgPrice: pickNullableNumber(metrics?.avgPrice),
    avgYield: pickNullableNumber(metrics?.avgYield),
  }
}
