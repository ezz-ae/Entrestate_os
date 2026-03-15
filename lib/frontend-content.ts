import "server-only"
import { Prisma, dbQuery } from "@/lib/db"

export type HomepageSectionRow = {
  id: string
  section: string
  content_json: unknown
  display_order: number | null
}

export type TopDataRow = {
  id: string
  section: string
  title: string | null
  subtitle: string | null
  data_json: unknown
  display_order: number | null
  confidence?: string | null
  last_updated?: string | null
}

export type MarketPulseSummary = {
  total: number
  avg_price: number | null
  avg_yield: number | null
  buy_signals: number
  high_confidence: number
}

export type ApiContentRow = {
  endpoint: string
  method: string
  description: string | null
  tier_required: string | null
}

const SUMMARY_TABLE_SQL = Prisma.raw("inventory_clean")

export async function getHomepageContentSections() {
  const rows = await dbQuery<HomepageSectionRow>(Prisma.sql`
    SELECT id, section, content_json, display_order
    FROM entrestate_homepage
    WHERE is_live = true
    ORDER BY display_order
  `)

  return {
    data_as_of: new Date().toISOString(),
    sections: rows,
  }
}

export async function getTopDataRows() {
  const rows = await dbQuery<TopDataRow>(Prisma.sql`
    SELECT id, section, title, subtitle, data_json, display_order
    FROM entrestate_top_data
    WHERE is_live = true
    ORDER BY display_order
  `)

  return {
    data_as_of: new Date().toISOString(),
    sections: rows,
  }
}

export async function getMarketPulseSummary() {
  const rows = await dbQuery<MarketPulseSummary>(Prisma.sql`
    SELECT
      COUNT(*)::int AS total,
      ROUND(AVG(price_from) FILTER (WHERE price_from > 0))::int AS avg_price,
      ROUND(AVG(rental_yield::numeric) FILTER (WHERE rental_yield > 0), 1) AS avg_yield,
      COUNT(CASE WHEN timing_label IN ('STRONG_BUY', 'BUY') THEN 1 END)::int AS buy_signals,
      COUNT(CASE WHEN price_confidence = 'HIGH' THEN 1 END)::int AS high_confidence
    FROM ${SUMMARY_TABLE_SQL}
  `)

  return {
    data_as_of: new Date().toISOString(),
    summary: rows[0] ?? {
      total: 0,
      avg_price: null,
      avg_yield: null,
      buy_signals: 0,
      high_confidence: 0,
    },
  }
}

export async function getOutcomeIntentCounts() {
  const rows = await dbQuery<Array<{ intent: string; count: number }>[number]>(Prisma.sql`
    SELECT
      LOWER(TRIM(intent)) AS intent,
      COUNT(*)::int AS count
    FROM ${DETAIL_TABLE_SQL},
      LATERAL unnest(COALESCE(outcome_intent, ARRAY[]::text[])) AS intent
    GROUP BY 1
    ORDER BY count DESC
  `)

  return {
    data_as_of: new Date().toISOString(),
    rows,
  }
}

export async function getApiContentRows() {
  const rows = await dbQuery<ApiContentRow>(Prisma.sql`
    SELECT endpoint, method, description, tier_required
    FROM entrestate_api_content
    WHERE is_live = true
    ORDER BY endpoint
  `)

  return {
    data_as_of: new Date().toISOString(),
    rows,
  }
}
