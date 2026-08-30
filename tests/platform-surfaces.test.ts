import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

function read(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8")
}

describe("platform score surfaces", () => {
  it("keeps core-surface routing on the homepage", () => {
    const home = read("app/page.tsx")
    expect(home).toContain('href: "/chat"')
    expect(home).toContain('href: "/search"')
    expect(home).toContain('href: "/map"')
    expect(home).toContain('href: "/pricing"')
    expect(home).toContain('href: "/status"')
    expect(home).toContain('href: "/docs/documentation"')
  })

  it("prices nothing — the free story, and the one store that sells", () => {
    // THE MODEL CHANGED BY THE OWNER'S WORD: "الأدوات اللي في الأكاونت
    // والباكيدجات احنا مخلّيين ده فري تماماً" — the Terminal account and its
    // packages are completely free, and selling happens in exactly one place,
    // the business's App Store. This block used to pin the tier grid
    // (offerCatalogSchema, "What changes across tiers?", pricingPlans.free);
    // those assertions guarded the OLD commercial layer, so they retired with
    // it. What must now stay true on /pricing:
    const pricingPage = read("app/pricing/page.tsx")
    const pricingLayout = read("app/pricing/layout.tsx")
    const schema = read("lib/seo/schema.ts")

    // 1. It answers honestly and structurally (FAQ schema still reaches the page).
    expect(pricingPage).toMatch(/faqSchema\(/)
    expect(schema).toContain('"@type": "FAQPage"')
    expect(pricingPage).toMatch(/<JsonLd data=\{jsonLdFaq\}/)

    // 2. It SELLS NOTHING: no offer catalog, no checkout door, no AED amount.
    //    Comments stripped first — the page's own header NARRATES the retired
    //    /checkout model, and a guard that reads comments arrests the historian.
    const pricingCode = pricingPage.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
    expect(pricingCode).not.toMatch(/offerCatalogSchema/)
    expect(pricingCode).not.toContain("/checkout")
    expect(pricingCode).not.toMatch(/AED\s*\d/)

    // 3. It names what the account gives (never "free" — the owner's word ban,
    //    pinned in tests/human-labels.test.ts) and points buying intent at the
    //    ONE store.
    expect(pricingCode.toLowerCase()).toContain("discovery")
    expect(pricingPage).toContain("entrestate.com/business/store")

    // 4. The dormant money path stays guarded elsewhere, not re-linked here:
    //    lib/pricing/plans.ts and the Tap literals remain pinned by
    //    tests/pricing-money.test.ts even while nothing links to them.
    expect(pricingLayout).toContain("generateMetadata")
  })

  it("keeps search and map discoverable in SEO surfaces", () => {
    const searchLayout = read("app/search/layout.tsx")
    const mapLayout = read("app/map/layout.tsx")
    const sitemap = read("app/sitemap.ts")
    const searchPage = read("app/search/page.tsx")
    const builder = read("components/search/time-table-builder.tsx")

    expect(searchLayout).toContain("generateMetadata")
    expect(mapLayout).toContain("generateMetadata")
    expect(sitemap).toContain('"/chat"')
    expect(sitemap).toContain('"/map"')
    expect(searchPage).toContain("SearchTimeTableBuilder")
    expect(builder).toContain("/api/time-table/preview")
    expect(builder).toContain("AnalystView")
  })

  it("keeps public trust and compliance pathways visible", () => {
    const home = read("app/page.tsx")
    const statusPage = read("app/status/page.tsx")

    expect(home).toContain("Public proof")
    expect(statusPage).toContain("Governance and reliance")
    expect(statusPage).toContain('"/privacy"')
    expect(statusPage).toContain('"/terms"')
  })
})
