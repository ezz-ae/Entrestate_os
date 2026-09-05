import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * A STATUS PAGE THAT CAN FAIL.
 *
 * Until 2026-09-05 every row on /status was a constant: six services
 * "Operational", "10-phase pipeline · Last cycle completed on schedule",
 * "Streaming responses live", an SLO row promising "Data freshness < 24 h",
 * and a banner "All systems operational" derived from those constants — a
 * status page that could not report anything, linked from the homepage as
 * a trust surface. Meanwhile the newest DLD row was 21 August and the
 * scores were written in March. Its own snapshot counted through
 * getMarketPulse (1,946) while the footer beneath it said 2,813.
 *
 * Rules pinned here:
 *   1. The two rows that CAN be measured are: the feed states the DLD count
 *      and coverage it read; the scoring engine states how many projects
 *      carry scores and when they were written. A failed read says
 *      "Unreadable" and the banner turns amber.
 *   2. No cadence claim anywhere on the page — no "on schedule", no
 *      "< 24 h", no "hourly", no request-clock "Last checked".
 *   3. The snapshot reads the same metrics source as every other page.
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:'"`])\/\/.*$/gm, "$1")

describe("/status", () => {
  const page = stripComments(read("app/status/page.tsx"))

  it("measures the feed and the scoring engine, and can say Unreadable", () => {
    expect(page).toContain("status: m.readable ? ok : bad")
    expect(page).toMatch(/DLD transactions"\}\$\{m\.coverage/)
    expect(page).toContain("scores as written on")
    expect(page).toContain('"Unreadable"')
    expect(page).toContain("could not be read just now")
  })

  it("makes no cadence claim", () => {
    expect(page).not.toMatch(/on schedule|< 24 h|hourly|Last checked|Streaming responses live|10-phase/i)
    expect(page).not.toMatch(/formatTs\(/)
  })

  it("reads the one metrics source and the scores date, never the old pulse", () => {
    expect(page).toContain("getPlatformMetrics()")
    expect(page).toContain("getTopDataRows()")
    expect(page).toContain("scores_as_of")
    expect(page).not.toMatch(/getMarketPulse|getDataFreshnessStatus/)
  })

  it("the snapshot cards are the same three figures the overview shows", () => {
    expect(page).toContain("snapshot.metrics.totalProjects")
    expect(page).toContain("snapshot.metrics.highConfidence")
    expect(page).toContain("snapshot.metrics.buySignals")
  })

  it("the coverage line replaces the clock in the banner and the snapshot header", () => {
    expect(page).toContain("coverageLabel(snapshot.metrics.coverageThrough")
    expect(page).toMatch(/services monitored\$\{coverage \? ` · \$\{coverage\}` : ""\}/)
  })
})
