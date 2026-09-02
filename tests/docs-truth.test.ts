import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * THE DOCS PAGES TELL THE TRUTH ABOUT THE STACK THAT SHIPS.
 *
 * The 2026-09-01 sweep found the public docs still describing a retired
 * stack: Clerk as the auth layer (it is Neon Auth on the shared
 * .entrestate.com session) and a "Free tier" (the owner's word ban —
 * بلاش نستخدم فري — and the ruling that the entry tier is called
 * Discovery). These pins keep the sweep swept: a page that reintroduces
 * either claim fails the suite, not a future reader's trust.
 *
 * The entitlement token "free" in code comparisons (bundle.tier ===
 * "free") is NOT banned — it is a database value, never rendered; the
 * rendering must map it (Discovery), and the /me page does.
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(e.name) ? [p] : []
  })

describe("no page still names the retired stack", () => {
  const pages = ["app", "lib", "components"].flatMap((d) =>
    fs.existsSync(path.join(ROOT, d)) ? walk(path.join(ROOT, d)) : [],
  )
  it("Clerk is gone everywhere — the auth layer is Neon Auth", () => {
    const offenders = pages.filter((p) => /\bclerk\b/i.test(fs.readFileSync(p, "utf8")))
    expect(offenders).toEqual([])
  })
  it('no rendered "Free tier" survives — the entry tier is Discovery', () => {
    // The tier TOKEN "free" in comparisons is allowed; the phrase is not.
    const offenders = pages.filter((p) => /\bfree[ -]?tier\b/i.test(fs.readFileSync(p, "utf8")))
    expect(offenders).toEqual([])
  })
})

describe("the swept pages say what actually ships", () => {
  it("the status page reports Neon Auth, in both languages of its copy", () => {
    const status = read("app/status/page.tsx")
    expect(status).toContain("Neon Auth")
    expect(status).not.toMatch(/\bclerk\b/i)
  })
  it("the deployment-architecture doc names Neon Auth on the shared session", () => {
    const doc = read("app/docs/deployment-architecture/page.tsx")
    expect(doc).toContain("Neon Auth")
    expect(doc).toContain(".entrestate.com")
  })
  it("investor relations calls the entry tier Discovery", () => {
    expect(read("app/docs/investors-relations/page.tsx")).toContain('"Discovery"')
  })
  it("partners doc: attribution is locked on discovery accounts, not a 'free tier'", () => {
    expect(read("app/docs/partners-apis/page.tsx")).toMatch(/[Dd]iscovery accounts/)
  })
})
