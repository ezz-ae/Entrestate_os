import "server-only"
import { getSessionUser } from "@/lib/auth"
import { coerceEntitlementTier, getEntitlementByAccountKey } from "@/lib/billing-entitlements"

export type CurrentEntitlement = {
  accountKey: string | null
  tier: "free" | "pro" | "team" | "institutional"
  source: "default" | "billing_entitlements"
  subscriptionId: string | null
  status: string | null
}

export async function getCurrentEntitlement(accountKeyOverride?: string | null): Promise<CurrentEntitlement> {
  let accountKey = accountKeyOverride?.trim() || null
  if (!accountKey) {
    try {
      accountKey = (await getSessionUser())?.id?.trim() || null
    } catch (error) {
      console.error("Failed to load session user; falling back to free entitlement.", { error })
      accountKey = null
    }
  }
  if (!accountKey) {
    return {
      accountKey: null,
      tier: "free",
      source: "default",
      subscriptionId: null,
      status: null,
    }
  }

  try {
    const entitlement = await getEntitlementByAccountKey(accountKey)
    if (!entitlement) {
      return {
        accountKey,
        tier: "free",
        source: "default",
        subscriptionId: null,
        status: null,
      }
    }

    return {
      accountKey,
      tier: coerceEntitlementTier(entitlement.tier),
      source: "billing_entitlements",
      subscriptionId: entitlement.paypal_subscription_id,
      status: entitlement.paypal_status,
    }
  } catch (error) {
    console.error("Entitlement lookup failed; falling back to free entitlement.", { error, accountKey })
    return {
      accountKey,
      tier: "free",
      source: "default",
      subscriptionId: null,
      status: null,
    }
  }
}
