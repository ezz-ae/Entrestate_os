import "server-only"
import { prisma } from "@/lib/prisma"

/**
 * AN AUTOMATION HAS NO OWNER COLUMN, SO OWNERSHIP IS RESOLVED THROUGH ITS ANCHOR.
 *
 * `automations` carries timetableId and decisionObjectId and nothing else that
 * identifies a person. That is deliberate — an automation belongs to the thing
 * it watches, not to a user directly — but it means every read and write here
 * has to reach through to TimeTable.ownerId or DecisionObject.ownerId before it
 * answers. There is no query in this file that filters on the automation alone.
 *
 * Two rules follow, and both are enforced rather than documented:
 *
 *   1. Exactly one anchor. Zero anchors makes a row nobody can own and nobody
 *      can reach; two makes ownership ambiguous the moment the two disagree.
 *   2. A DecisionObject's owner may be null (the column is nullable), in which
 *      case ownership falls back to the owner of its parent TimeTable — which
 *      is never null.
 */

export type AutomationType = "notebook" | "agent" | "whatsapp" | "email"

export type Automation = {
  id: string
  timetableId: string | null
  decisionObjectId: string | null
  type: string
  config: Record<string, unknown>
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export type AutomationAnchor =
  | { timetableId: string; decisionObjectId?: never }
  | { decisionObjectId: string; timetableId?: never }

function toJson(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function shape(row: {
  id: string
  timetableId: string | null
  decisionObjectId: string | null
  type: string
  config: unknown
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}): Automation {
  return {
    id: row.id,
    timetableId: row.timetableId,
    decisionObjectId: row.decisionObjectId,
    type: row.type,
    config: toJson(row.config),
    enabled: row.enabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

/** True when this user owns the Time Table the automation would watch. */
async function ownsTimetable(timetableId: string, userId: string): Promise<boolean> {
  const found = await prisma.timeTable.findFirst({
    where: { id: timetableId, ownerId: userId },
    select: { id: true },
  })
  return Boolean(found)
}

/**
 * True when this user owns the Decision Object — directly, or through the Time
 * Table that produced it, because DecisionObject.ownerId is nullable and an
 * object generated inside a pipeline may never have been stamped with one.
 */
async function ownsDecisionObject(decisionObjectId: string, userId: string): Promise<boolean> {
  const found = await prisma.decisionObject.findFirst({
    where: {
      id: decisionObjectId,
      OR: [{ ownerId: userId }, { timetable: { ownerId: userId } }],
    },
    select: { id: true },
  })
  return Boolean(found)
}

export async function canReachAnchor(anchor: AutomationAnchor, userId: string): Promise<boolean> {
  if (anchor.timetableId) return ownsTimetable(anchor.timetableId, userId)
  if (anchor.decisionObjectId) return ownsDecisionObject(anchor.decisionObjectId, userId)
  return false
}

/** Every automation anchored to something this user owns. */
export async function listAutomations(userId: string): Promise<Automation[]> {
  const rows = await prisma.automation.findMany({
    where: {
      OR: [
        { timetable: { ownerId: userId } },
        { decisionObject: { ownerId: userId } },
        { decisionObject: { timetable: { ownerId: userId } } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  })
  return rows.map(shape)
}

/** One automation, or null when it does not exist OR is not this user's. */
export async function getAutomation(id: string, userId: string): Promise<Automation | null> {
  const row = await prisma.automation.findFirst({
    where: {
      id,
      OR: [
        { timetable: { ownerId: userId } },
        { decisionObject: { ownerId: userId } },
        { decisionObject: { timetable: { ownerId: userId } } },
      ],
    },
  })
  return row ? shape(row) : null
}

export async function createAutomation(input: {
  anchor: AutomationAnchor
  type: AutomationType
  config: Record<string, unknown>
  enabled?: boolean
}): Promise<Automation> {
  const row = await prisma.automation.create({
    data: {
      timetableId: input.anchor.timetableId ?? null,
      decisionObjectId: input.anchor.decisionObjectId ?? null,
      type: input.type,
      config: input.config as object,
      enabled: input.enabled ?? true,
    },
  })
  return shape(row)
}

/**
 * Update by id, but only within rows this user can reach: updateMany with the
 * ownership filter in the WHERE, so a mismatched id changes zero rows instead
 * of throwing after the fact.
 */
export async function updateAutomation(
  id: string,
  userId: string,
  patch: { config?: Record<string, unknown>; enabled?: boolean },
): Promise<Automation | null> {
  const result = await prisma.automation.updateMany({
    where: {
      id,
      OR: [
        { timetable: { ownerId: userId } },
        { decisionObject: { ownerId: userId } },
        { decisionObject: { timetable: { ownerId: userId } } },
      ],
    },
    data: {
      ...(patch.config !== undefined ? { config: patch.config as object } : {}),
      ...(patch.enabled !== undefined ? { enabled: patch.enabled } : {}),
    },
  })
  if (result.count === 0) return null
  return getAutomation(id, userId)
}

export async function deleteAutomation(id: string, userId: string): Promise<boolean> {
  const result = await prisma.automation.deleteMany({
    where: {
      id,
      OR: [
        { timetable: { ownerId: userId } },
        { decisionObject: { ownerId: userId } },
        { decisionObject: { timetable: { ownerId: userId } } },
      ],
    },
  })
  return result.count > 0
}
