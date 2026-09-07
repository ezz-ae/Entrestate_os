import { NextResponse } from "next/server"
import { z } from "zod"
import { getRequestId } from "@/lib/api-errors"
import { addWatchlistItem } from "@/lib/runtime-store"
import { getSyncedUser } from "@/lib/auth/sync"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  name: z.string().trim().min(1).max(180),
  slug: z.string().trim().min(1).max(180).optional(),
})

/**
 * NO TIER GATE HERE — /pricing says the Decision Terminal chat is included.
 *
 * This is one of the chat's own two actions ("Save to shortlist" and
 * "Generate report" in components/ChatInterface.tsx). Both refused every
 * caller with 403 "Team tier required", so the chat rendered
 * "Could not create shortlist (Team tier may be required)" to everybody —
 * on a product whose pricing page states, in both languages, that the chat
 * and the discovery layer come with the account, and where nothing sells a
 * Team tier at all (app/pricing/page.tsx: "THE TERMINAL DOES NOT SELL
 * SUBSCRIPTIONS ANY MORE"). A gate for a plan that cannot be bought is not a
 * paywall; it is a closed door with no handle.
 *
 * What is still required is an ACCOUNT — a shortlist and a report belong to
 * somebody — which the sign-in check below is.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request)
  const user = await getSyncedUser()
  if (!user) {
    return NextResponse.json({ error: "Sign in to save a shortlist.", requestId }, { status: 401 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid watchlist item payload", requestId }, { status: 400 })
  }

  const { id } = await context.params
  const watchlist = addWatchlistItem(id, parsed.data)
  if (!watchlist) {
    return NextResponse.json({ error: "Watchlist not found", requestId }, { status: 404 })
  }

  return NextResponse.json({ watchlist, requestId })
}

