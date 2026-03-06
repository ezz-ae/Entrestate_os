import { ConfidenceBadge, StressGradeBadge, TimingSignalBadge } from "@/components/decision/badges"
import { formatAed, formatScore, formatYield } from "@/components/decision/formatters"

type TopDataSectionProps = {
  section: string
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
  return Array.isArray(value) ? value : []
}

function asObject(value: unknown): GenericObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as GenericObject) : {}
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function asText(value: unknown, fallback = "—") {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback
}

function valueFromKeys(record: GenericObject, keys: string[]) {
  for (const key of keys) {
    if (key in record) return record[key]
  }
  return undefined
}

function dataToRecords(data: unknown): GenericObject[] {
  if (Array.isArray(data)) {
    return data.filter((row) => row && typeof row === "object" && !Array.isArray(row)) as GenericObject[]
  }

  const payload = asObject(data)

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
  ]) {
    const value = payload[key]
    if (Array.isArray(value)) {
      return value.filter((row) => row && typeof row === "object" && !Array.isArray(row)) as GenericObject[]
    }
  }

  if (Object.keys(payload).length > 0) {
    return [payload]
  }

  return []
}

function sectionSubtitle(confidence: string | null, lastUpdated: string | null) {
  const parts = []
  if (lastUpdated) parts.push(lastUpdated)
  if (confidence) parts.push(`Confidence: ${confidence}`)
  return parts.join(" · ")
}

function SectionShell({
  title,
  subtitle,
  confidence,
  lastUpdated,
  children,
}: {
  title: string
  subtitle: string | null
  confidence: string | null
  lastUpdated: string | null
  children: React.ReactNode
}) {
  return (
    <article className="rounded-2xl border border-border/70 bg-card/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle ?? sectionSubtitle(confidence, lastUpdated)}</p>
        </div>
        <div className="flex items-center gap-2">
          <ConfidenceBadge confidence={confidence} />
          <span className="text-[11px] text-muted-foreground">{lastUpdated ?? "—"}</span>
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </article>
  )
}

function MarketPulseView({ data }: { data: unknown }) {
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
        <p className="text-[11px] text-muted-foreground">Projects</p>
        <p className="mt-1 text-lg font-semibold text-foreground">{total.toLocaleString()}</p>
      </div>
      <div className="rounded-lg border border-border/60 bg-background/40 p-3">
        <p className="text-[11px] text-muted-foreground">Avg price</p>
        <p className="mt-1 text-lg font-semibold text-foreground">{formatAed(avgPrice ?? 0)}</p>
      </div>
      <div className="rounded-lg border border-border/60 bg-background/40 p-3">
        <p className="text-[11px] text-muted-foreground">Avg yield</p>
        <p className="mt-1 text-lg font-semibold text-foreground">{formatYield(avgYield)}</p>
      </div>
      <div className="rounded-lg border border-border/60 bg-background/40 p-3">
        <p className="text-[11px] text-muted-foreground">BUY signals</p>
        <p className="mt-1 text-lg font-semibold text-emerald-300">{buySignals.toLocaleString()}</p>
      </div>
    </div>
  )
}

function TimingSignalsView({ data }: { data: unknown }) {
  const rows = dataToRecords(data)
  const bySignal = new Map<string, GenericObject>()

  for (const row of rows) {
    const key = asText(valueFromKeys(row, ["signal", "label"]), "WAIT").toUpperCase()
    bySignal.set(key, row)
  }

  const signals: Array<{ key: "BUY" | "HOLD" | "WAIT"; tone: string }> = [
    { key: "BUY", tone: "border-emerald-500/50 bg-emerald-500/10" },
    { key: "HOLD", tone: "border-amber-500/50 bg-amber-500/10" },
    { key: "WAIT", tone: "border-red-500/50 bg-red-500/10" },
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
              <p className="text-base font-semibold text-foreground">{count.toLocaleString()}</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Avg price: {formatAed(avgPrice ?? 0)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Avg yield: {formatYield(avgYield)}</p>
          </div>
        )
      })}
    </div>
  )
}

function StressGradesView({ data }: { data: unknown }) {
  const rows = dataToRecords(data)
  const byGrade = new Map<string, number>()

  for (const row of rows) {
    const grade = asText(valueFromKeys(row, ["grade", "label"]), "F").toUpperCase()
    const count = asNumber(valueFromKeys(row, ["count", "projects"])) ?? 0
    byGrade.set(grade, count)
  }

  const grades: Array<{ grade: "A" | "B" | "C" | "D" | "F"; barColor: string }> = [
    { grade: "A", barColor: "bg-emerald-700" },
    { grade: "B", barColor: "bg-emerald-500" },
    { grade: "C", barColor: "bg-amber-500" },
    { grade: "D", barColor: "bg-orange-500" },
    { grade: "F", barColor: "bg-red-500" },
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
              <p className="text-sm font-semibold text-foreground">{count.toLocaleString()}</p>
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

function AffordabilityView({ data }: { data: unknown }) {
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
              <span>{projects.toLocaleString()} projects</span>
              <span>{formatYield(avgYield)}</span>
              {buySignals !== null ? <span>{buySignals.toLocaleString()} BUY</span> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function OutcomeIntentsView({ data }: { data: unknown }) {
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
            <p className="mt-2 text-lg font-semibold text-foreground">{count.toLocaleString()}</p>
          </div>
        )
      })}
    </div>
  )
}

function TopProjectsTableView({ data }: { data: unknown }) {
  const rows = dataToRecords(data)

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No top projects available.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border/60">
      <table className="min-w-full text-left text-xs">
        <thead className="bg-background/70 text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Project</th>
            <th className="px-3 py-2">Area</th>
            <th className="px-3 py-2">Developer</th>
            <th className="px-3 py-2">Price</th>
            <th className="px-3 py-2">Yield</th>
            <th className="px-3 py-2">Stress</th>
            <th className="px-3 py-2">Timing</th>
            <th className="px-3 py-2">God Metric</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 15).map((row, index) => {
            const name = asText(valueFromKeys(row, ["name", "project"]), `Project ${index + 1}`)
            const area = asText(valueFromKeys(row, ["area", "final_area"]))
            const developer = asText(valueFromKeys(row, ["developer"]))
            const price = asNumber(valueFromKeys(row, ["price", "l1_canonical_price", "avg_price"]))
            const yieldValue = asNumber(valueFromKeys(row, ["yield", "l1_canonical_yield", "avg_yield"]))
            const stressGrade = asText(valueFromKeys(row, ["stress_grade", "l2_stress_test_grade", "grade"]), "F")
            const timing = asText(valueFromKeys(row, ["timing", "timing_signal", "l3_timing_signal"]), "WAIT")
            const godMetric = asNumber(valueFromKeys(row, ["god_metric", "engine_god_metric", "score"]))

            return (
              <tr key={`${name}-${index}`} className="border-t border-border/50 bg-card/30">
                <td className="px-3 py-2 font-medium text-foreground">{name}</td>
                <td className="px-3 py-2 text-muted-foreground">{area}</td>
                <td className="px-3 py-2 text-muted-foreground">{developer}</td>
                <td className="px-3 py-2 text-muted-foreground">{formatAed(price ?? 0)}</td>
                <td className="px-3 py-2 text-muted-foreground">{formatYield(yieldValue)}</td>
                <td className="px-3 py-2">
                  <StressGradeBadge grade={stressGrade} />
                </td>
                <td className="px-3 py-2">
                  <TimingSignalBadge signal={timing} />
                </td>
                <td className="px-3 py-2 text-muted-foreground">{formatScore(godMetric)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function AreaIntelligenceView({ data }: { data: unknown }) {
  const rows = dataToRecords(data)

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No area intelligence records available.</p>
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
              <span>{projects.toLocaleString()} projects</span>
              <span>{formatAed(avgPrice ?? 0)}</span>
              <span>Eff {formatScore(efficiency)}</span>
              <span>Supply {formatScore(supply)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DeveloperReliabilityView({ data }: { data: unknown }) {
  const rows = dataToRecords(data)

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No developer reliability records available.</p>
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
              <p className="text-xs text-muted-foreground">Score {formatScore(reliability)}</p>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {projects.toLocaleString()} projects{typeof safeProjects === "number" ? ` · ${safeProjects.toLocaleString()} safe` : ""}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function GoldenVisaView({ data }: { data: unknown }) {
  const payload = dataToRecords(data)[0] ?? {}

  const eligible = asNumber(valueFromKeys(payload, ["eligible_count", "eligible", "count", "projects"])) ?? 0
  const avgPrice = asNumber(valueFromKeys(payload, ["avg_price", "price"]))
  const safeCount = asNumber(valueFromKeys(payload, ["safe_count", "safe_projects"]))
  const buySignals = asNumber(valueFromKeys(payload, ["buy_signals", "buy"]))

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
      <p className="text-sm font-semibold text-foreground">Golden Visa eligible projects</p>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <div>
          <p className="text-[11px] text-muted-foreground">Eligible</p>
          <p className="text-base font-semibold text-foreground">{eligible.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Avg price</p>
          <p className="text-base font-semibold text-foreground">{formatAed(avgPrice ?? 0)}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Safe count</p>
          <p className="text-base font-semibold text-foreground">{(safeCount ?? 0).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">BUY signals</p>
          <p className="text-base font-semibold text-emerald-300">{(buySignals ?? 0).toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

function TrustBarView({ data }: { data: unknown }) {
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
                  <p className="text-sm font-semibold text-foreground">{count.toLocaleString()}</p>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function GenericListView({ data }: { data: unknown }) {
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
              {count !== null ? <p className="text-sm font-semibold text-foreground">{count.toLocaleString()}</p> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function renderSection(section: string, data: unknown) {
  if (section === "market-pulse") return <MarketPulseView data={data} />
  if (section === "timing-signals") return <TimingSignalsView data={data} />
  if (section === "stress-grades") return <StressGradesView data={data} />
  if (section === "affordability") return <AffordabilityView data={data} />
  if (section === "outcome-intents") return <OutcomeIntentsView data={data} />
  if (section === "top-projects") return <TopProjectsTableView data={data} />
  if (section === "area-intelligence") return <AreaIntelligenceView data={data} />
  if (section === "developer-reliability") return <DeveloperReliabilityView data={data} />
  if (section === "golden-visa") return <GoldenVisaView data={data} />
  if (section === "trust-bar") return <TrustBarView data={data} />
  return <GenericListView data={data} />
}

export function TopDataSection({ section, title, subtitle, confidence, lastUpdated, data }: TopDataSectionProps) {
  return (
    <SectionShell title={title} subtitle={subtitle} confidence={confidence} lastUpdated={lastUpdated}>
      {renderSection(section, data)}
    </SectionShell>
  )
}
