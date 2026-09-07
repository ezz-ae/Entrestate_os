import "server-only"

/**
 * A SUBSCRIPTION STATUS DECIDES ACCESS, NOT ONLY THE TIER BESIDE IT.
 *
 * The entitlement row carries two facts: which tier was bought, and what the
 * processor last said about the subscription. Until 2026-09-06 every gate in
 * the product read the first and ignored the second — and the Stripe webhook
 * writes them apart on purpose:
 *
 *   app/api/webhooks/stripe/route.ts:15-21 maps `past_due` and `unpaid` to
 *   "SUSPENDED" while `nextTier` stays the tier the customer bought. So a
 *   customer whose card fails keeps full paid access, forever, because
 *   nothing downstream ever looked at the status column.
 *
 * PayPal already resolves this at WRITE time (lib/paypal-entitlement-sync.ts
 * `resolveTierFromStatus` drops the tier to "free" on CANCELLED/SUSPENDED/
 * EXPIRED), which is why the hole was invisible: one provider closed it and
 * the other did not. Deciding it at READ time closes it for every provider,
 * including any added later, and does not depend on a webhook arriving.
 *
 * PAYING is the narrow set on purpose. APPROVAL_PENDING is a PayPal
 * subscription the buyer has not approved yet (app/api/billing/paypal/
 * checkout/route.ts:68 records it before the buyer ever reaches PayPal), and
 * an unapproved subscription has taken no money.
 */

/** Statuses under which money is actually flowing for the tier on the row. */
const PAYING = new Set(["ACTIVE", "TRIALING", "APPROVED"])

/**
 * A null status is the pre-billing world: rows written before the status
 * column carried meaning, and grants made by an operator by hand. Those keep
 * their tier — refusing them would revoke access nobody bought a way to
 * restore. A status that is present and not in PAYING is a "no".
 */
export function statusEntitles(status: string | null | undefined): boolean {
  if (status === null || status === undefined) return true
  const normalized = status.trim().toUpperCase()
  if (!normalized) return true
  return PAYING.has(normalized)
}
