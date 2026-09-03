import { NextResponse } from "next/server"
import { z } from "zod"
import { getRequestId, getPublicErrorMessage } from "@/lib/api-errors"
import { requireSessionUserId } from "@/lib/auth/server"
import {
  canReachAnchor,
  createAutomation,
  listAutomations,
  type AutomationAnchor,
} from "@/lib/automations/queries"

/**
 * README.md has advertised /api/automations as a programmatic surface for
 * months. Until 2026-09-03 it answered 404: the route did not exist, and
 * neither did the `automations` table it needs. This is that endpoint.
 *
 * WHAT IT DOES AND DOES NOT DO. It manages automation definitions — create,
 * list, enable, disable, delete — anchored to a Time Table or a Decision
 * Object. It does NOT dispatch them: nothing yet re-executes a TableSpec,
 * diffs the result, or fires the automations attached to it. That loop is
 * specified in docs/decision-infrastructure/automation-notebook-loop.md and is
 * not built. An automation created here is a stored intention, and the
 * response says so in `dispatch`, so no caller has to infer it from silence.
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * The four names the Automation model's own comment comes with. All four store;
 * none dispatch yet. They are accepted rather than narrowed to the two the loop
 * spec starts with, because a definition written today should survive the
 * dispatcher being built later — and refusing a type only to accept it next
 * month is a worse contract than accepting it with an honest dispatch flag.
 */
const automationType = z.enum(["notebook", "agent", "whatsapp", "email"])

const createSchema = z
  .object({
    timetableId: z.string().trim().min(1).optional(),
    decisionObjectId: z.string().trim().min(1).optional(),
    type: automationType,
    config: z.record(z.unknown()).default({}),
    enabled: z.boolean().optional(),
  })
  // Exactly one anchor: zero makes a row nobody owns, two makes ownership
  // ambiguous the moment the two disagree.
  .refine(
    (v) => Boolean(v.timetableId) !== Boolean(v.decisionObjectId),
    { message: "Provide exactly one of timetableId or decisionObjectId." },
  )

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  try {
    const userId = await requireSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 })
    }

    const automations = await listAutomations(userId)
    return NextResponse.json({
      automations,
      dispatch: "not-implemented",
      requestId,
    })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to list automations."), requestId },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    const userId = await requireSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request.", requestId },
        { status: 400 },
      )
    }

    const anchor = (
      parsed.data.timetableId
        ? { timetableId: parsed.data.timetableId }
        : { decisionObjectId: parsed.data.decisionObjectId! }
    ) as AutomationAnchor

    // 404 rather than 403: a Time Table the caller does not own should not be
    // distinguishable from one that does not exist.
    if (!(await canReachAnchor(anchor, userId))) {
      return NextResponse.json({ error: "Anchor not found.", requestId }, { status: 404 })
    }

    const automation = await createAutomation({
      anchor,
      type: parsed.data.type,
      config: parsed.data.config,
      enabled: parsed.data.enabled,
    })

    return NextResponse.json(
      { automation, dispatch: "not-implemented", requestId },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to create automation."), requestId },
      { status: 500 },
    )
  }
}
