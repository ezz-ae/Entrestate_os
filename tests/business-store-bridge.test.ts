import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { getSharedAuthCookieDomain } from "@/lib/auth/cookie-domain"

/**
 * ONE ACCOUNT, AND THE STORE VISIBLE INSIDE IT — locked.
 *
 * The owner's account model: the Terminal account is THE account (search and
 * data free), and selling happens through the business's App Store. Three
 * commitments carry it:
 *
 *   1. The session cookie must be readable across the whole site — a cookie
 *      scoped to .terminal.entrestate.com is an account the business can
 *      never recognise.
 *   2. The catalog is FETCHED from the business, never copied here. A copy
 *      already swallowed a price guard once in the sibling repository.
 *   3. If the business is unreachable, /me renders NO store section — never
 *      a stale or invented one.
 */

const ROOT = process.cwd()
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8")

describe("the session belongs to the whole site", () => {
  it("scopes the terminal's cookie to .entrestate.com", () => {
    expect(getSharedAuthCookieDomain("terminal.entrestate.com")).toBe(".entrestate.com")
    expect(getSharedAuthCookieDomain("m.entrestate.com")).toBe(".entrestate.com")
    expect(getSharedAuthCookieDomain("entrestate.com")).toBe(".entrestate.com")
  })

  it("still refuses local and bare hosts", () => {
    expect(getSharedAuthCookieDomain("localhost")).toBeUndefined()
    expect(getSharedAuthCookieDomain("127.0.0.1")).toBeUndefined()
  })
})

describe("the store is served, never copied", () => {
  it("fetches the catalog from the business origin", () => {
    const src = read("lib/business-store.ts")
    expect(src).toContain("/api/store/catalog")
    expect(src).toContain("https://entrestate.com")
  })

  it("never speaks the client's name", () => {
    // Freehold is a CLIENT of Entrestate — his workspace, sessions, data,
    // ads and leads run untouched. Nothing the Terminal renders may carry
    // his name or point into his signed-in workspace.
    for (const file of ["lib/business-store.ts", "app/me/page.tsx"]) {
      expect(read(file).toLowerCase(), `${file} mentions the client`).not.toContain("freehold")
    }
  })

  it("keeps no product catalog of its own", () => {
    // The one product-shaped literal allowed here is the TYPE — no STORE
    // array, no hardcoded product ids from the business.
    const src = read("lib/business-store.ts").replace(/\/\*[\s\S]*?\*\//g, "")
    expect(src).not.toContain("meta-for-realtors")
    expect(src).not.toMatch(/const STORE/)
  })

  it("renders nothing when the business is unreachable", () => {
    const me = read("app/me/page.tsx")
    expect(me).toContain("businessStore ?")
    expect(me).toContain(": null}")
    const src = read("lib/business-store.ts")
    expect(src).toContain("return null")
  })

  it("/me shows the store from the fetched catalog", () => {
    const me = read("app/me/page.tsx")
    expect(me).toContain('from "@/lib/business-store"')
    expect(me).toContain("businessStore.products.map")
    expect(me).toContain("businessStore.storeUrl")
  })
})
