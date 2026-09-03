import "server-only"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "./server"

/**
 * "SIGNED OUT" AND "THE DATABASE DID NOT ANSWER" ARE DIFFERENT ANSWERS.
 *
 * This function used to collapse them. Any Prisma failure was caught and
 * returned as null, and every caller reads null as "not signed in". On
 * 2026-09-02 that produced an infinite redirect on terminal.entrestate.com:
 *
 *   /me   → getSyncedUser() → prisma.user.findUnique() → P2021, the table
 *           `public.users` does not exist → catch → null → "signed out"
 *           → redirect to /login?next=/me
 *   /login → getSessionUser() → the session is real and valid
 *           → redirect to /me
 *   → and round again. 330 times in two minutes, for one signed-in person.
 *
 * The two pages disagreed by construction: login asks whether a session
 * exists, /me asks that AND whether a database read succeeds. Any condition
 * that breaks only the second one is an unbreakable loop, and the screen says
 * "you are not signed in", which is false.
 *
 * So the three outcomes are now three values, following the same rule
 * lib/auth/server.ts already applies to a missing auth secret: a deployment
 * fault must be visible on the screen it breaks, not disguised as something
 * the person did. Callers that guard a page use requireSyncedUser() in
 * lib/auth/guard.ts, which redirects only on "anonymous".
 */
export type SyncedUser = NonNullable<Awaited<ReturnType<typeof findOrCreateUser>>>

export type SyncedUserResult =
  | { status: "anonymous" }
  | { status: "ready"; user: SyncedUser }
  | { status: "unavailable"; reason: string }

async function findOrCreateUser(neonUser: { id: string; email?: string | null; name?: string | null }) {
  // Check if we already have this user
  const existing = await prisma.user.findUnique({
    where: { id: neonUser.id },
    include: { profile: true },
  })
  if (existing) return existing

  // Create the user and their strategic profile on first sync
  return prisma.user.create({
    data: {
      id: neonUser.id,
      email: neonUser.email,
      name: neonUser.name,
      profile: {
        create: {
          riskBias: 0.65,
          yieldVsSafety: 0.5,
          horizon: "Ready",
        },
      },
    },
    include: { profile: true },
  })
}

/**
 * Ensures that the Neon Auth session user exists in our local Prisma database
 * along with their strategic user profile, and says which of the three things
 * happened.
 */
export async function getSyncedUserResult(): Promise<SyncedUserResult> {
  const neonUser = await getSessionUser()
  if (!neonUser) return { status: "anonymous" }

  try {
    return { status: "ready", user: await findOrCreateUser(neonUser) }
  } catch (error) {
    // The person IS signed in. Saying otherwise is what caused the loop.
    console.error("User session sync failed:", error)
    const reason =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: unknown }).code)
        : "unknown"
    return { status: "unavailable", reason }
  }
}

/**
 * The original shape, kept for the API routes and helpers that only need
 * "give me the user or nothing". Those return 401 on null, which is wrong
 * during an outage but does not loop; page guards must use
 * requireSyncedUser() instead.
 */
export async function getSyncedUser() {
  const result = await getSyncedUserResult()
  return result.status === "ready" ? result.user : null
}
