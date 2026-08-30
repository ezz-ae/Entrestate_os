import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * THE OAUTH RETURN LEG STAYS WIRED — pinned, because its absence was invisible.
 *
 * The owner signed in with Google on terminal.entrestate.com and landed back
 * on the login form, every time. Nothing was "broken" in any log: the auth
 * backend answered, Google answered, the page rendered. What was missing was
 * a STEP — @neondatabase/auth completes OAuth in its Next middleware
 * (verifier param + challenge cookie → get-session → session cookie), the
 * Terminal never mounted that middleware (it force-protects every route,
 * and this product is public-first), so /me's server layout bounced the
 * session-less request to /login and the bounce destroyed the verifier.
 *
 * proxy.ts now performs the exchange leg itself. These pins keep it exact:
 * the lib's param and cookie names (including the lib's own misspelling
 * "challange" — correcting it silently breaks the match), the API-path
 * exclusion (the exchange fetches /api/auth itself; intercepting that fetch
 * recurses forever), the Set-Cookie relay, and fail-through on error.
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

describe("the OAuth return leg", () => {
  const proxy = stripComments(read("proxy.ts"))

  it("speaks the library's exact names — verifier param and the misspelt challenge cookie", () => {
    expect(proxy).toContain('"neon_auth_session_verifier"')
    expect(proxy).toContain('"__Secure-neon-auth.session_challange"')
    // The lib spells it "challange"; the correctly spelt name matches nothing.
    expect(proxy).not.toContain("session_challenge")
  })

  it("matches what the library itself uses, so a lib bump cannot silently drift the names", () => {
    const lib = read("node_modules/@neondatabase/auth/dist/next/server/index.mjs")
    expect(lib).toContain('"__Secure-neon-auth"')
    expect(lib).toContain(".session_challange")
    const constants = fs
      .readdirSync(path.join(ROOT, "node_modules/@neondatabase/auth/dist"))
      .filter((f) => f.startsWith("constants-") && f.endsWith(".mjs"))
      .map((f) => read(`node_modules/@neondatabase/auth/dist/${f}`))
      .join("\n")
    expect(constants).toContain('"neon_auth_session_verifier"')
  })

  it("runs before every other rule, never on API routes, and relays the fresh cookies", () => {
    expect(proxy).toMatch(/export async function proxy\(/)
    // First statement of proxy(): the exchange.
    const body = proxy.slice(proxy.indexOf("export async function proxy("))
    expect(body.indexOf("completeOAuthReturn(request)")).toBeLessThan(body.indexOf("requestHost"))
    expect(proxy).toContain('nextUrl.pathname.startsWith("/api/")) return null')
    expect(proxy).toContain('new URL("/api/auth/get-session", nextUrl.origin)')
    expect(proxy).toContain('response.headers.append("set-cookie", cookie)')
    expect(proxy).toContain("cleanUrl.searchParams.delete(OAUTH_VERIFIER_PARAM)")
  })

  it("falls through on failure — a broken exchange is yesterday's bounce, never a 500", () => {
    const fn = proxy.slice(proxy.indexOf("async function completeOAuthReturn"), proxy.indexOf("export async function proxy("))
    expect(fn).toMatch(/catch\s*\{[\s\S]*?return null/)
    expect(fn).toContain("if (!upstream.ok || setCookies.length === 0) return null")
    expect(fn).toContain("AbortSignal.timeout(")
  })
})
