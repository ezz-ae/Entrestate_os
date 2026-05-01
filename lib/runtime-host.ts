export type RuntimeShell = "default" | "mobile"

function firstHeaderValue(value: string | null | undefined) {
  return value?.split(",")[0]?.trim() ?? ""
}

export function getRequestHostname(host: string | null | undefined) {
  return firstHeaderValue(host).replace(/:\d+$/, "").toLowerCase()
}

export function isMobileWebHost(host: string | null | undefined) {
  const hostname = getRequestHostname(host)
  return hostname === "m.entrestate.com" || hostname === "m.localhost" || hostname.startsWith("m.")
}

export function resolveRuntimeShell(host: string | null | undefined): RuntimeShell {
  return isMobileWebHost(host) ? "mobile" : "default"
}
