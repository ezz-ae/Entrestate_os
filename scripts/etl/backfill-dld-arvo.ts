#!/usr/bin/env tsx
/**
 * CLOSE THE HOLE IN THE DLD TABLE.
 *
 * raw.dld_transactions_arvo held 46,161 rows on 2026-09-05: January and
 * February 2026 in full (34,470), the first week of March (2,371), and
 * August to the 21st (9,320) — and nothing between 8 March and 3 August.
 * Every DLD figure on the site inherited that hole: the count, the area
 * velocities, "DLD transactions through 21 Aug" over a feed with a
 * five-month gap inside it.
 *
 * The public feed the March ingestion read (transactions.arvo.co) carries
 * the whole year to date in the same shape and the same id scheme
 * ("102-71888-2026"), and the table's primary key is that id. So the
 * backfill is one idempotent statement per batch:
 *
 *   INSERT … ON CONFLICT (id) DO NOTHING
 *
 * Rows already present are skipped, rows from the hole land, and running
 * it twice changes nothing. Column mapping is the March ingestion's, field
 * for field (see sample rows in the table: prop_type "Unit", prop_sub_type
 * "Flat", sub_type "Sell - Pre registration", source "arvo.co").
 *
 * Usage:
 *   pnpm tsx scripts/etl/backfill-dld-arvo.ts --dry-run   # counts only, no write
 *   pnpm tsx scripts/etl/backfill-dld-arvo.ts             # writes, prints before/after
 *
 * Needs DATABASE_URL (the Terminal's own database — see lib/tenancy notes in
 * the sibling repo: never the client's). Nothing here deletes or updates.
 */
import { PrismaClient, Prisma } from "@prisma/client"

const FEED_URL = process.env.ARVO_FEED_URL ?? "https://transactions.arvo.co/api/transactions"
const TABLE = "raw.dld_transactions_arvo"
const BATCH = Number(process.env.BACKFILL_BATCH ?? 1000)
const DRY_RUN = process.argv.includes("--dry-run")

type FeedRow = {
  id: string
  date: string
  area?: string
  project?: string
  masterProject?: string
  propType?: string
  propSubType?: string
  subType?: string
  regType?: string
  freehold?: string
  usage?: string
  amount?: number | string
  propSizeSqm?: number | string
  pricePerSqm?: number | string
  rooms?: string
  parking?: string
  nearestMetro?: string
  nearestMall?: string
  nearestLandmark?: string
  buyers?: string
  sellers?: string
}

const num = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v) : v
  return typeof n === "number" && Number.isFinite(n) ? n : null
}
const text = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null)

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log(`Fetching ${FEED_URL} …`)
    const response = await fetch(FEED_URL, { headers: { "User-Agent": "Entrestate-Backfill/1.0" }, signal: AbortSignal.timeout(120_000) })
    if (!response.ok) throw new Error(`feed answered ${response.status}`)
    const rows = (await response.json()) as FeedRow[]
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("feed returned no rows")

    const valid = rows.filter((r) => typeof r.id === "string" && r.id.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(r.date ?? ""))
    const byMonth = new Map<string, number>()
    for (const r of valid) byMonth.set(r.date.slice(0, 7), (byMonth.get(r.date.slice(0, 7)) ?? 0) + 1)
    console.log(`Feed: ${valid.length} rows (${rows.length - valid.length} skipped for missing id/date)`)
    console.log("  by month:", Object.fromEntries([...byMonth.entries()].sort()))

    const before = await prisma.$queryRawUnsafe<Array<{ n: number; through: Date | null }>>(
      `SELECT COUNT(*)::int AS n, MAX(transaction_date) AS through FROM ${TABLE}`,
    )
    console.log(`Table before: ${before[0]?.n} rows, through ${before[0]?.through?.toISOString().slice(0, 10)}`)

    if (DRY_RUN) {
      const existing = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM ${TABLE} WHERE id = ANY($1::text[])`,
        valid.map((r) => r.id),
      )
      const have = new Set(existing.map((e) => e.id))
      const missing = valid.filter((r) => !have.has(r.id))
      const missingByMonth = new Map<string, number>()
      for (const r of missing) missingByMonth.set(r.date.slice(0, 7), (missingByMonth.get(r.date.slice(0, 7)) ?? 0) + 1)
      console.log(`DRY RUN — ${missing.length} rows would be inserted:`, Object.fromEntries([...missingByMonth.entries()].sort()))
      return
    }

    let inserted = 0
    for (let i = 0; i < valid.length; i += BATCH) {
      const slice = valid.slice(i, i + BATCH)
      const values = slice.map(
        (r) => Prisma.sql`(${r.id}, ${r.date}::date, ${text(r.area)}, ${text(r.project)}, ${text(r.masterProject)}, ${text(r.propType)}, ${text(r.propSubType)}, ${text(r.subType)}, ${text(r.regType)}, ${text(r.freehold)}, ${text(r.usage)}, ${num(r.amount)}, ${num(r.propSizeSqm)}, ${num(r.pricePerSqm)}, ${text(r.rooms)}, ${text(r.parking)}, ${text(r.nearestMetro)}, ${text(r.nearestMall)}, ${text(r.nearestLandmark)}, ${text(r.buyers)}, ${text(r.sellers)}, 'arvo.co', NOW())`,
      )
      const result = await prisma.$executeRaw(Prisma.sql`
        INSERT INTO ${Prisma.raw(TABLE)}
          (id, transaction_date, area, project, master_project, prop_type, prop_sub_type, sub_type, reg_type, freehold, usage,
           amount, prop_size_sqm, price_per_sqm, rooms, parking, nearest_metro, nearest_mall, nearest_landmark, buyers, sellers, source, ingested_at)
        VALUES ${Prisma.join(values, ", ")}
        ON CONFLICT (id) DO NOTHING
      `)
      inserted += result
      console.log(`  batch ${Math.floor(i / BATCH) + 1}: +${result} (total +${inserted})`)
    }

    const after = await prisma.$queryRawUnsafe<Array<{ n: number; through: Date | null }>>(
      `SELECT COUNT(*)::int AS n, MAX(transaction_date) AS through FROM ${TABLE}`,
    )
    const months = await prisma.$queryRawUnsafe<Array<{ m: string; n: number }>>(
      `SELECT to_char(transaction_date, 'YYYY-MM') AS m, COUNT(*)::int AS n FROM ${TABLE} GROUP BY 1 ORDER BY 1`,
    )
    console.log(`Table after: ${after[0]?.n} rows, through ${after[0]?.through?.toISOString().slice(0, 10)}`)
    console.log("  by month:", Object.fromEntries(months.map((r) => [r.m, r.n])))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
