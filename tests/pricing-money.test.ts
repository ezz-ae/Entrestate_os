import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { pricingPlans, resolvePaidTier } from "@/lib/pricing/plans"

/**
 * WHAT A CARD GETS CHARGED, LOCKED — and locked in the repository that charges it.
 *
 * lib/pricing/plans.ts is the only place the paid amounts exist, and the money
 * path reads them directly:
 *
 *   lib/payments/tap.ts:19-23  getTapAmount() returns plan.monthlyAed /
 *     plan.annualAed straight out of that file, and createTapCharge posts it to
 *     https://api.tap.company/v2/charges as `amount`, with currency "AED"
 *     hardcoded beside it. No price id, no env var, no second system that has
 *     to agree. Editing a literal in a source file edits what a card is
 *     charged.
 *
 * Stripe is safer by accident — it charges whatever STRIPE_PRICE_* says and the
 * literal is only what the page DISPLAYS, so an edit there produces a page that
 * lies rather than a wrong charge. Both are defects; one of them takes the
 * wrong amount of somebody's money.
 *
 * THIS GUARD EXISTED AND WAS WATCHING THE WRONG FILE. It lived in the platform
 * repository as scripts/terminal-price-test.ts, reading
 * `apps/terminal/lib/pricing/plans.ts` — a full copy of this repository that
 * had been vendored there when the Terminal was believed to build from
 * entrestate-platform/apps/terminal. It does not: the Vercel project
 * entrestate-os builds THIS repository from its root. So the guard froze a
 * snapshot while the deployed file drifted, and it passed the whole time.
 *
 * What it missed, live on terminal.entrestate.com: resolvePaidTier aliased
 * "realtor" and "realtor-pro" onto "team", so /checkout?tier=realtor rendered
 * "Complete Team checkout — AED 999" and the billing route posted 999 to Tap —
 * the brokerage price, quoted for the one-agent product. The copy had the alias
 * removed; the deployed file never did. A guard reading the wrong file is worse
 * than no guard, because it is believed.
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")

/**
 * THE PRICES, AS AGREED. A change here is a change to a charge, so it belongs
 * in a diff a human reads on purpose — which is the entire job of this file.
 */
const EXPECTED = {
  free: { monthly: 0, annual: 0 },
  pro: { monthly: 299, annual: 2988 },
  team: { monthly: 999, annual: 9588 },
  institutional: { monthly: null, annual: null },
} as const

describe("the amounts a card is charged", () => {
  it("declares exactly the four tiers, and only these four", () => {
    expect(Object.keys(pricingPlans)).toEqual(["free", "pro", "team", "institutional"])
  })

  it("charges the agreed amount for every tier", () => {
    for (const [tier, want] of Object.entries(EXPECTED)) {
      const plan = pricingPlans[tier as keyof typeof pricingPlans]
      expect(plan.monthlyAed, `${tier} monthlyAed`).toBe(want.monthly)
      expect(plan.annualAed, `${tier} annualAed`).toBe(want.annual)
    }
  })

  it("prices a year as a real discount, not a typo", () => {
    // Twelve times monthly, or more, is a bug that reads as a price; and a
    // "discount" past half is far likelier to be a missing digit than a deal.
    for (const [tier, want] of Object.entries(EXPECTED)) {
      if (want.monthly === null || want.monthly === 0) continue
      expect(want.annual!, `${tier}: a year must cost less than twelve months`).toBeLessThan(want.monthly * 12)
      expect(want.annual!, `${tier}: …and not so much less that it is a missing digit`).toBeGreaterThan(want.monthly * 6)
    }
  })

  it("says AED on every badge that carries a number", () => {
    // createTapCharge sends currency: "AED" (lib/payments/tap.ts). A badge
    // quoting anything else promises one currency while charging another.
    for (const plan of Object.values(pricingPlans)) {
      if (!/[0-9]/.test(plan.badge.en)) continue
      expect(plan.badge.en, "a numeric badge must name AED").toContain("AED")
    }
  })
})

describe("the solo product is never quoted the brokerage price", () => {
  it("does not resolve realtor tiers to team", () => {
    // The live defect this file was written after: both of these returned
    // "team" and quoted AED 999 for the one-agent product.
    expect(resolvePaidTier("realtor")).toBeNull()
    expect(resolvePaidTier("realtor-pro")).toBeNull()
    expect(resolvePaidTier("REALTOR")).toBeNull()
  })

  it("still accepts the aliases that name a tier this platform sells", () => {
    // PayPal plan ids in the wild carry these, and they name the same thing.
    expect(resolvePaidTier("enterprise")).toBe("institutional")
    expect(resolvePaidTier("os")).toBe("institutional")
    expect(resolvePaidTier("solo")).toBe("pro")
    expect(resolvePaidTier("team")).toBe("team")
  })

  it("refuses anything it does not recognise, rather than guessing a tier", () => {
    for (const junk of ["", "  ", "gold", "realtors", "team-plus", "0"]) {
      expect(resolvePaidTier(junk), `resolvePaidTier(${JSON.stringify(junk)})`).toBeNull()
    }
  })
})

describe("the money path still reads the literals this file freezes", () => {
  const tap = read("lib/payments/tap.ts")

  it("takes the Tap amount from the plan, not from a second source", () => {
    expect(tap).toMatch(/getTapAmount[\s\S]{0,200}getPaidPlan\(tier\)/)
    expect(tap).toMatch(/plan\.annualAed/)
    expect(tap).toMatch(/plan\.monthlyAed/)
  })

  it("refuses to charge when the amount is missing, instead of sending zero", () => {
    expect(tap).toMatch(/if \(!amount\)[\s\S]{0,120}throw new Error/)
  })

  it("charges in the currency the badges quote", () => {
    expect(tap).toContain('currency: "AED"')
  })
})
