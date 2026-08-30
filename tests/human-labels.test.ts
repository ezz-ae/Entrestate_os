import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { timingSignalLabel, confidenceLabel } from "@/lib/format/verdicts"

/**
 * THE SITE-WIDE AUDIT'S PINS: no raw enum on a screen, no dead visit path.
 *
 * A live sweep of terminal.entrestate.com found the owner's exact complaint
 * shipping on seven public surfaces at once:
 *
 *   · The HOMEPAGE trust bar and stat cards said "BUY/STRONG_BUY timing" and
 *     "refreshed each ETL pass" — the enum and the pipeline, on the front door.
 *   · /areas, /properties, /search printed "API sync · api.areas_v1 · …";
 *     /search and /map offered "Current source: api.search_index" boxes.
 *   · Property detail rows read "Verdict: STRONG_BUY".
 *   · Pricing's free tier read "AED 0" — a robot's spelling of FREE.
 *   · EVERY ONE of the 166 area cards on /areas linked to "Area not found",
 *     because buildComparableSql ran its character-class strip BEFORE LOWER —
 *     '[^a-z0-9]' removes CAPITALS, so "Jumeirah Village Circle" compared as
 *     "umeirahillageircle" and no area could ever match its own slug.
 *   · /apps "Learn more" links used doc keys that don't exist, and the doc
 *     pages' CTAs pointed at /apps routes that don't exist.
 *
 * The Arabic surfaces had human labels all along (SIGNAL_LABELS_AR); English
 * fell through to the raw token. lib/format/verdicts.ts is now the one
 * spelling of the vocabulary, and this file keeps every fixed surface fixed.
 */

const ROOT = process.cwd()
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8")
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

describe("the comparable expression lowercases BEFORE it strips", () => {
  const src = stripComments(read("lib/decision-infrastructure.ts"))

  it("uses the fixed argument order", () => {
    expect(src).toContain("REGEXP_REPLACE(LOWER(COALESCE(")
  })

  it("never regresses to strip-then-lower", () => {
    // The broken order destroyed every capital letter: "Jumeirah Village
    // Circle" → "umeirahillageircle". All 166 area pages 404'd on it.
    expect(src).not.toContain("LOWER(REGEXP_REPLACE(COALESCE(")
  })
})

describe("verdict codes never render as text", () => {
  it("translates the vocabulary in both languages", () => {
    expect(timingSignalLabel("STRONG_BUY", "en")).toBe("Strong buy")
    expect(timingSignalLabel("STRONG_BUY", "ar")).toBe("شراء قوي")
    expect(timingSignalLabel("AVOID", "en")).toBe("Avoid")
    expect(confidenceLabel("HIGH", "ar")).toBe("ثقة عالية")
  })

  it("de-snakes even a code it has never seen", () => {
    expect(timingSignalLabel("SOME_NEW_CODE", "en")).toBe("Some new code")
    expect(timingSignalLabel(null, "en")).toBe("Unrated")
  })

  it("keeps the raw token out of the label surfaces", () => {
    for (const file of [
      "components/homepage/hero-section.tsx",
      "components/mobile/mobile-home-page.tsx",
      "app/page.tsx",
      "components/platform/terminal-prompt-teaser.tsx",
    ]) {
      expect(stripComments(read(file)), `${file} still prints the enum`).not.toContain("STRONG_BUY")
    }
    expect(stripComments(read("lib/policy-copy.ts"))).not.toContain("STRONG_BUY / BUY")
  })

  it("routes the badge components through the shared labels", () => {
    for (const file of [
      "components/decision/badges.tsx",
      "components/platform/verdict-card.tsx",
      "components/me/verdict-pill.tsx",
      "app/properties/[slug]/page.tsx",
      "components/top-data/top-data-section.tsx",
    ]) {
      expect(read(file), `${file} must import the shared verdict labels`).toContain("@/lib/format/verdicts")
    }
  })
})

describe("data chips speak human, not schema", () => {
  it("says when, not which view", () => {
    for (const file of ["app/areas/page.tsx", "app/properties/page.tsx", "app/search/page.tsx"]) {
      const src = stripComments(read(file))
      expect(src, `${file} still prints "API sync"`).not.toContain("API sync")
      expect(src, `${file} still prints "مزامنة API"`).not.toContain("مزامنة API")
    }
  })

  it("never renders the sourceView field itself", () => {
    // sourceView stays in state (isFallbackSource compares it); what is
    // banned is printing it — {syncMeta?.sourceView} was the leak.
    for (const file of ["app/search/page.tsx", "app/map/page.tsx"]) {
      const src = stripComments(read(file))
      expect(src, `${file} renders the raw view name again`).not.toMatch(/\{(?:syncMeta|meta)\?\.sourceView/)
    }
  })

  it("keeps ETL out of the footer and the industry stats", () => {
    expect(stripComments(read("components/footer.tsx"))).not.toContain("ETL")
    expect(stripComments(read("app/docs/industry/page.tsx"))).not.toContain("ETL")
  })
})

describe("the free tier says Free", () => {
  it("renders 0 as a word in both languages", () => {
    const src = read("app/pricing/page.tsx")
    expect(src).toContain('value === 0')
    expect(src).toContain('"Free"')
    expect(src).toContain('"مجاناً"')
  })
})

describe("every apps link lands", () => {
  it("the listing's Learn-more slugs exist in the docs map", () => {
    const listing = read("app/apps/page.tsx")
    const docs = read("app/apps/docs/[slug]/page.tsx")
    const slugs = [...listing.matchAll(/\/apps\/docs\/([a-z0-9-]+)/g)].map((m) => m[1])
    expect(slugs.length).toBeGreaterThanOrEqual(4)
    for (const slug of slugs) {
      expect(docs, `docs map is missing "${slug}" — the Learn-more link lands on Guide-not-found`).toContain(`"${slug}"`)
    }
  })

  it("the docs CTAs point at routes that exist", () => {
    const docs = read("app/apps/docs/[slug]/page.tsx")
    const hrefs = [...docs.matchAll(/href: "(\/[^"]+)"/g)].map((m) => m[1])
    for (const href of hrefs) {
      const clean = href.replace(/^\//, "").replace(/\?.*$/, "")
      const candidates = [
        path.join(ROOT, "app", clean, "page.tsx"),
        path.join(ROOT, "app", "(marketing)", clean, "page.tsx"),
      ]
      expect(
        candidates.some((c) => fs.existsSync(c)),
        `${href} has no page — a CTA that 404s`,
      ).toBe(true)
    }
  })
})
