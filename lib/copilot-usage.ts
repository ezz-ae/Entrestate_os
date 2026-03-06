import "server-only"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export const FREE_COPILOT_DAILY_LIMIT = 3

export type CopilotDailyUsage = {
  accountKey: string
  date: string
  used: number
  limit: number | null
  remaining: number | null
}

let ensureUsageTablesPromise: Promise<void> | null = null

function applyLimit(used: number, limit: number | null): CopilotDailyUsage["remaining"] {
  if (limit === null) return null
  return Math.max(limit - used, 0)
}

export function getCopilotDailyLimit(tier: "free" | "pro" | "team" | "institutional") {
  return tier === "free" ? FREE_COPILOT_DAILY_LIMIT : null
}

export function getAnonymousCopilotAccountKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const realIp = request.headers.get("x-real-ip")?.trim()
  const ip = forwardedFor || realIp || "unknown"
  return `anon:${ip}`
}

async function ensureUsageTables() {
  if (!ensureUsageTablesPromise) {
    ensureUsageTablesPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS copilot_daily_usage (
          account_key TEXT NOT NULL,
          usage_date DATE NOT NULL,
          messages_count INTEGER NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (account_key, usage_date)
        )
      `)
    })()
  }

  await ensureUsageTablesPromise
}

export async function getCopilotDailyUsage(accountKey: string, tier: "free" | "pro" | "team" | "institutional") {
  const normalizedKey = accountKey.trim()
  if (!normalizedKey) {
    return {
      accountKey: "",
      date: new Date().toISOString().slice(0, 10),
      used: 0,
      limit: getCopilotDailyLimit(tier),
      remaining: getCopilotDailyLimit(tier),
    } satisfies CopilotDailyUsage
  }

  await ensureUsageTables()

  const rows = await prisma.$queryRaw<Array<{ usage_date: string; messages_count: number }>>(Prisma.sql`
    SELECT
      usage_date::text,
      messages_count
    FROM copilot_daily_usage
    WHERE account_key = ${normalizedKey}
      AND usage_date = CURRENT_DATE
    LIMIT 1
  `)

  const used = rows[0]?.messages_count ?? 0
  const date = rows[0]?.usage_date ?? new Date().toISOString().slice(0, 10)
  const limit = getCopilotDailyLimit(tier)

  return {
    accountKey: normalizedKey,
    date,
    used,
    limit,
    remaining: applyLimit(used, limit),
  } satisfies CopilotDailyUsage
}

export async function incrementCopilotDailyUsage(accountKey: string, tier: "free" | "pro" | "team" | "institutional") {
  const normalizedKey = accountKey.trim()
  if (!normalizedKey) {
    throw new Error("accountKey is required to increment copilot usage")
  }

  await ensureUsageTables()

  const rows = await prisma.$queryRaw<Array<{ usage_date: string; messages_count: number }>>(Prisma.sql`
    INSERT INTO copilot_daily_usage (account_key, usage_date, messages_count, updated_at)
    VALUES (${normalizedKey}, CURRENT_DATE, 1, NOW())
    ON CONFLICT (account_key, usage_date) DO UPDATE
      SET messages_count = copilot_daily_usage.messages_count + 1,
          updated_at = NOW()
    RETURNING usage_date::text, messages_count
  `)

  const used = rows[0]?.messages_count ?? 1
  const date = rows[0]?.usage_date ?? new Date().toISOString().slice(0, 10)
  const limit = getCopilotDailyLimit(tier)

  return {
    accountKey: normalizedKey,
    date,
    used,
    limit,
    remaining: applyLimit(used, limit),
  } satisfies CopilotDailyUsage
}
