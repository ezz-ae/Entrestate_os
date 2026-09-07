import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * WHAT /pricing CALLS INCLUDED IS NOT BEHIND A 403.
 *
 * app/pricing/page.tsx states the deal in both languages — the account and its
 * packages come with the Terminal, and the selling happens in the business App
 * Store. Its own header says so: "THE TERMINAL DOES NOT SELL SUBSCRIPTIONS ANY
 * MORE". The page then lists six surfaces by name, the Decision Terminal chat
 * among them.
 *
 * Meanwhile the chat's two actions — "Save to shortlist" and "Generate report"
 * in components/ChatInterface.tsx — called /api/watchlists, /api/watchlists/
 * [id]/items and /api/reports/generate, and every one of them answered
 * 403 "Team tier required". Nothing sells a Team tier, so no caller could ever
 * pass: the chat rendered "Could not create shortlist (Team tier may be
 * required)" to every user of a product whose price page says the chat is
 * included. A gate for a plan that cannot be bought is not a paywall, it is a
 * closed door with no handle.
 *
 * The gates are gone from those four routes. What is still required is an
 * account — a shortlist and a report belong to somebody — so they check the
 * session instead. The tiers that remain guard things /pricing does NOT list:
 * the DaaS feeds, portfolio stress, the automation builder, CSV export of the
 * inventory and the data-scientist chat. That list is pinned below, so opening
 * or closing one is a decision somebody makes on purpose.
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:'"`])\/\/.*$/gm, "$1")

/** Every route.ts under app/api, relative to the repo root. */
function apiRoutes(dir = path.join(ROOT, "app/api"), out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) apiRoutes(full, out)
    else if (entry.name === "route.ts") out.push(path.relative(ROOT, full))
  }
  return out
}

describe("the chat's own actions ask for an account, not a plan", () => {
  const CHAT_ACTIONS = [
    "app/api/watchlists/route.ts",
    "app/api/watchlists/[id]/items/route.ts",
    "app/api/reports/generate/route.ts",
    "app/api/reports/[id]/download/route.ts",
  ]

  it("none of them gates on a tier", () => {
    for (const rel of CHAT_ACTIONS) {
      const src = stripComments(read(rel))
      expect(src, rel).not.toMatch(/hasTierAccess/)
      expect(src, rel).not.toMatch(/Team tier required/)
    }
  })

  it("all of them still require a signed-in account", () => {
    for (const rel of CHAT_ACTIONS) {
      const src = stripComments(read(rel))
      expect(src, rel).toContain("getSyncedUser()")
      expect(src, rel).toMatch(/status: 401|status: 401/)
    }
  })

  it("the chat no longer blames a tier when the call fails", () => {
    const chat = stripComments(read("components/ChatInterface.tsx"))
    expect(chat).not.toMatch(/Team tier may be required/)
    expect(chat).toContain("Could not create shortlist. Sign in and try again.")
  })
})

describe("the tiers that remain guard things the price page does not include", () => {
  /**
   * The complete list, so adding a gate is a decision and not a habit. Each
   * entry is a product the App Store sells or a bulk data export — none of
   * them appears in DISCOVERY_SURFACES on app/pricing/page.tsx.
   */
  const EXPECTED_GATED = [
    "app/api/automation-builder/list/route.ts",
    "app/api/daas/listing-feed/route.ts",
    "app/api/daas/market-analysis/route.ts",
    "app/api/data-scientist/chat/route.ts",
    "app/api/deal-screener/route.ts",
    "app/api/developer-reliability/[name]/route.ts",
    "app/api/evidence-drawer/[name]/route.ts",
    "app/api/export/csv/route.ts",
    "app/api/portfolio-stress/route.ts",
    "app/api/price-reality/[name]/route.ts",
    "app/api/properties/[name]/route.ts",
    "app/api/stress-test/[name]/route.ts",
  ]

  it("is exactly this list", () => {
    const gated = apiRoutes()
      .filter((rel) => /hasTierAccess\(/.test(stripComments(read(rel))))
      .sort()
    expect(gated).toEqual([...EXPECTED_GATED].sort())
  })

  it("and none of them is reached by a screen in this app", () => {
    // A gate the UI walks into is a gate a user meets. These are API-only —
    // which is what makes them a product boundary rather than a broken button.
    const screens = (function walk(dir: string, out: string[] = []): string[] {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          if (full.endsWith(path.join("app", "api"))) continue
          walk(full, out)
        } else if (/\.tsx?$/.test(entry.name)) out.push(full)
      }
      return out
    })(path.join(ROOT, "app")).concat(
      (function walk(dir: string, out: string[] = []): string[] {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name)
          if (entry.isDirectory()) walk(full, out)
          else if (/\.tsx?$/.test(entry.name)) out.push(full)
        }
        return out
      })(path.join(ROOT, "components")),
    )
    const source = screens.map((f) => fs.readFileSync(f, "utf8")).join("\n")

    for (const rel of EXPECTED_GATED) {
      // "app/api/daas/listing-feed/route.ts" → "/api/daas/listing-feed"
      const endpoint = "/" + rel.replace(/^app/, "").replace(/\/route\.ts$/, "").replace(/^\//, "")
      if (endpoint.includes("[")) continue // dynamic segments are built, not written whole
      expect(source.includes(`"${endpoint}"`) || source.includes(`'${endpoint}'`), endpoint).toBe(false)
    }
  })
})

describe("the price page still says what it says", () => {
  const pricing = read("app/pricing/page.tsx")

  it("the account is included and the selling is the store", () => {
    expect(pricing).toContain("THE TERMINAL DOES NOT SELL SUBSCRIPTIONS ANY MORE")
    expect(pricing).toContain("BUSINESS_STORE_URL")
  })

  it("the chat is one of the surfaces it names", () => {
    expect(pricing).toMatch(/Decision Terminal chat/)
  })

  it("and it never calls the included layer by the banned word", () => {
    expect(stripComments(pricing)).not.toMatch(/\bfree\b/i)
  })
})
