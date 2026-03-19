import { describe, it, expect } from "vitest"
import { PrismaClient } from "@prisma/client"

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
  test("should have inventory_clean view with required columns", async () => {
    // Check if the view exists and has the required columns
    const columns = await prisma!.$queryRaw<any[]>`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_clean'
    `

    expect(columns.length).toBeGreaterThan(0)

    const columnNames = columns.map((c) => c.column_name)
    
    // Enterprise Mandatory Columns
    expect(columnNames).toContain("price_from_aed")
    expect(columnNames).toContain("investor_score_v1")
    expect(columnNames).toContain("stress_grade_v1")
    expect(columnNames).toContain("timing_label")
    expect(columnNames).toContain("decision_label_v1")
  })

  test("should have market_scores_v1 view", async () => {
    const columns = await prisma!.$queryRaw<any[]>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'market_scores_v1'
    `
    
    expect(columns.length).toBeGreaterThan(0)
  })

  test("should enforce DOUBLE PRECISION for core financial metrics", async () => {
    const priceColumn = await prisma!.$queryRaw<any[]>`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_clean' AND column_name = 'price_from_aed'
    `

    // Neon/Postgres double precision is usually 'double precision'
    expect(priceColumn[0].data_type).toMatch(/double precision|numeric/i)
  })
})
