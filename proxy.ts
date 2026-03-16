import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { defaultLocale, isLocale, localeCookieName, stripLocalePrefix } from "@/i18n/locale"

const AUTOMATION_BUILDER_PATHS = ["/apps/automation-builder", "/api/automation-builder"]
const KILL_SWITCH_PATHS = ["/api/time-table", "/api/scoring", "/api/profile", "/api/distribution"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const segments = pathname.split("/").filter(Boolean)
  const pathLocale = segments[0]
  const internalPathname = isLocale(pathLocale) ? stripLocalePrefix(pathname) : pathname
  const isAutomationBuilderRoute = AUTOMATION_BUILDER_PATHS.some((path) => internalPathname.startsWith(path))
  const isKillSwitchRoute = KILL_SWITCH_PATHS.some((path) => internalPathname.startsWith(path))

  if (isAutomationBuilderRoute) {
    const enabled = process.env.NEXT_PUBLIC_ENABLE_AUTOMATION_BUILDER === "true"
    if (process.env.NODE_ENV === "production" && !enabled) {
      return new NextResponse("Not Found", { status: 404 })
    }
  }

  if (isKillSwitchRoute && process.env.ENTRESTATE_KILL_SWITCH === "true") {
    return new NextResponse("Service Unavailable", { status: 503 })
  }

  if (internalPathname.startsWith("/api")) {
    return NextResponse.next()
  }

  const cookieLocale = request.cookies.get(localeCookieName)?.value
  const activeLocale = isLocale(pathLocale) ? pathLocale : isLocale(cookieLocale) ? cookieLocale : defaultLocale
  const requestHeaders = new Headers(request.headers)

  requestHeaders.set("x-entrestate-locale", activeLocale)

  if (isLocale(pathLocale)) {
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = internalPathname

    const response = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    })

    response.cookies.set(localeCookieName, activeLocale, {
      path: "/",
      sameSite: "lax",
    })

    return response
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  response.cookies.set(localeCookieName, activeLocale, {
    path: "/",
    sameSite: "lax",
  })

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)"],
}
