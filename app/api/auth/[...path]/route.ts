import { NextResponse } from "next/server"
import { getAuth } from "@/lib/auth/server"
import { isMobileWebHost } from "@/lib/runtime-host"

type AuthParams = { params: Promise<{ path: string[] }> }

const auth = getAuth()
const handler = auth?.handler()
const authBaseUrl = process.env.NEON_AUTH_BASE_URL?.replace(/\/+$/, "") ?? ""
const trustedOriginOverride =
  process.env.NEON_AUTH_TRUSTED_ORIGIN?.trim().replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") ||
  ""

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || ""
}

function deriveOrigin(request: Request) {
  const directOrigin = firstHeaderValue(request.headers.get("origin"))
  if (trustedOriginOverride && directOrigin) {
    try {
      if (isMobileWebHost(new URL(directOrigin).host)) {
        return directOrigin
      }
    } catch {}
  }
  if (directOrigin) return directOrigin

  const forwardedHost = firstHeaderValue(request.headers.get("x-forwarded-host"))
  const host = forwardedHost || firstHeaderValue(request.headers.get("host"))
  const forwardedProto = firstHeaderValue(request.headers.get("x-forwarded-proto"))
  const proto = forwardedProto || (host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https")

  if (trustedOriginOverride && host && isMobileWebHost(host)) {
    return `${proto}://${host}`
  }

  if (trustedOriginOverride) {
    return trustedOriginOverride
  }

  if (host) {
    return `${proto}://${host}`
  }

  return new URL(request.url).origin
}

async function proxyEmailAuth(request: Request, context: AuthParams) {
  if (!authBaseUrl) {
    return missingAuth(request, context)
  }

  const params = await context.params
  const path = params?.path ?? []
  const joinedPath = path.join("/")
  const isAuthWritePath = joinedPath.startsWith("sign-in/") || joinedPath.startsWith("sign-up/")

  if (request.method !== "POST" || !isAuthWritePath) {
    return null
  }

  const upstreamUrl = new URL(`${authBaseUrl}/${joinedPath}`)
  upstreamUrl.search = new URL(request.url).search

  const upstreamHeaders = new Headers()
  const passthroughHeaders = ["content-type", "user-agent", "accept-language", "authorization", "referer"]
  for (const header of passthroughHeaders) {
    const value = request.headers.get(header)
    if (value) upstreamHeaders.set(header, value)
  }

  const cookie = request.headers.get("cookie")
  if (cookie) {
    upstreamHeaders.set("cookie", cookie)
  }

  upstreamHeaders.set("origin", deriveOrigin(request))
  upstreamHeaders.set("x-neon-auth-middleware", "true")

  const body = await request.text()

  try {
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: "POST",
      headers: upstreamHeaders,
      body,
      redirect: "manual",
    })

    const responseHeaders = new Headers()
    const allowlistHeaders = [
      "content-type",
      "cache-control",
      "x-neon-ret-request-id",
      "location",
    ]

    for (const header of allowlistHeaders) {
      const value = upstreamResponse.headers.get(header)
      if (value) responseHeaders.set(header, value)
    }

    const getSetCookie = (upstreamResponse.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie
    if (typeof getSetCookie === "function") {
      for (const setCookieValue of getSetCookie.call(upstreamResponse.headers)) {
        responseHeaders.append("set-cookie", setCookieValue)
      }
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    })
  } catch {
    return NextResponse.json({ error: "Unable to connect to Neon Auth." }, { status: 502 })
  }
}

const missingAuth = async (_request: Request, context: AuthParams) => {
  const params = await context.params
  const path = params?.path?.[0]
  if (path === "get-session") {
    return NextResponse.json({ data: null }, { status: 200 })
  }
  return NextResponse.json({ error: "Neon Auth is not configured." }, { status: 501 })
}

export const GET = handler?.GET ?? (async (request: Request, context: AuthParams) => missingAuth(request, context))
export const POST = async (request: Request, context: AuthParams) => {
  const proxied = await proxyEmailAuth(request, context)
  if (proxied) return proxied

  if (handler?.POST) {
    return handler.POST(request, context)
  }

  return missingAuth(request, context)
}
export const PUT = handler?.PUT ?? (async (request: Request, context: AuthParams) => missingAuth(request, context))
export const DELETE = handler?.DELETE ?? (async (request: Request, context: AuthParams) => missingAuth(request, context))
export const PATCH = handler?.PATCH ?? (async (request: Request, context: AuthParams) => missingAuth(request, context))
