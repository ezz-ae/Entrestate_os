import "server-only"
import {
  coerceEntitlementTier,
  getEntitlementBySubscriptionId,
  type EntitlementTier,
  updateEntitlementBySubscriptionId,
  upsertPaypalEntitlement,
} from "@/lib/billing-entitlements"
import { getPaypalSubscription, getTierFromPaypalPlanId, parsePaypalCustomId } from "@/lib/paypal"

type SyncInput = {
  subscriptionId: string
  accountKeyHint?: string | null
  eventId?: string | null
  eventType?: string | null
  eventAt?: Date | null
}

type SyncResult = {
  accountKey: string | null
  subscriptionId: string
  status: string | null
  tier: EntitlementTier
  planId: string | null
}

function resolveTierFromStatus(
  baseTier: EntitlementTier,
  status: string | null | undefined,
  fallbackTier: EntitlementTier,
  eventType?: string | null,
) {
  const normalized = status?.toUpperCase() ?? null
  const normalizedEvent = eventType?.toUpperCase() ?? null

  if (
    normalizedEvent === "BILLING.SUBSCRIPTION.CANCELLED" ||
    normalizedEvent === "BILLING.SUBSCRIPTION.SUSPENDED" ||
    normalizedEvent === "BILLING.SUBSCRIPTION.EXPIRED"
  ) {
    return "free" as const
  }

  if (normalized === "CANCELLED" || normalized === "SUSPENDED" || normalized === "EXPIRED") {
    return "free" as const
  }

  if (normalized === "ACTIVE" || normalized === "APPROVAL_PENDING" || normalized === "APPROVED") {
    return baseTier
  }

  return fallbackTier
}

export async function syncPaypalSubscriptionEntitlement(input: SyncInput): Promise<SyncResult> {
  const subscriptionId = input.subscriptionId.trim()
  if (!subscriptionId) {
    throw new Error("subscriptionId is required for entitlement sync")
  }

  const [subscription, existing] = await Promise.all([
    getPaypalSubscription(subscriptionId),
    getEntitlementBySubscriptionId(subscriptionId),
  ])

  const parsedCustom = parsePaypalCustomId(subscription.customId)
  const planTier = coerceEntitlementTier(getTierFromPaypalPlanId(subscription.planId))
  const customTier = coerceEntitlementTier(parsedCustom.tier)
  const fallbackTier = coerceEntitlementTier(existing?.tier)

  const baseTier = planTier !== "free" ? planTier : customTier !== "free" ? customTier : fallbackTier
  const effectiveTier = resolveTierFromStatus(baseTier, subscription.status, fallbackTier, input.eventType)

  // WHOSE SUBSCRIPTION THIS IS COMES FROM PAYPAL, NOT FROM THE URL.
  // `accountKeyHint` used to win this expression, and it is filled from the
  // `accountKey` query parameter on /api/billing/paypal/return. Since the
  // subscription itself is verified but the owner was not, anyone could take
  // a real subscription id and copy its tier onto their own account:
  //   /api/billing/paypal/return?subscription_id=<real>&accountKey=<mine>
  // The custom_id PayPal returns is the only party to this that the caller
  // cannot write, so it decides. The hint is now the last resort — used only
  // when PayPal carried no custom_id and no row exists yet, which is the
  // recovery case it was added for.
  const accountKey = parsedCustom.accountKey || existing?.account_key || input.accountKeyHint?.trim() || null

  if (accountKey) {
    await upsertPaypalEntitlement({
      accountKey,
      email: existing?.email ?? null,
      tier: effectiveTier,
      subscriptionId,
      planId: subscription.planId,
      status: subscription.status,
      eventId: input.eventId ?? null,
      eventType: input.eventType ?? "SUBSCRIPTION_SYNC",
      eventAt: input.eventAt ?? new Date(),
    })
  } else {
    await updateEntitlementBySubscriptionId({
      subscriptionId,
      tier: effectiveTier,
      planId: subscription.planId,
      status: subscription.status,
      eventId: input.eventId ?? null,
      eventType: input.eventType ?? "SUBSCRIPTION_SYNC",
      eventAt: input.eventAt ?? new Date(),
    })
  }

  return {
    accountKey,
    subscriptionId,
    status: subscription.status,
    tier: effectiveTier,
    planId: subscription.planId,
  }
}
