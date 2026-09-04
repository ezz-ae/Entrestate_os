import { prefixLocalePath, stripLocalePrefix, type AppLocale } from "@/i18n/locale"

/**
 * THE ONE PLACE `next` MAY LEAVE THIS HOST.
 *
 * The sign-in's `next` has always been a relative path — the open-redirect
 * guard below refuses anything else, and that stays. The one exception is
 * our own house: a workspace at `https://<customer>.entrestate.com` sends a
 * person here to sign in with the ONE Entrestate account and needs them back
 * on that host afterwards, where `/api/wl/recognise` turns the session into
 * the workspace session. Without this, that person landed on /me and had to
 * find the workspace again — the "three hops" the owner kept tripping over.
 *
 * Only https, only entrestate.com and its subdomains, and the host is matched
 * on its own dot boundary so `evil-entrestate.com` and
 * `entrestate.com.evil.example` are strangers. Credentials in the URL
 * (`https://user:pw@…`) are refused because they are not something a
 * workspace would ever send and are how a URL lies about its host.
 */
const HOUSE_DOMAIN = "entrestate.com"

export function isHouseUrl(candidate: string | null | undefined): boolean {
  const trimmed = candidate?.trim() ?? ""
  if (!/^https:\/\//i.test(trimmed)) return false
  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return false
  }
  if (url.protocol !== "https:") return false
  if (url.username || url.password) return false
  const host = url.hostname.toLowerCase()
  return host === HOUSE_DOMAIN || host.endsWith(`.${HOUSE_DOMAIN}`)
}

export function normalizeNextPath(nextPath: string | null | undefined, fallback = "/account") {
  const trimmed = nextPath?.trim() ?? ""
  if (isHouseUrl(trimmed)) return trimmed
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback
  }

  const [pathWithQuery, hashPart] = trimmed.split("#")
  const [pathname, queryPart] = pathWithQuery.split("?")
  const normalizedPath = stripLocalePrefix(pathname || "/")

  return `${normalizedPath}${queryPart ? `?${queryPart}` : ""}${hashPart ? `#${hashPart}` : ""}`
}

export function buildLoginHref(locale: AppLocale, nextPath = "/me") {
  const safeNextPath = normalizeNextPath(nextPath, "/me")
  return prefixLocalePath(`/login?next=${encodeURIComponent(safeNextPath)}`, locale)
}

export function resolvePostLoginHref(
  locale: AppLocale,
  nextPath: string | null | undefined,
  fallback = "/me",
) {
  const normalizedPath = normalizeNextPath(nextPath, fallback)
  // A house URL is another host: no locale prefix, no chat-shell rewriting.
  if (isHouseUrl(normalizedPath)) return normalizedPath
  const [pathWithQuery, hashPart] = normalizedPath.split("#")
  const [pathname, queryPart] = pathWithQuery.split("?")
  const sourceParams = new URLSearchParams(queryPart ?? "")

  if (pathname === "/chat" || sourceParams.get("openChat") === "true") {
    const shellParams = new URLSearchParams()
    shellParams.set("openChat", "true")

    const sessionId = sourceParams.get("id")
    if (sessionId) {
      shellParams.set("id", sessionId)
    }

    const prompt = sourceParams.get("prompt") ?? sourceParams.get("q")
    if (prompt) {
      shellParams.set("prompt", prompt)
    }

    return prefixLocalePath(`/me?${shellParams.toString()}${hashPart ? `#${hashPart}` : ""}`, locale)
  }

  return prefixLocalePath(normalizedPath, locale)
}

/**
 * Go to the post-login target. A path is a soft navigation inside this app;
 * a house URL is another origin and needs a real navigation — the router
 * would try to render it as one of our routes.
 */
export function goToPostLoginHref(router: { replace: (href: string) => void }, href: string) {
  if (isHouseUrl(href)) {
    window.location.replace(href)
    return
  }
  router.replace(href)
}

/**
 * What to hand an OAuth provider as callbackURL. A house URL is on another
 * origin, and the auth server only trusts its own; so the callback comes back
 * HERE, to the sign-in page with the same `next`, and this page finishes the
 * trip once the session exists. Same door, one more knock.
 */
export function oauthCallbackHref(locale: AppLocale, targetHref: string, page: "/login" | "/signup") {
  if (!isHouseUrl(targetHref)) return targetHref
  return prefixLocalePath(`${page}?next=${encodeURIComponent(targetHref)}`, locale)
}
