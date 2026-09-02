import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * SIGNED OUT AND "THE DATABASE DID NOT ANSWER" MUST STAY DIFFERENT ANSWERS.
 *
 * On 2026-09-02 terminal.entrestate.com trapped a signed-in person in an
 * infinite redirect: /me asked getSyncedUser(), which caught a Prisma P2021
 * ("the table `public.users` does not exist") and returned null; every caller
 * reads null as "not signed in", so /me sent them to /login, /login found a
 * perfectly valid session and sent them back. 330 round trips in two minutes.
 *
 * The bug was not the missing table — that is a database problem with its own
 * fix. The bug was that nine page guards each decided, independently, that a
 * falsy user means "go to /login", so any fault that breaks only the database
 * read becomes a loop AND tells the person something false about themselves.
 *
 * These assertions keep the decision in one place.
 */

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8")

const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? walk(p) : /\.tsx?$/.test(e.name) ? [p] : []
  })

describe("the synced-user lookup reports why it failed", () => {
  const sync = read("lib/auth/sync.ts")

  it("distinguishes anonymous from unavailable", () => {
    expect(sync).toContain('status: "anonymous"')
    expect(sync).toContain('status: "unavailable"')
    expect(sync).toContain('status: "ready"')
  })

  it("a database failure is never reported as a missing session", () => {
    // The catch block must produce "unavailable", not null/anonymous.
    const catchBlock = sync.slice(sync.indexOf("} catch"))
    expect(catchBlock).toContain('status: "unavailable"')
    expect(catchBlock).not.toContain('status: "anonymous"')
  })
})

describe("no page decides the login redirect on its own", () => {
  const guard = read("lib/auth/guard.ts")

  it("requireSyncedUser redirects only when there is no session", () => {
    const redirectBlock = guard.slice(guard.indexOf('result.status === "anonymous"'))
    expect(redirectBlock).toContain("buildLoginHref")
    // The unavailable branch must throw, never redirect: sending a signed-in
    // person to /login is precisely the loop.
    const afterRedirect = guard.slice(guard.indexOf("throw new Error"))
    expect(afterRedirect).toBeTruthy()
    expect(guard.match(/buildLoginHref/g)?.length).toBe(2) // import + the one use
  })

  it("no page under app/ pairs getSyncedUser with a login redirect", () => {
    const offenders = walk(path.join(ROOT, "app"))
      .filter((p) => {
        const text = fs.readFileSync(p, "utf8")
        return text.includes("getSyncedUser") && text.includes("buildLoginHref")
      })
      .map((p) => path.relative(ROOT, p))
    // Guarded pages call requireSyncedUser("/next/path") instead.
    expect(offenders).toEqual([])
  })
})
