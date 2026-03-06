import "server-only"
import { Prisma } from "@prisma/client"
import { withStatementTimeout } from "@/lib/db-guardrails"

const STATEMENT_TIMEOUT_MS = 9000

const PROJECT_SORT_COLUMNS = {
  god_metric: "engine_god_metric",
  price: "l1_canonical_price",
  yield: "l1_canonical_yield",
  reliability: "l2_developer_reliability",
} as const

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
  if (!filters) return []
  const clauses: Prisma.Sql[] = [Prisma.sql`name IS NOT NULL`]
  const gradeOrder = ["A", "B", "C", "D"] as const

  if (filters.area) {
    clauses.push(Prisma.sql`LOWER(COALESCE(final_area, area)) LIKE LOWER(${`%${filters.area}%`})`)
  }
  if (filters.developer) {
    clauses.push(Prisma.sql`LOWER(developer) LIKE LOWER(${`%${filters.developer}%`})`)
  }
  if (filters.intent) {
    clauses.push(Prisma.sql`outcome_intent @> ARRAY[${filters.intent}]::text[]`)
  }
  if (typeof filters.budgetMaxAed === "number") {
    clauses.push(Prisma.sql`l1_canonical_price <= ${filters.budgetMaxAed}`)
  }
  if (typeof filters.budgetMinAed === "number") {
    clauses.push(Prisma.sql`l1_canonical_price >= ${filters.budgetMinAed}`)
  }
  if (typeof filters.bedsMin === "number") {
    clauses.push(
      Prisma.sql`(
        bedrooms_max >= ${filters.bedsMin}
        OR bedrooms_min >= ${filters.bedsMin}
      )`,
    )
  }
  if (typeof filters.bedsMax === "number") {
    clauses.push(
      Prisma.sql`(
        bedrooms_min <= ${filters.bedsMax}
        OR bedrooms_max <= ${filters.bedsMax}
      )`,
    )
  }
  if (filters.timingSignal) {
    clauses.push(Prisma.sql`l3_timing_signal = ${filters.timingSignal}`)
  }
  if (filters.stressGradeMin) {
    const index = gradeOrder.indexOf(filters.stressGradeMin)
    const allowed = gradeOrder.slice(0, index + 1)
    clauses.push(Prisma.sql`l2_stress_test_grade IN (${toSqlList([...allowed])})`)
  }
  if (filters.affordabilityTier) {
    clauses.push(Prisma.sql`LOWER(COALESCE(l2_affordability_tier, '')) = LOWER(${filters.affordabilityTier})`)
  }

  if (filters.goldenVisaRequired) {
    clauses.push(
      Prisma.sql`(
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
  const sortColumn = Prisma.raw(PROJECT_SORT_COLUMNS[sortBy])

  const [rows, countRows] = await Promise.all([
    runQuery(Prisma.sql`
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
      FROM inventory_full
      ${whereClause}
      ORDER BY ${sortColumn} DESC NULLS LAST
      LIMIT ${pageSize}
      OFFSET ${offset}
    `),
    runQuery<{ count: number }>(Prisma.sql`
      SELECT COUNT(*)::int AS count
      FROM inventory_full
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
      units,
      evidence_sources,
      evidence_exclusions,
      evidence_assumptions,
      hotness_factors
    FROM inventory_full
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
      FROM inventory_full
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
      FROM inventory_full
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
      FROM inventory_full
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
  const rows = await runQuery(Prisma.sql`
    SELECT
      COALESCE(final_area, area) AS area,
      COUNT(*)::int AS projects,
      ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0)) AS avg_price,
      ROUND(AVG(l1_canonical_yield::numeric), 1) AS avg_yield,
      ROUND(AVG(engine_god_metric::numeric), 1) AS efficiency,
      ROUND(AVG(l3_supply_pressure::numeric), 2) AS supply_pressure,
      COUNT(CASE WHEN l3_timing_signal = 'BUY' THEN 1 END)::int AS buy_signals
    FROM inventory_full
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

  return {
    data_as_of: new Date().toISOString(),
    areas: rows.map((row) => {
      const key = String(row.area ?? "").toLowerCase()
      const profile = profileMap.get(key)
      return {
        ...row,
        image_url: profile?.image_url ?? null,
        area_type: profile?.area_type ?? null,
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

  const [statsRows, projectsRows, developerRows, profileRows] = await Promise.all([
    runQuery(Prisma.sql`
      SELECT
        COALESCE(final_area, area) AS area,
        COUNT(*)::int AS projects,
        ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0)) AS avg_price,
        ROUND(AVG(l1_canonical_yield::numeric), 1) AS avg_yield,
        ROUND(AVG(l3_supply_pressure::numeric), 2) AS supply_pressure,
        COUNT(CASE WHEN l3_timing_signal = 'BUY' THEN 1 END)::int AS buy_signals
      FROM inventory_full
      WHERE LOWER(COALESCE(final_area, area)) LIKE LOWER('%' || ${areaName} || '%')
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
      FROM inventory_full
      WHERE LOWER(COALESCE(final_area, area)) LIKE LOWER('%' || ${areaName} || '%')
      ORDER BY engine_god_metric DESC NULLS LAST
      LIMIT 40
    `),
    runQuery(Prisma.sql`
      SELECT
        developer,
        COUNT(*)::int AS projects
      FROM inventory_full
      WHERE LOWER(COALESCE(final_area, area)) LIKE LOWER('%' || ${areaName} || '%')
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
  const rows = await runQuery(Prisma.sql`
    SELECT
      developer,
      COUNT(*)::int AS projects,
      ROUND(AVG(l2_developer_reliability::numeric), 1) AS reliability,
      ROUND(AVG(engine_god_metric::numeric), 1) AS efficiency,
      ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0)) AS avg_price
    FROM inventory_full
    WHERE developer IS NOT NULL
    GROUP BY 1
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

  return {
    data_as_of: new Date().toISOString(),
    developers: rows.map((row) => {
      const key = String(row.developer ?? "").toLowerCase()
      const profile = profileMap.get(key)
      return {
        ...row,
        logo_url: profile?.logo_url ?? null,
        founded_year: profile?.founded_year ?? null,
        hq: profile?.hq ?? null,
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

  const [developerRows, projectRows, areaRows, profileRows] = await Promise.all([
    runQuery(Prisma.sql`
      SELECT
        developer,
        COUNT(*)::int AS projects,
        ROUND(AVG(l2_developer_reliability::numeric), 1) AS reliability,
        ROUND(AVG(engine_god_metric::numeric), 1) AS efficiency,
        ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0)) AS avg_price,
        COUNT(CASE WHEN l2_stress_test_grade IN ('A', 'B') THEN 1 END)::int AS safe_projects
      FROM inventory_full
      WHERE LOWER(developer) LIKE LOWER('%' || ${developerName} || '%')
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
      FROM inventory_full
      WHERE LOWER(developer) LIKE LOWER('%' || ${developerName} || '%')
      ORDER BY engine_god_metric DESC NULLS LAST
      LIMIT 40
    `),
    runQuery(Prisma.sql`
      SELECT
        COALESCE(final_area, area) AS area,
        COUNT(*)::int AS projects
      FROM inventory_full
      WHERE LOWER(developer) LIKE LOWER('%' || ${developerName} || '%')
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
  const [summaryRows, timingRows, gradeRows, confidenceRows] = await Promise.all([
    runQuery(Prisma.sql`
      SELECT
        COUNT(*)::int AS projects,
        ROUND(AVG(l1_canonical_price) FILTER (WHERE l1_canonical_price > 0)) AS avg_price,
        ROUND(AVG(l1_canonical_yield::numeric), 1) AS avg_yield,
        ROUND(AVG(engine_god_metric::numeric), 1) AS avg_efficiency
      FROM inventory_full
    `),
    runQuery(Prisma.sql`
      SELECT l3_timing_signal AS label, COUNT(*)::int AS count
      FROM inventory_full
      GROUP BY 1
      ORDER BY count DESC
    `),
    runQuery(Prisma.sql`
      SELECT l2_stress_test_grade AS label, COUNT(*)::int AS count
      FROM inventory_full
      GROUP BY 1
      ORDER BY count DESC
    `),
    runQuery(Prisma.sql`
      SELECT l1_confidence AS label, COUNT(*)::int AS count
      FROM inventory_full
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
    source: "inventory_full",
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
    FROM inventory_full,
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
    FROM inventory_full
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
    FROM inventory_full
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
    FROM inventory_full
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
    FROM inventory_full
    WHERE LOWER(name) LIKE LOWER('%' || ${name} || '%')
    LIMIT 10
  `)

  return {
    data_as_of: new Date().toISOString(),
    rows,
  }
}
