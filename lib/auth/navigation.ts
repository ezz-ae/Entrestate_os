import { prefixLocalePath, stripLocalePrefix, type AppLocale } from "@/i18n/locale"

export function normalizeNextPath(nextPath: string | null | undefined, fallback = "/account") {
  const trimmed = nextPath?.trim() ?? ""
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback
  }

  const [pathWithQuery, hashPart] = trimmed.split("#")
  const [pathname, queryPart] = pathWithQuery.split("?")
  const normalizedPath = stripLocalePrefix(pathname || "/")

  return `${normalizedPath}${queryPart ? `?${queryPart}` : ""}${hashPart ? `#${hashPart}` : ""}`
}

export function buildLoginHref(locale: AppLocale, nextPath = "/account") {
  const safeNextPath = normalizeNextPath(nextPath, "/account")
  return prefixLocalePath(`/login?next=${encodeURIComponent(safeNextPath)}`, locale)
}

export function resolvePostLoginHref(
  locale: AppLocale,
  nextPath: string | null | undefined,
  fallback = "/account",
) {
  return prefixLocalePath(normalizeNextPath(nextPath, fallback), locale)
}
