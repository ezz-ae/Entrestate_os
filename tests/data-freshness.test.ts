import { describe, expect, it } from "vitest"
import fs from "node:fs"
import path from "node:path"
import {
  PLATFORM_METRICS_FALLBACK,
  coverageLabel,
  withPlatformMetricFallback,
} from "@/lib/platform-metrics"

/**
 * THE FRESHNESS LABEL WAS READING A CLOCK.
 *
 * On 3 September the homepage said "Data refreshed Sep 03, 22:14 GST", the
 * library said the same, and the Decision Terminal header said "Updated just
 * now". None of the three was a measurement. Every read model in
 * lib/decision-infrastructure.ts stamps `data_as_of: new Date().toISOString()`,
 * so the age was always seconds — while the newest DLD transaction in the
 * database was 21 August, with a five-month hole from 8 March to 3 August
 * sitting inside the range the page was implicitly claiming.
 *
 * The failure mode is the one this repo keeps naming: the label was most
 * confident exactly when the pipeline was most stale, because a clock cannot
 * fail. `components/top-data/top-data-section.tsx` already states the rule in
 * its header — "LIVE" IS A CLAIM, AND IT HAS TO BE TRUE — and had been fixed
 * for that surface alone in August. These tests hold the same line everywhere
 * else, and hold it in the direction that actually matters: **not knowing must
 * render as silence, never as a date.**
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")

/** Prose explains the rule; only real code may satisfy it. */
const stripComments = (src: string) =>
  src
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")

/** Every file that renders a freshness claim to a visitor. */
const SURFACES = [
  "app/page.tsx",
  "app/library/page.tsx",
  "app/overview/page.tsx",
  "components/mobile/mobile-home-page.tsx",
]

describe("not knowing renders as silence", () => {
  it("an absent coverage date produces no label at all", () => {
    expect(coverageLabel(null, false)).toBeNull()
    expect(coverageLabel(null, true)).toBeNull()
  })

  it("an unparseable coverage date produces no label either", () => {
    expect(coverageLabel("not-a-date", false)).toBeNull()
    expect(coverageLabel("", false)).toBeNull()
  })

  it("the fallback carries no coverage date, because a dead database knows no dates", () => {
    expect(PLATFORM_METRICS_FALLBACK.coverageThrough).toBeNull()
  })

  it("and the fallback never leaks a date into a live reading", () => {
    // The other fields intentionally fall back to last-known figures. This one
    // must not: a stale count is a stale count, a wrong date is a lie.
    expect(withPlatformMetricFallback({}).coverageThrough).toBeNull()
    expect(withPlatformMetricFallback(null).coverageThrough).toBeNull()
    expect(withPlatformMetricFallback({ totalProjects: 10 }).coverageThrough).toBeNull()
  })
})

describe("a real coverage date is stated as a date", () => {
  const through = "2026-08-21T00:00:00.000Z"

  it("survives the fallback untouched", () => {
    expect(withPlatformMetricFallback({ coverageThrough: through }).coverageThrough).toBe(through)
  })

  it("names the day", () => {
    const label = coverageLabel(through, false)
    expect(label).toBeTruthy()
    expect(label).toContain("21")
  })

  it("names the source, so the boundary is not read as covering everything", () => {
    expect(coverageLabel(through, false)).toContain("DLD")
    expect(coverageLabel(through, true)).toContain("دائرة الأراضي")
  })

  it("carries no time of day — the column has no hour in it to report", () => {
    for (const isArabic of [false, true]) {
      const label = coverageLabel(through, isArabic) ?? ""
      expect(label).not.toMatch(/\d{1,2}:\d{2}/)
      expect(label).not.toMatch(/GST|GMT|UTC/)
    }
  })
})

describe("no surface derives freshness from the request clock", () => {
  it("none of them reads dataAsOf", () => {
    for (const file of SURFACES) {
      const src = stripComments(read(file))
      expect(src, `${file} still reads dataAsOf`).not.toMatch(/\.dataAsOf\b/)
    }
  })

  it("the retired relative-time formatter is gone from the terminal header", () => {
    const src = stripComments(read("app/overview/page.tsx"))
    expect(src).not.toContain("formatRelativeTime")
    // Its two outputs were unconditional claims with no reading behind them.
    expect(src).not.toContain("Updated just now")
    expect(src).not.toContain("Recently updated")
  })

  it("every surface that shows a label guards on it being present", () => {
    for (const file of SURFACES) {
      const src = stripComments(read(file))
      if (!src.includes("coverageLabel") && !src.includes("syncLabel")) continue
      expect(
        /syncLabel \?/.test(src) || /updatedLabel \?/.test(src) || /coverageLabel\([^)]*\) \?/.test(src),
        `${file} renders a freshness label without checking it exists`,
      ).toBe(true)
    }
  })
})

describe("the count and the date come out of the same read", () => {
  const src = stripComments(read("lib/platform-metrics.server.ts"))

  it("one query asks for both", () => {
    expect(src).toMatch(/COUNT\(\*\)[\s\S]{0,80}MAX\(transaction_date\)/)
  })

  it("a failed read degrades the date to null, not to a constant", () => {
    // The count may fall back to a last-known figure; the date may not.
    expect(src).toMatch(/through:\s*null/)
    expect(src).not.toMatch(/through:\s*PLATFORM_METRICS_FALLBACK/)
  })
})
