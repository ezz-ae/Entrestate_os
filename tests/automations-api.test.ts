import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * /api/automations WAS ADVERTISED IN THE README AND ANSWERED 404.
 *
 * These tests pin the two things that matter about the endpoint that replaced
 * the 404, and they are both about not lying:
 *
 *   1. Ownership. `automations` has no owner column — a row belongs to whoever
 *      owns the Time Table or Decision Object it is anchored to. So every query
 *      has to reach through, and an automation the caller cannot reach must
 *      return 404, never 403: whether someone else's Time Table exists is not a
 *      fact this endpoint discloses.
 *   2. Dispatch. Nothing fires these automations yet — the loop is specified in
 *      docs/decision-infrastructure/automation-notebook-loop.md and unbuilt. The
 *      response says `dispatch: "not-implemented"` so a caller learns it from
 *      the payload rather than from an automation that silently never runs.
 */

const requireSessionUserIdMock = vi.fn()

const prismaMock = {
  automation: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  timeTable: { findFirst: vi.fn() },
  decisionObject: { findFirst: vi.fn() },
}

vi.mock("@/lib/auth/server", () => ({
  requireSessionUserId: () => requireSessionUserIdMock(),
}))

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }))

// Imported inside the suite rather than at top level: this repo's tsconfig
// targets a module setting that rejects top-level await, and vi.mock must be
// registered before the route module is evaluated.
let GET: typeof import("@/app/api/automations/route").GET
let POST: typeof import("@/app/api/automations/route").POST

const post = (body: unknown) =>
  POST(new Request("https://terminal.entrestate.com/api/automations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }))

const row = {
  id: "auto_1",
  timetableId: "tt_1",
  decisionObjectId: null,
  type: "notebook",
  config: { threshold: 0.5 },
  enabled: true,
  createdAt: new Date("2026-09-03T00:00:00.000Z"),
  updatedAt: new Date("2026-09-03T00:00:00.000Z"),
}

beforeAll(async () => {
  const route = await import("@/app/api/automations/route")
  GET = route.GET
  POST = route.POST
})

beforeEach(() => {
  vi.clearAllMocks()
  requireSessionUserIdMock.mockResolvedValue("user_1")
})

describe("signed out", () => {
  it("GET answers 401 and lists nothing", async () => {
    requireSessionUserIdMock.mockResolvedValue(null)
    const res = await GET(new Request("https://terminal.entrestate.com/api/automations"))
    expect(res.status).toBe(401)
    expect(prismaMock.automation.findMany).not.toHaveBeenCalled()
  })

  it("POST answers 401 and writes nothing", async () => {
    requireSessionUserIdMock.mockResolvedValue(null)
    const res = await post({ timetableId: "tt_1", type: "notebook" })
    expect(res.status).toBe(401)
    expect(prismaMock.automation.create).not.toHaveBeenCalled()
  })
})

describe("an automation is anchored to exactly one thing", () => {
  it("rejects zero anchors — the row would be unownable", async () => {
    const res = await post({ type: "notebook" })
    expect(res.status).toBe(400)
    expect(prismaMock.automation.create).not.toHaveBeenCalled()
  })

  it("rejects two anchors — ownership would be ambiguous", async () => {
    const res = await post({ timetableId: "tt_1", decisionObjectId: "do_1", type: "notebook" })
    expect(res.status).toBe(400)
    expect(prismaMock.automation.create).not.toHaveBeenCalled()
  })

  it("rejects a type the model does not name", async () => {
    const res = await post({ timetableId: "tt_1", type: "telegram" })
    expect(res.status).toBe(400)
    expect(prismaMock.automation.create).not.toHaveBeenCalled()
  })
})

describe("ownership is resolved through the anchor", () => {
  it("an unreachable Time Table is 404, not 403, and nothing is written", async () => {
    prismaMock.timeTable.findFirst.mockResolvedValue(null)
    const res = await post({ timetableId: "tt_someone_else", type: "notebook" })
    expect(res.status).toBe(404)
    expect(prismaMock.automation.create).not.toHaveBeenCalled()
    // The reachability check must filter on the caller, not just the id.
    expect(prismaMock.timeTable.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "tt_someone_else", ownerId: "user_1" } }),
    )
  })

  it("a Decision Object counts as owned through its parent Time Table", async () => {
    prismaMock.decisionObject.findFirst.mockResolvedValue({ id: "do_1" })
    prismaMock.automation.create.mockResolvedValue({ ...row, timetableId: null, decisionObjectId: "do_1" })
    const res = await post({ decisionObjectId: "do_1", type: "agent" })
    expect(res.status).toBe(201)
    // ownerId direct OR through timetable — DecisionObject.ownerId is nullable.
    const where = prismaMock.decisionObject.findFirst.mock.calls[0][0].where
    expect(where.OR).toEqual([
      { ownerId: "user_1" },
      { timetable: { ownerId: "user_1" } },
    ])
  })

  it("listing filters by owner and never reads the table unfiltered", async () => {
    prismaMock.automation.findMany.mockResolvedValue([row])
    const res = await GET(new Request("https://terminal.entrestate.com/api/automations"))
    expect(res.status).toBe(200)
    const where = prismaMock.automation.findMany.mock.calls[0][0].where
    expect(where.OR).toEqual([
      { timetable: { ownerId: "user_1" } },
      { decisionObject: { ownerId: "user_1" } },
      { decisionObject: { timetable: { ownerId: "user_1" } } },
    ])
  })
})

describe("the response does not pretend the automation will run", () => {
  it("says so on create", async () => {
    prismaMock.timeTable.findFirst.mockResolvedValue({ id: "tt_1" })
    prismaMock.automation.create.mockResolvedValue(row)
    const res = await post({ timetableId: "tt_1", type: "notebook", config: { threshold: 0.5 } })
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.dispatch).toBe("not-implemented")
    expect(body.automation).toMatchObject({ id: "auto_1", type: "notebook", enabled: true })
  })

  it("says so on list", async () => {
    prismaMock.automation.findMany.mockResolvedValue([row])
    const res = await GET(new Request("https://terminal.entrestate.com/api/automations"))
    const body = await res.json()
    expect(body.dispatch).toBe("not-implemented")
    expect(body.automations).toHaveLength(1)
  })
})
