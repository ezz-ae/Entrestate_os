import { NextResponse } from "next/server"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { getSessionUser } from "@/lib/auth"
import { getEntitlementByAccountKey, upsertPaypalEntitlement } from "@/lib/billing-entitlements"
import { buildPaypalCustomId, createPaypalSubscription, isPaidTier } from "@/lib/paypal"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const requestId = getRequestId(request)

  try {
    const { searchParams, origin } = new URL(request.url)
    const tier = (searchParams.get("tier") ?? "").toLowerCase()
    const queryAccountKey = searchParams.get("accountKey")?.trim()

    if (!isPaidTier(tier)) {
      return NextResponse.json(
        { error: "Invalid tier. Use one of: pro, team, institutional.", requestId },
        { status: 400 },
      )
    }

    const sessionUser = await getSessionUser()
    const accountKey = queryAccountKey || sessionUser?.id || null

    if (!accountKey) {
      return NextResponse.json(
        { error: "Missing account identity. Sign in or provide accountKey in query params.", requestId },
        { status: 400 },
      )
    }

    const existingEntitlement = await getEntitlementByAccountKey(accountKey)
    const customId = buildPaypalCustomId({ tier, accountKey })
    const returnUrl = `${origin}/api/billing/paypal/return?tier=${tier}&accountKey=${encodeURIComponent(accountKey)}`
    const cancelUrl = `${origin}/pricing?billing=cancelled&tier=${tier}`

    const subscription = await createPaypalSubscription({ tier, requestOrigin: origin, customId, returnUrl, cancelUrl })

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
