import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * THE DEVELOPERS PAGE: A COUNT THE SOURCE DOES NOT CARRY IS NULL, NEVER ZERO.
 *
 * On 2026-09-05 every developer card read "Safe Project Coverage 0 / 99 ·
 * 0%": listDevelopers read `safe_projects` from the registry view
 * (api.developers_v1), which has no such column, through COALESCE(…, 0) —
 * and divided by the registry's project count, which is not the number of
 * projects that carry a stress grade. The header said "Audit Freshness ·
 * 5 Sep 2026" and "Data synced · <now>" from the request clock.
 *
 * Now: safe_projects and scored_projects come from the curated inventory
 * (stress grade A/B over scored rows, per developer), the card divides one
 * by the other, a developer with no scored rows shows "—", and the header
 * carries the DLD coverage line or nothing.
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:'"`])\/\/.*$/gm, "$1")

describe("developers", () => {
  const di = stripComments(read("lib/decision-infrastructure.ts"))
  const card = stripComments(read("components/decision/developer-card.tsx"))
  const page = stripComments(read("app/developers/page.tsx"))

  it("safe projects are counted from the curated inventory's stress grades, per developer", () => {
    expect(di).toMatch(/COUNT\(\*\) FILTER \(WHERE UPPER\(COALESCE\(stress_grade_v1, ''\)\) IN \('A', 'B'\)\)::int AS safe_projects/)
    expect(di).toContain("safeProjects: Number(row.safe_projects) || 0")
    expect(di).toContain("scored_projects: safety ? safety.scored_projects : null")
  })

  it("the registry's missing column is null, not a coalesced zero", () => {
    expect(di).toContain("(to_jsonb(d) ->> 'safe_projects')::int AS safe_projects,")
    expect(di).not.toMatch(/\(to_jsonb\(d\) ->> 'safe_projects'\)::int,\s*0\s*\)/)
  })

  it("the card divides safe by scored, and shows — when it has no reading", () => {
    expect(card).toContain("scored_projects?: number | null")
    expect(card).toMatch(/const total = typeof developer\.scored_projects === "number"/)
    expect(card).toMatch(/if \(safe === null \|\| total === null \|\| total <= 0\)/)
    expect(page).toContain("scored_projects={")
  })

  it("the header carries the coverage line, never the request clock", () => {
    expect(page).toContain("coverageLabel(metrics.coverageThrough, isArabic)")
    expect(page).not.toMatch(/Audit Freshness|Data synced|buildDataSyncMeta|syncTimestamp/)
  })
})

describe("no page prints the request clock as a data date", () => {
  it("properties and areas carry the coverage line; top-data says computed; search says read", () => {
    for (const rel of ["app/properties/page.tsx", "app/areas/page.tsx"]) {
      const src = stripComments(read(rel))
      expect(src, rel).toContain("coverageLabel(pageMetrics.coverageThrough")
      expect(src, rel).not.toMatch(/Data synced|Data Freshness · |syncTimestamp/)
    }
    expect(stripComments(read("app/top-data/page.tsx"))).toContain("Computed at · ")
    expect(stripComments(read("app/search/page.tsx"))).toContain("Read from the database")
    const shipped = ["app/properties/page.tsx", "app/areas/page.tsx", "app/top-data/page.tsx", "app/search/page.tsx", "app/developers/page.tsx"]
    for (const rel of shipped) expect(stripComments(read(rel)), rel).not.toMatch(/`Data synced|"Data synced/)
  })
})
