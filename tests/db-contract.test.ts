import { Prisma, PrismaClient } from "@prisma/client"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { REQUIRED_FUNCTIONS, REQUIRED_RELATIONS } from "@/lib/db-contract"

const hasDatabaseUrl = Boolean(
  process.env.DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.NEON_DATABASE_URL ||
    process.env.NEON_DATABASE_URL_UNPOOLED ||
    process.env.NEON_READONLY_URL,
)

const describeDb = hasDatabaseUrl ? describe : describe.skip

describeDb("database contract", () => {
  const prisma = new PrismaClient()

  const expectType = (value: string, allowed: string[]) => {
    expect(allowed).toContain(value)
  }

  beforeAll(async () => {
    await prisma.$queryRaw`SELECT 1`
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it("exposes required views and tables", async () => {
    const names = REQUIRED_RELATIONS.map((relation) => relation.name)
    const rows = await prisma.$queryRaw<{ table_name: string; table_type: string }[]>(Prisma.sql`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (${Prisma.join(names)})
    `)

    const found = new Map(rows.map((row) => [row.table_name, row.table_type]))
    for (const relation of REQUIRED_RELATIONS) {
      const expected = Array.isArray(relation.type) ? relation.type : [relation.type]
      expect(expected).toContain(found.get(relation.name))
    }
  })

  it("exposes required columns on core relations", async () => {
    for (const relation of REQUIRED_RELATIONS) {
      const columns = await prisma.$queryRaw<{ column_name: string }[]>(Prisma.sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ${relation.name}
      `)
      const columnSet = new Set(columns.map((column) => column.column_name))
      for (const required of relation.requiredColumns) {
        expect(columnSet.has(required)).toBe(true)
      }
    }
  })

  it("enforces price_from_aed type on entrestate_master", async () => {
    const rows = await prisma.$queryRaw<{ data_type: string }[]>(Prisma.sql`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'entrestate_master'
        AND column_name = 'price_from_aed'
    `)

    if (rows.length === 0) return
    expect(rows[0].data_type).toBe("double precision")
  })

  it("enforces core column types on the inventory view", async () => {
    const rows = await prisma.$queryRaw<
      {
        asset_id_type: string
        score_type: string
        price_type: string
        reason_type: string
        risk_type: string
        drivers_type: string
      }[]
    >(Prisma.sql`
      SELECT
        pg_typeof(asset_id)::text AS asset_id_type,
        pg_typeof(score_0_100)::text AS score_type,
        pg_typeof(price_aed)::text AS price_type,
        pg_typeof(reason_codes)::text AS reason_type,
        pg_typeof(risk_flags)::text AS risk_type,
        pg_typeof(drivers)::text AS drivers_type
      FROM automation_inventory_view_v1
      LIMIT 1
    `)

    if (rows.length === 0) return
    const [row] = rows
    expectType(row.asset_id_type, ["text", "character varying"])
    expectType(row.score_type, ["smallint", "integer", "bigint", "numeric", "double precision"])
    expectType(row.price_type, ["double precision", "numeric", "bigint", "integer"])
    expectType(row.reason_type, ["text", "text[]", "character varying"])
    expectType(row.risk_type, ["text", "text[]", "character varying"])
    expectType(row.drivers_type, ["text", "jsonb", "json"])
  })

  it("enforces market_scores_v1.score type", async () => {
    const rows = await prisma.$queryRaw<{ data_type: string }[]>(Prisma.sql`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'market_scores_v1'
        AND column_name = 'score'
    `)

    expect(rows.length).toBeGreaterThan(0)
    expect(rows[0].data_type).toBe("double precision")
  })

  it("exposes required functions", async () => {
    const rows = await prisma.$queryRaw<{ proname: string }[]>(Prisma.sql`
      SELECT proname
      FROM pg_proc
      JOIN pg_namespace n ON n.oid = pg_proc.pronamespace
      WHERE n.nspname = 'public'
        AND proname IN (${Prisma.join([...REQUIRED_FUNCTIONS])})
    `)
    const found = new Set(rows.map((row) => row.proname))
    for (const fn of REQUIRED_FUNCTIONS) {
      expect(found.has(fn)).toBe(true)
    }
  })

  it("returns required columns for unranked investor function", async () => {
    const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT *
      FROM automation_inventory_for_investor_v1('Conservative', 'Ready')
      LIMIT 1
    `)
    if (rows.length === 0) return
    const keys = new Set(Object.keys(rows[0] ?? {}))
    const required = [
      "asset_id",
      "score_0_100",
      "safety_band",
      "classification",
      "roi_band",
      "liquidity_band",
      "timeline_risk_band",
      "reason_codes",
      "risk_flags",
      "drivers",
    ]
    for (const key of required) {
      expect(keys.has(key)).toBe(true)
    }
  })

  it("returns required columns for ranked investor function", async () => {
    const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT *
      FROM automation_ranked_for_investor_v1('Balanced', '1-2yr', 2000000, 'Dubai', '2BR', 'invest')
      LIMIT 1
    `)
    if (rows.length === 0) return
    const keys = new Set(Object.keys(rows[0] ?? {}))
    const required = [
      "asset_id",
      "score_0_100",
      "safety_band",
      "classification",
      "roi_band",
      "liquidity_band",
      "timeline_risk_band",
      "reason_codes",
      "risk_flags",
      "drivers",
      "match_score",
      "final_rank",
    ]
    for (const key of required) {
      expect(keys.has(key)).toBe(true)
    }
  })

  it("returns area absorption shape", async () => {
    const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT *
      FROM get_area_absorption(NULL)
      LIMIT 1
    `)
    if (rows.length === 0) return
    const keys = new Set(Object.keys(rows[0] ?? {}))
    const required = ["area", "projects", "buy_signals", "safe_projects", "efficiency", "supply_pressure"]
    for (const key of required) {
      expect(keys.has(key)).toBe(true)
    }
  })
})
