import { ConfidenceBadge, StressGradeBadge, TimingSignalBadge } from "@/components/decision/badges"
import { formatAed, formatScore, formatYield } from "@/components/decision/formatters"
import { TransactionNotification } from "@/components/dld/transaction-notification"
import { formatInteger } from "@/lib/format/number"

type TopDataSectionProps = {
  section: string
  locale?: string
  title: string
  subtitle: string | null
  confidence: string | null
  lastUpdated: string | null
  data: unknown
}

type GenericObject = Record<string, unknown>

const DEFAULT_HIERARCHY = [
  "L1 Canonical",
  "L2 Derived",
  "L3 Dynamic",
  "L4 External",
  "L5 Raw",
]

const DEFAULT_ENGINES = ["God Metric", "Affordability", "Stress Test", "Goal Alignment"]

function asArray(value: unknown) {
  const normalized = normalizeJsonPayload(value)
  return Array.isArray(normalized) ? normalized : []
}

function asObject(value: unknown): GenericObject {
  const normalized = normalizeJsonPayload(value)
  return normalized && typeof normalized === "object" && !Array.isArray(normalized) ? (normalized as GenericObject) : {}
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim()
    if (!cleaned) return null
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function asText(value: unknown, fallback = "—") {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback
}

function asBoolean(value: unknown) {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    return normalized === "true" || normalized === "1" || normalized === "yes"
  }
  return false
}

function isArabicLocale(locale?: string | null) {
  return locale === "ar" || locale?.startsWith("ar-")
}

function formatAedValue(value: number | null, locale?: string | null) {
  return value === null ? "—" : formatAed(value, locale)
}

function formatYieldValue(value: number | null, locale?: string | null) {
  return value === null ? "—" : formatYield(value, locale)
}

function formatCount(value: number, locale?: string | null, fallback = "0") {
  return formatInteger(value, locale, fallback)
}

function formatTimestamp(value: string | null, locale?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(isArabicLocale(locale) ? "ar-AE" : "en-AE", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function valueFromKeys(record: GenericObject, keys: string[]) {
  for (const key of keys) {
    if (key in record) return record[key]
  }
  return undefined
}

function normalizeJsonPayload(value: unknown): unknown {
  if (typeof value !== "string") {
    return value
  }

  const trimmed = value.trim()
  if (!trimmed) return value
  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return value

  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

function dataToRecords(data: unknown): GenericObject[] {
  const normalizedData = normalizeJsonPayload(data)

  if (Array.isArray(normalizedData)) {
    return normalizedData
      .map((row) => normalizeJsonPayload(row))
      .filter((row) => row && typeof row === "object" && !Array.isArray(row)) as GenericObject[]
  }

  const payload = asObject(normalizedData)

  for (const key of [
    "rows",
    "items",
    "data",
    "projects",
    "developers",
    "areas",
    "intents",
    "tiers",
    "distribution",
    "results",
    "records",
    "entries",
    "list",
  ]) {
    const value = normalizeJsonPayload(payload[key])
    if (Array.isArray(value)) {
      return value
        .map((row) => normalizeJsonPayload(row))
        .filter((row) => row && typeof row === "object" && !Array.isArray(row)) as GenericObject[]
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = asObject(value)
      for (const nestedKey of ["rows", "items", "data", "records", "list"]) {
        const nestedValue = normalizeJsonPayload(nested[nestedKey])
        if (Array.isArray(nestedValue)) {
          return nestedValue
            .map((row) => normalizeJsonPayload(row))
            .filter((row) => row && typeof row === "object" && !Array.isArray(row)) as GenericObject[]
        }
      }
    }
  }

  if (Object.keys(payload).length > 0) {
    return [payload]
  }

  return []
}

function sectionSubtitle(confidence: string | null, lastUpdated: string | null, locale?: string | null) {
  const parts = []
  if (lastUpdated) parts.push(lastUpdated)
  if (confidence) parts.push(isArabicLocale(locale) ? `الثقة: ${confidence}` : `Confidence: ${confidence}`)
  return parts.join(" · ")
}

function SectionShell({
  section,
  locale,
  title,
  subtitle,
  confidence,
  lastUpdated,
  children,
}: {
  section: string
  locale?: string
  title: string
  subtitle: string | null
  confidence: string | null
  lastUpdated: string | null
  children: React.ReactNode
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.35)]">

      {/* Section header */}
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/60 px-4 py-3.5">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {subtitle ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <ConfidenceBadge confidence={confidence} />
          {lastUpdated ? (
            <span className="text-[10px] text-muted-foreground">{formatTimestamp(lastUpdated, locale)}</span>
          ) : null}
        </div>
      </div>

      <div className="border-b border-border/60 px-4 py-2 text-[11px] text-muted-foreground">{sectionSubtitle(confidence, lastUpdated, locale)}</div>
      <div className="p-4">{children}</div>
    </article>
  )
}

function MarketPulseView({ data, locale }: { data: unknown; locale?: string }) {
  const rootPayload = asObject(data)
  const summaryPayload = asObject(rootPayload.summary)
  const payload = dataToRecords(data)[0] ?? (Object.keys(summaryPayload).length > 0 ? summaryPayload : rootPayload)
  const total = asNumber(valueFromKeys(payload, ["total", "projects"])) ?? 0
  const avgPrice = asNumber(valueFromKeys(payload, ["avg_price", "price_avg"]))
  const avgYield = asNumber(valueFromKeys(payload, ["avg_yield", "yield_avg"]))
  const buySignals = asNumber(valueFromKeys(payload, ["buy_signals", "buy"])) ?? 0

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      <div className="rounded-lg border border-border/60 bg-background/40 p-3">
        <p className="text-[11px] text-muted-foreground">{isArabicLocale(locale) ? "المشاريع" : "Projects"}</p>
        <p className="mt-1 text-lg font-semibold text-foreground">{formatCount(total, locale)}</p>
      </div>
      <div className="rounded-lg border border-border/60 bg-background/40 p-3">
        <p className="text-[11px] text-muted-foreground">{isArabicLocale(locale) ? "متوسط السعر" : "Avg price"}</p>
        <p className="mt-1 text-lg font-semibold text-foreground">{formatAedValue(avgPrice, locale)}</p>
      </div>
      <div className="rounded-lg border border-border/60 bg-background/40 p-3">
        <p className="text-[11px] text-muted-foreground">{isArabicLocale(locale) ? "متوسط العائد" : "Avg yield"}</p>
        <p className="mt-1 text-lg font-semibold text-foreground">{formatYieldValue(avgYield, locale)}</p>
      </div>
      <div className="rounded-lg border border-border/60 bg-background/40 p-3">
        <p className="text-[11px] text-muted-foreground">{isArabicLocale(locale) ? "إشارات BUY" : "BUY signals"}</p>
        <p className="mt-1 text-lg font-semibold text-emerald-300">{formatCount(buySignals, locale)}</p>
      </div>
    </div>
  )
}

function TimingSignalsView({ data, locale }: { data: unknown; locale?: string }) {
  const rows = dataToRecords(data)
  const bySignal = new Map<string, GenericObject>()

  for (const row of rows) {
    const key = asText(valueFromKeys(row, ["signal", "label"]), "WAIT").toUpperCase()
    bySignal.set(key, row)
  }

  const signals: Array<{ key: "STRONG_BUY" | "BUY" | "HOLD" | "WAIT" | "AVOID"; tone: string }> = [
    { key: "STRONG_BUY", tone: "border-emerald-600/50 bg-emerald-600/15" },
    { key: "BUY", tone: "border-emerald-500/50 bg-emerald-500/10" },
    { key: "HOLD", tone: "border-amber-500/50 bg-amber-500/10" },
    { key: "WAIT", tone: "border-orange-500/50 bg-orange-500/10" },
    { key: "AVOID", tone: "border-red-500/50 bg-red-500/10" },
  ]

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
      {signals.map((signal) => {
        const record = bySignal.get(signal.key) ?? {}
        const count = asNumber(valueFromKeys(record, ["count", "projects"])) ?? 0
        const avgPrice = asNumber(valueFromKeys(record, ["avg_price", "price_avg"]))
        const avgYield = asNumber(valueFromKeys(record, ["avg_yield", "yield_avg"]))

        return (
          <div key={signal.key} className={`rounded-lg border p-3 ${signal.tone}`}>
            <div className="flex items-center justify-between">
              <TimingSignalBadge signal={signal.key} />
              <p className="text-base font-semibold text-foreground">{formatCount(count, locale)}</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{isArabicLocale(locale) ? `متوسط السعر: ${formatAedValue(avgPrice, locale)}` : `Avg price: ${formatAedValue(avgPrice, locale)}`}</p>
            <p className="mt-1 text-xs text-muted-foreground">{isArabicLocale(locale) ? `متوسط العائد: ${formatYieldValue(avgYield, locale)}` : `Avg yield: ${formatYieldValue(avgYield, locale)}`}</p>
          </div>
        )
      })}
    </div>
  )
}

function StressGradesView({ data, locale }: { data: unknown; locale?: string }) {
  const rows = dataToRecords(data)
  const byGrade = new Map<string, number>()

  for (const row of rows) {
    const grade = asText(valueFromKeys(row, ["grade", "label"]), "E").toUpperCase()
    const count = asNumber(valueFromKeys(row, ["count", "projects"])) ?? 0
    byGrade.set(grade, count)
  }

  const grades: Array<{ grade: "A" | "B" | "C" | "D" | "E"; barColor: string }> = [
    { grade: "A", barColor: "bg-emerald-700" },
    { grade: "B", barColor: "bg-emerald-500" },
    { grade: "C", barColor: "bg-amber-500" },
    { grade: "D", barColor: "bg-orange-500" },
    { grade: "E", barColor: "bg-red-500" },
  ]

  const max = Math.max(...grades.map((entry) => byGrade.get(entry.grade) ?? 0), 1)

  return (
    <div className="space-y-2">
      {grades.map((entry) => {
        const count = byGrade.get(entry.grade) ?? 0
        const pct = Math.max(Math.min((count / max) * 100, 100), 0)

        return (
          <div key={entry.grade} className="rounded-lg border border-border/60 bg-background/40 p-3">
            <div className="flex items-center justify-between">
              <StressGradeBadge grade={entry.grade} />
              <p className="text-sm font-semibold text-foreground">{formatCount(count, locale)}</p>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div className={`h-2 rounded-full ${entry.barColor}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function AffordabilityView({ data, locale }: { data: unknown; locale?: string }) {
  const rows = dataToRecords(data)

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No affordability distribution available.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {rows.slice(0, 6).map((row, index) => {
        const tier = asText(valueFromKeys(row, ["tier", "name", "label"]), `Tier ${index + 1}`)
        const projects = asNumber(valueFromKeys(row, ["count", "projects"])) ?? 0
        const avgYield = asNumber(valueFromKeys(row, ["avg_yield", "yield"]))
        const buySignals = asNumber(valueFromKeys(row, ["buy_signals", "buy"]))

        return (
          <div key={`${tier}-${index}`} className="rounded-lg border border-border/60 bg-background/40 p-3">
            <p className="text-sm font-medium text-foreground">{tier}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{isArabicLocale(locale) ? `${formatCount(projects, locale)} مشروع` : `${formatCount(projects, locale)} projects`}</span>
              <span>{formatYieldValue(avgYield, locale)}</span>
              {buySignals !== null ? <span>{isArabicLocale(locale) ? `${formatCount(buySignals, locale)} BUY` : `${formatCount(buySignals, locale)} BUY`}</span> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function OutcomeIntentsView({ data, locale }: { data: unknown; locale?: string }) {
  const rows = dataToRecords(data)

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No intent distribution available.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
      {rows.slice(0, 12).map((row, index) => {
        const label = asText(valueFromKeys(row, ["intent", "name", "label"]), `Intent ${index + 1}`)
        const count = asNumber(valueFromKeys(row, ["count", "projects"])) ?? 0

        return (
          <div key={`${label}-${index}`} className="rounded-lg border border-border/60 bg-background/40 p-3">
            <p className="text-sm font-medium text-foreground">{label.replace(/_/g, " ")}</p>
            <p className="mt-2 text-lg font-semibold text-foreground">{formatCount(count, locale)}</p>
          </div>
        )
      })}
    </div>
  )
}

function LabelDistributionView({ data, locale, emptyMessage }: { data: unknown; locale?: string; emptyMessage: string }) {
  const rows = dataToRecords(data)

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {rows.slice(0, 12).map((row, index) => {
        const label = asText(valueFromKeys(row, ["label", "grade", "signal", "name"]), `Label ${index + 1}`)
        const count = asNumber(valueFromKeys(row, ["count", "projects"])) ?? 0
        const avgPrice = asNumber(valueFromKeys(row, ["avg_price", "price"]))
        const avgYield = asNumber(valueFromKeys(row, ["avg_yield", "yield"]))
        const avgScore = asNumber(valueFromKeys(row, ["avg_score", "score", "investor_score_v1"]))

        return (
          <div key={`${label}-${index}`} className="rounded-lg border border-border/60 bg-background/40 p-3">
            <p className="text-sm font-medium text-foreground">{label}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{isArabicLocale(locale) ? `${formatCount(count, locale)} مشروع` : `${formatCount(count, locale)} projects`}</span>
              {avgPrice !== null ? <span>{formatAedValue(avgPrice, locale)}</span> : null}
              {avgYield !== null ? <span>{formatYieldValue(avgYield, locale)}</span> : null}
              {avgScore !== null ? <span>{isArabicLocale(locale) ? `النتيجة ${formatScore(avgScore, locale)}` : `Score ${formatScore(avgScore, locale)}`}</span> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TopProjectsTableView({ data, locale }: { data: unknown; locale?: string }) {
  const rows = dataToRecords(data)

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{isArabicLocale(locale) ? "لا توجد مشاريع متاحة في هذا المقطع." : "No top projects available."}</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border/60">
      <table className="min-w-full text-left text-xs">
        <thead className="bg-background/85 text-muted-foreground">
          <tr>
            <th className="px-3 py-2">{isArabicLocale(locale) ? "المشروع" : "Project"}</th>
            <th className="px-3 py-2">{isArabicLocale(locale) ? "المنطقة" : "Area"}</th>
            <th className="px-3 py-2">{isArabicLocale(locale) ? "المطور" : "Developer"}</th>
            <th className="px-3 py-2">{isArabicLocale(locale) ? "السعر" : "Price"}</th>
            <th className="px-3 py-2">{isArabicLocale(locale) ? "العائد" : "Yield"}</th>
            <th className="px-3 py-2">{isArabicLocale(locale) ? "الضغط" : "Stress"}</th>
            <th className="px-3 py-2">{isArabicLocale(locale) ? "التوقيت" : "Timing"}</th>
            <th className="px-3 py-2">{isArabicLocale(locale) ? "النتيجة" : "God Metric"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 15).map((row, index) => {
            const name = asText(valueFromKeys(row, ["name", "project"]), `Project ${index + 1}`)
            const area = asText(valueFromKeys(row, ["area", "final_area"]))
            const developer = asText(valueFromKeys(row, ["developer"]))
            const price = asNumber(valueFromKeys(row, ["price_from", "price", "l1_canonical_price", "avg_price"]))
            const yieldValue = asNumber(valueFromKeys(row, ["rental_yield", "yield", "l1_canonical_yield", "avg_yield"]))
            const stressGrade = asText(valueFromKeys(row, ["stress_grade_v1", "grade"]), "E")
            const timing = asText(valueFromKeys(row, ["timing_label", "timing"]), "WAIT")
            const godMetric = asNumber(valueFromKeys(row, ["investor_score_v1", "score"]))

            return (
              <tr key={`${name}-${index}`} className="border-t border-border/50 bg-card/30 transition hover:bg-primary/5">
                <td className="px-3 py-2 font-medium text-foreground">{name}</td>
                <td className="px-3 py-2 text-muted-foreground">{area}</td>
                <td className="px-3 py-2 text-muted-foreground">{developer}</td>
                <td className="px-3 py-2 text-muted-foreground">{formatAedValue(price, locale)}</td>
                <td className="px-3 py-2 text-muted-foreground">{formatYieldValue(yieldValue, locale)}</td>
                <td className="px-3 py-2">
                  <StressGradeBadge grade={stressGrade} />
                </td>
                <td className="px-3 py-2">
                  <TimingSignalBadge signal={timing} />
                </td>
                <td className="px-3 py-2 text-muted-foreground">{formatScore(godMetric, locale)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function AreaIntelligenceView({ data, locale }: { data: unknown; locale?: string }) {
  const rows = dataToRecords(data)

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{isArabicLocale(locale) ? "لا توجد سجلات مناطق متاحة." : "No area intelligence records available."}</p>
  }

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {rows.slice(0, 10).map((row, index) => {
        const area = asText(valueFromKeys(row, ["area", "name"]), `Area ${index + 1}`)
        const projects = asNumber(valueFromKeys(row, ["projects", "count"])) ?? 0
        const avgPrice = asNumber(valueFromKeys(row, ["avg_price", "price"]))
        const efficiency = asNumber(valueFromKeys(row, ["efficiency", "engine_god_metric", "score"]))
        const supply = asNumber(valueFromKeys(row, ["supply_pressure", "l3_supply_pressure"]))

        return (
          <div key={`${area}-${index}`} className="rounded-lg border border-border/60 bg-background/40 p-3">
            <p className="text-sm font-medium text-foreground">{area}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{isArabicLocale(locale) ? `${formatCount(projects, locale)} مشروع` : `${formatCount(projects, locale)} projects`}</span>
              <span>{formatAedValue(avgPrice, locale)}</span>
              <span>{isArabicLocale(locale) ? `الكفاءة ${formatScore(efficiency, locale)}` : `Eff ${formatScore(efficiency, locale)}`}</span>
              <span>{isArabicLocale(locale) ? `المعروض ${formatScore(supply, locale)}` : `Supply ${formatScore(supply, locale)}`}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DeveloperReliabilityView({ data, locale }: { data: unknown; locale?: string }) {
  const rows = dataToRecords(data)

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{isArabicLocale(locale) ? "لا توجد سجلات مطورين متاحة." : "No developer reliability records available."}</p>
  }

  return (
    <div className="space-y-2">
      {rows.slice(0, 12).map((row, index) => {
        const developer = asText(valueFromKeys(row, ["developer", "name"]), `Developer ${index + 1}`)
        const projects = asNumber(valueFromKeys(row, ["projects", "count"])) ?? 0
        const reliability = asNumber(valueFromKeys(row, ["reliability", "score"]))
        const safeProjects = asNumber(valueFromKeys(row, ["safe_projects", "safe_count"]))

        return (
          <div key={`${developer}-${index}`} className="rounded-lg border border-border/60 bg-background/40 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{developer}</p>
              <p className="text-xs text-muted-foreground">{isArabicLocale(locale) ? `النتيجة ${formatScore(reliability, locale)}` : `Score ${formatScore(reliability, locale)}`}</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {isArabicLocale(locale)
                ? `${formatCount(projects, locale)} مشروع${typeof safeProjects === "number" ? ` · ${formatCount(safeProjects, locale)} آمن` : ""}`
                : `${formatCount(projects, locale)} projects${typeof safeProjects === "number" ? ` · ${formatCount(safeProjects, locale)} safe` : ""}`}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function GoldenVisaView({ data, locale }: { data: unknown; locale?: string }) {
  const payload = dataToRecords(data)[0] ?? {}

  const eligible = asNumber(valueFromKeys(payload, ["eligible_count", "eligible", "count", "projects"])) ?? 0
  const avgPrice = asNumber(valueFromKeys(payload, ["avg_price", "price"]))
  const safeCount = asNumber(valueFromKeys(payload, ["safe_count", "safe_projects"]))
  const buySignals = asNumber(valueFromKeys(payload, ["buy_signals", "buy"]))

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
      <p className="text-sm font-semibold text-foreground">{isArabicLocale(locale) ? "المشاريع المؤهلة للإقامة الذهبية" : "Golden Visa eligible projects"}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <div>
          <p className="text-[11px] text-muted-foreground">{isArabicLocale(locale) ? "المؤهل" : "Eligible"}</p>
          <p className="text-base font-semibold text-foreground">{formatCount(eligible, locale)}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">{isArabicLocale(locale) ? "متوسط السعر" : "Avg price"}</p>
          <p className="text-base font-semibold text-foreground">{formatAedValue(avgPrice, locale)}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">{isArabicLocale(locale) ? "العدد الآمن" : "Safe count"}</p>
          <p className="text-base font-semibold text-foreground">{formatCount(safeCount ?? 0, locale)}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">{isArabicLocale(locale) ? "إشارات BUY" : "BUY signals"}</p>
          <p className="text-base font-semibold text-emerald-300">{formatCount(buySignals ?? 0, locale)}</p>
        </div>
      </div>
    </div>
  )
}

function TrustBarView({ data, locale }: { data: unknown; locale?: string }) {
  const payload = asObject(data)
  const confidenceRows = dataToRecords(payload.confidence_distribution)
  const hierarchyFromData = asArray(payload.hierarchy).filter((entry) => typeof entry === "string") as string[]
  const enginesFromData = asArray(payload.engines).filter((entry) => typeof entry === "string") as string[]

  const hierarchy = hierarchyFromData.length > 0 ? hierarchyFromData : DEFAULT_HIERARCHY
  const engines = enginesFromData.length > 0 ? enginesFromData : DEFAULT_ENGINES

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/60 bg-background/40 p-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Hierarchy</p>
        <p className="mt-2 text-sm text-foreground">{hierarchy.join(" → ")}</p>
      </div>

      <div className="rounded-lg border border-border/60 bg-background/40 p-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Engines</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {engines.map((engine) => (
            <span key={engine} className="rounded-full border border-border/60 px-2 py-1 text-xs text-muted-foreground">
              {engine}
            </span>
          ))}
        </div>
      </div>

      {confidenceRows.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {confidenceRows.map((row, index) => {
            const label = asText(valueFromKeys(row, ["label", "confidence"]), "UNKNOWN").toUpperCase()
            const count = asNumber(valueFromKeys(row, ["count", "projects"])) ?? 0
            return (
              <div key={`${label}-${index}`} className="rounded-lg border border-border/60 bg-background/40 p-3">
                <div className="flex items-center justify-between">
                  <ConfidenceBadge confidence={label} />
                  <p className="text-sm font-semibold text-foreground">{formatCount(count, locale)}</p>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function GenericListView({ data, locale }: { data: unknown; locale?: string }) {
  const rows = dataToRecords(data)
  if (rows.length === 0) {
    const obj = asObject(data)
    return <pre className="max-h-72 overflow-auto text-xs text-muted-foreground">{JSON.stringify(obj, null, 2)}</pre>
  }

  return (
    <div className="space-y-2">
      {rows.slice(0, 10).map((row, index) => {
        const label =
          asText(valueFromKeys(row, ["name", "intent", "area", "developer", "label"]), `Item ${index + 1}`) ??
          `Item ${index + 1}`
        const count = asNumber(valueFromKeys(row, ["count", "projects"]))

        return (
          <div key={`${label}-${index}`} className="rounded-lg border border-border/60 bg-background/40 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">{label}</p>
              {count !== null ? <p className="text-sm font-semibold text-foreground">{formatCount(count, locale)}</p> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DldMarketView({ data, locale }: { data: unknown; locale?: string }) {
  const rows = dataToRecords(data)

  const feed = rows
    .map((row) => {
      const headline = asText(
        valueFromKeys(row, ["headline", "title", "project", "name"]),
        isArabicLocale(locale) ? "صفقة DLD" : "DLD transaction",
      )
      const subline = asText(
        valueFromKeys(row, ["subline", "area", "community", "city"]),
        isArabicLocale(locale) ? "دبي - دائرة الأراضي" : "Dubai Land Department",
      )
      const amount = asNumber(valueFromKeys(row, ["amount", "amount_aed", "price", "value"])) ?? 0
      const badge = asText(valueFromKeys(row, ["badge", "deal_tag"]), "") || null
      const regType = asText(valueFromKeys(row, ["reg_type", "transaction_type"]), "")
      const propType = asText(valueFromKeys(row, ["prop_type", "property_type"]), "")
      const isNotable = asBoolean(valueFromKeys(row, ["is_notable"])) || amount >= 10_000_000

      return {
        headline,
        subline,
        amount,
        badge,
        reg_type: regType,
        prop_type: propType,
        is_notable: isNotable,
      }
    })
    .filter((entry) => entry.headline.trim().length > 0)

  if (feed.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {isArabicLocale(locale)
          ? "لا توجد صفقات DLD متاحة حالياً في هذا المقطع."
          : "No DLD market feed is available for this section yet."}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {feed.slice(0, 15).map((txn, index) => (
        <TransactionNotification key={`dld-${txn.headline}-${index}`} txn={txn} />
      ))}
    </div>
  )
}

function renderSection(section: string, data: unknown, locale?: string) {
  if (section === "market-pulse") return <MarketPulseView data={data} locale={locale} />
  if (section === "timing-signals") return <TimingSignalsView data={data} locale={locale} />
  if (section === "stress-grades") return <StressGradesView data={data} locale={locale} />
  if (section === "yield-labels") {
    return <LabelDistributionView data={data} locale={locale} emptyMessage={isArabicLocale(locale) ? "لا يوجد توزيع متاح للعائد." : "No yield distribution available."} />
  }
  if (section === "evidence-levels") {
    return <LabelDistributionView data={data} locale={locale} emptyMessage={isArabicLocale(locale) ? "لا يوجد توزيع متاح للأدلة." : "No evidence distribution available."} />
  }
  if (section === "decision-labels") {
    return <LabelDistributionView data={data} locale={locale} emptyMessage={isArabicLocale(locale) ? "لا يوجد توزيع متاح لتصنيفات القرار." : "No decision label distribution available."} />
  }
  if (section === "top-projects") return <TopProjectsTableView data={data} locale={locale} />
  if (section === "area-intelligence") return <AreaIntelligenceView data={data} locale={locale} />
  if (section === "developer-reliability") return <DeveloperReliabilityView data={data} locale={locale} />
  if (section === "golden-visa") return <GoldenVisaView data={data} locale={locale} />
  if (section === "dld-market") return <DldMarketView data={data} locale={locale} />
  if (section === "affordability") return <AffordabilityView data={data} locale={locale} />
  if (section === "outcome-intents") return <OutcomeIntentsView data={data} locale={locale} />
  if (section === "trust-bar") return <TrustBarView data={data} locale={locale} />
  return <GenericListView data={data} locale={locale} />
}

export function TopDataSection({ section, locale, title, subtitle, confidence, lastUpdated, data }: TopDataSectionProps) {
  return (
    <SectionShell section={section} locale={locale} title={title} subtitle={subtitle} confidence={confidence} lastUpdated={lastUpdated}>
      {renderSection(section, data, locale)}
    </SectionShell>
  )
}
