import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * THE TERMINAL ANSWERS BEFORE THE READER GIVES UP — locked.
 *
 * Measured against production on 2026-09-07, cold:
 *
 *     /en/overview     9,633 ms
 *     /en/properties   7,315 ms
 *     /en/top-data     5,816 ms
 *     /en/areas        1,945 ms
 *     /en/developers   1,077 ms
 *
 * The server itself is not slow — TTFB is 318 ms once warm. What costs the
 * time is that each of these pages is `force-dynamic` and runs its full
 * aggregate queries again for every single visitor, on a serverless instance
 * that may be cold against a database that may be idle. So a judge opening the
 * Decision Terminal sat in front of app/loading.tsx — "Fetching the latest
 * page state and market context." — for the better part of ten seconds.
 *
 * None of those numbers change per request: the curated inventory changes when
 * an ingest runs, the scores when the engine runs, the DLD coverage when a
 * backfill lands. So the READ is shared for a window (lib/read-cache.ts). The
 * value is identical; it is simply not recomputed for the next visitor inside
 * the window.
 *
 * Pure — no network, no database.
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:'"`])\/\/.*$/gm, "$1")

describe("one window, one tag, one way to drop it", () => {
  const cache = stripComments(read("lib/read-cache.ts"))

  it("the window and the tag are named once", () => {
    expect(cache).toContain('export const READ_TAG = "market-read"')
    expect(cache).toContain("export const READ_TTL_SECONDS = 300")
    expect(cache).toContain("tags: [READ_TAG]")
  })

  it("the key is part of the cache key, so two reads cannot serve each other's rows", () => {
    expect(cache).toMatch(/unstable_cache\(read, \["market-read", key\]/)
  })
})

describe("the slow reads go through it, and nothing per-person does", () => {
  const WRAPPED: Array<[string, string]> = [
    ["lib/platform-metrics.server.ts", "platform-stats"],
    ["lib/platform-metrics.server.ts", "dld-coverage"],
    ["lib/decision-infrastructure.ts", "investor-profile-counts"],
    ["lib/frontend-content.ts", "top-data-rows"],
  ]

  it("each of the four is wrapped", () => {
    for (const [rel, key] of WRAPPED) {
      expect(stripComments(read(rel)), `${rel}:${key}`).toContain(`sharedRead("${key}"`)
    }
  })

  it("nothing that touches a session is ever shared between people", () => {
    // unstable_cache serves one result to everyone, so a read that touched a
    // session would hand one person another's answer. Everything wrapped here
    // is a pure aggregate over public inventory.
    for (const rel of new Set(WRAPPED.map(([r]) => r))) {
      const src = read(rel)
      expect(src, rel).not.toMatch(/sharedRead\([^)]*\)[\s\S]{0,300}(cookies\(\)|headers\(\)|getSessionUser|getSyncedUser)/)
    }
  })

  it("the response date is still stamped per request, because it dates the response", () => {
    const metrics = stripComments(read("lib/platform-metrics.server.ts"))
    expect(metrics).toMatch(/dataAsOf: new Date\(\)\.toISOString\(\)/)
    // The freshness a READER sees is the data date, and that is cached with
    // the data it describes — which is correct, because it describes it.
    expect(metrics).toContain("coverageThrough: dld.through")
  })

  it("a cached read is a real read, never the fallback table", () => {
    // lib/platform-metrics.ts holds the one honest fallback, for a read that
    // FAILS. The window must not become a second place numbers come from.
    const cache = stripComments(read("lib/read-cache.ts"))
    expect(cache).not.toMatch(/PLATFORM_METRICS_FALLBACK|fallback/i)
  })
})
