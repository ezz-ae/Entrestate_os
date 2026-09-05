import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * A SUBLABEL IS A CLAIM.
 *
 * The line under a number is read as the number's warrant. On 2026-09-05 the
 * homepage said "97% Grade A/B coverage" under the project count (grades A
 * and B were 12% of the scored inventory), "Median across 166 areas" under a
 * figure that is a MEAN of entry prices, "Refreshed each ETL pass" under the
 * BUY count (the engine last ran in March), and the footer said "Engine
 * refreshed hourly" and "snapshots refresh throughout the day". None was a
 * reading; each was a phrase that sounded like one.
 *
 * Rule: a sublabel is either computed from the same metrics as the number
 * above it, or it describes the SOURCE. It never describes a cadence the
 * pipeline does not have.
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:'"`])\/\/.*$/gm, "$1")

describe("homepage hero sublabels", () => {
  const hero = stripComments(read("components/homepage/hero-section.tsx"))

  it("the project count's sublabel is the computed HIGH-confidence share, not a constant", () => {
    expect(hero).not.toMatch(/97%|٩٧٪|Grade A\/B coverage/)
    expect(hero).toMatch(/highConfidencePct = totalProjects > 0 \? Math\.round\(\(highConfidence \/ totalProjects\) \* 100\)/)
    expect(hero).toContain("% HIGH price confidence")
  })

  it("a mean is called a mean", () => {
    expect(hero).not.toMatch(/Median across/)
    expect(hero).toContain("Mean entry price across")
  })

  it("no cadence claims", () => {
    expect(hero).not.toMatch(/Refreshed each ETL|ETL pass|hourly|throughout the day/i)
  })

  it("the page passes the count the share is computed from", () => {
    expect(stripComments(read("app/page.tsx"))).toContain("highConfidence={metrics.highConfidence}")
  })
})

describe("footer", () => {
  const footer = stripComments(read("components/footer.tsx"))

  it("describes the source, never a refresh cadence the pipeline does not have", () => {
    expect(footer).not.toMatch(/refreshed hourly|يُحدَّث كل ساعة|refresh throughout the day/i)
    expect(footer).toContain("Curated V1 inventory")
    expect(footer).toContain("read from the database on every request")
  })
})
