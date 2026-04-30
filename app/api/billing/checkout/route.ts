import { NextResponse } from "next/server"
import { getRequestId } from "@/lib/api-errors"
import type { PaidTier } from "@/lib/paypal"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CHECKOUT_TIER_MAP: Record<string, PaidTier> = {
  pro: "pro",
  solo: "pro",
  "solo-analyst": "pro",
  team: "team",
  realtor: "team",
  "realtor-pro": "team",
  institutional: "institutional",
  enterprise: "institutional",
  "enterprise-os": "institutional",
  os: "institutional",
}

const PLAN_ENV_BY_TIER: Record<PaidTier, string> = {
  pro: "PAYPAL_PLAN_ID_PRO",
  team: "PAYPAL_PLAN_ID_TEAM",
  institutional: "PAYPAL_PLAN_ID_INSTITUTIONAL",
}

function mapTier(rawTier: string | null): PaidTier | null {
  if (!rawTier) return null
  return CHECKOUT_TIER_MAP[rawTier.trim().toLowerCase()] ?? null
}

function hasConfiguredPlan(tier: PaidTier) {
  return Boolean(process.env[PLAN_ENV_BY_TIER[tier]])
}

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  const requestUrl = new URL(request.url)
  const tier = mapTier(requestUrl.searchParams.get("tier"))

  if (!tier) {
    return NextResponse.json(
      {
        error: "Invalid tier. Use one of: pro, team, institutional.",
        requestId,
        request_id: requestId,
      },
      { status: 400, headers: { "x-request-id": requestId } },
    )
  }

  if (!hasConfiguredPlan(tier)) {
    const fallbackUrl = new URL("/contact", requestUrl.origin)
    fallbackUrl.searchParams.set("plan", tier)
    fallbackUrl.searchParams.set("source", "pricing")
    fallbackUrl.searchParams.set("billing", "contact")

    const response = NextResponse.redirect(fallbackUrl, { status: 307 })
    response.headers.set("x-request-id", requestId)
    return response
  }

  const paypalUrl = new URL("/api/billing/paypal/checkout", requestUrl.origin)
  for (const [key, value] of requestUrl.searchParams.entries()) {
    paypalUrl.searchParams.set(key, value)
  }
  paypalUrl.searchParams.set("tier", tier)

  const response = NextResponse.redirect(paypalUrl, { status: 307 })
  response.headers.set("x-request-id", requestId)
  return response
}
