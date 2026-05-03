import { prefixLocalePath, stripLocalePrefix, type AppLocale } from "@/i18n/locale"

type BuildCopilotShellHrefOptions = {
  authenticated: boolean
  locale: AppLocale
  pathname?: string | null
  search?: string | URLSearchParams | null
  prompt?: string | null
  sessionId?: string | null
}

export function getCopilotShellBasePath(authenticated: boolean) {
  return authenticated ? "/me" : "/"
}

export function buildCopilotShellHref({
  authenticated,
  locale,
  pathname,
  search,
  prompt,
  sessionId,
}: BuildCopilotShellHrefOptions) {
  const localizedBasePath = prefixLocalePath(
    stripLocalePrefix(pathname || getCopilotShellBasePath(authenticated)),
    locale,
  )
  const url = new URL(localizedBasePath, "https://entrestate.local")
  const searchParams = typeof search === "string"
    ? new URLSearchParams(search.replace(/^\?/, ""))
    : new URLSearchParams(search ?? undefined)

  searchParams.set("openChat", "true")

  if (sessionId) {
    searchParams.set("id", sessionId)
  } else {
    searchParams.delete("id")
  }

  if (prompt) {
    searchParams.set("prompt", prompt)
  } else {
    searchParams.delete("prompt")
  }

  searchParams.delete("q")
  url.search = searchParams.toString()

  return `${url.pathname}${url.search}${url.hash}`
}
