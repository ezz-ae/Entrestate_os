import "server-only"
import { createNeonAuth } from "@neondatabase/auth/next/server"
import { getSharedAuthCookieDomain } from "@/lib/auth/cookie-domain"

const baseUrl = process.env.NEON_AUTH_BASE_URL
const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET
const cookieDomain = getSharedAuthCookieDomain()
const adminEmails = (process.env.NEON_AUTH_ADMIN_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)
const adminModeRequested = process.env.NEXT_PUBLIC_ADMIN_MODE === "true"
const adminModeEnabled = adminModeRequested && process.env.NODE_ENV !== "production"
let adminModeWarned = false

/**
 * WHY SIGN-IN IS OFF, AS A VALUE THE PAGE CAN READ.
 *
 * Sign-in was dead on terminal.entrestate.com and the screen gave no reason:
 * /en/login rendered the full form — Google button, email, password, "Sign in" —
 * over an auth object that was null, so /api/auth/session answered 501 and the
 * form did nothing a person could interpret. The only explanation existed as a
 * console.warn in a serverless log.
 *
 * A deployment misconfiguration must be visible on the screen it breaks, so the
 * reason is returned instead of logged, and app/login and app/signup say it.
 * The values themselves are never exposed — only which one is missing.
 */
export type AuthStatus =
  | { ready: true }
  | { ready: false; reason: "missing-base-url" | "missing-cookie-secret" | "weak-cookie-secret" }

export function authStatus(): AuthStatus {
  if (!baseUrl) return { ready: false, reason: "missing-base-url" }
  if (!cookieSecret) return { ready: false, reason: "missing-cookie-secret" }
  // Neon Auth signs session cookies with this; a short secret is a weak
  // signature, so it is refused rather than quietly accepted.
  if (cookieSecret.length < 32) return { ready: false, reason: "weak-cookie-secret" }
  return { ready: true }
}

export const authEnabled = authStatus().ready

if (!authEnabled) {
  const reason = authStatus()
  console.warn(
    `Neon Auth disabled (${"reason" in reason ? reason.reason : "unknown"}): sign-in and sign-up will refuse. `
    + "Set NEON_AUTH_BASE_URL and a NEON_AUTH_COOKIE_SECRET of at least 32 characters on this deployment.",
  )
}

if (adminModeRequested && !adminModeEnabled) {
  console.warn("Admin mode ignored in production. Disable NEXT_PUBLIC_ADMIN_MODE for production.")
}

export const auth = authEnabled
  ? createNeonAuth({
      baseUrl: baseUrl!,
      cookies: {
        secret: cookieSecret!,
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      },
    })
  : null

export function getAuth() {
  return auth
}

async function getSessionData() {
  if (!auth) return null
  try {
    const { data } = await auth.getSession()
    return data ?? null
  } catch (error) {
    // Silently handle "Cookies can only be modified in a Server Action or Route Handler"
    // which happens when auth library tries to refresh session during page render
    if (String(error).includes("Cookies can only be modified")) {
      return null
    }
    throw error
  }
}

export async function getSessionUser() {
  const session = await getSessionData()
  return session?.user ?? null
}

export async function getSessionUserId(): Promise<string> {
  const user = await getSessionUser()
  return user?.id ?? "system"
}

export async function requireSessionUserId(): Promise<string | null> {
  const user = await getSessionUser()
  return user?.id ?? null
}

export async function isAdminUser(): Promise<boolean> {
  if (adminModeEnabled) {
    if (!adminModeWarned) {
      console.warn("Admin mode bypass is enabled for this environment.")
      adminModeWarned = true
    }
    return true
  }

  const user = await getSessionUser()
  if (!user) return false

  if (user.role === "admin") return true

  if (adminEmails.length && user.email) {
    return adminEmails.includes(user.email.toLowerCase())
  }

  return false
}
