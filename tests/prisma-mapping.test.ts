import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * THE MODELS MUST ADDRESS THE COLUMNS THE DATABASE ACTUALLY HAS.
 *
 * `"userId"` and `user_id` are different columns in Postgres. The UserProfile
 * model was written without @map directives against a hand-built snake_case
 * table, so every read and write it attempted named columns that were never
 * there — and `prisma db push`, offered as the fix, would have added seven
 * camelCase columns and dropped seventeen live ones.
 *
 * These pins keep the mapping attached to the model, and keep the warning
 * attached to the repository, for the next person who reaches for db push.
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")
const schema = read("prisma/schema.prisma")

const modelBody = (name: string) => {
  const start = schema.indexOf(`model ${name} {`)
  expect(start).toBeGreaterThan(-1)
  return schema.slice(start, schema.indexOf("\n}", start))
}

describe("UserProfile addresses the live table's columns", () => {
  const body = modelBody("UserProfile")

  // Verified against the live table on 2026-09-02.
  const mappings: Array<[string, string]> = [
    ["userId", "user_id"],
    ["teamId", "team_id"],
    ["riskBias", "risk_bias"],
    ["yieldVsSafety", "yield_vs_safety"],
    ["preferredMarkets", "preferred_markets"],
    ["inferredSignals", "inferred_signals"],
    ["updatedAt", "updated_at"],
  ]

  for (const [field, column] of mappings) {
    it(`${field} maps to ${column}`, () => {
      const line = body.split("\n").find((l) => l.trim().startsWith(field))
      expect(line, `field ${field} is missing`).toBeTruthy()
      expect(line).toContain(`@map("${column}")`)
    })
  }

  it("horizon needs no mapping — the column has the same name", () => {
    const line = body.split("\n").find((l) => l.trim().startsWith("horizon"))
    expect(line).not.toContain("@map(")
  })
})

describe("the db push trap stays documented", () => {
  it("db/README.md warns against push and names what it would drop", () => {
    const doc = read("db/README.md")
    expect(doc).toMatch(/do not run `prisma db push`/i)
    expect(doc).toContain("user_profiles")
    expect(doc).toContain("connectors")
    expect(doc).toContain("tenant_id")
  })

  it("the additive SQL only adds — it never drops or alters a column type", () => {
    const sql = read("db/2026-09-02-terminal-auth-tables.sql")
    const statements = sql
      .split("\n")
      .filter((l) => !l.trim().startsWith("--"))
      .join("\n")
    expect(statements).not.toMatch(/\bDROP\b/i)
    expect(statements).not.toMatch(/ALTER COLUMN/i)
    expect(statements).toMatch(/CREATE TABLE IF NOT EXISTS "users"/)
    expect(statements).toMatch(/ADD COLUMN IF NOT EXISTS "inferred_signals"/)
  })

  it("the README does not grade a capability BUILT when its table is absent", () => {
    const readme = read("README.md")
    const rows = readme.split("\n").filter((l) => l.startsWith("| **"))
    const timeTable = rows.find((r) => r.includes("**Time Table**"))
    const decisionObjects = rows.find((r) => r.includes("**Decision Objects**"))
    expect(timeTable).toContain("PARTIAL")
    expect(decisionObjects).toContain("PARTIAL")
  })
})
