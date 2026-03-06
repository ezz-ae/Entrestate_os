import "server-only"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export type EntitlementTier = "free" | "pro" | "team" | "institutional"

export type BillingEntitlement = {
  account_key: string
  email: string | null
  tier: EntitlementTier
  provider: string
  paypal_subscription_id: string | null
  paypal_plan_id: string | null
  paypal_status: string | null
  last_event_id: string | null
  last_event_type: string | null
  last_event_at: string | null
  updated_at: string
  created_at: string
}

export type BillingActivityEvent = {
  event_id: string
  event_type: string | null
  subscription_id: string | null
  payload: unknown
  received_at: string
}

let ensureTablesPromise: Promise<void> | null = null

function normalizeTier(value: string | null | undefined): EntitlementTier {
  const normalized = (value ?? "free").toLowerCase().trim()
  if (normalized === "pro") return "pro"
  if (normalized === "team") return "team"
  if (normalized === "institutional") return "institutional"
  return "free"
}

function normalizeRow(row: BillingEntitlement): BillingEntitlement {
  return {
    ...row,
    tier: normalizeTier(row.tier),
  }
}

const ENTITLEMENT_COLUMNS = Prisma.sql`
  account_key,
  email,
  tier,
  provider,
  paypal_subscription_id,
  paypal_plan_id,
  paypal_status,
  last_event_id,
  last_event_type,
  TO_CHAR(last_event_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS last_event_at,
  TO_CHAR(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS updated_at,
  TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS created_at
`

const BILLING_ACTIVITY_COLUMNS = Prisma.sql`
  event_id,
  event_type,
  subscription_id,
  payload,
  TO_CHAR(received_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS received_at
`

async function ensureTables() {
  if (!ensureTablesPromise) {
    ensureTablesPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS billing_entitlements (
          account_key TEXT PRIMARY KEY,
          email TEXT,
          tier TEXT NOT NULL DEFAULT 'free',
          provider TEXT NOT NULL DEFAULT 'paypal',
          paypal_subscription_id TEXT,
          paypal_plan_id TEXT,
          paypal_status TEXT,
          last_event_id TEXT,
          last_event_type TEXT,
          last_event_at TIMESTAMPTZ,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_billing_entitlements_subscription_id
        ON billing_entitlements(paypal_subscription_id)
      `)

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS billing_webhook_events (
          event_id TEXT PRIMARY KEY,
          event_type TEXT,
          subscription_id TEXT,
          payload JSONB,
          received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `)

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_billing_webhook_events_subscription_id
        ON billing_webhook_events(subscription_id)
      `)
    })()
  }

  await ensureTablesPromise
}

export async function getEntitlementByAccountKey(accountKey: string): Promise<BillingEntitlement | null> {
  const normalizedKey = accountKey.trim()
  if (!normalizedKey) return null

  await ensureTables()

  const rows = await prisma.$queryRaw<BillingEntitlement[]>(Prisma.sql`
    SELECT ${ENTITLEMENT_COLUMNS}
    FROM billing_entitlements
    WHERE account_key = ${normalizedKey}
    LIMIT 1
  `)

  return rows[0] ? normalizeRow(rows[0]) : null
}

export async function getEntitlementBySubscriptionId(subscriptionId: string): Promise<BillingEntitlement | null> {
  const normalizedId = subscriptionId.trim()
  if (!normalizedId) return null

  await ensureTables()

  const rows = await prisma.$queryRaw<BillingEntitlement[]>(Prisma.sql`
    SELECT ${ENTITLEMENT_COLUMNS}
    FROM billing_entitlements
    WHERE paypal_subscription_id = ${normalizedId}
    ORDER BY updated_at DESC
    LIMIT 1
  `)

  return rows[0] ? normalizeRow(rows[0]) : null
}

type UpsertEntitlementInput = {
  accountKey: string
  email?: string | null
  tier: EntitlementTier
  subscriptionId?: string | null
  planId?: string | null
  status?: string | null
  eventId?: string | null
  eventType?: string | null
  eventAt?: Date | null
}

export async function upsertPaypalEntitlement(input: UpsertEntitlementInput): Promise<BillingEntitlement> {
  const accountKey = input.accountKey.trim()
  if (!accountKey) {
    throw new Error("accountKey is required to upsert entitlement")
  }

  await ensureTables()

  const rows = await prisma.$queryRaw<BillingEntitlement[]>(Prisma.sql`
    INSERT INTO billing_entitlements (
      account_key,
      email,
      tier,
      provider,
      paypal_subscription_id,
      paypal_plan_id,
      paypal_status,
      last_event_id,
      last_event_type,
      last_event_at,
      updated_at
    )
    VALUES (
      ${accountKey},
      ${input.email ?? null},
      ${normalizeTier(input.tier)},
      'paypal',
      ${input.subscriptionId ?? null},
      ${input.planId ?? null},
      ${input.status ?? null},
      ${input.eventId ?? null},
      ${input.eventType ?? null},
      ${input.eventAt ?? null},
      NOW()
    )
    ON CONFLICT (account_key) DO UPDATE SET
      email = COALESCE(EXCLUDED.email, billing_entitlements.email),
      tier = EXCLUDED.tier,
      provider = 'paypal',
      paypal_subscription_id = COALESCE(EXCLUDED.paypal_subscription_id, billing_entitlements.paypal_subscription_id),
      paypal_plan_id = COALESCE(EXCLUDED.paypal_plan_id, billing_entitlements.paypal_plan_id),
      paypal_status = COALESCE(EXCLUDED.paypal_status, billing_entitlements.paypal_status),
      last_event_id = COALESCE(EXCLUDED.last_event_id, billing_entitlements.last_event_id),
      last_event_type = COALESCE(EXCLUDED.last_event_type, billing_entitlements.last_event_type),
      last_event_at = COALESCE(EXCLUDED.last_event_at, billing_entitlements.last_event_at),
      updated_at = NOW()
    RETURNING ${ENTITLEMENT_COLUMNS}
  `)

  if (!rows[0]) {
    throw new Error("Failed to upsert billing entitlement")
  }

  return normalizeRow(rows[0])
}

type UpdateBySubscriptionInput = {
  subscriptionId: string
  tier: EntitlementTier
  planId?: string | null
  status?: string | null
  eventId?: string | null
  eventType?: string | null
  eventAt?: Date | null
}

export async function updateEntitlementBySubscriptionId(input: UpdateBySubscriptionInput): Promise<BillingEntitlement | null> {
  const subscriptionId = input.subscriptionId.trim()
  if (!subscriptionId) return null

  await ensureTables()

  const rows = await prisma.$queryRaw<BillingEntitlement[]>(Prisma.sql`
    UPDATE billing_entitlements
    SET
      tier = ${normalizeTier(input.tier)},
      paypal_plan_id = COALESCE(${input.planId ?? null}, paypal_plan_id),
      paypal_status = COALESCE(${input.status ?? null}, paypal_status),
      last_event_id = COALESCE(${input.eventId ?? null}, last_event_id),
      last_event_type = COALESCE(${input.eventType ?? null}, last_event_type),
      last_event_at = COALESCE(${input.eventAt ?? null}, last_event_at),
      updated_at = NOW()
    WHERE paypal_subscription_id = ${subscriptionId}
    RETURNING ${ENTITLEMENT_COLUMNS}
  `)

  return rows[0] ? normalizeRow(rows[0]) : null
}

export async function recordWebhookEvent(eventId: string, payload: unknown, eventType?: string | null, subscriptionId?: string | null) {
  const normalizedEventId = eventId.trim()
  if (!normalizedEventId) return false

  await ensureTables()

  const rows = await prisma.$queryRaw<Array<{ inserted: boolean }>>(Prisma.sql`
    WITH inserted AS (
      INSERT INTO billing_webhook_events (event_id, event_type, subscription_id, payload)
      VALUES (${normalizedEventId}, ${eventType ?? null}, ${subscriptionId ?? null}, ${JSON.stringify(payload)}::jsonb)
      ON CONFLICT (event_id) DO NOTHING
      RETURNING 1
    )
    SELECT EXISTS(SELECT 1 FROM inserted) AS inserted
  `)

  return rows[0]?.inserted ?? false
}

function buildBillingActivityWhereClause(accountKey: string, eventType?: string | null) {
  const encodedAccount = encodeURIComponent(accountKey)
  const filters: Prisma.Sql[] = [
    Prisma.sql`(
      subscription_id IN (
        SELECT paypal_subscription_id
        FROM billing_entitlements
        WHERE account_key = ${accountKey}
          AND paypal_subscription_id IS NOT NULL
      )
      OR COALESCE(payload -> 'resource' ->> 'custom_id', '') LIKE ${`%account=${encodedAccount}%`}
      OR COALESCE(payload ->> 'account_key', '') = ${accountKey}
    )`,
  ]

  if (eventType) {
    filters.push(Prisma.sql`event_type = ${eventType}`)
  }

  return Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}`
}

export async function listBillingEventsByAccountKey(
  accountKey: string,
  options?: { limit?: number; offset?: number; eventType?: string | null },
): Promise<BillingActivityEvent[]> {
  const normalizedKey = accountKey.trim()
  if (!normalizedKey) return []

  const safeLimit = Math.min(Math.max(options?.limit ?? 10, 1), 100)
  const safeOffset = Math.max(options?.offset ?? 0, 0)
  const whereClause = buildBillingActivityWhereClause(normalizedKey, options?.eventType)

  await ensureTables()

  const rows = await prisma.$queryRaw<BillingActivityEvent[]>(Prisma.sql`
    SELECT ${BILLING_ACTIVITY_COLUMNS}
    FROM billing_webhook_events
    ${whereClause}
    ORDER BY received_at DESC
    LIMIT ${safeLimit}
    OFFSET ${safeOffset}
  `)

  return rows
}

export async function countBillingEventsByAccountKey(accountKey: string, eventType?: string | null): Promise<number> {
  const normalizedKey = accountKey.trim()
  if (!normalizedKey) return 0

  const whereClause = buildBillingActivityWhereClause(normalizedKey, eventType)

  await ensureTables()

  const rows = await prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
    SELECT COUNT(*)::int AS count
    FROM billing_webhook_events
    ${whereClause}
  `)

  return rows[0]?.count ?? 0
}

export async function listBillingEventTypesByAccountKey(accountKey: string, limit = 25): Promise<string[]> {
  const normalizedKey = accountKey.trim()
  if (!normalizedKey) return []

  const safeLimit = Math.min(Math.max(limit, 1), 100)
  const whereClause = buildBillingActivityWhereClause(normalizedKey)

  await ensureTables()

  const rows = await prisma.$queryRaw<Array<{ event_type: string | null }>>(Prisma.sql`
    SELECT DISTINCT event_type
    FROM billing_webhook_events
    ${whereClause}
    ORDER BY event_type ASC NULLS LAST
    LIMIT ${safeLimit}
  `)

  return rows.map((row) => row.event_type).filter((value): value is string => Boolean(value))
}

export function coerceEntitlementTier(value: string | null | undefined): EntitlementTier {
  return normalizeTier(value)
}
