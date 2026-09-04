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
  // Superseded 2026-09-04: /me is now app/me/page.tsx (gathers) +
  // components/me/account-home.tsx (renders). The account facts still come
  // from one relayed read and are rendered, never kept — the assertions below
  // follow them to where they now live.
  const home = stripComments(read("components/me/account-home.tsx"))
  it("shows the account facts only when the summary answered", () => {
    expect(me).toContain("getBusinessAccountSummary().catch(() => null)")
    expect(me).toContain("account?.wallet ? { balanceAed: account.wallet.balanceAed } : null")
    expect(me).toContain("account?.apps.map(")
    expect(home).toContain("yours.wallet &&")
    expect(home).toContain("yours.apps.length > 0 &&")
  })
  it("a held or pending amount never renders as balance", () => {
    // Only balanceAed crosses into the page; held and pending stay on the account page.
    expect(me).not.toContain("heldAed")
    expect(me).not.toContain("pendingTopUps")
  })
  it("the store cards land on the install flow — the same account, no second identity", () => {
    expect(home).toContain("/start?app=${p.id}")
    expect(home).not.toContain("storeUrl}#${")
    expect(home).toContain("liveProducts.map<Starter>")
  })
  it("the new copy keeps the word bans", () => {
    // Rendered strings only — the tier token stays a code comparison. The
    // whole home is one surface now; tests/account-home.test.ts holds the
    // full insider-word list, this keeps the two standing bans.
    const rendered = (me + home).replaceAll('"free"', '"__tier__"')
    expect(rendered).not.toMatch(/\bfree\b/i)
    expect(rendered).not.toContain("مجان")
    expect(rendered).not.toMatch(/[Ff]reehold/)
  })
})

describe("the workspace door is offered, and only the door the business handed over", () => {
  const mod = stripComments(read("lib/business-account.ts"))
  const me = stripComments(read("app/me/page.tsx"))

  it("reads the workspaces the business decided this identity owns", () => {
    expect(mod).toContain("data.workspaces")
    expect(mod).toContain("canCreateWorkspace: data.canCreateWorkspace === true")
  })

  it("drops any workspace row whose enter link is not on entrestate.com", () => {
    // The summary is fetched server-side over HTTPS from a fixed origin, but the
    // rendered link is the one thing on /me that opens a workspace as its owner.
    // A row with a foreign or missing enterUrl is not rendered as a dead or
    // wrong link — it is not rendered at all.
    expect(mod).toContain('enterUrl.startsWith("https://entrestate.com/")')
    expect(mod).toMatch(/if \(!subdomain \|\| !company \|\| !url \|\| !enterUrl\.startsWith/)
  })

  it("/me offers the door when there is one, and the creation only when the business says it can complete", () => {
    const home = stripComments(read("components/me/account-home.tsx"))
    expect(home).toContain("yours.workspaces.length > 0")
    expect(home).toContain("href: w.enterUrl")
    expect(me).toContain("canCreateWorkspace: account?.canCreateWorkspace ?? false")
    // Creation happens on the business side, where the identity is verified.
    expect(home).toMatch(/yours\.canCreateWorkspace && yours\.accountUrl[\s\S]{0,300}href: yours\.accountUrl/)
  })

  it("the Terminal never mints, signs or stores anything about the workspace itself", () => {
    expect(mod).not.toMatch(/signSession|fh_session|claim\?token/)
    expect(me).not.toMatch(/signSession|fh_session|claim\?token/)
  })
})
