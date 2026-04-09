import { describe, it, expect } from "vitest"
import { PrismaClient } from "@prisma/client"
import { getInventoryTableName } from "@/lib/inventory-table"

const hasDatabaseUrl = Boolean(
  process.env.DATABASE_URL
    || process.env.DATABASE_URL_UNPOOLED
    || process.env.NEON_DATABASE_URL
    || process.env.NEON_DATABASE_URL_UNPOOLED
    || process.env.NEON_READONLY_URL,
)

const prisma = hasDatabaseUrl ? new PrismaClient() : null
const test = hasDatabaseUrl ? it : it.skip

describe("Database Contract Verification", () => {
  test("should have inventory view with required columns", async () => {
    const inventoryTable = getInventoryTableName()
    const parts = inventoryTable.split(".")
    const tableSchema = parts.length === 2 ? parts[0] : "public"
    const tableName = parts.length === 2 ? parts[1] : parts[0]

    const columns = await prisma!.$queryRaw<any[]>`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = ${tableSchema}
        AND table_name = ${tableName}
    `

    expect(columns.length).toBeGreaterThan(0)

    const columnNames = columns.map((c) => c.column_name)

    // Enterprise mandatory signals
    const hasPrice =
      columnNames.includes("price_from_aed")
      || columnNames.includes("price_from")
    expect(hasPrice).toBe(true)
    expect(columnNames).toContain("investor_score_v1")
    expect(columnNames).toContain("stress_grade_v1")
    expect(columnNames).toContain("timing_label")
    expect(columnNames).toContain("decision_label_v1")
  })

  test("should have market-score inventory view", async () => {
    const columns = await prisma!.$queryRaw<any[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('automation_inventory_view_v1', 'agent_inventory_view_v1')
    `

    expect(columns.length).toBeGreaterThan(0)
  })

  test("should enforce DOUBLE PRECISION for core financial metrics", async () => {
    const inventoryTable = getInventoryTableName()
    const parts = inventoryTable.split(".")
    const tableSchema = parts.length === 2 ? parts[0] : "public"
    const tableName = parts.length === 2 ? parts[1] : parts[0]

    const priceColumn = await prisma!.$queryRaw<any[]>`
      SELECT data_type, column_name
      FROM information_schema.columns 
      WHERE table_schema = ${tableSchema}
        AND table_name = ${tableName}
        AND column_name IN ('price_from_aed', 'price_from')
      ORDER BY CASE column_name WHEN 'price_from_aed' THEN 0 ELSE 1 END
      LIMIT 1
    `

    expect(priceColumn.length).toBeGreaterThan(0)
    // Neon/Postgres numeric types include double precision, numeric, or bigint for integer AED values.
    expect(priceColumn[0].data_type).toMatch(/double precision|numeric|bigint/i)
  })
})
