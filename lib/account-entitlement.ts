import "server-only"
import { getSessionUser } from "@/lib/auth"
import { coerceEntitlementTier, getEntitlementByAccountKey } from "@/lib/billing-entitlements"
import { statusEntitles } from "@/lib/entitlement-status"

/**
 * THE ENTITLEMENT ON RECORD FOR THE ACCOUNT ASKING.
 *
 * `trustedAccountKey` is named for what it must be. It used to be
 * `accountKeyOverride`, and both callers filled it straight from a request
 * header a stranger sets (app/api/chat/route.ts and app/api/copilot/route.ts
 * read `x-entrestate-account-key` off the incoming request), so naming any
 * account key made you that account: its tier, its usage allowance, and its
 * quota counters. Both callers now pass the key that
 * lib/tier-access.ts `resolveRequestAccountKey` resolved — the session, or an
 * internal caller that presented INTERNAL_API_SECRET.
 *
 * The tier is also read together with the subscription status, so a card that
 * stopped paying stops entitling. See lib/entitlement-status.ts for why that
 * is decided here, on read, and not left to each provider's webhook.
 */

export type CurrentEntitlement = {
  accountKey: string | null
  tier: "free" | "pro" | "team" | "institutional"
  source: "default" | "billing_entitlements"
  provider: string | null
  subscriptionId: string | null
  status: string | null
}

export async function getCurrentEntitlement(trustedAccountKey?: string | null): Promise<CurrentEntitlement> {
  let accountKey = trustedAccountKey?.trim() || null
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
      provider: null,
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
        provider: null,
        subscriptionId: null,
        status: null,
      }
    }

    if (!statusEntitles(entitlement.paypal_status)) {
      return {
        accountKey,
        tier: "free",
        source: "billing_entitlements",
        provider: entitlement.provider,
        subscriptionId: entitlement.paypal_subscription_id,
        status: entitlement.paypal_status,
      }
    }

    return {
      accountKey,
      tier: coerceEntitlementTier(entitlement.tier),
      source: "billing_entitlements",
      provider: entitlement.provider,
      subscriptionId: entitlement.paypal_subscription_id,
      status: entitlement.paypal_status,
    }
  } catch (error) {
    console.error("Entitlement lookup failed; falling back to free entitlement.", { error, accountKey })
    return {
      accountKey,
      tier: "free",
      source: "default",
      provider: null,
      subscriptionId: null,
      status: null,
    }
  }
}
