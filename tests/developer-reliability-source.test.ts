import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * "DEVELOPER RELIABILITY" HAS ONE SOURCE, AND NOTHING ELSE GETS TO WEAR THE NAME.
 *
 * Emaar Properties' public page said "Reliability 43.8". The chat, asked the
 * same question, said 83. Both were faithfully reading a column — different
 * columns:
 *
 *   canonical.inventory_clean.developer_reliability_score  → Emaar 83, Sobha 92
 *   raw.inventory_full.l2_developer_reliability (per listing) → Emaar avg 41.8
 *
 * And when even that column was missing, two code paths dressed the yield-heavy
 * composite up in the name: `d.avg_score AS reliability` in getDeveloperBySlug's
 * curated fallback, and `reliability: row.avg_score` in listDevelopers — which
 * is how a one-listing developer led a page titled "Reliability scores" while
 * the largest developer in the country sat under a short red bar.
 *
 * The rule, enforced here: every surface reads reliability through
 * getCanonicalDeveloperReliabilityMap(), and no query or mapping may alias a
 * different fact to the name.
 */

const ROOT = process.cwd()
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*(?:\/\/|--).*$/gm, "").replace(/\s--\s[^\n]*/g, "")

describe("the reliability source", () => {
  const infra = stripComments(fs.readFileSync(path.join(ROOT, "lib/decision-infrastructure.ts"), "utf8"))

  it("never aliases the composite score to reliability", () => {
    expect(infra).not.toMatch(/avg_score\s+AS\s+reliability/i)
    expect(infra).not.toMatch(/reliability:\s*row\.avg_score/)
  })

  it("computes the canonical map from the column that means it", () => {
    expect(infra).toMatch(/function getCanonicalDeveloperReliabilityMap/)
    expect(infra).toMatch(/AVG\(developer_reliability_score\)/)
    expect(infra).toMatch(/MARKET_TABLES\.inventory/)
  })

  it("routes every developer surface through the canonical map", () => {
    // listDevelopers (the /developers listing), getDeveloperBySlug (the detail
    // page that printed 43.8 on Emaar), and the reliability API route.
    const uses = infra.match(/getCanonicalDeveloperReliabilityMap\(\)/g) ?? []
    expect(uses.length, "listing + detail + api route must all read the map").toBeGreaterThanOrEqual(3)
  })
})

describe("the cards show the product, not the plumbing", () => {
  for (const rel of ["components/decision/developer-card.tsx", "components/decision/project-card.tsx"]) {
    it(`${rel} has no raw-payload flip`, () => {
      // Both cards carried an "API Response" button that flipped the card into
      // a JSON.stringify of the payload — internal wiring handed to every
      // visitor, and to every competitor.
      const src = stripComments(fs.readFileSync(path.join(ROOT, rel), "utf8"))
      expect(src).not.toMatch(/API Response/i)
      expect(src).not.toMatch(/showApi/)
      expect(src).not.toMatch(/JSON\.stringify\([^)]*apiPreview/i)
    })
  }

  it("keeps internal view names off the developers listing", () => {
    const src = stripComments(fs.readFileSync(path.join(ROOT, "app/developers/page.tsx"), "utf8"))
    expect(src).not.toMatch(/\$\{syncMeta\.primaryView\}/)
  })
})
