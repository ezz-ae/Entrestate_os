import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * A DEPLOYMENT THAT CANNOT SIGN ANYONE IN MUST SAY SO — locked.
 *
 * terminal.entrestate.com served /en/login with the whole form: Continue with
 * Google, an email field, a password field, a Sign in button, a testimonial. It
 * could not sign anyone in. lib/auth/server.ts returns null when
 * NEON_AUTH_BASE_URL or NEON_AUTH_COOKIE_SECRET is missing, /api/auth/session
 * answered 501, and the form's button did nothing a person could interpret. The
 * only explanation was a console.warn nobody was going to read.
 *
 * The owner's report was "the new site on production does not log in", and the
 * screen gave him no way to get further than that. So:
 *
 *   1. THE REASON IS A VALUE, not a log line — authStatus() names which setting
 *      is missing, and the value itself is never returned.
 *   2. THE PAGE READS IT. Sign-in and sign-up refuse before rendering a form,
 *      so a misconfigured deployment cannot show a working-looking one.
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")

describe("auth configuration", () => {
  const server = read("lib/auth/server.ts")

  it("names the reason instead of only warning", () => {
    expect(server).toMatch(/export function authStatus\(\)/)
    for (const reason of ["missing-base-url", "missing-cookie-secret", "weak-cookie-secret"]) {
      expect(server, `authStatus must distinguish ${reason}`).toContain(reason)
    }
  })

  it("still refuses a cookie secret too short to sign a session", () => {
    expect(server).toMatch(/cookieSecret\.length < 32/)
  })

  it("never puts a secret value in the status", () => {
    // The status crosses to a client component; only names may travel.
    const fn = server.slice(server.indexOf("export function authStatus()"))
    const body = fn.slice(0, fn.indexOf("\n}") + 2)
    expect(body).not.toMatch(/return[^\n]*cookieSecret[^.]/)
    expect(body).not.toMatch(/return[^\n]*\bbaseUrl\b/)
  })

  it("builds the auth client only when the status is ready", () => {
    expect(server).toMatch(/export const authEnabled = authStatus\(\)\.ready/)
    expect(server).toMatch(/export const auth = authEnabled\s*\n?\s*\?\s*createNeonAuth/)
  })
})

describe("the sign-in and sign-up pages", () => {
  for (const page of ["app/login/page.tsx", "app/signup/page.tsx"]) {
    it(`${page} refuses before rendering a form it cannot submit`, () => {
      const src = read(page)
      expect(src).toContain("authStatus")
      expect(src).toMatch(/if \(!status\.ready\) return <AuthUnavailable reason=\{status\.reason\}/)
      // The refusal must come before the form, not after it.
      const guard = src.indexOf("status.ready")
      const form = src.search(/<(LoginPageClient|SignUpPageClient)/)
      expect(guard).toBeGreaterThan(-1)
      expect(guard).toBeLessThan(form)
    })
  }

  it("tells the reader which setting is missing, in both languages", () => {
    const src = read("components/auth/auth-unavailable.tsx")
    expect(src).toContain("NEON_AUTH_BASE_URL")
    expect(src).toContain("NEON_AUTH_COOKIE_SECRET")
    expect(src).toMatch(/\ben\b\s*:/)
    expect(src).toMatch(/\bar\b\s*:/)
    // …and leaves a way out of the dead end.
    expect(src).toContain('"/markets"')
    expect(src).toContain('"/pricing"')
  })
})
