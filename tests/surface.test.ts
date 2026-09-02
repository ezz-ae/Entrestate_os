import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { DEEP_LINK_ROUTES, HIDDEN_ROUTES, isHiddenRoute } from "@/lib/surface"

/**
 * THE SURFACE IS DECLARED, NOT INFERRED — locked.
 *
 * 145 page routes ship in this repository and 94 are linked from somewhere in
 * the app. The rest were reachable only by typing the address, and most were not
 * unfinished ideas: /os, /dashboard, /me and /workspace/* are four attempts at
 * one screen. Whoever found one saw a version of Entrestate nobody maintains.
 *
 * Three rules, each answering a way this goes wrong:
 *
 *   1. EVERY ROUTE IS CLASSIFIED. Linked, deep link, or hidden-with-a-reason.
 *      A new page that is none of those fails the build, because a list nobody
 *      is forced to update is a list that silently deletes things — the same
 *      defect as the vendor allowlist and the orphan modules.
 *   2. HIDING NEVER BREAKS A LINK. A route something links to must not be
 *      hidden; that would turn a working button into a 404, which is worse than
 *      the page it was hiding.
 *   3. A DEEP LINK STILL OPENS. Evidence permalinks and the embed live under
 *      paths nothing links to on purpose, and one of them sits under a hidden
 *      parent — /lead-agent is hidden, /lead-agent/embed must not be.
 */

const ROOT = process.cwd()

function pageRoutes(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (e.name === "page.tsx") {
        const rel = path.relative(path.join(ROOT, "app"), dir).replace(/\\/g, "/")
        // Route groups — /(marketing)/demo is served at /demo.
        out.push(("/" + rel).replace(/\/\([^)]*\)/g, "") || "/")
      }
    }
  }
  walk(path.join(ROOT, "app"))
  return [...new Set(out)]
}

/**
 * Trees that belong to a RETIRED surface. Links found inside one of these do
 * not keep a route visible.
 *
 * `seq/` is the creative studio that served /storyboard, /image-playground and
 * /timeline. Those three were retired from the claim set on 2026-08-31 in
 * favour of the workspace studio, and hidden in lib/surface.ts. Its components
 * still link to one another — a sidebar, a landing page, a creation library —
 * which is correct for a subtree nobody can reach any more, and is not a
 * product link keeping a live page alive. Counting them would mean a retired
 * surface could never be retired, because it always cites itself.
 *
 * This is deliberately a LIST OF TREES, not a list of routes: it stays honest
 * only while every directory in it is genuinely unreachable. Remove a tree
 * from here the moment any of its routes goes back on the product.
 */
const RETIRED_TREES = ["seq"]

/** Every path the LIVE app links to, from any href / push / nav config. */
function linkedPaths(): Set<string> {
  const out = new Set<string>()
  const PAT = /(?:href|path|to|url|push|replace|redirect)\s*[=:(]\s*[`'"](\/[a-zA-Z0-9/[\]._-]*)/g
  const walk = (dir: string) => {
    let entries: fs.Dirent[]
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      if (e.name === "node_modules" || e.name === ".next" || e.name.startsWith(".")) continue
      const full = path.join(dir, e.name)
      if (e.isDirectory()) walk(full)
      else if (/\.(ts|tsx)$/.test(e.name)) {
        const src = fs.readFileSync(full, "utf8")
        for (const m of src.matchAll(PAT)) out.add(m[1].replace(/\/+$/, "") || "/")
      }
    }
  }
  for (const d of ["app", "components", "lib", "seq", "agent-builder", "automation-builder", "ai-data-scientist"]) {
    if (RETIRED_TREES.includes(d)) continue
    walk(path.join(ROOT, d))
  }
  return out
}

const routes = pageRoutes()
const linked = linkedPaths()

const isLinked = (r: string) => {
  if (linked.has(r)) return true
  const base = r.split("/[")[0]
  return base !== r && linked.has(base)
}
const isDeepLink = (r: string) =>
  Object.keys(DEEP_LINK_ROUTES).some((d) => r === d || r.startsWith(`${d}/`))
const isHiddenListed = (r: string) =>
  Object.keys(HIDDEN_ROUTES).some((h) => r === h || r.startsWith(`${h}/`))

describe("the product surface", () => {
  it("has routes to classify", () => {
    expect(routes.length).toBeGreaterThan(100)
  })

  it("classifies every page route", () => {
    const unclassified = routes.filter((r) => !isLinked(r) && !isDeepLink(r) && !isHiddenListed(r))
    expect(
      unclassified,
      "link it from the app, or add it to DEEP_LINK_ROUTES or HIDDEN_ROUTES in lib/surface.ts WITH the reason",
    ).toEqual([])
  })

  it("never hides a page something links to", () => {
    // Hiding a linked route turns a working button into a 404 — worse than the
    // page it was hiding.
    const broken = Object.keys(HIDDEN_ROUTES).filter((h) => linked.has(h))
    expect(broken, "these are linked from the app and must not be hidden").toEqual([])
  })

  it("states a reason for every hidden and deep-link route", () => {
    for (const [route, why] of [...Object.entries(HIDDEN_ROUTES), ...Object.entries(DEEP_LINK_ROUTES)]) {
      expect(why.trim().length, `${route} has no reason`).toBeGreaterThan(15)
    }
  })

  it("lists no route that does not exist", () => {
    const known = new Set(routes)
    const stale = [...Object.keys(HIDDEN_ROUTES), ...Object.keys(DEEP_LINK_ROUTES)]
      .filter((r) => r !== "/404" && !known.has(r) && !routes.some((k) => k.startsWith(`${r}/`)))
    expect(stale, "a reason with no page under it").toEqual([])
  })
})

describe("hiding behaves", () => {
  it("hides a listed route and its children", () => {
    expect(isHiddenRoute("/os")).toBe(true)
    expect(isHiddenRoute("/workspace/search")).toBe(true)
    expect(isHiddenRoute("/workspace/search/anything")).toBe(true)
  })

  it("leaves the product alone", () => {
    for (const r of ["/", "/markets", "/areas", "/developers", "/pricing", "/chat", "/top-data"]) {
      expect(isHiddenRoute(r), r).toBe(false)
    }
  })

  it("still opens a deep link under a hidden parent", () => {
    // /lead-agent is hidden; the widget customers embed is not.
    expect(isHiddenRoute("/lead-agent")).toBe(true)
    expect(isHiddenRoute("/lead-agent/embed")).toBe(false)
    expect(isHiddenRoute("/evidence/some-project")).toBe(false)
  })

  it("ignores a trailing slash", () => {
    expect(isHiddenRoute("/os/")).toBe(true)
  })
})

describe("the proxy asks before it rewrites", () => {
  const proxy = fs.readFileSync(path.join(ROOT, "proxy.ts"), "utf8")

  it("checks the surface", () => {
    expect(proxy).toMatch(/isHiddenRoute\(internalPathname\)/)
  })

  it("checks it on the locale-stripped path, so /en/os and /os are one decision", () => {
    const at = proxy.indexOf("isHiddenRoute(internalPathname)")
    const stripAt = proxy.indexOf("const internalPathname")
    expect(stripAt).toBeGreaterThan(-1)
    expect(at).toBeGreaterThan(stripAt)
  })

  it("checks it before every rewrite, so nothing slips through one branch", () => {
    const at = proxy.indexOf("isHiddenRoute(internalPathname)")
    const firstRewrite = proxy.indexOf("NextResponse.rewrite")
    expect(at).toBeLessThan(firstRewrite)
  })

  it("answers 404, not a blank 200", () => {
    // Rewritten to a path with no route so Next renders its own not-found page
    // with a real 404 status — a hidden page must look missing to a crawler.
    expect(proxy).toMatch(/isHiddenRoute[\s\S]{0,400}pathname = "\/_hidden"/)
  })
})
