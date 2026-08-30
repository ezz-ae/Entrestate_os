import "server-only"
import { getConfiguredTableName } from "@/lib/inventory-table"

/**
 * WHERE THE MARKET DATA ACTUALLY LIVES.
 *
 * Almost none of it is in `public`. Scored projects and the developer registry
 * are in `canonical`, the DLD feeds are in `raw`, several read models are in
 * `api` — and the connection's search_path is plain `public`.
 *
 * That was not a documented fact anywhere, so query after query was written as
 * `FROM inventory_clean` and threw "relation does not exist" the first time it
 * ran. The copilot, the MCP server and the market feed each failed this way,
 * each caught the error, and each reported an empty market over a database
 * holding 2,813 scored projects, 481 developers and 36,841 DLD transactions.
 *
 * One module now answers "what is this table called", so a name is decided once
 * and every reader inherits the answer. Every value is `schema.table`; a bare
 * env override inherits the fallback's schema rather than being handed to
 * search_path (see getConfiguredTableName).
 */
export const MARKET_TABLES = {
  /** Curated V1 inventory: the decision columns live only here. */
  inventory: getConfiguredTableName("COPILOT_INVENTORY_TABLE", "canonical.inventory_clean"),
  /** Wide ingest table: every scraped field, none of the V1 scores. */
  inventoryFull: getConfiguredTableName("INVENTORY_FULL_TABLE", "raw.inventory_full"),
  developerRegistry: getConfiguredTableName("COPILOT_DEVELOPER_REGISTRY_TABLE", "canonical.developer_registry"),
  dldAreaBenchmarks: getConfiguredTableName("COPILOT_DLD_AREA_BENCHMARKS_TABLE", "canonical.dld_area_benchmarks_live"),
  dldTransactions: getConfiguredTableName("COPILOT_DLD_TRANSACTIONS_TABLE", "raw.dld_transactions_arvo"),
  dldFeed: getConfiguredTableName("COPILOT_DLD_FEED_TABLE", "raw.dld_transaction_feed"),
  sourceOfTruthRegistry: getConfiguredTableName("SOURCE_OF_TRUTH_TABLE", "canonical.source_of_truth_registry"),
  projectsApi: getConfiguredTableName("PROJECTS_API_TABLE", "public.entrestate_projects_api"),
  developersApi: getConfiguredTableName("DEVELOPERS_API_TABLE", "api.entrestate_developers_api"),
  areasApi: getConfiguredTableName("AREAS_API_TABLE", "public.entrestate_areas_api"),
  topData: getConfiguredTableName("TOP_DATA_TABLE", "api.entrestate_top_data"),
  homepage: getConfiguredTableName("HOMEPAGE_TABLE", "api.entrestate_homepage"),
  apiContent: getConfiguredTableName("API_CONTENT_TABLE", "api.entrestate_api_content"),
  homepageSections: getConfiguredTableName("HOMEPAGE_SECTIONS_TABLE", "api.entrestate_homepage"),
  /** The joined master row per project, upstream of the curated table. */
  entrestateMaster: getConfiguredTableName("ENTRESTATE_MASTER_TABLE", "signals.entrestate_master"),
  mediaEnrichment: getConfiguredTableName("MEDIA_ENRICHMENT_TABLE", "raw.media_enrichment"),
} as const

export type MarketTableKey = keyof typeof MARKET_TABLES

/**
 * The two inventory tables are shaped differently and the difference is not
 * cosmetic. `canonical.inventory_clean` carries stress_grade_v1,
 * investor_score_v1, price_confidence, developer_reliability_score and
 * rental_yield — every column a decision is made from — and names its price
 * `price_from`, with no bedrooms_min/max and no `emirate`. The wide tables
 * (raw.inventory_full, public.inventory_spine, api.entrestate_inventory) carry
 * price_from_aed, final_area and bedrooms_min/max and none of the V1 columns.
 *
 * Reading the shape off the table name is what the area column already did; the
 * price column and the bedroom range now do the same instead of assuming the
 * wide shape against the curated table.
 */
const HINT = MARKET_TABLES.inventory.toLowerCase()

export const INVENTORY_IS_CURATED = HINT.includes("inventory_clean")

export const INVENTORY_PRICE_COLUMN = (() => {
  const configured = (process.env.COPILOT_PRICE_COLUMN ?? "").trim()
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(configured)) return configured
  return INVENTORY_IS_CURATED ? "price_from" : "price_from_aed"
})()

export const INVENTORY_AREA_COLUMN = (() => {
  const configured = (process.env.COPILOT_AREA_COLUMN ?? "").trim()
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(configured)) return configured
  return HINT.includes("inventory_full") || HINT.includes("inventory_spine") ? "final_area" : "area"
})()

/** bedrooms_min / bedrooms_max exist only on the wide tables. */
export const INVENTORY_HAS_BEDROOM_RANGE = !INVENTORY_IS_CURATED

/**
 * The registry's project count. `project_count` was queried for a long time and
 * has never existed: the columns are clean_project_count (rows in the curated
 * inventory) and dxb_project_count (Dubai only, from the source portal).
 */
export function developerProjectCountSql(alias?: string): string {
  const q = alias ? `${alias}.` : ""
  return `COALESCE(${q}clean_project_count, ${q}dxb_project_count, 0)`
}

export const DEVELOPER_PROJECT_COUNT_SQL = developerProjectCountSql()
