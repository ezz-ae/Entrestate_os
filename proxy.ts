import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { defaultLocale, isLocale, localeCookieName, prefixLocalePath, stripLocalePrefix } from "@/i18n/locale"
import { getMobileWebHostname, isPrimaryWebHost, resolveRuntimeShell } from "@/lib/runtime-host"
import { isHiddenRoute } from "@/lib/surface"

const AUTOMATION_BUILDER_PATHS = ["/apps/automation-builder", "/api/automation-builder"]
const KILL_SWITCH_PATHS = ["/api/time-table", "/api/scoring", "/api/profile", "/api/distribution"]
const LOCALE_SHORTCUT_REDIRECTS: Record<string, string> = {
  "/apis": "/docs/partners-apis",
}

function applyLocaleCookie(response: NextResponse, locale: string, secure: boolean) {
  response.cookies.set(localeCookieName, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure,
    httpOnly: false,
  })
  return response
}

function isMobileUserAgent(userAgent: string | null) {
  return /mobile|android|iphone|ipad|phone/i.test(userAgent ?? "")
}

/**
 * THE OAUTH RETURN LEG — the exchange the sign-in loop was missing.
 *
 * Google sign-in came back to the app as
 * /{callbackURL}?neon_auth_session_verifier=... plus a challenge cookie, and
 * NOTHING exchanged that verifier for a session: @neondatabase/auth performs
 * the exchange in ITS Next middleware (neonAuthMiddleware), which this app
 * never mounted — and mounting it wholesale is wrong here, because it
 * force-redirects every anonymous route and this Terminal is public-first.
 * So /me's server layout saw no session, bounced to /login, and the bounce
 * destroyed the verifier param: sign in with Google, land back on the login
 * form, forever. The owner hit exactly that.
 *
 * The fix is the exchange leg alone: when a page request carries the
 * verifier AND the challenge cookie, forward it once to our own
 * /api/auth/get-session (the lib's handler proxies query params and cookies
 * upstream, the auth backend validates challenge+verifier, and our route
 * re-signs and rewrites Domain=.entrestate.com on the way back), then
 * redirect to the same URL with the verifier removed, carrying the fresh
 * Set-Cookie headers. Failure falls through to today's behaviour.
 */
// The lib's constant — "challange" [sic] is THEIR spelling
// (NEON_AUTH_SESSION_CHALLENGE_COOKIE_NAME); correcting it breaks the match.
const OAUTH_VERIFIER_PARAM = "neon_auth_session_verifier"
const OAUTH_CHALLENGE_COOKIE = "__Secure-neon-auth.session_challange"

async function completeOAuthReturn(request: NextRequest): Promise<NextResponse | null> {
  const { nextUrl } = request
  // Never intercept API routes: the exchange below fetches /api/auth itself,
  // and intercepting that fetch would recurse forever.
  if (nextUrl.pathname.startsWith("/api/")) return null
  const verifier = nextUrl.searchParams.get(OAUTH_VERIFIER_PARAM)
  if (!verifier || !request.cookies.has(OAUTH_CHALLENGE_COOKIE)) return null

  try {
    const exchangeUrl = new URL("/api/auth/get-session", nextUrl.origin)
    exchangeUrl.searchParams.set(OAUTH_VERIFIER_PARAM, verifier)
    const upstream = await fetch(exchangeUrl, {
      headers: { cookie: request.headers.get("cookie") ?? "" },
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    })
    const getSetCookie = (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie
    const setCookies = typeof getSetCookie === "function" ? getSetCookie.call(upstream.headers) : []
    if (!upstream.ok || setCookies.length === 0) return null

    const cleanUrl = nextUrl.clone()
    cleanUrl.searchParams.delete(OAUTH_VERIFIER_PARAM)
    const response = NextResponse.redirect(cleanUrl)
    for (const cookie of setCookies) {
      response.headers.append("set-cookie", cookie)
    }
    return response
  } catch {
    // Unreachable auth backend or timeout: fall through — the page then
    // behaves exactly as before this fix (bounce to login), never a 500.
    return null
  }
}

export async function proxy(request: NextRequest) {
  // The OAuth return leg runs before every other rule: a session being born
  // must not be eaten by the mobile-host redirect or a protected layout.
  const oauthResponse = await completeOAuthReturn(request)
  if (oauthResponse) return oauthResponse

  const { pathname } = request.nextUrl
  const requestHost = request.headers.get("x-forwarded-host") || request.headers.get("host")
  const runtimeShell = resolveRuntimeShell(requestHost)
  const segments = pathname.split("/").filter(Boolean)
  const pathLocale = segments[0]
  const internalPathname = isLocale(pathLocale) ? stripLocalePrefix(pathname) : pathname
  const headerLocale = request.headers.get("x-entrestate-locale")
  const cookieLocale = request.cookies.get(localeCookieName)?.value
  const activeLocale = isLocale(pathLocale)
    ? pathLocale
    : isLocale(headerLocale)
      ? headerLocale
      : isLocale(cookieLocale)
        ? cookieLocale
        : defaultLocale
  const notFoundText = activeLocale === "ar" ? "غير موجود" : "Not Found"
  const unavailableText = activeLocale === "ar" ? "الخدمة غير متاحة" : "Service Unavailable"
  const isAutomationBuilderRoute = AUTOMATION_BUILDER_PATHS.some((path) => internalPathname.startsWith(path))
  const isKillSwitchRoute = KILL_SWITCH_PATHS.some((path) => internalPathname.startsWith(path))
  const secureCookie = request.nextUrl.protocol === "https:"
  const userAgent = request.headers.get("user-agent")

  if (
    request.method === "GET"
    && isPrimaryWebHost(requestHost)
    && isMobileUserAgent(userAgent)
    && !pathname.startsWith("/_next/")
    && !pathname.startsWith("/api/")
    && !/\.[a-z0-9]+$/i.test(pathname)
    && request.nextUrl.searchParams.get("desktop") !== "1"
  ) {
    const mobileHostname = getMobileWebHostname(requestHost)
    if (mobileHostname) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.hostname = mobileHostname
      return applyLocaleCookie(NextResponse.redirect(redirectUrl, 307), activeLocale, secureCookie)
    }
  }

  if (isAutomationBuilderRoute) {
    const enabled = process.env.NEXT_PUBLIC_ENABLE_AUTOMATION_BUILDER === "true"
    if (process.env.NODE_ENV === "production" && !enabled) {
      return new NextResponse(notFoundText, { status: 404 })
    }
  }

  if (isKillSwitchRoute && process.env.ENTRESTATE_KILL_SWITCH === "true") {
    return new NextResponse(unavailableText, { status: 503 })
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-entrestate-locale", activeLocale)
  requestHeaders.set("x-entrestate-shell", runtimeShell)

  if (pathname.length > 1 && pathname.endsWith("/")) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = pathname.replace(/\/+$/, "")
    return applyLocaleCookie(NextResponse.redirect(redirectUrl, 308), activeLocale, secureCookie)
  }

  if (internalPathname === "/api" || internalPathname.startsWith("/api/")) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  // ── The surface is what this product IS ─────────────────────────────────────
  //
  // 51 of the 145 page routes here are reachable only by typing the address, and
  // most are the same product built again — /os, /dashboard, /me and
  // /workspace/* are four attempts at one screen. A visitor who found one saw a
  // half-built Entrestate that nobody maintains. lib/surface.ts names what is
  // hidden and why; SHOW_ALL_ROUTES=1 turns it off for a preview.
  //
  // Placed after the locale prefix is stripped so /en/os and /os are one
  // decision, and before every rewrite below so a hidden page cannot slip
  // through on one branch of them.
  if (isHiddenRoute(internalPathname)) {
    // Rewritten to a path that has no route, so Next renders the app's own
    // not-found page with a real 404 — a hidden page must look missing, not
    // blank, and must not answer 200 to a crawler.
    const missing = request.nextUrl.clone()
    missing.pathname = "/_hidden"
    return NextResponse.rewrite(missing)
  }

  if (isLocale(pathLocale) && LOCALE_SHORTCUT_REDIRECTS[internalPathname]) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = prefixLocalePath(LOCALE_SHORTCUT_REDIRECTS[internalPathname], activeLocale)
    return applyLocaleCookie(NextResponse.redirect(redirectUrl, 308), activeLocale, secureCookie)
  }

  if (/^\/(en|ar)\/plans\/?$/.test(pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = pathname.replace("/plans", "/pricing")
    return applyLocaleCookie(NextResponse.redirect(redirectUrl, 301), activeLocale, secureCookie)
  }

  if (isLocale(pathLocale)) {
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = internalPathname

    const response = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    })

    return applyLocaleCookie(response, activeLocale, secureCookie)
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  return applyLocaleCookie(response, activeLocale, secureCookie)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
}
