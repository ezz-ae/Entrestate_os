import "server-only"
import { Prisma } from "@prisma/client"
import { withStatementTimeout } from "@/lib/db-guardrails"
import {
  getAreasTableName,
  getAreasTableSql,
  getDetailTableName,
  getDetailTableSql,
  getDevelopersTableName,
  getDevelopersTableSql,
  getInventoryTableName,
  getInventoryTableSql,
  getStatusTableName,
  getStatusTableSql,
} from "@/lib/inventory-table"

const STATEMENT_TIMEOUT_MS = 9000

const PROJECT_SORT_COLUMNS = {
  god_metric: "engine_god_metric",
  price: "l1_canonical_price",
  yield: "l1_canonical_yield",
  reliability: "l2_developer_reliability",
} as const

const CURATED_PROJECT_SORT_COLUMNS = {
  god_metric: "investor_score_v1",
  price: "price_from",
  yield: "rental_yield",
  reliability: "developer_reliability_score",
} as const

const UAE_CITIES = [
  "dubai",
  "abu dhabi",
  "sharjah",
  "ajman",
  "ras al khaimah",
  "fujairah",
  "umm al quwain",
  "al ain",
] as const

const PROPERTIES_TABLE_NAME = getInventoryTableName()
const PROPERTIES_TABLE_SQL = getInventoryTableSql()
const DETAIL_TABLE_NAME = getDetailTableName()
const DETAIL_TABLE_SQL = getDetailTableSql()
const AREAS_TABLE_NAME = getAreasTableName()
const AREAS_TABLE_SQL = getAreasTableSql()
const DEVELOPERS_TABLE_NAME = getDevelopersTableName()
const DEVELOPERS_TABLE_SQL = getDevelopersTableSql()
const STATUS_TABLE_NAME = getStatusTableName()
const STATUS_TABLE_SQL = getStatusTableSql()

function tableEndsWith(tableName: string, suffix: string) {
  return tableName.toLowerCase().endsWith(suffix.toLowerCase())
}

const USE_CURATED_PROPERTIES_VIEW =
  tableEndsWith(PROPERTIES_TABLE_NAME, "entrestate_projects_api") ||
  tableEndsWith(PROPERTIES_TABLE_NAME, "entrestate_projects_api_full")

const USE_CURATED_AREAS_VIEW = tableEndsWith(AREAS_TABLE_NAME, "entrestate_areas_api")
const USE_CURATED_DEVELOPERS_VIEW = tableEndsWith(DEVELOPERS_TABLE_NAME, "entrestate_developers_api")

type SortBy = keyof typeof PROJECT_SORT_COLUMNS

type DbRow = Record<string, unknown>
export type DecisionRecord = Record<string, unknown>
export type DecisionProject = DecisionRecord & { slug: string }

export type PropertyFilters = {
  area?: string
  developer?: string
  intent?: string
  budgetMaxAed?: number
  budgetMinAed?: number
  bedsMin?: number
  bedsMax?: number
  timingSignal?: "BUY" | "HOLD" | "WAIT"
  stressGradeMin?: "A" | "B" | "C" | "D"
  affordabilityTier?: string
  goldenVisaRequired?: boolean
}

export type ListPropertiesInput = {
  filters?: PropertyFilters
  sortBy?: SortBy
  page?: number
  pageSize?: number
}

function toSqlList(values: string[]) {
  return Prisma.join(values.map((value) => Prisma.sql`${value}`))
}

type QualityOptions = {
  requirePrice?: boolean
  requireStress?: boolean
  requireArea?: boolean
  requireDeveloper?: boolean
  requireConfidence?: boolean
  onlyUae?: boolean
  excludeGarbageDeveloper?: boolean
  requireBedroomSanity?: boolean
}

function buildQualityClauses(options: QualityOptions = {}): Prisma.Sql[] {
  const clauses: Prisma.Sql[] = []

  if (options.requirePrice) {
    clauses.push(Prisma.sql`COALESCE(l1_canonical_price, 0) > 0`)
  }

  if (options.requireStress) {
    clauses.push(Prisma.sql`l2_stress_test_grade IS NOT NULL`)
  }

  if (options.requireArea) {
    clauses.push(Prisma.sql`TRIM(COALESCE(final_area, area, '')) <> ''`)
  }

  if (options.requireDeveloper) {
    clauses.push(Prisma.sql`TRIM(COALESCE(developer, '')) <> ''`)
  }

  if (options.requireConfidence) {
    clauses.push(Prisma.sql`COALESCE(l1_confidence, 'LOW') IN ('MEDIUM', 'HIGH')`)
  }

  if (options.onlyUae) {
    clauses.push(
      Prisma.sql`LOWER(COALESCE(NULLIF(TRIM(final_city), ''), NULLIF(TRIM(city), ''), '')) IN (${toSqlList([...UAE_CITIES])})`,
    )
  }

  if (options.excludeGarbageDeveloper) {
    clauses.push(Prisma.sql`LOWER(COALESCE(developer, '')) NOT LIKE '%breadcrumb%'`)
    clauses.push(Prisma.sql`LOWER(COALESCE(developer, '')) NOT LIKE '%@id%'`)
    clauses.push(Prisma.sql`LOWER(COALESCE(developer, '')) NOT LIKE '%http%'`)
    clauses.push(Prisma.sql`LENGTH(COALESCE(developer, '')) <= 80`)
  }

  if (options.requireBedroomSanity) {
    clauses.push(Prisma.sql`(bedrooms_min IS NULL OR bedrooms_min BETWEEN 0 AND 10)`)
    clauses.push(Prisma.sql`(bedrooms_max IS NULL OR bedrooms_max BETWEEN 0 AND 10)`)
    clauses.push(Prisma.sql`(bedrooms_min IS NULL OR bedrooms_max IS NULL OR bedrooms_min <= bedrooms_max)`)
  }

  return clauses
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

async function runQuery<T extends DbRow = DbRow>(query: Prisma.Sql): Promise<T[]> {
  const rows = await withStatementTimeout((tx) => tx.$queryRaw<T[]>(query), STATEMENT_TIMEOUT_MS)
  return rows.map((row) => normalizeValue(row) as T)
}

async function runOptionalQuery<T extends DbRow = DbRow>(query: Prisma.Sql): Promise<T[]> {
  try {
    return await runQuery<T>(query)
  } catch {
    return []
  }
}

export function slugifyName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function buildPropertyClauses(filters?: PropertyFilters): Prisma.Sql[] {
  const clauses: Prisma.Sql[] = USE_CURATED_PROPERTIES_VIEW
    ? [
        Prisma.sql`name IS NOT NULL`,
        Prisma.sql`COALESCE(price_from, 0) > 0`,
        Prisma.sql`(bedrooms_min IS NULL OR bedrooms_min BETWEEN 0 AND 10)`,
        Prisma.sql`(bedrooms_max IS NULL OR bedrooms_max BETWEEN 0 AND 10)`,
        Prisma.sql`(bedrooms_min IS NULL OR bedrooms_max IS NULL OR bedrooms_min <= bedrooms_max)`,
        Prisma.sql`TRIM(COALESCE(area, '')) <> ''`,
        Prisma.sql`TRIM(COALESCE(developer, '')) <> ''`,
        Prisma.sql`COALESCE(price_confidence, 'LOW') IN ('MEDIUM', 'HIGH')`,
      ]
    : [
        Prisma.sql`name IS NOT NULL`,
        ...buildQualityClauses({
          requirePrice: true,
          requireStress: true,
          requireArea: true,
          requireDeveloper: true,
          requireConfidence: true,
          onlyUae: true,
          excludeGarbageDeveloper: true,
          requireBedroomSanity: true,
        }),
      ]
  const gradeOrder = ["A", "B", "C", "D"] as const

  if (!filters) return clauses

  if (typeof filters.bedsMin === "number" || typeof filters.bedsMax === "number") {
    clauses.push(Prisma.sql`COALESCE(bedrooms_max, bedrooms_min) BETWEEN 0 AND 10`)
    clauses.push(Prisma.sql`(bedrooms_min IS NULL OR bedrooms_min BETWEEN 0 AND 10)`)
    clauses.push(Prisma.sql`(bedrooms_max IS NULL OR bedrooms_max BETWEEN 0 AND 10)`)
    clauses.push(Prisma.sql`(bedrooms_min IS NULL OR bedrooms_max IS NULL OR bedrooms_min <= bedrooms_max)`)
  }

  if (filters.area) {
    clauses.push(
      USE_CURATED_PROPERTIES_VIEW
        ? Prisma.sql`LOWER(area) LIKE LOWER(${`%${filters.area}%`})`
        : Prisma.sql`LOWER(COALESCE(final_area, area)) LIKE LOWER(${`%${filters.area}%`})`,
    )
  }
  if (filters.developer) {
    clauses.push(Prisma.sql`LOWER(developer) LIKE LOWER(${`%${filters.developer}%`})`)
  }
  if (filters.intent) {
    clauses.push(Prisma.sql`outcome_intent @> ARRAY[${filters.intent}]::text[]`)
  }
  if (typeof filters.budgetMaxAed === "number") {
    clauses.push(
      USE_CURATED_PROPERTIES_VIEW
        ? Prisma.sql`price_from <= ${filters.budgetMaxAed}`
        : Prisma.sql`l1_canonical_price <= ${filters.budgetMaxAed}`,
    )
  }
  if (typeof filters.budgetMinAed === "number") {
    clauses.push(
      USE_CURATED_PROPERTIES_VIEW
        ? Prisma.sql`price_from >= ${filters.budgetMinAed}`
        : Prisma.sql`l1_canonical_price >= ${filters.budgetMinAed}`,
    )
  }
  if (typeof filters.bedsMin === "number") {
    clauses.push(Prisma.sql`COALESCE(bedrooms_max, bedrooms_min) >= ${filters.bedsMin}`)
  }
  if (typeof filters.bedsMax === "number") {
    clauses.push(Prisma.sql`COALESCE(bedrooms_min, bedrooms_max) <= ${filters.bedsMax}`)
  }
  if (filters.timingSignal) {
    clauses.push(
      USE_CURATED_PROPERTIES_VIEW
        ? Prisma.sql`timing_label = ${filters.timingSignal}`
        : Prisma.sql`l3_timing_signal = ${filters.timingSignal}`,
    )
  }
  if (filters.stressGradeMin) {
    const index = gradeOrder.indexOf(filters.stressGradeMin)
    const allowed = gradeOrder.slice(0, index + 1)
    clauses.push(
      USE_CURATED_PROPERTIES_VIEW
        ? Prisma.sql`stress_grade_v1 IN (${toSqlList([...allowed])})`
        : Prisma.sql`l2_stress_test_grade IN (${toSqlList([...allowed])})`,
    )
  }
  if (filters.affordabilityTier) {
    clauses.push(
      USE_CURATED_PROPERTIES_VIEW
        ? Prisma.sql`LOWER(COALESCE(affordability_tier, '')) = LOWER(${filters.affordabilityTier})`
        : Prisma.sql`LOWER(COALESCE(l2_affordability_tier, '')) = LOWER(${filters.affordabilityTier})`,
    )
  }

  if (filters.goldenVisaRequired) {
    clauses.push(
      USE_CURATED_PROPERTIES_VIEW
        ? Prisma.sql`(
            COALESCE(price_from, 0) >= 2000000
            OR LOWER(COALESCE(golden_visa_eligible, 'false')) IN ('true', 'yes', '1')
          )`
        : Prisma.sql`(
            l1_canonical_price >= 2000000
            OR LOWER(COALESCE(hotness_factors ->> 'golden_visa_eligible', hotness_factors ->> 'golden_visa', 'false')) IN ('true', 'yes', '1')
          )`,
    )
  }

  return clauses
}

export async function listProperties(input: ListPropertiesInput = {}): Promise<{
  data_as_of: string
  page: number
  pageSize: number
  total: number
  projects: DecisionProject[]
}> {
  const pageSize = Math.min(Math.max(input.pageSize ?? 20, 1), 100)
  const page = Math.max(input.page ?? 1, 1)
  const offset = (page - 1) * pageSize
  const sortBy = input.sortBy ?? "god_metric"

  const clauses = buildPropertyClauses(input.filters)
  const whereClause = clauses.length > 0 ? Prisma.sql`WHERE ${Prisma.join(clauses, " AND ")}` : Prisma.empty
  const sortColumn = Prisma.raw(
    USE_CURATED_PROPERTIES_VIEW ? CURATED_PROJECT_SORT_COLUMNS[sortBy] : PROJECT_SORT_COLUMNS[sortBy],
  )

  const selectQuery = USE_CURATED_PROPERTIES_VIEW
    ? Prisma.sql`
        SELECT
          name,
          developer,
          area,
          area AS final_area,
          bedrooms_min,
          bedrooms_max,
          COALESCE(bedrooms_min, bedrooms_max) AS beds,
          price_from AS l1_canonical_price,
          rental_yield AS l1_canonical_yield,
          NULL AS l1_canonical_status,
          price_confidence AS l1_confidence,
          price_source AS l1_source_coverage,
          investor_score_v1 AS l2_investment_score,
          developer_reliability_score AS l2_developer_reliability,
          NULL AS l2_affordability_tier,
          stress_grade_v1 AS l2_stress_test_grade,
          timing_label AS l3_timing_signal,
          NULL::jsonb AS engine_stress_test,
          investor_score_v1 AS engine_god_metric
        FROM ${PROPERTIES_TABLE_SQL}
        ${whereClause}
        ORDER BY ${sortColumn} DESC NULLS LAST
        LIMIT ${pageSize}
        OFFSET ${offset}
      `
    : Prisma.sql`
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
          l2_stress_test_grade,
          l2_developer_reliability,
          l2_affordability_tier,
          l3_timing_signal,
          engine_stress_test,
          engine_god_metric,
          l1_confidence,
          l1_source_coverage
        FROM ${PROPERTIES_TABLE_SQL}
        ${whereClause}
        ORDER BY ${sortColumn} DESC NULLS LAST
        LIMIT ${pageSize}
        OFFSET ${offset}
      `

  const [rows, countRows] = await Promise.all([
    runQuery(selectQuery),
    runQuery<{ count: number }>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM ${PROPERTIES_TABLE_SQL}
      ${whereClause}
    `),
  ])

  const projects: DecisionProject[] = rows.map((row) => ({
    ...(row as DecisionRecord),
    slug: slugifyName(String(row.name ?? "project")),
  }))

  return {
    data_as_of: new Date().toISOString(),
    page,
    pageSize,
    total: countRows[0]?.count ?? 0,
    projects,
  }
}

export async function getProjectBySlug(slug: string): Promise<{
  data_as_of: string
  slug: string
  project: DecisionProject
  area_context: DecisionRecord | null
  developer_profile: DecisionRecord | null
  similar_projects: DecisionProject[]
} | null> {
  const normalizedSlug = slug.toLowerCase().trim()
  const candidateName = normalizedSlug.replace(/-/g, " ")

  const candidates = await runQuery(Prisma.sql`
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
      l2_stress_test_grade,
      l2_developer_reliability,
      l2_affordability_tier,
      l3_timing_signal,
      l3_supply_pressure,
      l3_demand_velocity,
      l3_price_drift_30d,
      engine_god_metric,
      engine_affordability,
      engine_stress_test,
      payment_plan_structured,
      evidence_sources,
      evidence_exclusions,
      evidence_assumptions,
      hotness_factors
    FROM ${DETAIL_TABLE_SQL}
    WHERE LOWER(name) LIKE LOWER('%' || ${candidateName} || '%')
    ORDER BY engine_god_metric DESC NULLS LAST
    LIMIT 30
  `)

  const project =
    (candidates.find((row) => slugifyName(String(row.name ?? "")) === normalizedSlug) as DecisionRecord | undefined) ??
    (candidates[0] as DecisionRecord | undefined) ??
    null
  if (!project) return null

  const areaName = String(project.final_area ?? project.area ?? "")
  const developerName = String(project.developer ?? "")

  const [areaContextRows, developerRows, similarRows] = await Promise.all([
    runQuery(Prisma.sql`
      SELECT
        COALESCE(final_area, area) AS area,
        COUNT(*)::int AS projects,
        ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0)) AS avg_price,
        ROUND(AVG(l1_canonical_yield::numeric), 1) AS avg_yield,
        ROUND(AVG(engine_god_metric::numeric), 1) AS avg_efficiency
      FROM ${DETAIL_TABLE_SQL}
      WHERE LOWER(COALESCE(final_area, area)) = LOWER(${areaName})
      GROUP BY 1
    `),
    runQuery(Prisma.sql`
      SELECT
        developer,
        COUNT(*)::int AS projects,
        ROUND(AVG(l2_developer_reliability::numeric), 1) AS reliability,
        ROUND(AVG(engine_god_metric::numeric), 1) AS efficiency,
        array_agg(DISTINCT COALESCE(final_area, area)) AS areas
      FROM ${DETAIL_TABLE_SQL}
      WHERE LOWER(developer) = LOWER(${developerName})
      GROUP BY 1
    `),
    runQuery(Prisma.sql`
      SELECT
        name,
        developer,
        COALESCE(final_area, area) AS area,
        l1_canonical_price,
        l1_canonical_yield,
        l2_stress_test_grade,
        l3_timing_signal,
        engine_god_metric,
        l1_confidence
      FROM ${DETAIL_TABLE_SQL}
      WHERE LOWER(COALESCE(final_area, area)) = LOWER(${areaName})
        AND LOWER(name) <> LOWER(${String(project.name)})
      ORDER BY engine_god_metric DESC NULLS LAST
      LIMIT 5
    `),
  ])

  return {
    data_as_of: new Date().toISOString(),
    slug: normalizedSlug,
    project: {
      ...(project as DecisionRecord),
      slug: slugifyName(String(project.name ?? "project")),
    },
    area_context: (areaContextRows[0] as DecisionRecord | undefined) ?? null,
    developer_profile: (developerRows[0] as DecisionRecord | undefined) ?? null,
    similar_projects: similarRows.map((row) => ({
      ...(row as DecisionRecord),
      slug: slugifyName(String(row.name ?? "project")),
    })),
  }
}

export async function listAreas(): Promise<{
  data_as_of: string
  areas: Array<DecisionRecord & { slug: string }>
}> {
  const rows = USE_CURATED_AREAS_VIEW
    ? await runQuery(Prisma.sql`
        SELECT
          t.area,
          NULLIF(TRIM(COALESCE(t.city, '')), '') AS city,
          COALESCE((to_jsonb(t) ->> 'total_projects')::int, 0) AS projects,
          (to_jsonb(t) ->> 'avg_price')::numeric AS avg_price,
          (to_jsonb(t) ->> 'avg_yield')::numeric AS avg_yield,
          COALESCE(
            (to_jsonb(t) ->> 'avg_investment_score')::numeric,
            (to_jsonb(t) ->> 'avg_score')::numeric,
            (to_jsonb(t) ->> 'efficiency')::numeric
          ) AS efficiency,
          NULL::numeric AS supply_pressure,
          COALESCE(
            (to_jsonb(t) ->> 'buy_signals')::int,
            CASE WHEN UPPER(COALESCE(to_jsonb(t) ->> 'dominant_timing', '')) = 'BUY'
              THEN COALESCE((to_jsonb(t) ->> 'total_projects')::int, 0)
              ELSE 0
            END,
            0
          ) AS buy_signals
        FROM ${AREAS_TABLE_SQL} t
        WHERE TRIM(COALESCE(t.area, '')) <> ''
          AND COALESCE((to_jsonb(t) ->> 'total_projects')::int, 0) >= 2
        ORDER BY efficiency DESC NULLS LAST
      `)
    : await runQuery(Prisma.sql`
        SELECT
          COALESCE(final_area, area) AS area,
          MODE() WITHIN GROUP (ORDER BY COALESCE(NULLIF(TRIM(final_city), ''), NULLIF(TRIM(city), ''), 'Dubai')) AS city,
          COUNT(*)::int AS projects,
          ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0)) AS avg_price,
          ROUND(AVG(l1_canonical_yield::numeric), 1) AS avg_yield,
          ROUND(AVG(engine_god_metric::numeric), 1) AS efficiency,
          ROUND(AVG(l3_supply_pressure::numeric), 2) AS supply_pressure,
          COUNT(CASE WHEN l3_timing_signal = 'BUY' THEN 1 END)::int AS buy_signals
        FROM ${DETAIL_TABLE_SQL}
        WHERE ${Prisma.join(
          buildQualityClauses({
            requirePrice: true,
            requireStress: true,
            requireArea: true,
            requireConfidence: true,
            onlyUae: true,
            requireBedroomSanity: true,
          }),
          " AND ",
        )}
        GROUP BY 1
        HAVING COUNT(*) >= 3
        ORDER BY efficiency DESC NULLS LAST
      `)

  const profiles = await runOptionalQuery<{ area_name: string; image_url: string | null; area_type: string | null }>(Prisma.sql`
    SELECT
      area_name,
      image_url,
      area_type
    FROM gc_area_profiles
  `)

  const profileMap = new Map(
    profiles.map((profile) => [String(profile.area_name ?? "").toLowerCase(), profile]),
  )

  const topProjectsRows = await runOptionalQuery<{ area: string; top_projects: string[] | null }>(Prisma.sql`
    WITH ranked AS (
      SELECT
        COALESCE(final_area, area) AS area,
        name,
        ROW_NUMBER() OVER (
          PARTITION BY COALESCE(final_area, area)
          ORDER BY engine_god_metric DESC NULLS LAST
        ) AS row_rank
      FROM ${DETAIL_TABLE_SQL}
      WHERE name IS NOT NULL
    )
    SELECT
      area,
      ARRAY_AGG(name ORDER BY row_rank) FILTER (WHERE row_rank <= 3) AS top_projects
    FROM ranked
    WHERE row_rank <= 3
    GROUP BY area
  `)

  const topProjectsMap = new Map(
    topProjectsRows.map((row) => [
      String(row.area ?? "").toLowerCase(),
      Array.isArray(row.top_projects) ? row.top_projects : [],
    ]),
  )

  return {
    data_as_of: new Date().toISOString(),
    areas: rows.map((row) => {
      const key = String(row.area ?? "").toLowerCase()
      const profile = profileMap.get(key)
      const topProjects = topProjectsMap.get(key) ?? []
      return {
        ...row,
        image_url: profile?.image_url ?? null,
        area_type: profile?.area_type ?? null,
        top_projects: topProjects,
        slug: slugifyName(String(row.area ?? "area")),
      }
    }),
  }
}

export async function getAreaBySlug(slug: string): Promise<{
  data_as_of: string
  area: DecisionRecord & { slug: string; profile: DecisionRecord | null }
  projects: DecisionProject[]
  developers: DecisionRecord[]
} | null> {
  const areaName = slug.replace(/-/g, " ")
  const areaQualityClauses = buildQualityClauses({
    requirePrice: true,
    requireStress: true,
    requireArea: true,
    requireConfidence: true,
    onlyUae: true,
    requireBedroomSanity: true,
  })
  const areaWhere = Prisma.sql`LOWER(COALESCE(final_area, area)) LIKE LOWER('%' || ${areaName} || '%') AND ${Prisma.join(areaQualityClauses, " AND ")}`
  const developerAreaWhere = Prisma.sql`${areaWhere} AND TRIM(COALESCE(developer, '')) <> ''`

  const [statsRows, projectsRows, developerRows, profileRows] = await Promise.all([
    runQuery(Prisma.sql`
      SELECT
        COALESCE(final_area, area) AS area,
        COUNT(*)::int AS projects,
        ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0)) AS avg_price,
        ROUND(AVG(l1_canonical_yield::numeric), 1) AS avg_yield,
        ROUND(AVG(l3_supply_pressure::numeric), 2) AS supply_pressure,
        COUNT(CASE WHEN l3_timing_signal = 'BUY' THEN 1 END)::int AS buy_signals
      FROM ${DETAIL_TABLE_SQL}
      WHERE ${areaWhere}
      GROUP BY 1
      ORDER BY projects DESC
      LIMIT 1
    `),
    runQuery(Prisma.sql`
      SELECT
        name,
        developer,
        l1_canonical_price,
        l1_canonical_yield,
        l2_stress_test_grade,
        l3_timing_signal,
        engine_god_metric,
        l1_confidence
      FROM ${DETAIL_TABLE_SQL}
      WHERE ${areaWhere}
      ORDER BY engine_god_metric DESC NULLS LAST
      LIMIT 40
    `),
    runQuery(Prisma.sql`
      SELECT
        developer,
        COUNT(*)::int AS projects
      FROM ${DETAIL_TABLE_SQL}
      WHERE ${developerAreaWhere}
      GROUP BY 1
      ORDER BY projects DESC
      LIMIT 12
    `),
    runOptionalQuery(Prisma.sql`
      SELECT
        area_name,
        image_url,
        area_type,
        city
      FROM gc_area_profiles
      WHERE LOWER(area_name) LIKE LOWER('%' || ${areaName} || '%')
      LIMIT 1
    `),
  ])

  const stat = (statsRows[0] as DecisionRecord | undefined) ?? null
  if (!stat) return null

  return {
    data_as_of: new Date().toISOString(),
    area: {
      ...(stat as DecisionRecord),
      slug: slugifyName(String(stat.area ?? "area")),
      profile: (profileRows[0] as DecisionRecord | undefined) ?? null,
    },
    projects: projectsRows.map((row) => ({
      ...(row as DecisionRecord),
      slug: slugifyName(String(row.name ?? "project")),
    })),
    developers: developerRows as DecisionRecord[],
  }
}

export async function listDevelopers(): Promise<{
  data_as_of: string
  developers: Array<DecisionRecord & { slug: string }>
}> {
  const developerQualityClauses = buildQualityClauses({
    requirePrice: true,
    requireStress: true,
    requireArea: true,
    requireDeveloper: true,
    requireConfidence: true,
    onlyUae: true,
    excludeGarbageDeveloper: true,
    requireBedroomSanity: true,
  })

  const rows = USE_CURATED_DEVELOPERS_VIEW
    ? await runQuery(Prisma.sql`
        SELECT
          COALESCE(
            NULLIF(TRIM(COALESCE(to_jsonb(t) ->> 'name', '')), ''),
            NULLIF(TRIM(COALESCE(to_jsonb(t) ->> 'developer', '')), '')
          ) AS developer,
          COALESCE((to_jsonb(t) ->> 'total_projects')::int, 0) AS projects,
          COALESCE(
            (to_jsonb(t) ->> 'avg_score')::numeric,
            (to_jsonb(t) ->> 'avg_quality')::numeric,
            (to_jsonb(t) ->> 'reliability')::numeric
          ) AS reliability,
          COALESCE(
            (to_jsonb(t) ->> 'avg_score')::numeric,
            (to_jsonb(t) ->> 'avg_quality')::numeric,
            (to_jsonb(t) ->> 'efficiency')::numeric
          ) AS efficiency,
          (to_jsonb(t) ->> 'avg_price')::numeric AS avg_price,
          CASE
            WHEN jsonb_typeof(COALESCE(to_jsonb(t) -> 'areas', to_jsonb(t) -> 'top_areas', '[]'::jsonb)) = 'array' THEN
              ARRAY(
                SELECT value
                FROM jsonb_array_elements_text(
                  COALESCE(
                    to_jsonb(t) -> 'areas',
                    to_jsonb(t) -> 'top_areas',
                    '[]'::jsonb
                  )
                )
              )
            WHEN jsonb_typeof(COALESCE(to_jsonb(t) -> 'areas', to_jsonb(t) -> 'top_areas', '[]'::jsonb)) = 'string' THEN
              regexp_split_to_array(
                COALESCE(to_jsonb(t) -> 'areas', to_jsonb(t) -> 'top_areas') #>> '{}',
                E' *, *'
              )
            ELSE ARRAY[]::text[]
          END AS top_areas
        FROM ${DEVELOPERS_TABLE_SQL} t
        WHERE COALESCE(
            NULLIF(TRIM(COALESCE(to_jsonb(t) ->> 'name', '')), ''),
            NULLIF(TRIM(COALESCE(to_jsonb(t) ->> 'developer', '')), '')
          ) IS NOT NULL
          AND COALESCE((to_jsonb(t) ->> 'total_projects')::int, 0) >= 2
        ORDER BY reliability DESC NULLS LAST
      `)
    : await runQuery(Prisma.sql`
        SELECT
          developer,
          COUNT(*)::int AS projects,
          ROUND(AVG(l2_developer_reliability::numeric), 1) AS reliability,
          ROUND(AVG(engine_god_metric::numeric), 1) AS efficiency,
          ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0)) AS avg_price
        FROM ${DETAIL_TABLE_SQL}
        WHERE ${Prisma.join(developerQualityClauses, " AND ")}
        GROUP BY 1
        HAVING COUNT(*) >= 3
        ORDER BY reliability DESC NULLS LAST
      `)

  const profiles = await runOptionalQuery<{ name: string; logo_url: string | null; founded_year: string | null; hq: string | null }>(Prisma.sql`
    SELECT
      name,
      logo_url,
      founded_year,
      hq
    FROM gc_developer_profiles
  `)

  const profileMap = new Map(profiles.map((profile) => [String(profile.name ?? "").toLowerCase(), profile]))

  const topAreasRows = await runOptionalQuery<{ developer: string; top_areas: string[] | null }>(Prisma.sql`
    WITH ranked AS (
      SELECT
        developer,
        COALESCE(final_area, area) AS area,
        COUNT(*)::int AS projects,
        ROW_NUMBER() OVER (
          PARTITION BY developer
          ORDER BY COUNT(*) DESC
        ) AS row_rank
      FROM ${DETAIL_TABLE_SQL}
      WHERE ${Prisma.join(developerQualityClauses, " AND ")}
      GROUP BY 1, 2
    )
    SELECT
      developer,
      ARRAY_AGG(area ORDER BY row_rank) FILTER (WHERE row_rank <= 3) AS top_areas
    FROM ranked
    WHERE row_rank <= 3
    GROUP BY 1
  `)

  const topProjectsRows = await runOptionalQuery<{ developer: string; top_projects: string[] | null }>(Prisma.sql`
    WITH ranked AS (
      SELECT
        developer,
        name,
        ROW_NUMBER() OVER (
          PARTITION BY developer
          ORDER BY engine_god_metric DESC NULLS LAST
        ) AS row_rank
      FROM ${DETAIL_TABLE_SQL}
      WHERE ${Prisma.join(developerQualityClauses, " AND ")}
        AND name IS NOT NULL
    )
    SELECT
      developer,
      ARRAY_AGG(name ORDER BY row_rank) FILTER (WHERE row_rank <= 3) AS top_projects
    FROM ranked
    WHERE row_rank <= 3
    GROUP BY 1
  `)

  const topAreasMap = new Map(
    topAreasRows.map((row) => [String(row.developer ?? "").toLowerCase(), Array.isArray(row.top_areas) ? row.top_areas : []]),
  )

  const topProjectsMap = new Map(
    topProjectsRows.map((row) => [
      String(row.developer ?? "").toLowerCase(),
      Array.isArray(row.top_projects) ? row.top_projects : [],
    ]),
  )

  return {
    data_as_of: new Date().toISOString(),
    developers: rows.map((row) => {
      const key = String(row.developer ?? "").toLowerCase()
      const profile = profileMap.get(key)
      const inlineTopAreas = Array.isArray((row as DecisionRecord).top_areas)
        ? ((row as DecisionRecord).top_areas as string[])
        : []
      const topAreas = inlineTopAreas.length > 0 ? inlineTopAreas : topAreasMap.get(key) ?? []
      const topProjects = topProjectsMap.get(key) ?? []
      return {
        ...row,
        logo_url: profile?.logo_url ?? null,
        founded_year: profile?.founded_year ?? null,
        hq: profile?.hq ?? null,
        top_areas: topAreas,
        top_projects: topProjects,
        slug: slugifyName(String(row.developer ?? "developer")),
      }
    }),
  }
}

export async function getDeveloperBySlug(slug: string): Promise<{
  data_as_of: string
  developer: DecisionRecord & { slug: string; profile: DecisionRecord | null }
  projects: DecisionProject[]
  area_presence: DecisionRecord[]
} | null> {
  const developerName = slug.replace(/-/g, " ")
  const developerQualityClauses = buildQualityClauses({
    requirePrice: true,
    requireStress: true,
    requireArea: true,
    requireDeveloper: true,
    requireConfidence: true,
    onlyUae: true,
    excludeGarbageDeveloper: true,
    requireBedroomSanity: true,
  })

  const developerWhere = Prisma.sql`LOWER(developer) LIKE LOWER('%' || ${developerName} || '%') AND ${Prisma.join(developerQualityClauses, " AND ")}`

  const [developerRows, projectRows, areaRows, profileRows] = await Promise.all([
    runQuery(Prisma.sql`
      SELECT
        developer,
        COUNT(*)::int AS projects,
        ROUND(AVG(l2_developer_reliability::numeric), 1) AS reliability,
        ROUND(AVG(engine_god_metric::numeric), 1) AS efficiency,
        ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0)) AS avg_price,
      COUNT(CASE WHEN l2_stress_test_grade IN ('A', 'B') THEN 1 END)::int AS safe_projects
      FROM ${DETAIL_TABLE_SQL}
      WHERE ${developerWhere}
      GROUP BY 1
      ORDER BY projects DESC
      LIMIT 1
    `),
    runQuery(Prisma.sql`
      SELECT
        name,
        COALESCE(final_area, area) AS area,
        l1_canonical_price,
        l1_canonical_yield,
        l2_stress_test_grade,
        l3_timing_signal,
        engine_god_metric,
        l1_confidence
      FROM ${DETAIL_TABLE_SQL}
      WHERE ${developerWhere}
      ORDER BY engine_god_metric DESC NULLS LAST
      LIMIT 40
    `),
    runQuery(Prisma.sql`
      SELECT
        COALESCE(final_area, area) AS area,
        COUNT(*)::int AS projects
      FROM ${DETAIL_TABLE_SQL}
      WHERE ${developerWhere}
      GROUP BY 1
      ORDER BY projects DESC
      LIMIT 15
    `),
    runOptionalQuery(Prisma.sql`
      SELECT
        name,
        logo_url,
        founded_year,
        hq,
        footprint,
        continuity
      FROM gc_developer_profiles
      WHERE LOWER(name) LIKE LOWER('%' || ${developerName} || '%')
      LIMIT 1
    `),
  ])

  const developer = (developerRows[0] as DecisionRecord | undefined) ?? null
  if (!developer) return null

  return {
    data_as_of: new Date().toISOString(),
    developer: {
      ...(developer as DecisionRecord),
      slug: slugifyName(String(developer.developer ?? "developer")),
      profile: (profileRows[0] as DecisionRecord | undefined) ?? null,
    },
    projects: projectRows.map((row) => ({
      ...(row as DecisionRecord),
      slug: slugifyName(String(row.name ?? "project")),
    })),
    area_presence: areaRows as DecisionRecord[],
  }
}

export async function getMarketPulse() {
  const qualityClauses = buildQualityClauses({
    requirePrice: true,
    requireStress: true,
    requireArea: true,
    requireConfidence: true,
    onlyUae: true,
    requireBedroomSanity: true,
  })

  const [summaryRows, timingRows, gradeRows, confidenceRows] = await Promise.all([
    runQuery(Prisma.sql`
      SELECT
        COUNT(*)::int AS projects,
        ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0)) AS avg_price,
        ROUND(AVG(l1_canonical_yield::numeric), 1) AS avg_yield,
        ROUND(AVG(engine_god_metric::numeric), 1) AS avg_efficiency
      FROM ${DETAIL_TABLE_SQL}
      WHERE ${Prisma.join(qualityClauses, " AND ")}
    `),
    runQuery(Prisma.sql`
      SELECT l3_timing_signal AS label, COUNT(*)::int AS count
      FROM ${DETAIL_TABLE_SQL}
      WHERE ${Prisma.join(qualityClauses, " AND ")}
      GROUP BY 1
      ORDER BY count DESC
    `),
    runQuery(Prisma.sql`
      SELECT l2_stress_test_grade AS label, COUNT(*)::int AS count
      FROM ${DETAIL_TABLE_SQL}
      WHERE ${Prisma.join(qualityClauses, " AND ")}
      GROUP BY 1
      ORDER BY count DESC
    `),
    runQuery(Prisma.sql`
      SELECT l1_confidence AS label, COUNT(*)::int AS count
      FROM ${DETAIL_TABLE_SQL}
      WHERE ${Prisma.join(qualityClauses, " AND ")}
      GROUP BY 1
      ORDER BY count DESC
    `),
  ])

  return {
    data_as_of: new Date().toISOString(),
    summary: summaryRows[0] ?? null,
    timing_signals: timingRows,
    stress_grades: gradeRows,
    confidence_distribution: confidenceRows,
  }
}

export async function getTopDataSections() {
  const rows = await runOptionalQuery(Prisma.sql`
    SELECT *
    FROM entrestate_top_data
    WHERE is_live = true
    ORDER BY display_order
  `)

  if (rows.length > 0) {
    return {
      data_as_of: new Date().toISOString(),
      source: "entrestate_top_data",
      sections: rows,
    }
  }

  const pulse = await getMarketPulse()
  return {
    data_as_of: pulse.data_as_of,
    source: DETAIL_TABLE_NAME,
    sections: [
      {
        slug: "market-pulse",
        title: "Market Pulse",
        payload: pulse.summary,
      },
      {
        slug: "timing-signals",
        title: "Timing Signals",
        payload: pulse.timing_signals,
      },
      {
        slug: "stress-grades",
        title: "Stress Grades",
        payload: pulse.stress_grades,
      },
      {
        slug: "confidence",
        title: "Confidence Distribution",
        payload: pulse.confidence_distribution,
      },
    ],
  }
}

export async function getHomepageSections() {
  const rows = await runOptionalQuery(Prisma.sql`
    SELECT *
    FROM entrestate_homepage
    ORDER BY display_order
  `)

  return {
    data_as_of: new Date().toISOString(),
    sections: rows,
  }
}

export async function getOutcomeIntentCounts() {
  const rows = await runQuery<{ intent: string; count: number }>(Prisma.sql`
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

export async function getGoldenVisaProjects(filters?: PropertyFilters) {
  return listProperties({
    filters: {
      ...filters,
      goldenVisaRequired: true,
      budgetMinAed: Math.max(filters?.budgetMinAed ?? 0, 2_000_000),
    },
    sortBy: "god_metric",
    page: 1,
    pageSize: 50,
  })
}

export async function getPriceRealityByProjectName(name: string) {
  const rows = await runQuery(Prisma.sql`
    SELECT
      name,
      l1_canonical_price,
      l4_dld_avg_txn_price,
      l4_portal_price_delta,
      l1_confidence,
      l1_source_coverage,
      evidence_sources,
      evidence_assumptions
    FROM ${DETAIL_TABLE_SQL}
    WHERE LOWER(name) LIKE LOWER('%' || ${name} || '%')
    LIMIT 10
  `)

  return {
    data_as_of: new Date().toISOString(),
    rows,
  }
}

export async function getStressTestByProjectName(name: string) {
  const rows = await runQuery(Prisma.sql`
    SELECT
      name,
      engine_stress_test,
      l2_stress_test_grade,
      l1_confidence,
      evidence_assumptions
    FROM ${DETAIL_TABLE_SQL}
    WHERE LOWER(name) LIKE LOWER('%' || ${name} || '%')
    LIMIT 10
  `)

  return {
    data_as_of: new Date().toISOString(),
    rows,
  }
}

export async function getDeveloperReliabilityByName(name: string) {
  const rows = await runQuery(Prisma.sql`
    SELECT
      developer,
      COUNT(*)::int AS projects,
      ROUND(AVG(l2_developer_reliability::numeric), 1) AS reliability,
      ROUND(AVG(engine_god_metric::numeric), 1) AS efficiency,
      COUNT(CASE WHEN l2_stress_test_grade IN ('A', 'B') THEN 1 END)::int AS safe_projects,
      array_agg(DISTINCT COALESCE(final_area, area)) AS areas
    FROM ${DETAIL_TABLE_SQL}
    WHERE LOWER(developer) LIKE LOWER('%' || ${name} || '%')
    GROUP BY 1
  `)

  return {
    data_as_of: new Date().toISOString(),
    rows,
  }
}

export async function getEvidenceByProjectName(name: string) {
  const rows = await runQuery(Prisma.sql`
    SELECT
      name,
      l1_confidence,
      l1_source_coverage,
      evidence_sources,
      evidence_exclusions,
      evidence_assumptions,
      hotness_factors
    FROM ${DETAIL_TABLE_SQL}
    WHERE LOWER(name) LIKE LOWER('%' || ${name} || '%')
    LIMIT 10
  `)

  return {
    data_as_of: new Date().toISOString(),
    rows,
  }
}

export async function getDataFreshnessStatus() {
  const rows = await runOptionalQuery(Prisma.sql`
    SELECT *
    FROM ${STATUS_TABLE_SQL}
    LIMIT 1
  `)

  return {
    data_as_of: new Date().toISOString(),
    source: STATUS_TABLE_NAME,
    row: (rows[0] as DecisionRecord | undefined) ?? null,
  }
}
