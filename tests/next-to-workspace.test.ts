import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import {
  buildLoginHref,
  goToPostLoginHref,
  isHouseUrl,
  normalizeNextPath,
  oauthCallbackHref,
  resolvePostLoginHref,
} from "@/lib/auth/navigation"

/**
 * THE SIGN-IN MAY SEND A PERSON BACK TO THEIR WORKSPACE — AND NOWHERE ELSE.
 *
 * One Entrestate account opens every surface, including a customer's own
 * workspace at https://<customer>.entrestate.com. That workspace sends a
 * person here to sign in and needs them back on ITS host afterwards, where
 * /api/wl/recognise turns the session into the workspace session. Before this,
 * `next` accepted relative paths only, so that person landed on /me and had
 * to find the workspace again — three hops, and the owner tripped on every
 * one of them.
 *
 * The open-redirect guard stays exactly as strict for everything that is not
 * our own house: https only, entrestate.com and its subdomains on a real dot
 * boundary, no credentials in the URL. Everything else is still the fallback.
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")

describe("what counts as our own house", () => {
  it("accepts entrestate.com and its subdomains over https", () => {
    expect(isHouseUrl("https://mahmoud.entrestate.com/api/wl/recognise")).toBe(true)
    expect(isHouseUrl("https://entrestate.com/business/account")).toBe(true)
    expect(isHouseUrl("https://deep.sub.entrestate.com/x?y=1#z")).toBe(true)
    expect(isHouseUrl("  https://mahmoud.entrestate.com/  ")).toBe(true)
  })

  it("refuses look-alikes on the dot boundary", () => {
    expect(isHouseUrl("https://evil-entrestate.com/")).toBe(false)
    expect(isHouseUrl("https://entrestate.com.evil.example/")).toBe(false)
    expect(isHouseUrl("https://notentrestate.com/")).toBe(false)
    expect(isHouseUrl("https://entrestate.co/")).toBe(false)
  })

  it("refuses http, credentials, and anything that is not a URL", () => {
    expect(isHouseUrl("http://mahmoud.entrestate.com/")).toBe(false)
    expect(isHouseUrl("https://user:pw@mahmoud.entrestate.com/")).toBe(false)
    expect(isHouseUrl("https://evil.example@mahmoud.entrestate.com/")).toBe(false)
    expect(isHouseUrl("mahmoud.entrestate.com/api/wl/recognise")).toBe(false)
    expect(isHouseUrl("//mahmoud.entrestate.com/")).toBe(false)
    expect(isHouseUrl("javascript:alert(1)")).toBe(false)
    expect(isHouseUrl("")).toBe(false)
    expect(isHouseUrl(null)).toBe(false)
    expect(isHouseUrl(undefined)).toBe(false)
  })
})

describe("`next` keeps its guard for everything else", () => {
  it("still refuses foreign absolute URLs and protocol-relative paths", () => {
    expect(normalizeNextPath("https://evil.example/", "/me")).toBe("/me")
    expect(normalizeNextPath("//evil.example/", "/me")).toBe("/me")
    expect(normalizeNextPath("evil", "/me")).toBe("/me")
  })

  it("still strips the locale from relative paths", () => {
    expect(normalizeNextPath("/ar/notebook?x=1#top", "/me")).toBe("/notebook?x=1#top")
  })

  it("passes a house URL through untouched", () => {
    const back = "https://mahmoud.entrestate.com/api/wl/recognise"
    expect(normalizeNextPath(back, "/me")).toBe(back)
  })
})

describe("after sign-in, a house URL is the destination itself", () => {
  const back = "https://mahmoud.entrestate.com/api/wl/recognise?next=%2Ffreehold-intelligence"

  it("is neither locale-prefixed nor rewritten into the chat shell", () => {
    expect(resolvePostLoginHref("ar", back, "/me")).toBe(back)
    expect(resolvePostLoginHref("en", back, "/me")).toBe(back)
  })

  it("relative paths keep their behaviour", () => {
    expect(resolvePostLoginHref("ar", "/notebook", "/me")).toBe("/ar/notebook")
    expect(resolvePostLoginHref("en", "/chat?prompt=hi", "/me")).toBe("/en/me?openChat=true&prompt=hi")
  })

  it("buildLoginHref carries a house URL as `next`", () => {
    expect(buildLoginHref("en", back)).toBe(`/en/login?next=${encodeURIComponent(back)}`)
  })

  it("a house URL is a real navigation, a path is a soft one", () => {
    const calls: string[] = []
    const router = { replace: (href: string) => { calls.push(href) } }
    const replaced: string[] = []
    // Node environment: stand in for the browser's window for the one call
    // that needs it, and take it away again.
    const g = globalThis as { window?: unknown }
    g.window = { location: { replace: (href: string) => { replaced.push(href) } } }
    try {
      goToPostLoginHref(router, "/en/me")
      goToPostLoginHref(router, back)
    } finally {
      delete g.window
    }
    expect(calls).toEqual(["/en/me"])
    expect(replaced).toEqual([back])
  })

  it("an OAuth callback for a house URL comes back to this page first, carrying `next`", () => {
    expect(oauthCallbackHref("en", back, "/login")).toBe(`/en/login?next=${encodeURIComponent(back)}`)
    expect(oauthCallbackHref("ar", back, "/signup")).toBe(`/ar/signup?next=${encodeURIComponent(back)}`)
    expect(oauthCallbackHref("en", "/en/me", "/login")).toBe("/en/me")
  })
})

describe("both sign-in surfaces use the helpers, not the router directly", () => {
  for (const [file, page] of [
    ["components/auth/login-page-client.tsx", "/login"],
    ["components/auth/signup-page-client.tsx", "/signup"],
  ] as const) {
    it(`${file} navigates through goToPostLoginHref`, () => {
      const src = read(file)
      expect(src).toContain("goToPostLoginHref(router, targetHref)")
      expect(src).not.toContain("router.replace(targetHref)")
    })
    it(`${file} hands OAuth a callback that returns here for a house URL`, () => {
      expect(read(file)).toContain(`callbackURL: oauthCallbackHref(locale, targetHref, "${page}")`)
    })
  }

  it("the server pages redirect a signed-in visitor through the same resolver (absolute URLs allowed by Next's redirect)", () => {
    for (const file of ["app/login/page.tsx", "app/signup/page.tsx"]) {
      expect(read(file)).toContain('redirect(resolvePostLoginHref(locale, firstParam(params.next), "/me"))')
    }
  })
})
