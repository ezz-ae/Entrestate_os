import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { statusEntitles } from "@/lib/entitlement-status"

/**
 * THE MONEY RAILS TRUST NOTHING THE CALLER SAYS ABOUT ITSELF.
 *
 * On 2026-09-06 an audit of the paid path found five ways a stranger could
 * take, keep or redirect access, and one way a customer could be charged for
 * something they did not agree to. Every one of them was the same mistake in
 * a different file: a claim arriving in a request was believed because it was
 * shaped like something we would send.
 *
 *   1. `x-entrestate-tier` was read BEFORE the database in lib/tier-access.ts
 *      and returned as the tier. Fifteen gated routes; no middleware.ts in the
 *      repo and proxy.ts sets only locale and shell, so nothing stripped it:
 *        curl -H 'x-entrestate-tier: institutional' …/api/export/csv
 *   2. `x-entrestate-account-key` named the account for the entitlement read
 *      and for the copilot and chat allowances — impersonation by header.
 *   3. `verifyTapSignature` returned TRUE when TAP_WEBHOOK_SECRET was unset,
 *      so an unconfigured deployment granted institutional to an unsigned
 *      POST. Stripe's verifier throws in the same situation.
 *   4. `accountKeyHint` — filled from the ?accountKey query parameter — won
 *      over the custom_id PayPal returns, so a real subscription id plus your
 *      own account key copied someone's tier onto your account.
 *   5. The Stripe verifier checked the HMAC and ignored the timestamp inside
 *      it, so any captured webhook body replayed forever.
 *   6. A mistyped coupon was dropped in silence and the buyer was sent to
 *      approve the full price; and ensureTables() seeded a 90%-off,
 *      unlimited-redemption coupon into whatever database it first touched.
 *
 * Plus two revenue defects of the same family — believing a label instead of
 * the mechanism: Tap's `/v2/charges` is a ONE-TIME charge sold under a button
 * labelled "Monthly", and a missing country header defaulted to it.
 *
 * Each rule below names the file it guards. Pure — no network, no database.
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:'"`])\/\/.*$/gm, "$1")

describe("1. identity comes from the session, not from a header", () => {
  const tierAccess = stripComments(read("lib/tier-access.ts"))

  it("no request header can name a tier", () => {
    expect(tierAccess).not.toMatch(/x-entrestate-tier/)
  })

  it("an account key from a header needs a proved caller behind it", () => {
    expect(tierAccess).toContain("export function isTrustedInternalCaller(request: Request)")
    expect(tierAccess).toContain("INTERNAL_API_SECRET")
    // The claim is read INSIDE the trusted branch, never beside it.
    const trustedAt = tierAccess.indexOf("if (isTrustedInternalCaller(request))")
    const claimAt = tierAccess.indexOf("x-entrestate-account-key")
    expect(trustedAt).toBeGreaterThan(-1)
    expect(claimAt).toBeGreaterThan(trustedAt)
  })

  it("an unset secret trusts nobody — the unconfigured state is the closed one", () => {
    expect(tierAccess).toMatch(/const expected = process\.env\.INTERNAL_API_SECRET\?\.trim\(\)\s*\n\s*if \(!expected\) return false/)
  })

  it("the secret is compared in constant time", () => {
    expect(tierAccess).toContain("crypto.timingSafeEqual")
  })

  it("the copilot and the chat spend the resolved account's allowance, not a claimed one", () => {
    for (const rel of ["app/api/chat/route.ts", "app/api/copilot/route.ts"]) {
      const src = stripComments(read(rel))
      expect(src, rel).toContain("resolveRequestAccountKey(request)")
      expect(src, rel).toContain("getCurrentEntitlement(trustedAccountKey)")
      expect(src, rel).not.toMatch(/headerAccountKey/)
    }
  })

  it("every gated route still goes through this one door", () => {
    const walk = (dir: string, out: string[] = []): string[] => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) walk(full, out)
        else if (entry.name === "route.ts") out.push(full)
      }
      return out
    }
    const gated = walk(path.join(ROOT, "app/api")).filter((f) => /hasTierAccess\(/.test(fs.readFileSync(f, "utf8")))
    expect(gated.length).toBeGreaterThanOrEqual(10)
    for (const file of gated) {
      expect(fs.readFileSync(file, "utf8"), file).toMatch(/from ["']@\/lib\/tier-access["']/)
    }
  })
})

describe("2. a status decides access, not only the tier beside it", () => {
  it("a paying status entitles and a stopped one does not", () => {
    for (const ok of ["ACTIVE", "active", "TRIALING", "APPROVED"]) expect(statusEntitles(ok), ok).toBe(true)
    for (const no of ["SUSPENDED", "CANCELLED", "EXPIRED", "PENDING", "APPROVAL_PENDING", "PAST_DUE", "UNPAID"]) {
      expect(statusEntitles(no), no).toBe(false)
    }
  })

  it("a row with no status keeps its tier — those grants predate the column", () => {
    expect(statusEntitles(null)).toBe(true)
    expect(statusEntitles(undefined)).toBe(true)
    expect(statusEntitles("  ")).toBe(true)
  })

  it("both readers apply it", () => {
    for (const rel of ["lib/tier-access.ts", "lib/account-entitlement.ts"]) {
      expect(stripComments(read(rel)), rel).toContain("statusEntitles(entitlement.paypal_status)")
    }
  })

  it("the Stripe webhook is why: it writes SUSPENDED beside the paid tier", () => {
    const hook = stripComments(read("app/api/webhooks/stripe/route.ts"))
    expect(hook).toMatch(/past_due" \|\| normalized === "unpaid"\) return "SUSPENDED"/)
  })
})

describe("3. a webhook proves itself or is refused", () => {
  it("Tap fails closed when its secret is unset", () => {
    const tap = stripComments(read("lib/payments/tap.ts"))
    expect(tap).toMatch(/const secret = process\.env\.TAP_WEBHOOK_SECRET\?\.trim\(\)\s*\n\s*if \(!secret\) return false/)
  })

  it("an authorized-but-uncaptured Tap charge grants nothing", () => {
    const route = stripComments(read("app/api/webhooks/tap/route.ts"))
    expect(route).not.toMatch(/=== "authorized"/)
    expect(route).toMatch(/normalized === "captured" \|\| normalized === "success"/)
  })

  it("a Stripe signature outside the window is refused", () => {
    const stripe = stripComments(read("lib/payments/stripe.ts"))
    expect(stripe).toContain("STRIPE_TIMESTAMP_TOLERANCE_SECONDS")
    expect(stripe).toContain("Stripe signature timestamp is outside the tolerance window")
  })
})

describe("4. PayPal says whose subscription it is", () => {
  it("the custom_id decides, and the URL hint is the last resort", () => {
    const sync = stripComments(read("lib/paypal-entitlement-sync.ts"))
    expect(sync).toContain(
      "const accountKey = parsedCustom.accountKey || existing?.account_key || input.accountKeyHint?.trim() || null",
    )
  })

  it("a signed-in buyer's subscription cannot be started on someone else's account", () => {
    const checkout = stripComments(read("app/api/billing/paypal/checkout/route.ts"))
    expect(checkout).toContain("const accountKey = sessionUser?.id || queryAccountKey || null")
  })
})

describe("5. nobody is charged for something they did not agree to", () => {
  it("a coupon that does not validate stops the checkout instead of being dropped", () => {
    const checkout = stripComments(read("app/api/billing/paypal/checkout/route.ts"))
    expect(checkout).toMatch(/if \(!couponResult\.valid\) \{[\s\S]*?status: 400/)
  })

  it("no coupon is seeded by a schema bootstrap", () => {
    // Comments are stripped first: the file explains in a comment WHICH code
    // used to be seeded and why it is gone, and naming a deleted thing is not
    // the deleted thing.
    const entitlements = stripComments(read("lib/billing-entitlements.ts"))
    expect(entitlements).not.toMatch(/INSERT INTO billing_coupons/)
    expect(entitlements).not.toMatch(/try9o/)
  })

  it("a recurring plan does not start on Tap's one-time charge", () => {
    const checkout = stripComments(read("app/api/billing/checkout/route.ts"))
    expect(checkout).toContain('const RECURRING_CADENCES: BillingCadence[] = ["monthly", "annual"]')
    expect(checkout).toMatch(/candidate === "tap" && isTapAvailable\(\) && !RECURRING_CADENCES\.includes\(cadence\)/)
    // …and Tap really is a single charge, which is what makes the rule necessary.
    expect(stripComments(read("lib/payments/tap.ts"))).toContain("`${TAP_API}/charges`")
  })

  it("an unknown country takes the recurring rail, not the one-time one", () => {
    const checkout = stripComments(read("app/api/billing/checkout/route.ts"))
    expect(checkout).toContain('request.headers.get("x-vercel-ip-country") ?? ""')
    expect(checkout).not.toContain('x-vercel-ip-country") ?? "AE"')
  })
})

describe("6. a failed payment does not look like a successful one", () => {
  const page = stripComments(read("app/account/billing/page.tsx"))

  it("the tick is reserved for success", () => {
    expect(page).toMatch(/billingState === "success" \? \([\s\S]{0,400}CheckCircle2/)
  })

  it("the two failure redirects get a warning that says nothing changed", () => {
    expect(page).toContain("AlertTriangle")
    expect(page).toContain('billingState === "missing_subscription"')
    expect(page).toMatch(/nothing on your account changed/)
    const ret = stripComments(read("app/api/billing/paypal/return/route.ts"))
    expect(ret).toContain('"billing", "missing_subscription"')
    expect(ret).toContain('"billing", "error"')
  })
})
