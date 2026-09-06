import { NextResponse } from "next/server"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { getSessionUser } from "@/lib/auth"
import { getEntitlementByAccountKey, upsertPaypalEntitlement, validateCoupon } from "@/lib/billing-entitlements"
import { buildPaypalCustomId, createPaypalSubscription, isPaidTier } from "@/lib/paypal"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const requestId = getRequestId(request)

  try {
    const { searchParams, origin } = new URL(request.url)
    const tier = (searchParams.get("tier") ?? "").toLowerCase()
    const queryAccountKey = searchParams.get("accountKey")?.trim()
    const couponCode = searchParams.get("coupon")?.trim() ?? null

    if (!isPaidTier(tier)) {
      return NextResponse.json(
        { error: "Invalid tier. Use one of: pro, team, institutional.", requestId },
        { status: 400 },
      )
    }

    // THE SESSION DECIDES WHOSE SUBSCRIPTION THIS IS. `queryAccountKey` used
    // to win, so a signed-in buyer could start a subscription that lands on
    // somebody else's account, and an unauthenticated caller could start one
    // on any account by naming it. The query key is now honoured only when
    // there is no session at all — the operator path — and never over a
    // signed-in identity.
    const sessionUser = await getSessionUser().catch(() => null)
    const accountKey = sessionUser?.id || queryAccountKey || null

    if (!accountKey) {
      return NextResponse.json(
        { error: "Missing account identity. Sign in or provide accountKey in query params.", requestId },
        { status: 400 },
      )
    }

    // A CODE THAT DOES NOT VALIDATE STOPS THE CHECKOUT. It used to be dropped
    // in silence — the buyer typed a code, saw no error, and was sent to
    // PayPal to approve the full price. Someone who mistypes a discount they
    // were given should be told, not charged the difference and left to find
    // it on the statement.
    let discountPct = 0
    let validatedCouponCode: string | null = null
    if (couponCode) {
      const couponResult = await validateCoupon(couponCode, accountKey)
      if (!couponResult.valid) {
        return NextResponse.json(
          { error: `That code is not valid for this account: ${couponCode}`, requestId },
          { status: 400 },
        )
      }
      discountPct = couponResult.coupon.discount_pct
      validatedCouponCode = couponResult.coupon.code
    }

    const existingEntitlement = await getEntitlementByAccountKey(accountKey)
    const customId = buildPaypalCustomId({ tier, accountKey })
    const couponParam = validatedCouponCode ? `&coupon=${encodeURIComponent(validatedCouponCode)}` : ""
    const returnUrl = `${origin}/api/billing/paypal/return?tier=${tier}&accountKey=${encodeURIComponent(accountKey)}${couponParam}`
    const cancelUrl = `${origin}/pricing?billing=cancelled&tier=${tier}`

    const subscription = await createPaypalSubscription({
      tier,
      requestOrigin: origin,
      customId,
      returnUrl,
      cancelUrl,
      firstMonthDiscountPct: discountPct > 0 ? discountPct : undefined,
    })

    await upsertPaypalEntitlement({
      accountKey,
      email: sessionUser?.email ?? existingEntitlement?.email ?? null,
      tier: existingEntitlement?.tier ?? "free",
      subscriptionId: subscription.subscriptionId,
      status: "APPROVAL_PENDING",
      eventType: "CHECKOUT_REDIRECT",
      eventAt: new Date(),
    })

    return NextResponse.redirect(subscription.approvalUrl, { status: 307 })
  } catch (error) {
    return NextResponse.json(
      {
        error: getPublicErrorMessage(error, "Failed to initialize PayPal subscription checkout."),
        requestId,
      },
      { status: 500 },
    )
  }
}
