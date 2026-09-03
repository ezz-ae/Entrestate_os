import "server-only"
import { redirect } from "next/navigation"
import { getSyncedUserResult, type SyncedUser } from "@/lib/auth/sync"
import { buildLoginHref } from "@/lib/auth/navigation"
import { getRequestLocale } from "@/i18n/request"

/**
 * The one guard every signed-in page uses, so the redirect decision is made
 * in a single place and cannot drift back apart.
 *
 * Redirect to /login ONLY when there is genuinely no session. When the session
 * is real but the database cannot answer, throw: app/error.tsx renders it, the
 * person is told the truth, and — the point — sending them to /login would
 * bounce them straight back here, which is the loop this replaces.
 */
export async function requireSyncedUser(nextPath: string): Promise<SyncedUser> {
  const result = await getSyncedUserResult()

  if (result.status === "ready") return result.user

  if (result.status === "anonymous") {
    const locale = await getRequestLocale()
    redirect(buildLoginHref(locale, nextPath))
  }

  throw new Error(
    `Your account could not be loaded: the database did not answer (${result.reason}). `
    + "You are still signed in — this is a fault on our side, not your session. "
    + "Please try again in a moment.",
  )
}
