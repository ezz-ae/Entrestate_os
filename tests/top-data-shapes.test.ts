import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  ROW_WRAPPER_KEYS,
  TRUST_BAR_KEYS,
  freshnessOf,
  shouldRenderTopDataSection,
} from "@/components/top-data/top-data-section"

/**
 * /top-data SAID "14/14 LIVE SECTIONS" AND NINE OF THEM WERE ZEROS.
 *
 * The page renders api.entrestate_top_data. Every row in that table had a real
 * payload — 981 WAIT signals, 725 C-grade projects, 460 FAIR yields — and the
 * page showed 0, 0, 0 under a green LIVE dot and "Confidence: HIGH".
 *
 * Two independent causes, both of the same kind: something that could not read
 * the data reported success instead of absence.
 *
 *   1. THE WRITER WRITES camelCase, THE READER ASKED FOR snake_case. Payloads
 *      store totalProjects, avgPrice, buySignals, safeCount,
 *      confidenceDistribution. Lookups asked for total, avg_price, buy_signals,
 *      safe_count, confidence_distribution. Where the two coincided by accident
 *      — projects, areas, developers, tiers, intents — a section rendered, and
 *      those five made the page look mostly fine. valueFromKeys now compares on
 *      a canonical form, so a casing difference cannot hide a field again.
 *
 *   2. dataToRecords DID NOT KNOW FOUR WRAPPER KEYS — signals, grades, labels,
 *      levels — and its fallback returned the wrapper object itself as "one
 *      row". So shouldRenderTopDataSection counted a row and showed the
 *      section, and the view found none of its fields and drew zeros. An
 *      unreadable payload now yields no rows, so the section hides instead of
 *      claiming a reading of zero.
 *
 * And the badge: every section printed "Live" from a hardcoded string. The rows
 * were last written on 12 March and read on 30 August.
 *
 * The fixtures below are the REAL payload shapes, copied from the live table.
 */

/** Exactly what `SELECT id, data_json FROM api.entrestate_top_data` returns. */
const LIVE_PAYLOADS: Record<string, unknown> = {
  "market-pulse": { totalProjects: 1642 },
  "timing-signals": {
    signals: [
      { count: 981, signal: "WAIT", avgPrice: 4769734, avgScore: 58.8 },
      { count: 107, signal: "BUY", avgPrice: 2100000, avgScore: 76 },
    ],
  },
  "stress-grades": { grades: [{ count: 725, grade: "C", avgPrice: 4582058, avgScore: 61 }] },
  affordability: { tiers: [{ tier: "mid_market", count: 370, avgPrice: 1512790, avgYield: 5.4 }] },
  "yield-labels": { labels: [{ count: 460, label: "FAIR", avgScore: 62, avgYield: 5.8 }] },
  "evidence-levels": { levels: [{ count: 957, level: "L4", avgScore: 61, avgEvidence: 80 }] },
  "outcome-intents": { intents: [{ count: 74, intent: "first_time_buyer", description: "BUY signal + under AED 1M" }] },
  "decision-labels": { labels: [{ count: 669, label: "HOLD", avgPrice: 3783450, avgScore: 64 }] },
  "top-projects": { projects: [{ area: "Business Bay", name: "Binghatti Skyhall", price: 1208000, score: 83 }] },
  "area-intelligence": { areas: [{ area: "Dubai Land", avgPrice: 2934319, avgScore: 60, avgYield: 5.7, projects: 100 }] },
  "developer-reliability": { developers: [{ avgScore: 62, avgYield: 5.8, projects: 259, developer: "Emaar Properties" }] },
  "trust-bar": {
    source: "inventory_clean (curated, PF-verified)",
    engines: ["Evidence Engine", "Stress Test Engine"],
    dataHierarchy: ["L1 DLD", "L2 Portal"],
    confidenceDistribution: [{ level: "HIGH", count: 900 }],
    totalProjects: 1642,
  },
  "golden-visa": { avgScore: 58, avgYield: 4.8, eligible: 468, safeCount: 16, buySignals: 12, threshold: "AED 2,000,000" },
}

describe("every section the table ships can be read", () => {
  it("renders each one instead of hiding it", () => {
    const unreadable = Object.entries(LIVE_PAYLOADS)
      .filter(([section, payload]) => !shouldRenderTopDataSection(section, payload))
      .map(([section]) => section)
    expect(
      unreadable,
      "these payloads ship in api.entrestate_top_data and the page cannot read them",
    ).toEqual([])
  })

  it("knows every wrapper key the payloads actually use", () => {
    // The four that were missing — signals, grades, labels, levels — are why
    // five sections rendered as zeros.
    const wrappers = new Set<string>()
    for (const payload of Object.values(LIVE_PAYLOADS)) {
      if (!payload || typeof payload !== "object") continue
      for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
        // A wrapper holds ROWS. `engines: ["Evidence Engine", …]` is a list of
        // strings the view renders directly, not rows to unwrap.
        if (Array.isArray(value) && value.length > 0 && value.every((v) => v && typeof v === "object")) {
          wrappers.add(key)
        }
      }
    }
    // A wrapper is readable either because dataToRecords unwraps it, or
    // because a named key list pulls it out first (trust-bar does that for its
    // two). Anything else is a section that will render as zeros.
    const known = new Set<string>([
      ...ROW_WRAPPER_KEYS,
      ...Object.values(TRUST_BAR_KEYS).flatMap((spellings) => [...spellings]),
    ])
    const missing = [...wrappers].filter((k) => !known.has(k))
    expect(missing, "add these to ROW_WRAPPER_KEYS — an unknown wrapper renders as zeros").toEqual([])
  })
})

describe("a payload it cannot read is absent, never zero", () => {
  it("hides a section whose rows sit under a key it does not know", () => {
    // The old fallback returned the wrapper object as one row, which is exactly
    // how "0 · 0% of inventory" got drawn beside "Confidence: HIGH".
    expect(shouldRenderTopDataSection("timing-signals", { mysteryRows: [{ count: 5 }] })).toBe(false)
  })

  it("still shows a section that genuinely is a single record", () => {
    expect(shouldRenderTopDataSection("golden-visa", LIVE_PAYLOADS["golden-visa"])).toBe(true)
    expect(shouldRenderTopDataSection("market-pulse", { totalProjects: 1642 })).toBe(true)
  })

  it("hides an empty payload rather than drawing an empty section", () => {
    expect(shouldRenderTopDataSection("timing-signals", {})).toBe(false)
    expect(shouldRenderTopDataSection("timing-signals", { signals: [] })).toBe(false)
    expect(shouldRenderTopDataSection("market-pulse", { totalProjects: 0 })).toBe(false)
  })
})

describe("the LIVE badge states what the timestamp supports", () => {
  const now = Date.parse("2026-08-30T10:00:00.000Z")

  it("calls March data on an August page stale, not live", () => {
    // The exact row this was written for: last_updated 2026-03-12T14:01:29Z.
    const f = freshnessOf("2026-03-12T14:01:29.027Z", now)
    expect(f.state).toBe("stale")
    expect(f.ageHours).toBeGreaterThan(24 * 150)
  })

  it("calls a fresh row live", () => {
    expect(freshnessOf("2026-08-30T06:00:00.000Z", now).state).toBe("live")
    expect(freshnessOf("2026-08-29T12:00:00.000Z", now).state).toBe("live")
  })

  it("tolerates one missed daily pass before crying stale", () => {
    // The ETL runs daily; a badge that flips on every slipped job is a badge
    // people stop reading. 48h is the line, so ~36h is still live.
    expect(freshnessOf("2026-08-28T22:00:00.000Z", now).state).toBe("live")
    expect(freshnessOf("2026-08-27T00:00:00.000Z", now).state).toBe("stale")
  })

  it("says undated rather than live when there is no timestamp", () => {
    expect(freshnessOf(null, now).state).toBe("unknown")
    expect(freshnessOf("not a date", now).state).toBe("unknown")
  })
})

describe("the page header agrees with the badges under it", () => {
  const page = fs.readFileSync(path.join(process.cwd(), "app/top-data/page.tsx"), "utf8")

  it("does not promise 'right now' unconditionally", () => {
    // The per-section badge was made honest first; leaving the headline alone
    // made the page contradict itself in one screenful — "Live market data,
    // right now" above a row of amber "171 DAYS OLD" chips.
    expect(page).toMatch(/headerIsLive[\s\S]{0,200}"Live market data, right now"/)
    expect(page).toContain("Market data, as last scored")
  })

  it("derives its freshness from the sections, not from the request time", () => {
    // data_as_of is set to new Date() on every request by getTopDataRows, so it
    // reports when the PAGE was built and never when the DATA was written.
    expect(page).toMatch(/freshestUpdate/)
    expect(page).toMatch(/last_updated/)
    expect(page).toMatch(/freshnessOf\(/)
  })

  it("stops calling sections live when they are not", () => {
    expect(page).toContain("sections ${headerIsLive ? \"live\" : \"readable\"}")
  })
})
