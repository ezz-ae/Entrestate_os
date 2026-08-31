import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * PHASE 5 ON THE TERMINAL — the business account is RENDERED here, never
 * kept here.
 *
 * The rule these pins hold: the Terminal re-points at the account the
 * business keeps. One server-side GET of /api/account/summary with the
 * shared session cookie relayed; fail-soft on every path (signed out,
 * unreachable, slow, malformed → null → /me renders without the card);
 * no account fact invented on this side — a balance is a display string
 * the business's ledger produced. And phase 2's promise lands: the /me
 * store cards deep-link straight into the install flow, so a click that
 * starts on the Terminal ends on the same account.
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

describe("the re-pointing is one relayed read, fail-soft everywhere", () => {
  const mod = stripComments(read("lib/business-account.ts"))
  it("fetches the business's summary with the shared cookie relayed", () => {
    expect(mod).toContain("/api/account/summary")
    expect(mod).toContain("cookie: cookieHeader")
    expect(mod).toContain('cache: "no-store"')
    expect(mod).toContain("AbortSignal.timeout(")
  })
  it("returns null rather than inventing an account fact", () => {
    expect(mod).toContain("if (!cookieHeader) return null")
    expect(mod).toContain("if (!res.ok) return null")
    expect(mod).toMatch(/catch\s*\{\s*return null/)
    // The balance is the ledger's display string, accepted only as a string.
    expect(mod).toContain('typeof wallet.balanceAed === "string"')
  })
  it("is server-only and rides the same origin config as the store", () => {
    expect(mod.includes('import "server-only"') || read("lib/business-account.ts").includes('import "server-only"')).toBe(true)
    expect(mod).toContain("getBusinessOrigin()")
  })
})

describe("/me renders the account and deep-links the install flow", () => {
  const me = stripComments(read("app/me/page.tsx"))
  it("shows the card only when the summary answered", () => {
    expect(me).toContain("getBusinessAccountSummary()")
    expect(me).toContain("{businessAccount ? (")
    expect(me).toContain("Ads Coin wallet")
    expect(me).toContain("businessAccount.wallet.balanceAed")
  })
  it("a pending top-up renders as waiting, never as balance", () => {
    expect(me).toContain("waiting for the team")
  })
  it("the store cards land on the install flow — the same account, no second identity", () => {
    expect(me).toContain("/start?app=${product.id}")
    expect(me).not.toContain("storeUrl}#${product.id}")
    expect(me).toContain("Add to your account")
  })
  it("the new copy keeps the word bans", () => {
    // Rendered strings only — the tier token stays a code comparison.
    const rendered = me.replaceAll('"free"', '"__tier__"')
    const section = rendered.slice(rendered.indexOf("Your business account"), rendered.indexOf("Entrestate App Store"))
    expect(section).not.toMatch(/\bfree\b/i)
    expect(section).not.toContain("مجان")
    expect(section).not.toMatch(/[Ff]reehold/)
  })
})
