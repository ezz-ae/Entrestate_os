import { beforeEach, describe, expect, it, vi } from "vitest"

const queryRawMock = vi.fn()
const getMarketScoreSummaryMock = vi.fn()

vi.mock("@/lib/notebook-provenance", () => ({
  getLatestNotebookProvenance: vi.fn(async () => ({
    run_id: "run-test-123",
    snapshot_ts: "2026-04-10T00:00:00.000Z",
    sources_used: ["inventory_full"],
  })),
}))

vi.mock("@/lib/rate-limit", () => ({
  buildRateLimitKey: vi.fn(() => "markets:test"),
  rateLimit: vi.fn(async () => ({
    allowed: true,
    remaining: 119,
    resetAt: Date.now() + 60_000,
  })),
}))

vi.mock("@/lib/inventory-policy", () => ({
  buildExclusionSql: vi.fn(() => null),
}))

vi.mock("@/lib/db-guardrails", () => ({
  withStatementTimeout: vi.fn(async (callback: (tx: { $queryRaw: typeof queryRawMock }) => Promise<unknown>) =>
    callback({ $queryRaw: queryRawMock })),
}))

vi.mock("@/lib/market-score/service", () => ({
  getMarketScoreSummary: (...args: unknown[]) => getMarketScoreSummaryMock(...args),
}))

vi.mock("@/lib/market-score/filters", () => ({
  parseMarketScoreFilters: vi.fn(() => ({
    filters: { cities: [], areas: [], statusBands: [], priceTiers: [], safetyBands: [] },
    routing: {},
    overrideFlags: { allow2030Plus: false, allowSpeculative: false },
  })),
}))

vi.mock("@/lib/market-score/validators", () => ({
  filtersSchema: { parse: vi.fn((value: unknown) => value) },
  routingSchema: { parse: vi.fn((value: unknown) => value) },
}))

import { GET as marketsGet } from "@/app/api/markets/route"
import { GET as marketScoreSummaryGet } from "@/app/api/market-score/summary/route"

describe("route contracts", () => {
  beforeEach(() => {
    queryRawMock.mockReset()
    getMarketScoreSummaryMock.mockReset()
  })

  it("returns a real total count envelope from /api/markets", async () => {
    queryRawMock
      .mockResolvedValueOnce([
        {
          asset_id: "asset-1",
          name: "Marina Vista",
          developer: "Emaar",
          city: "Dubai",
          area: "Dubai Marina",
          status_band: "ready",
          price_aed: 2500000,
          beds: "2",
          score_0_100: 82,
          safety_band: "A",
          classification: "core",
        },
      ])
      .mockResolvedValueOnce([{ count: 42 }])

    const response = await marketsGet(new Request("http://localhost/api/markets?limit=1"))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.total).toBe(42)
    expect(body.requestId).toBeTruthy()
    expect(body.request_id).toBe(body.requestId)
    expect(body.provenance?.run_id).toBeTruthy()
    expect(Array.isArray(body.results)).toBe(true)
    expect(response.headers.get("x-request-id")).toBe(body.requestId)
  })

  it("returns request and provenance metadata from /api/market-score/summary", async () => {
    getMarketScoreSummaryMock.mockResolvedValue({
      totalAssets: 10,
      avgScore: 71.5,
      safetyDistribution: [],
      classificationDistribution: [],
      avgScoreByStatus: [],
      avgScoreBySafetyBand: [],
      avgScoreByPriceTier: [],
      conservativeReadyPool: 4,
      balancedDefaultPool: 6,
      available: {
        cities: ["Dubai"],
        areas: ["Dubai Marina"],
        statusBands: ["ready"],
        priceTiers: [],
        safetyBands: ["A"],
      },
      source: "view",
      truthChecks: {
        conservativeReady: [],
        balancedShort: [],
        horizonViolations: 0,
        speculativeLeak: 0,
      },
    })

    const response = await marketScoreSummaryGet(new Request("http://localhost/api/market-score/summary"))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.totalAssets).toBe(10)
    expect(body.requestId).toBeTruthy()
    expect(body.request_id).toBe(body.requestId)
    expect(body.run_id).toBe("run-test-123")
    expect(body.provenance).toEqual({
      run_id: "run-test-123",
      snapshot_ts: "2026-04-10T00:00:00.000Z",
      sources_used: ["inventory_full"],
    })
    expect(response.headers.get("x-request-id")).toBe(body.requestId)
  })
})
