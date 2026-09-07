import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSyncedUser } from "@/lib/auth/sync"
import { getRequestId } from "@/lib/api-errors"
import crypto from "node:crypto"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import { capabilityMinTier, hasCapability } from "@/lib/entitlement-gates"
import { buildApiKeyPrefix, hashApiKey } from "@/lib/api-keys"

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  const user = await getSyncedUser()
  if (!user) return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 })

  const keys = await prisma.apiKey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      scopes: true,
      createdAt: true,
      lastUsedAt: true,
      expiresAt: true,
    }
  })

  return NextResponse.json({ keys, requestId })
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  const user = await getSyncedUser()
  if (!user) return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 })

  // ONE DEFINITION OF WHO MAY HOLD A KEY, and it is not typed here.
  // lib/entitlement-gates.ts says `api_keys: "pro"`, and the plan comparison
  // it feeds prints "API keys + programmatic access" as a Pro feature — while
  // this route, and the page in front of it, hardcoded `institutional`. So
  // /me/api-access offered a paying Pro user a "Manage API keys" button that
  // led to a screen headed "Institutional feature", and any key they tried to
  // create came back 403. Two gates disagreeing about what was sold is worse
  // than either answer; the capability table is the answer.
  const entitlement = await getCurrentEntitlement()
  if (!hasCapability(entitlement.tier, "api_keys")) {
    return NextResponse.json(
      { error: `API keys require the ${capabilityMinTier("api_keys")} plan or above.`, requestId },
      { status: 403 },
    )
  }

  try {
    const { name, scopes } = await request.json()
    if (!name) return NextResponse.json({ error: "Name is required", requestId }, { status: 400 })

    const rawKey = `ent_live_${crypto.randomBytes(32).toString("hex")}`
    const prefix = buildApiKeyPrefix(rawKey)
    const hashedKey = hashApiKey(rawKey)

    const newKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        name,
        key: hashedKey,
        prefix,
        scopes: Array.isArray(scopes) ? scopes : ["read:market", "read:listings"],
      }
    })

    return NextResponse.json({
      key: {
        id: newKey.id,
        name: newKey.name,
        prefix: newKey.prefix,
        scopes: newKey.scopes,
        createdAt: newKey.createdAt,
        expiresAt: newKey.expiresAt,
        rawKey,
      },
      requestId,
    })
  } catch (error) {
    console.error("Failed to create API key:", error)
    return NextResponse.json({ error: "Failed to create API key", requestId }, { status: 500 })
  }
}
