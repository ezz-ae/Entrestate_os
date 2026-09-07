import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * THE TERMINAL IS READ ON A PHONE — locked.
 *
 * The owner opened terminal.entrestate.com on his phone and sent the frame:
 * the account card's button showing "Vie", a module description ending
 * mid-word with no ellipsis, the bottom tab bar's last item reading "Clo".
 * Everything cut at the same right edge — the signature of a panel wider than
 * the screen rather than of text that truncates.
 *
 * Three rules, each pinned below.
 *
 *   1. THE MOBILE DRAWER IS MEASURED BY THE SCREEN. It was `w-screen`, which
 *      is `width: 100vw` — the LAYOUT viewport, which on a phone is not
 *      always what the reader can see. `w-full` inside a container pinned
 *      `inset-x-0` is whatever the browser says the width is, which is the
 *      only number that cannot be wrong.
 *   2. NOTHING IS SET BELOW 10px. Eighteen places were at 7–9px, fifteen of
 *      them on /overview — the Decision Terminal, the page a judge opens
 *      first — where the layer pills and every module tag were 9px.
 *   3. THE BOTTOM OF A PHONE BELONGS TO THE THUMB. The cookie banner was
 *      `fixed bottom-4 z-[100]`, landing on the chat composer and above any
 *      bottom tab bar. On a phone it now sits at the top; from `sm` up it
 *      keeps the familiar bottom card, clear of the home indicator.
 *
 * Verified against the production build at a 390px viewport: all 129 page
 * routes report document.scrollWidth === clientWidth.
 *
 * Pure — no network, no database.
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:'"`])\/\/.*$/gm, "$1")

/** Every .tsx under app/ and components/, excluding the vendored sub-projects. */
function surfaces(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name.endsWith(".tsx")) out.push(path.relative(ROOT, full))
    }
  }
  walk(path.join(ROOT, "app"))
  walk(path.join(ROOT, "components"))
  return out
}

describe("1. the drawer is measured by the screen", () => {
  const sidebar = stripComments(read("components/llm-search/sidebar.tsx"))

  it("the panel is w-full on a phone and a fixed rail from md up", () => {
    expect(sidebar).toContain('"w-full md:w-[420px]"')
    expect(sidebar).not.toMatch(/w-screen/)
  })

  it("…inside a container pinned to both edges, so w-full is the viewport", () => {
    expect(sidebar).toMatch(/fixed inset-x-0 inset-y-0 z-\[60\][^`"]*md:hidden/)
  })

  it("…and nothing inside it can push it wider", () => {
    expect(sidebar).toMatch(/inset-x-0 inset-y-0[^`"]*overflow-x-hidden/)
  })

  it("the slide still comes from the transform, in both directions", () => {
    expect(sidebar).toContain("-translate-x-full rtl:translate-x-full")
  })
})

describe("2. nothing on a surface is set below 10px", () => {
  it("no app or component file carries a 7, 8 or 9px size", () => {
    const offenders: string[] = []
    for (const rel of surfaces()) {
      const hits = read(rel).match(/text-\[[789](?:\.\d+)?px\]/g)
      if (hits) offenders.push(`${rel} (${hits.length})`)
    }
    expect(offenders).toEqual([])
  })

  it("the Decision Terminal's own labels sit at the 10px floor, and its sentences above it", () => {
    const overview = read("app/overview/page.tsx")
    // The layer pills and the module tags are labels: 10px is their floor.
    expect(overview).toMatch(/text-\[10px\] font-bold text-blue-700/)
    // These four read as prose and were set at the label size.
    expect(overview).toContain('<span className="text-[11px] text-muted-foreground">{t.desc}</span>')
    expect(overview).toMatch(/mt-0\.5 truncate text-\[11px\] text-muted-foreground/)
  })
})

describe("3. the bottom of a phone belongs to the thumb", () => {
  const banner = stripComments(read("components/CookieConsent.tsx"))

  it("the cookie notice is at the top on a phone", () => {
    expect(banner).toMatch(/fixed inset-x-3 top-3 z-\[100\]/)
  })

  it("…and returns to the bottom card from sm up, clear of the home indicator", () => {
    expect(banner).toContain("sm:top-auto")
    expect(banner).toContain("sm:bottom-[max(1rem,env(safe-area-inset-bottom))]")
  })

  it("it never sits at a bare bottom-4 again — that is the composer's place", () => {
    expect(banner).not.toMatch(/fixed[^"]*\bbottom-4\b/)
  })
})
