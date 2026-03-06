import "server-only"
import { Prisma } from "@prisma/client"
import { withStatementTimeout } from "@/lib/db-guardrails"
import { getInventoryTableSql } from "@/lib/inventory-table"
import type {
  AreaRiskBriefInput,
  DealScreenerInput,
  DeveloperDueDiligenceInput,
  GenerateInvestorMemoInput,
  MemoSection,
  PriceRealityCheckInput,
} from "@/lib/copilot/tools"

const STATEMENT_TIMEOUT_MS = 8000
const STRESS_GRADE_ORDER = ["A", "B", "C", "D"] as const
const DEAL_SORT_COLUMNS = {
  engine_god_metric: "engine_god_metric",
  l1_canonical_price: "l1_canonical_price",
  l1_canonical_yield: "l1_canonical_yield",
  l2_developer_reliability: "l2_developer_reliability",
} as const

const INVENTORY_TABLE_SQL = getInventoryTableSql()

type DbRow = Record<string, unknown>

type ToolEnvelope<T> = {
  source: string
  data_as_of: string
  count?: number
  no_results?: boolean
  rows?: T[]
  memo?: Record<string, unknown>
}

function nowIso() {
  return new Date().toISOString()
}

function toSqlList(values: string[]) {
  return Prisma.join(values.map((value) => Prisma.sql`${value}`))
}

function normalizeValue(value: unknown): unknown {
  if (typeof value === "bigint") {
    const asNumber = Number(value)
    return Number.isSafeInteger(asNumber) ? asNumber : value.toString()
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizeValue(entry))
  }

  if (value && typeof value === "object") {
    if ("toNumber" in value) {
      try {
        return (value as { toNumber: () => number }).toNumber()
      } catch {
        return value
      }
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, normalizeValue(entry)]),
    )
  }

  return value
}

function normalizeRows<T extends DbRow>(rows: T[]): T[] {
  return rows.map((row) => normalizeValue(row) as T)
}

async function runQuery<T extends DbRow>(query: Prisma.Sql): Promise<T[]> {
  const rows = await withStatementTimeout((tx) => tx.$queryRaw<T[]>(query), STATEMENT_TIMEOUT_MS)
  return normalizeRows(rows)
}

function buildDealScreenerFilters(filters: DealScreenerInput["filters"]): Prisma.Sql[] {
  if (!filters) return []

  const clauses: Prisma.Sql[] = []

  if (filters.area) {
    clauses.push(Prisma.sql`LOWER(COALESCE(final_area, area)) LIKE LOWER(${`%${filters.area}%`})`)
  }

  if (typeof filters.budget_max_aed === "number") {
    clauses.push(Prisma.sql`l1_canonical_price <= ${filters.budget_max_aed}`)
  }

  if (typeof filters.beds_min === "number") {
    clauses.push(
      Prisma.sql`(
        bedrooms_max >= ${filters.beds_min}
        OR bedrooms_min >= ${filters.beds_min}
      )`,
    )
  }

  if (typeof filters.beds_max === "number") {
    clauses.push(
      Prisma.sql`(
        bedrooms_min <= ${filters.beds_max}
        OR bedrooms_max <= ${filters.beds_max}
      )`,
    )
  }

  if (typeof filters.golden_visa_required === "boolean" && filters.golden_visa_required) {
    clauses.push(
      Prisma.sql`(
        LOWER(COALESCE(hotness_factors ->> 'golden_visa_eligible', hotness_factors ->> 'golden_visa', 'false')) IN ('true', 'yes', '1')
        OR LOWER(COALESCE(outcome_intent::text, '')) LIKE '%golden%visa%'
      )`,
    )
  }

  if (filters.timing_signal) {
    clauses.push(Prisma.sql`l3_timing_signal = ${filters.timing_signal}`)
  }

  if (filters.stress_grade_min) {
    const index = STRESS_GRADE_ORDER.indexOf(filters.stress_grade_min)
    const allowedGrades = STRESS_GRADE_ORDER.slice(0, index + 1)
    clauses.push(Prisma.sql`l2_stress_test_grade IN (${toSqlList([...allowedGrades])})`)
  }

  if (filters.affordability_tier) {
    clauses.push(Prisma.sql`LOWER(COALESCE(l2_affordability_tier, '')) = LOWER(${filters.affordability_tier})`)
  }

  return clauses
}

function buildDealScreenerQuery(input: DealScreenerInput): Prisma.Sql {
  const clauses = buildDealScreenerFilters(input.filters)
  const whereClause = clauses.length > 0 ? Prisma.sql`WHERE ${Prisma.join(clauses, " AND ")}` : Prisma.empty
  const sortColumn = Prisma.raw(DEAL_SORT_COLUMNS[input.sort_by])

  return Prisma.sql`
    SELECT
      name,
      developer,
      area,
      final_area,
      bedrooms_min,
      bedrooms_max,
      COALESCE(bedrooms_min, bedrooms_max) AS beds,
      l1_canonical_price,
      l1_canonical_yield,
      l1_canonical_status,
      l1_confidence,
      l1_source_coverage,
      l2_investment_score,
      l2_developer_reliability,
      l2_affordability_tier,
      l2_stress_test_grade,
      l2_market_efficiency,
      l2_goal_alignment,
      l3_timing_signal,
      l3_supply_pressure,
      l3_demand_velocity,
      l3_price_drift_30d,
      engine_god_metric,
      engine_affordability,
      engine_stress_test,
      evidence_sources,
      evidence_exclusions,
      evidence_assumptions
    FROM ${INVENTORY_TABLE_SQL}
    ${whereClause}
    ORDER BY ${sortColumn} DESC NULLS LAST
    LIMIT ${input.limit}
  `
}

export async function executeDealScreener(input: DealScreenerInput): Promise<ToolEnvelope<DbRow>> {
  const query = buildDealScreenerQuery(input)
  const rows = await runQuery(query)

  return {
    source: "deal_screener",
    data_as_of: nowIso(),
    count: rows.length,
    no_results: rows.length === 0,
    rows,
  }
}

export async function executePriceRealityCheck(input: PriceRealityCheckInput): Promise<ToolEnvelope<DbRow>> {
  const query = Prisma.sql`
    SELECT
      name,
      l1_canonical_price,
      l4_dld_avg_txn_price,
      l4_portal_price_delta,
      l1_confidence,
      l1_source_coverage,
      evidence_sources,
      evidence_assumptions
    FROM ${INVENTORY_TABLE_SQL}
    WHERE LOWER(name) LIKE LOWER('%' || ${input.project_name} || '%')
    LIMIT 5
  `
  const rows = await runQuery(query)

  return {
    source: "price_reality_check",
    data_as_of: nowIso(),
    count: rows.length,
    no_results: rows.length === 0,
    rows,
  }
}

export async function executeAreaRiskBrief(input: AreaRiskBriefInput): Promise<ToolEnvelope<DbRow>> {
  const query = Prisma.sql`
    SELECT
      COALESCE(final_area, area) AS area,
      COUNT(*)::int AS projects,
      ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0)) AS avg_price,
      ROUND(AVG(l1_canonical_yield::numeric), 1) AS avg_yield,
      ROUND(AVG(l3_supply_pressure::numeric), 2) AS supply_pressure,
      ROUND(AVG(engine_god_metric::numeric), 1) AS efficiency,
      COUNT(CASE WHEN l3_timing_signal = 'BUY' THEN 1 END)::int AS buy_signals,
      COUNT(CASE WHEN l2_stress_test_grade IN ('A', 'B') THEN 1 END)::int AS safe_projects
    FROM ${INVENTORY_TABLE_SQL}
    WHERE LOWER(COALESCE(final_area, area)) LIKE LOWER('%' || ${input.area_name} || '%')
    GROUP BY 1
  `
  const rows = await runQuery(query)

  return {
    source: "area_risk_brief",
    data_as_of: nowIso(),
    count: rows.length,
    no_results: rows.length === 0,
    rows,
  }
}

export async function executeDeveloperDueDiligence(
  input: DeveloperDueDiligenceInput,
): Promise<ToolEnvelope<DbRow>> {
  const query = Prisma.sql`
    SELECT
      developer,
      COUNT(*)::int AS projects,
      ROUND(AVG(l2_developer_reliability::numeric), 1) AS reliability,
      ROUND(AVG(engine_god_metric::numeric), 1) AS efficiency,
      COUNT(CASE WHEN l2_stress_test_grade IN ('A', 'B') THEN 1 END)::int AS safe_projects,
      ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0)) AS avg_price,
      array_agg(DISTINCT COALESCE(final_area, area)) AS areas
    FROM ${INVENTORY_TABLE_SQL}
    WHERE LOWER(developer) LIKE LOWER('%' || ${input.developer_name} || '%')
    GROUP BY 1
  `
  const rows = await runQuery(query)

  return {
    source: "developer_due_diligence",
    data_as_of: nowIso(),
    count: rows.length,
    no_results: rows.length === 0,
    rows,
  }
}

async function loadProjectContext(projectName: string): Promise<DbRow | null> {
  const query = Prisma.sql`
    SELECT
      name,
      developer,
      COALESCE(final_area, area) AS area,
      l2_stress_test_grade,
      engine_stress_test,
      l3_timing_signal,
      l1_confidence,
      l1_source_coverage,
      evidence_sources,
      evidence_assumptions
    FROM ${INVENTORY_TABLE_SQL}
    WHERE LOWER(name) LIKE LOWER('%' || ${projectName} || '%')
    LIMIT 1
  `

  const rows = await runQuery(query)
  return rows[0] ?? null
}

function formatScalar(value: unknown): string {
  if (typeof value === "number") return Number.isFinite(value) ? value.toLocaleString() : "unavailable"
  if (typeof value === "string" && value.trim().length > 0) return value
  return "unavailable"
}

function buildStressNarrative(projectContext: DbRow | null): string {
  if (!projectContext) return "Stress test is unavailable because the project was not found."
  const grade = formatScalar(projectContext.l2_stress_test_grade)
  const score = formatScalar(projectContext.engine_stress_test)
  const timing = formatScalar(projectContext.l3_timing_signal)
  return `Stress profile: grade ${grade}, stress engine score ${score}, timing signal ${timing}.`
}

function includesSection(sections: MemoSection[], section: MemoSection) {
  return sections.includes(section)
}

export async function executeGenerateInvestorMemo(
  input: GenerateInvestorMemoInput,
): Promise<ToolEnvelope<DbRow>> {
  const projectContext = await loadProjectContext(input.project_name)

  const priceReality = includesSection(input.sections, "price_reality")
    ? await executePriceRealityCheck({ project_name: input.project_name })
    : null

  const areaRisk = includesSection(input.sections, "area_risk")
    ? projectContext?.area
      ? await executeAreaRiskBrief({ area_name: String(projectContext.area) })
      : {
          source: "area_risk_brief",
          data_as_of: nowIso(),
          count: 0,
          no_results: true,
          rows: [],
        }
    : null

  const developer = includesSection(input.sections, "developer")
    ? projectContext?.developer
      ? await executeDeveloperDueDiligence({ developer_name: String(projectContext.developer) })
      : {
          source: "developer_due_diligence",
          data_as_of: nowIso(),
          count: 0,
          no_results: true,
          rows: [],
        }
    : null

  const stressTestSection = includesSection(input.sections, "stress_test")
    ? {
        source: "stress_test",
        data_as_of: nowIso(),
        no_results: !projectContext,
        project: projectContext,
        narrative: buildStressNarrative(projectContext),
      }
    : null

  const memo = {
    project_name: input.project_name,
    project_context: projectContext,
    sections: {
      price_reality: priceReality,
      area_risk: areaRisk,
      developer,
      stress_test: stressTestSection,
    },
    narrative: {
      price_reality:
        priceReality && priceReality.rows?.[0]
          ? `Price snapshot for ${formatScalar(priceReality.rows[0].name)}: canonical price ${formatScalar(
              priceReality.rows[0].l1_canonical_price,
            )}, DLD average ${formatScalar(priceReality.rows[0].l4_dld_avg_txn_price)}, portal delta ${formatScalar(
              priceReality.rows[0].l4_portal_price_delta,
            )}.`
          : "Price reality section returned no matching project.",
      area_risk:
        areaRisk && areaRisk.rows?.[0]
          ? `Area risk snapshot for ${formatScalar(areaRisk.rows[0].area)}: projects ${formatScalar(
              areaRisk.rows[0].projects,
            )}, average price ${formatScalar(areaRisk.rows[0].avg_price)}, average yield ${formatScalar(
              areaRisk.rows[0].avg_yield,
            )}.`
          : "Area risk section returned no matching area.",
      developer:
        developer && developer.rows?.[0]
          ? `Developer snapshot for ${formatScalar(developer.rows[0].developer)}: projects ${formatScalar(
              developer.rows[0].projects,
            )}, reliability ${formatScalar(developer.rows[0].reliability)}, safe projects ${formatScalar(
              developer.rows[0].safe_projects,
            )}.`
          : "Developer diligence section returned no matching developer.",
      stress_test: stressTestSection?.narrative ?? "Stress test section was not requested.",
    },
  }

  return {
    source: "generate_investor_memo",
    data_as_of: nowIso(),
    no_results: !projectContext,
    memo,
  }
}

export const copilotExecutors = {
  deal_screener: executeDealScreener,
  price_reality_check: executePriceRealityCheck,
  area_risk_brief: executeAreaRiskBrief,
  developer_due_diligence: executeDeveloperDueDiligence,
  generate_investor_memo: executeGenerateInvestorMemo,
} as const

export { buildDealScreenerQuery }
