import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const AUTOMATION_BUILDER_PATHS = ["/apps/automation-builder", "/api/automation-builder"]
const KILL_SWITCH_PATHS = ["/api/time-table", "/api/scoring", "/api/profile", "/api/distribution"]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAutomationBuilderRoute = AUTOMATION_BUILDER_PATHS.some((path) => pathname.startsWith(path))
  const isKillSwitchRoute = KILL_SWITCH_PATHS.some((path) => pathname.startsWith(path))

  if (isAutomationBuilderRoute) {
    const enabled = process.env.NEXT_PUBLIC_ENABLE_AUTOMATION_BUILDER === "true"
    if (process.env.NODE_ENV === "production" && !enabled) {
      return new NextResponse("Not Found", { status: 404 })
    }
  }

  if (isKillSwitchRoute && process.env.ENTRESTATE_KILL_SWITCH === "true") {
    return new NextResponse("Service Unavailable", { status: 503 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/apps/automation-builder/:path*", "/api/automation-builder/:path*", "/api/time-table/:path*", "/api/scoring/:path*", "/api/profile/:path*", "/api/distribution/:path*"],
}
