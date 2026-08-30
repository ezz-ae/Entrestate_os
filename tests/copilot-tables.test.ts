import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { PrismaClient } from "@prisma/client"
import { COPILOT_TABLES } from "@/lib/copilot/executor"
import { MARKET_TABLES } from "@/lib/market-tables"

/**
 * THE TERMINAL SAID THE MARKET WAS EMPTY BECAUSE FOUR TABLE NAMES HAD NO SCHEMA.
 *
 * The market data lives in `canonical` and `raw`; the connection's search_path
 * is `public`. `FROM developer_registry` therefore resolved to nothing and threw
 * on every call, safeTool() turned the throw into `no_results: true`, and the
 * Evidence Drawer printed "No direct rows returned from this tool invocation."
 * A database holding 2,813 projects, 481 developers and 36,841 DLD transactions
 * was reported as an empty market, confidently, for as long as nobody checked.
 *
 * The first two tests are pure and always run: they are the ones that would have
 * caught it. The last needs a database and skips without one.
 */

const EXECUTOR = path.join(process.cwd(), "lib/copilot/executor.ts")
const QUALIFIED = /^[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*$/

/** Every FROM/JOIN target inside a template literal in the executor. */
function tableReferences(source: string): string[] {
  // Strip block comments first. The module header explains this very bug and
  // quotes `FROM developer_registry` while doing so; a scanner that reads its
  // own explanation as evidence fails on the fix instead of on the defect.
  const code = source.replace(/\/\*[\s\S]*?\*\//g, " ")
  const literals = code.match(/`[^`]*`/g) ?? []
  const refs: string[] = []
  for (const literal of literals) {
    if (!/\bFROM\b/i.test(literal)) continue
    // Strip line comments so the prose explaining the bug is not read as SQL.
    const sql = literal.replace(/--[^\n]*/g, " ")
    for (const match of sql.matchAll(/\b(?:FROM|JOIN)\s+([^\s(),;]+)/gi)) {
      refs.push(match[1])
    }
  }
  return refs
}

describe("copilot table references", () => {
  it("names no table without a schema", () => {
    const refs = tableReferences(fs.readFileSync(EXECUTOR, "utf8"))
    expect(refs.length).toBeGreaterThan(5)

    const bare = refs.filter((ref) => {
      // An interpolation carries its own qualified constant; those are checked
      // by the next test, at the value rather than the call site.
      if (ref.startsWith("${")) return false
      // Subqueries and CTE aliases are not tables.
      if (ref === "(" || ref.startsWith("(")) return false
      return !QUALIFIED.test(ref)
    })

    expect(
      bare,
      `unqualified table(s): ${bare.join(", ")} — a bare name resolves against search_path, which is 'public', which is not where the market data lives`,
    ).toEqual([])
  })

  it("resolves every configured table to schema.table", () => {
    for (const [key, value] of Object.entries(COPILOT_TABLES)) {
      expect(QUALIFIED.test(value), `${key} = "${value}" is not schema-qualified`).toBe(true)
    }
    // The five are distinct relations; a copy-paste that pointed two keys at one
    // table would quietly answer a DLD question with project rows.
    const values = Object.values(COPILOT_TABLES)
    expect(new Set(values).size).toBe(values.length)
  })
})

const databaseUrl =
  process.env.DATABASE_URL
  || process.env.DATABASE_URL_UNPOOLED
  || process.env.NEON_DATABASE_URL
  || process.env.NEON_READONLY_URL

describe("copilot tables exist in the database", () => {
  const test = databaseUrl ? it : it.skip

  test("every table the copilot reads is present", async () => {
    const prisma = new PrismaClient()
    try {
      for (const [key, qualified] of Object.entries(COPILOT_TABLES)) {
        const [schema, table] = qualified.split(".")
        const rows = await prisma.$queryRaw<Array<{ found: bigint }>>`
          SELECT COUNT(*) AS found
          FROM information_schema.tables
          WHERE table_schema = ${schema} AND table_name = ${table}
        `
        expect(Number(rows[0]?.found ?? 0), `${key}: ${qualified} does not exist`).toBeGreaterThan(0)
      }
    } finally {
      await prisma.$disconnect()
    }
  }, 30_000)
})

/**
 * The executor was not the only reader. lib/mcp/server.ts, the public market
 * feed, the homepage content loaders and the dataset routes all named the same
 * tables the same wrong way, and each one degraded quietly: mcp_query returned
 * status "error", getTopDataRows() caught "missing relation" and served a
 * fallback, the feed returned nothing. So the rule is enforced over the whole
 * source, not one file.
 */
describe("no source file names a non-public relation without its schema", () => {
  const ROOTS = ["app", "lib", "ai-data-scientist", "components", "automation-builder", "agent-builder", "seq"]

  function walk(dir: string, out: string[] = []): string[] {
    let entries: fs.Dirent[]
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return out }
    for (const e of entries) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) {
        if (e.name === "node_modules" || e.name === ".next") continue
        walk(full, out)
      } else if (e.name.endsWith(".ts") || e.name.endsWith(".tsx")) {
        out.push(full)
      }
    }
    return out
  }

  it("keeps every schema-bearing table name qualified", () => {
    // Only the relations that genuinely live outside `public`: a bare name for
    // one of these cannot resolve, whereas a public table legitimately can.
    const guarded = Object.values(MARKET_TABLES)
      .filter((rel) => !rel.startsWith("public."))
      .map((rel) => rel.split(".")[1])
    expect(guarded.length).toBeGreaterThan(5)

    const pattern = new RegExp(`\\b(?:FROM|JOIN)\\s+(?:"?)(${guarded.join("|")})(?:"?)\\b`, "i")
    const offenders: string[] = []

    for (const root of ROOTS) {
      for (const file of walk(path.join(process.cwd(), root))) {
        const src = fs.readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, " ")
        for (const literal of src.match(/`[^`]*`/g) ?? []) {
          const sql = literal.replace(/--[^\n]*/g, " ")
          const hit = sql.match(pattern)
          if (hit) offenders.push(`${path.relative(process.cwd(), file)} -> ${hit[1]}`)
        }
      }
    }

    expect(
      [...new Set(offenders)],
      "these resolve against search_path ('public'), where this data is not — use MARKET_TABLES",
    ).toEqual([])
  })
})
