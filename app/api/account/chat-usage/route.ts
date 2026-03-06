import { NextResponse } from "next/server"
import { getRequestId } from "@/lib/api-errors"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { getAnonymousCopilotAccountKey, getCopilotDailyUsage } from "@/lib/copilot-usage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  const headerAccountKey = request.headers.get("x-entrestate-account-key")?.trim() || request.headers.get("x-entrestate-user-id")?.trim()
  const entitlement = await getCurrentEntitlement(headerAccountKey)

  const usageAccountKey = entitlement.accountKey || getAnonymousCopilotAccountKey(request)
  const usage = await getCopilotDailyUsage(usageAccountKey, entitlement.tier)

  return NextResponse.json(
    {
      tier: entitlement.tier,
      account_key: entitlement.accountKey,
      usage_account_key: usageAccountKey,
      source: entitlement.source,
      subscription_status: entitlement.status,
      usage,
      requestId,
    },
    { status: 200 },
  )
}
