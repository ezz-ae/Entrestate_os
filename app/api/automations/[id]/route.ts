import { NextResponse } from "next/server"
import { z } from "zod"
import { getRequestId, getPublicErrorMessage } from "@/lib/api-errors"
import { requireSessionUserId } from "@/lib/auth/server"
import { deleteAutomation, getAutomation, updateAutomation } from "@/lib/automations/queries"

/**
 * Every handler here resolves ownership through the automation's anchor before
 * it answers — see lib/automations/queries.ts. A row the caller cannot reach
 * returns 404, never 403: whether someone else's Time Table exists is not a
 * fact this endpoint discloses.
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const patchSchema = z
  .object({
    config: z.record(z.unknown()).optional(),
    enabled: z.boolean().optional(),
  })
  .refine((v) => v.config !== undefined || v.enabled !== undefined, {
    message: "Provide config or enabled.",
  })

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request)
  try {
    const userId = await requireSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 })
    }
    const { id } = await params
    const automation = await getAutomation(id, userId)
    if (!automation) {
      return NextResponse.json({ error: "Automation not found.", requestId }, { status: 404 })
    }
    return NextResponse.json({ automation, dispatch: "not-implemented", requestId })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to fetch automation."), requestId },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request)
  try {
    const userId = await requireSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json().catch(() => null)
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request.", requestId },
        { status: 400 },
      )
    }

    const automation = await updateAutomation(id, userId, parsed.data)
    if (!automation) {
      return NextResponse.json({ error: "Automation not found.", requestId }, { status: 404 })
    }
    return NextResponse.json({ automation, dispatch: "not-implemented", requestId })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to update automation."), requestId },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request)
  try {
    const userId = await requireSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 })
    }
    const { id } = await params
    const removed = await deleteAutomation(id, userId)
    if (!removed) {
      return NextResponse.json({ error: "Automation not found.", requestId }, { status: 404 })
    }
    return NextResponse.json({ deleted: true, requestId })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to delete automation."), requestId },
      { status: 500 },
    )
  }
}
