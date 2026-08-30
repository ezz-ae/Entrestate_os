import "server-only"
import { withStatementTimeout } from "@/lib/db-guardrails"
import { PLATFORM_METRICS_FALLBACK } from "@/lib/platform-metrics"
import { MARKET_TABLES, INVENTORY_PRICE_COLUMN, developerProjectCountSql } from "@/lib/market-tables"

const STATEMENT_TIMEOUT_MS = 15000
const MAX_ROWS = 100

type DbRow = Record<string, unknown>

// row_count below is last-known sample size for MCP client display only.
// Authoritative live counts: query the table or call /api/platform-metrics.
const SCORED_PROJECTS = PLATFORM_METRICS_FALLBACK.totalProjects
const DLD_TRANSACTIONS = PLATFORM_METRICS_FALLBACK.dldTransactions
const DLD_FEED = DLD_TRANSACTIONS // co-tracked

/**
 * Every entry carries `relation`: the SCHEMA-QUALIFIED name to put in SQL.
 *
 * The keys are the short names people say out loud, and for a long time they
 * were also what went into the queries — but almost none of this data is in
 * `public`, and search_path is. `FROM inventory_clean` threw, mcp_query
 * returned status "error", and the answer came back as though the market were
 * empty. The relation is what the model is told to write; the key is only a
 * label. See lib/market-tables.ts.
 */
export const MCP_RESOURCES = {
  inventory_clean: {
    relation: MARKET_TABLES.inventory,
    description: "Scored UAE projects with full V1 decision scores",
    key_columns: [
      "id",
      "name",
      "slug",
      "area",
      "city",
      "developer",
      "price_from",
      "price_to",
      "timing_label",
      "stress_grade_v1",
      "rental_yield",
      "investor_score_v1",
      "decision_label_v1",
      "evidence_label_v1",
      "yield_label",
      "quality_score",
      "hero_image",
      "bedrooms",
      "completion_date",
      "price_confidence",
      "price_source",
    ],
    row_count: SCORED_PROJECTS,
    updated: "live",
  },
  inventory_full: {
    relation: MARKET_TABLES.inventoryFull,
    description: "Scored projects with full evidence-layer columns (180+ fields)",
    key_columns: [
      "name",
      "area",
      "developer",
      "l1_canonical_price",
      "l1_canonical_yield",
      "l2_developer_reliability",
      "l3_price_drift_90d",
      "l4_dld_avg_txn_price",
      "engine_god_metric",
      "engine_stress_test",
      "engine_affordability",
      "l3_timing_signal",
      "l2_stress_test_grade",
      "l3_demand_velocity",
      "l3_supply_pressure",
    ],
    row_count: SCORED_PROJECTS,
    updated: "live",
  },
  dld_transactions_arvo: {
    relation: MARKET_TABLES.dldTransactions,
    description: "DLD transaction registry from Dubai Land Department (current YTD)",
    key_columns: [
      "id",
      "area",
      "project",
      "amount",
      "reg_type",
      "prop_type",
      "rooms",
      "prop_size_sqm",
      "price_per_sqm",
      "transaction_date",
      "sub_type",
      "freehold",
      "usage",
      "nearest_mall",
      "nearest_metro",
      "nearest_landmark",
    ],
    row_count: DLD_TRANSACTIONS,
    updated: "daily via arvo.co API",
  },
  dld_transaction_feed: {
    relation: MARKET_TABLES.dldFeed,
    description: "Notification-style DLD entries with badges and classification",
    key_columns: [
      "transaction_id",
      "feed_type",
      "headline",
      "subline",
      "amount",
      "area",
      "project",
      "reg_type",
      "prop_type",
      "badge",
      "is_notable",
      "icon",
      "metadata",
    ],
    row_count: DLD_FEED,
    updated: "daily",
  },
  dld_area_benchmarks_live: {
    relation: MARKET_TABLES.dldAreaBenchmarks,
    description: "UAE area benchmarks with price stats, velocity, and supply mix",
    key_columns: [
      "area",
      "total_transactions",
      "total_volume_aed",
      "avg_price",
      "median_price",
      "p25_price",
      "p75_price",
      "p90_price",
      "avg_price_per_sqm",
      "median_price_per_sqm",
      "offplan_pct",
      "ready_pct",
      "freehold_pct",
      "avg_size_sqm",
      "daily_velocity",
      "most_common_rooms",
      "date_range_start",
      "date_range_end",
    ],
    row_count: 182,
    updated: "daily",
  },
  developer_registry: {
    relation: MARKET_TABLES.developerRegistry,
    description: "UAE developers with tiers, logos, and project counts",
    key_columns: ["name", "slug", "tier", "logo", "clean_project_count", "dxb_project_count", "dxb_avg_price", "dxb_min_price", "dxb_max_price", "hq", "established", "website", "status"],
    row_count: 75,
    updated: "live",
  },
  entrestate_projects_api: {
    relation: MARKET_TABLES.projectsApi,
    description: "Quality-scored projects for API consumption",
    key_columns: ["id", "name", "slug", "developer", "area", "city", "price_from", "price_to", "rental_yield", "investor_score_v1", "decision_label_v1", "timing_label", "stress_grade_v1", "market_signal", "evidence_level", "bedrooms", "dld_txn_count"],
    row_count: SCORED_PROJECTS,
    updated: "live view",
  },
  entrestate_developers_api: {
    relation: MARKET_TABLES.developersApi,
    description: "Developers with active quality projects",
    key_columns: ["name", "slug", "tier", "logo", "project_count", "avg_price", "avg_yield", "avg_score", "buy_signals", "safe_projects", "areas", "top_project"],
    row_count: 75,
    updated: "live view",
  },
  entrestate_areas_api: {
    relation: MARKET_TABLES.areasApi,
    description: "UAE areas with full analytics",
    key_columns: ["area", "city", "total_projects", "priced_projects", "avg_price", "min_price", "max_price", "avg_yield", "avg_score", "golden_visa_count", "developers"],
    row_count: 167,
    updated: "live view",
  },
  source_of_truth_registry: {
    relation: MARKET_TABLES.sourceOfTruthRegistry,
    description: "Tracked source metrics with owners and update frequencies",
    key_columns: ["metric_name", "category", "source_system", "query_or_method", "owner", "tier", "confidence_rule", "last_refresh_at", "audit_link"],
    row_count: 31,
    updated: "live",
  },
  entrestate_top_data: {
    relation: MARKET_TABLES.topData,
    description: "Homepage intelligence sections (market pulse, stress test, etc)",
    key_columns: ["section", "title", "subtitle", "data_json", "display_order", "confidence", "is_live", "last_updated"],
    row_count: 14,
    updated: "live",
  },
} as const

/**
 * A table name, as SQL may see it. One dot is allowed because a schema is part
 * of the name — stripping it (the old behaviour) turned
 * "canonical.inventory_clean" into "canonicalinventory_clean", which exists
 * nowhere, so a caller who did the right thing was punished for it.
 */
function sanitizeTableName(tableName: string) {
  const cleaned = tableName.trim().replace(/[^a-z0-9_.]/gi, "")
  const parts = cleaned.split(".").filter(Boolean)
  if (parts.length === 0 || parts.length > 2) return ""
  return parts.join(".")
}

/**
 * The qualified relation for a name a caller gave us. A short key from
 * MCP_RESOURCES resolves to its schema; anything already qualified is kept; an
 * unknown bare name is returned as-is, which is the only case that can still
 * depend on search_path and is therefore the only case that can still fail.
 */
function resolveRelation(name: string): string {
  const entry = (MCP_RESOURCES as Record<string, { relation?: string }>)[name]
  if (entry?.relation) return entry.relation
  return name
}

/** schema, table — for querying the catalogue without matching another schema's table of the same name. */
function splitRelation(relation: string): { schema: string | null; table: string } {
  const parts = relation.split(".")
  return parts.length === 2 ? { schema: parts[0], table: parts[1] } : { schema: null, table: relation }
}

/**
 * What mcp_query is allowed to read, in the exact spelling SQL needs. Handed to
 * the model in the tool description: without it the model guesses short names,
 * and short names resolve against `public`, where this data is not.
 */
export function mcpTableCatalogue(): string {
  return Object.values(MCP_RESOURCES)
    .map((r) => `${r.relation} — ${r.description}`)
    .join("\n")
}

export async function mcpQuery(input: {
  sql: string
  params?: unknown[]
  limit?: number
}) {
  const trimmed = input.sql.trim().toUpperCase()
  if (!trimmed.startsWith("SELECT") && !trimmed.startsWith("WITH")) {
    return { error: "Only SELECT/WITH queries allowed", status: "rejected" }
  }

  const forbidden = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "TRUNCATE", "CREATE", "GRANT"]
  for (const keyword of forbidden) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i")
    if (regex.test(input.sql)) {
      return { error: `${keyword} statements not allowed`, status: "rejected" }
    }
  }

  const limit = Math.min(input.limit || 50, MAX_ROWS)
  const finalSql = /\bLIMIT\b/i.test(input.sql) ? input.sql : `${input.sql} LIMIT ${limit}`

  try {
    const rows = (await withStatementTimeout(
      (tx) => tx.$queryRawUnsafe<DbRow[]>(finalSql, ...(input.params || [])),
      STATEMENT_TIMEOUT_MS,
    )) as DbRow[]

    return {
      source: "mcp_query",
      status: "success",
      count: rows.length,
      rows,
    }
  } catch (error) {
    return { source: "mcp_query", status: "error", message: String(error) }
  }
}

export async function mcpDescribeTable(tableName: string) {
  const safe = sanitizeTableName(tableName)
  if (!safe) {
    return { table: tableName, error: "Invalid table name" }
  }

  const relation = resolveRelation(safe)
  const { schema, table } = splitRelation(relation)

  try {
    // Filtered by schema as well as name: `inventory_clean` and its wide cousin
    // exist under different schemas, and an unfiltered catalogue query returned
    // both sets of columns interleaved as though they were one table.
    const columns = (await withStatementTimeout(
      (tx) =>
        schema
          ? tx.$queryRawUnsafe<DbRow[]>(
              `
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = $1 AND table_name = $2
                ORDER BY ordinal_position
              `,
              schema,
              table,
            )
          : tx.$queryRawUnsafe<DbRow[]>(
              `
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = $1
                ORDER BY ordinal_position
              `,
              table,
            ),
      STATEMENT_TIMEOUT_MS,
    )) as DbRow[]

    const quoted = schema ? `"${schema}"."${table}"` : `"${table}"`
    const count = (await withStatementTimeout(
      (tx) => tx.$queryRawUnsafe<DbRow[]>(`SELECT COUNT(*)::int as total FROM ${quoted}`),
      STATEMENT_TIMEOUT_MS,
    )) as DbRow[]

    return {
      table: relation,
      columns,
      row_count: Number(count[0]?.total || 0),
      description: (MCP_RESOURCES as Record<string, { description?: string }>)[safe]?.description || "Unknown table",
    }
  } catch (error) {
    return { table: relation, error: String(error) }
  }
}

export async function mcpSampleData(tableName: string, limit: number = 5) {
  const safe = sanitizeTableName(tableName)
  if (!safe) {
    return { table: tableName, error: "Invalid table name" }
  }

  const relation = resolveRelation(safe)
  const { schema, table } = splitRelation(relation)
  const quoted = schema ? `"${schema}"."${table}"` : `"${table}"`

  try {
    const rows = (await withStatementTimeout(
      (tx) => tx.$queryRawUnsafe<DbRow[]>(`SELECT * FROM ${quoted} LIMIT ${Math.min(limit, 20)}`),
      STATEMENT_TIMEOUT_MS,
    )) as DbRow[]

    return { table: relation, count: rows.length, rows }
  } catch (error) {
    return { table: relation, error: String(error) }
  }
}

export async function mcpCrossReference(input: {
  type: "price_vs_dld" | "developer_portfolio" | "area_intelligence" | "golden_visa_opportunities" | "stress_test_report"
  filter?: string
  limit?: number
}) {
  const limit = Math.min(input.limit || 20, 50)
  // The curated inventory names its price `price_from`; the wide tables name it
  // `price_from_aed`. These queries assumed the wide name against the curated
  // table, so every one of them threw on the column as well as on the schema.
  const IC_PRICE = `ic.${INVENTORY_PRICE_COLUMN}`
  const DR_PROJECTS = developerProjectCountSql("dr")

  const filterClause = input.filter ? `AND LOWER(ic.area) LIKE LOWER('%${input.filter.replace(/'/g, "''")}%')` : ""

  const queries: Record<string, string> = {
    price_vs_dld: `
      SELECT ic.name, ic.area, ${IC_PRICE} as listed_price,
             dab.median_price as dld_median, dab.p25_price, dab.p75_price,
             dab.avg_price_per_sqm as dld_psqm, dab.daily_velocity,
             CASE
               WHEN ${IC_PRICE} < dab.p25_price THEN 'BELOW MARKET'
               WHEN ${IC_PRICE} > dab.p75_price THEN 'ABOVE MARKET'
               ELSE 'FAIR VALUE'
             END as price_verdict,
             ic.timing_label, ic.stress_grade_v1, ic.rental_yield
      FROM ${MARKET_TABLES.inventory} ic
      JOIN ${MARKET_TABLES.dldAreaBenchmarks} dab ON UPPER(dab.area) = UPPER(ic.area)
      WHERE ${IC_PRICE} > 0 ${filterClause}
      ORDER BY ic.quality_score DESC
      LIMIT ${limit}`,
    developer_portfolio: `
      SELECT dr.name as developer, dr.tier, ${DR_PROJECTS} as registry_projects,
             COUNT(ic.id) as clean_projects,
             AVG(${IC_PRICE})::bigint as avg_price,
             AVG(ic.rental_yield)::numeric(4,2) as avg_yield,
             AVG(ic.investor_score_v1)::numeric(4,1) as avg_score,
             STRING_AGG(DISTINCT ic.area, ', ' ORDER BY ic.area) as areas,
             COUNT(*) FILTER (WHERE ic.timing_label IN ('STRONG_BUY', 'BUY')) as buy_signals,
             COUNT(*) FILTER (WHERE ic.stress_grade_v1 IN ('A','B')) as safe_projects
      FROM ${MARKET_TABLES.developerRegistry} dr
      LEFT JOIN ${MARKET_TABLES.inventory} ic ON LOWER(ic.developer) = LOWER(dr.name)
      GROUP BY dr.name, dr.tier, ${DR_PROJECTS}
      HAVING COUNT(ic.id) > 0
      ORDER BY COUNT(ic.id) DESC
      LIMIT ${limit}`,
    area_intelligence: `
      SELECT dab.area,
             dab.total_transactions, dab.total_volume_aed,
             dab.median_price, dab.avg_price_per_sqm, dab.daily_velocity,
             dab.offplan_pct, dab.ready_pct, dab.freehold_pct,
             COUNT(ic.id) as inventory_projects,
             AVG(${IC_PRICE})::bigint as inventory_avg_price,
             AVG(ic.rental_yield)::numeric(4,2) as avg_yield,
             COUNT(*) FILTER (WHERE ic.timing_label IN ('STRONG_BUY', 'BUY')) as buy_signals,
             COUNT(*) FILTER (WHERE ic.stress_grade_v1 = 'A') as grade_a_projects
      FROM ${MARKET_TABLES.dldAreaBenchmarks} dab
      LEFT JOIN ${MARKET_TABLES.inventory} ic ON UPPER(ic.area) = UPPER(dab.area)
      GROUP BY dab.area, dab.total_transactions, dab.total_volume_aed,
               dab.median_price, dab.avg_price_per_sqm, dab.daily_velocity,
               dab.offplan_pct, dab.ready_pct, dab.freehold_pct
      ORDER BY dab.daily_velocity DESC
      LIMIT ${limit}`,
    golden_visa_opportunities: `
      SELECT ic.name, ic.area, ic.developer, ${IC_PRICE} AS price_from_aed,
             ic.timing_label, ic.stress_grade_v1, ic.rental_yield, ic.investor_score_v1,
             dab.median_price as dld_area_median, dab.freehold_pct,
             CASE WHEN ${IC_PRICE} < dab.median_price THEN 'BELOW MEDIAN' ELSE 'AT/ABOVE MEDIAN' END as vs_market
      FROM ${MARKET_TABLES.inventory} ic
      LEFT JOIN ${MARKET_TABLES.dldAreaBenchmarks} dab ON UPPER(dab.area) = UPPER(ic.area)
      WHERE ${IC_PRICE} >= 2000000
        AND ic.timing_label IN ('STRONG_BUY', 'BUY', 'HOLD')
        AND ic.stress_grade_v1 IN ('A', 'B')
      ORDER BY ic.investor_score_v1 DESC
      LIMIT ${limit}`,
    stress_test_report: `
      SELECT ic.stress_grade_v1, COUNT(*) as projects,
             AVG(${IC_PRICE})::bigint as avg_price,
             AVG(ic.rental_yield)::numeric(4,2) as avg_yield,
             AVG(ic.investor_score_v1)::numeric(4,1) as avg_score,
             COUNT(*) FILTER (WHERE ic.timing_label IN ('STRONG_BUY', 'BUY')) as buy_signals,
             STRING_AGG(DISTINCT ic.area, ', ' ORDER BY ic.area) as top_areas
      FROM ${MARKET_TABLES.inventory} ic
      WHERE ic.stress_grade_v1 IS NOT NULL
      GROUP BY ic.stress_grade_v1
      ORDER BY CASE ic.stress_grade_v1 WHEN 'A' THEN 1 WHEN 'B' THEN 2 WHEN 'C' THEN 3 WHEN 'D' THEN 4 WHEN 'E' THEN 5 END`,
  }

  const sql = queries[input.type]
  if (!sql) return { error: `Unknown cross-reference type: ${input.type}` }

  try {
    const rows = (await withStatementTimeout(
      (tx) => tx.$queryRawUnsafe<DbRow[]>(sql),
      STATEMENT_TIMEOUT_MS,
    )) as DbRow[]

    return { source: `mcp_cross_reference:${input.type}`, count: rows.length, rows }
  } catch (error) {
    return { source: `mcp_cross_reference:${input.type}`, error: String(error) }
  }
}

export async function mcpTriggerScraper(source: "arvo_dld" | "pf_developers") {
  if (source === "arvo_dld") {
    try {
      const response = await fetch("https://transactions.arvo.co/api/transactions", {
        headers: { "User-Agent": "Entrestate-MCP/1.0" },
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) {
        return { source: "arvo.co", status: "error", code: response.status }
      }

      const transactions = await response.json()
      return {
        source: "arvo.co",
        status: "success",
        transactions_available: Array.isArray(transactions) ? transactions.length : 0,
        message: "Data fetched. Use mcp_query to analyze or sync to database.",
      }
    } catch (error) {
      return { source: "arvo.co", status: "error", message: String(error) }
    }
  }

  return { error: `Unknown scraper: ${source}` }
}
