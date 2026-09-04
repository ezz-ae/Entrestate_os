import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { ACCOUNT_HOME_COPY, ACCOUNT_HOME_DOOR_IDS, ACCOUNT_HOME_INSIDER_WORDS } from "@/lib/me/account-home-copy"

/**
 * THE ACCOUNT HOME GREETS A STRANGER IN THEIR OWN WORDS.
 *
 * The owner, on the old /me: an empty side rail, a second menu under the
 * header, and copy that told someone who does not know what Entrestate is
 * about "the Terminal" and "the Business" as if they lived with us.
 *
 * The page is now one question, one composer, seven doors and two panels —
 * the same composition as the workspace home on the platform — and these
 * tests keep the words honest: no insider name anywhere on it, the doors in
 * their order and kinds, the market numbers with their basis, the tab row
 * off the home, and the starter that is clicked being the sentence that is
 * asked.
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:'"`])\/\/.*$/gm, "$1")

function allStrings(v: unknown, out: string[] = []): string[] {
  if (typeof v === "string") out.push(v)
  else if (Array.isArray(v)) v.forEach((x) => allStrings(x, out))
  else if (v && typeof v === "object") Object.values(v).forEach((x) => allStrings(x, out))
  return out
}

describe("no insider word reaches the account home", () => {
  it("the copy object is clean against its own banned list", () => {
    const offenders = allStrings(ACCOUNT_HOME_COPY).filter((s) => ACCOUNT_HOME_INSIDER_WORDS.some((re) => re.test(s)))
    expect(offenders).toEqual([])
  })

  it("the banned list covers the words the owner named, and the standing ban", () => {
    const list = ACCOUNT_HOME_INSIDER_WORDS.map((re) => re.source)
    for (const w of ["terminal", "business account", "app store", "discovery member", "read surface", "paid layer", "free"]) {
      expect(list.some((s) => s.includes(w.replace(" ", " ")))).toBe(true)
    }
  })

  it("the page and the component carry no insider word in their own literals", () => {
    for (const rel of ["app/me/page.tsx", "components/me/account-home.tsx"]) {
      // Code tokens (`tier === "free"`) are the plan's key, not a word on the
      // page. Everything else must pass the list.
      const src = stripComments(read(rel)).replaceAll('"free"', '"__tier__"')
      const literals = [...src.matchAll(/"([^"\n]{3,})"|'([^'\n]{3,})'|>([^<>{}\n]{3,})</g)].map((m) => m[1] ?? m[2] ?? m[3])
      const offenders = literals.filter((s) => ACCOUNT_HOME_INSIDER_WORDS.some((re) => re.test(s)))
      expect(offenders, rel).toEqual([])
    }
  })

  it("the upgrade nudge in the bundle no longer says the banned word", () => {
    const src = stripComments(read("lib/me/personal-home.ts"))
    const nudge = src.split("const upgradeNudge")[1]?.split("\n  return {")[0] ?? ""
    expect(/\bfree\b/i.test(nudge.replaceAll('"free"', '"__tier__"'))).toBe(false)
  })
})

describe("seven doors, in order, of the right kinds", () => {
  it("the doors are market · areas · developers · projects · alerts · apps · workspace", () => {
    expect(ACCOUNT_HOME_DOOR_IDS).toEqual(["market", "areas", "developers", "projects", "alerts", "apps", "workspace"])
  })

  it("the four asking doors have three starters each, with a title and a sub", () => {
    for (const id of ["market", "areas", "developers", "projects"] as const) {
      const s = ACCOUNT_HOME_COPY.doors[id].s
      expect(s).toHaveLength(3)
      for (const x of s) {
        expect(x.t.trim().length).toBeGreaterThan(8)
        expect(x.s.trim().length).toBeGreaterThan(8)
      }
    }
  })

  it("the component wires the asking doors as asks and the place doors as links", () => {
    const src = stripComments(read("components/me/account-home.tsx"))
    expect(src).toContain('starters: asks("market")')
    expect(src).toContain('starters: asks("areas")')
    expect(src).toContain('starters: asks("developers")')
    expect(src).toContain('starters: asks("projects")')
    // alerts → places (areas, projects, the alerts feed or plans)
    expect(src).toMatch(/id: "alerts"[\s\S]{0,400}kind: "href", href: L\("\/areas"\)/)
    expect(src).toMatch(/kind: "href", href: alertsHome/)
    // apps → the store, real products first
    expect(src).toMatch(/liveProducts\.map<Starter>/)
    // workspace → open it, or create it, and always the complete system
    expect(src).toContain("w.enterUrl")
    expect(src).toContain("yours.accountUrl")
    expect(src).toContain('const FULL_SYSTEM_URL = "https://entrestate.com/business"')
  })

  it("a clicked ask sends its own title to the one chat — nothing hidden", () => {
    const src = stripComments(read("components/me/account-home.tsx"))
    expect(src).toMatch(/if \(s\.kind === "ask"\) \{ ask\(s\.t\); return \}/)
    expect(src).toContain("openSidebar()")
    expect(src).toContain("void sendMessage({ text: message })")
  })

  it("one sheet at a time, closed by Escape and outside click; accessible", () => {
    const src = stripComments(read("components/me/account-home.tsx"))
    expect(src).toContain('e.key === "Escape"')
    expect(src).toContain("!rootRef.current.contains(e.target as Node)")
    expect(src).toContain("aria-expanded={active}")
    expect(src).toContain('role="dialog"')
  })
})

describe("the two panels say what they stand on", () => {
  it("the market panel carries a basis line and the DLD coverage date", () => {
    const page = stripComments(read("app/me/page.tsx"))
    expect(page).toContain('import { coverageLabel } from "@/lib/platform-metrics"')
    expect(page).toMatch(/coverage: coverageLabel\(metrics\?\.coverageThrough \?\? null, locale === "ar"\)/)
    const comp = stripComments(read("components/me/account-home.tsx"))
    expect(comp).toContain("{C.pulseBasis}")
    expect(comp).toMatch(/pulse\.coverage \? <> · \{pulse\.coverage\}<\/> : null/)
    expect(ACCOUNT_HOME_COPY.pulseBasis.length).toBeGreaterThan(10)
  })

  it("a missing number renders as a dash, never as a fabricated figure", () => {
    const page = stripComments(read("app/me/page.tsx"))
    expect((page.match(/: "—"/g) ?? []).length).toBeGreaterThanOrEqual(3)
    expect(page).toContain('fallback: "—"')
  })

  it("'Yours' has an honest empty state and no demo row", () => {
    const comp = stripComments(read("components/me/account-home.tsx"))
    expect(comp).toContain("{C.yoursEmpty}")
    expect(comp).not.toMatch(/sample|demo|placeholder rows?/i)
  })
})

describe("the home is not a menu twice", () => {
  it("the tab row is off the home and on the pages behind the doors", () => {
    const nav = stripComments(read("components/me/me-nav.tsx"))
    expect(nav).toMatch(/if \(pathname === prefixLocalePath\("\/me", locale\) \|\| pathname === "\/me"\) return null/)
  })

  it("the page greets by first name", () => {
    const page = stripComments(read("app/me/page.tsx"))
    expect(page).toMatch(/const firstName = \(bundle\.user\.name \?\? ""\)\.trim\(\)\.split\(\/\\s\+\/\)\[0\]/)
    expect(ACCOUNT_HOME_COPY.title).toContain("{name}")
  })
})
