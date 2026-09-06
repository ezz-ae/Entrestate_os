import "server-only"
import crypto from "node:crypto"
import { getSessionUser } from "@/lib/auth"
import { coerceEntitlementTier, getEntitlementByAccountKey } from "@/lib/billing-entitlements"
import { statusEntitles } from "@/lib/entitlement-status"

/**
 * WHO IS ASKING, AND WHAT DID THEY PAY FOR.
 *
 * Fifteen route handlers gate on this module — the developer records, the
 * property and price-reality reads, the evidence drawer, the stress test, the
 * deal screener, CSV export, reports, watchlists, portfolio stress, the DaaS
 * feeds and the automation builder. Until 2026-09-06 it answered both
 * questions from request headers that a stranger sets:
 *
 *     const headerTier = request.headers.get("x-entrestate-tier")
 *     if (headerTier) return parseTier(headerTier)
 *
 * That branch ran BEFORE the database was consulted, and nothing stripped the
 * header: this app has no middleware.ts, and proxy.ts sets only
 * x-entrestate-locale and x-entrestate-shell. So every paid route in the
 * product was one curl flag away from institutional:
 *
 *     curl -H 'x-entrestate-tier: institutional' https://…/api/export/csv
 *
 * `x-entrestate-account-key` was the same hole wearing a different hat: an
 * unauthenticated caller naming any account key was that account, for the
 * entitlement read and for everything downstream that keys off it.
 *
 * Now: identity comes from the session. The headers are honoured only for a
 * caller that proves it is us by presenting INTERNAL_API_SECRET — the
 * operator smoke runs in docs/neon-auth-go-live.md are the reason that door
 * exists at all — and with the secret unset there is no such caller, so the
 * headers mean nothing. Unset fails CLOSED: the safe state must be the one
 * that needs no configuration, because the unconfigured state is the one a
 * new deployment is in.
 *
 * The tier is then read from the entitlement row AND its status
 * (lib/entitlement-status.ts), so a suspended card does not keep paid access.
 */

const TIER_ORDER = ["free", "pro", "team", "institutional"] as const

export type TierName = (typeof TIER_ORDER)[number]

function rankTier(tier: TierName) {
  return TIER_ORDER.indexOf(tier)
}

/** Constant-time compare that tolerates unequal lengths without leaking them. */
function secretMatches(presented: string, expected: string) {
  const a = crypto.createHash("sha256").update(presented).digest()
  const b = crypto.createHash("sha256").update(expected).digest()
  return crypto.timingSafeEqual(a, b)
}

/**
 * True only for a caller holding the shared secret. Not "is this localhost",
 * not "does this look internal" — a claim about the caller is worth exactly
 * what the caller had to prove to make it.
 */
export function isTrustedInternalCaller(request: Request): boolean {
  const expected = process.env.INTERNAL_API_SECRET?.trim()
  if (!expected) return false
  const presented = request.headers.get("x-entrestate-internal-key")?.trim()
  if (!presented) return false
  return secretMatches(presented, expected)
}

/**
 * The account this request acts as. The session is the only source of
 * identity for a browser; an internal caller that has proved itself may name
 * an account instead, which is what the operator smoke runs do.
 */
export async function resolveRequestAccountKey(request: Request): Promise<string | null> {
  if (isTrustedInternalCaller(request)) {
    const claimed =
      request.headers.get("x-entrestate-account-key")?.trim() ||
      request.headers.get("x-entrestate-user-id")?.trim()
    if (claimed) return claimed
  }

  const sessionUser = await getSessionUser().catch(() => null)
  return sessionUser?.id?.trim() || null
}

export async function getRequestTier(request: Request): Promise<TierName> {
  const accountKey = await resolveRequestAccountKey(request)
  if (!accountKey) return "free"

  const entitlement = await getEntitlementByAccountKey(accountKey).catch(() => null)
  if (!entitlement) return "free"
  if (!statusEntitles(entitlement.paypal_status)) return "free"

  return coerceEntitlementTier(entitlement.tier)
}

export async function hasTierAccess(request: Request, requiredTier: TierName) {
  return rankTier(await getRequestTier(request)) >= rankTier(requiredTier)
}
