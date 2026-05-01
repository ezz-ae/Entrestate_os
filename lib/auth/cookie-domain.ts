const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"])

function normalizeHost(value: string) {
  return value.trim().toLowerCase().replace(/:\d+$/, "")
}

function toCookieDomain(hostname: string | null | undefined) {
  if (!hostname) return undefined

  const normalized = normalizeHost(hostname).replace(/^\.+/, "")
  if (!normalized || LOCAL_HOSTS.has(normalized)) {
    return undefined
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(normalized)) {
    return undefined
  }

  const apexHostname = normalized.replace(/^www\./, "")
  if (!apexHostname.includes(".")) {
    return undefined
  }

  return `.${apexHostname}`
}

export function getSharedAuthCookieDomain(host?: string | null) {
  const explicitDomain = toCookieDomain(process.env.NEON_AUTH_COOKIE_DOMAIN)
  if (explicitDomain) {
    return explicitDomain
  }

  if (host) {
    const derivedFromHost = toCookieDomain(host)
    if (derivedFromHost) {
      return derivedFromHost
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (!siteUrl) {
    return undefined
  }

  try {
    return toCookieDomain(new URL(siteUrl).hostname)
  } catch {
    return toCookieDomain(siteUrl)
  }
}

export function applyCookieDomain(setCookieValue: string, cookieDomain?: string) {
  if (!cookieDomain) {
    return setCookieValue
  }

  if (/;\s*domain=/i.test(setCookieValue)) {
    return setCookieValue.replace(/;\s*domain=[^;]+/i, `; Domain=${cookieDomain}`)
  }

  return `${setCookieValue}; Domain=${cookieDomain}`
}
