/**
 * WHAT THE VISITOR SEES WHILE THE ASSISTANT WORKS.
 *
 * The chat used to go silent for ten seconds and then drop a wall of data. The
 * owner's spec, verbatim in spirit: while it searches, say what it is doing —
 * "searching the scored inventory… 4 projects added for analysis… comparing
 * against the market… assembling the evidence" — each step visible, each
 * expandable, and NEVER in engineer's words. The person on the other side is
 * an investor or a working agent, not a developer; "DLD API", table names and
 * enum codes are the site handing over its plumbing.
 *
 * So every tool the chat can call maps to a human step in both languages, and
 * tests/chat-steps.test.ts fails when a tool is registered without one — a
 * list nobody is forced to update is how five sections of /top-data rendered
 * as zeros.
 */

export type ChatStepKey =
  | "screen"
  | "price"
  | "area"
  | "developer"
  | "memo"
  | "compare"
  | "records"
  | "benchmark"
  | "pulse"
  | "notable"
  | "analyze"

/** Every tool registered on /api/chat, mapped to the step a person sees. */
export const STEP_FOR_TOOL: Record<string, ChatStepKey> = {
  deal_screener: "screen",
  price_reality_check: "price",
  area_risk_brief: "area",
  developer_due_diligence: "developer",
  generate_investor_memo: "memo",
  compare_projects: "compare",
  dld_transaction_search: "records",
  dld_area_benchmark: "benchmark",
  dld_market_pulse: "pulse",
  dld_notable_deals: "notable",
  mcp_query: "analyze",
  mcp_describe_table: "analyze",
  mcp_cross_reference: "analyze",
}

type StepCopy = {
  running: string
  /** count === null → generic completion line */
  done: (count: number | null) => string
}

const EN: Record<ChatStepKey, StepCopy> = {
  screen: {
    running: "Searching the scored inventory…",
    done: (n) => (n !== null ? `Added ${n} project${n === 1 ? "" : "s"} for analysis` : "Inventory search complete"),
  },
  price: {
    running: "Checking the asking price against recorded sales…",
    done: () => "Price check complete",
  },
  area: {
    running: "Reviewing the area's risk picture…",
    done: () => "Area review complete",
  },
  developer: {
    running: "Reviewing the developer's track record…",
    done: () => "Developer track record reviewed",
  },
  memo: {
    running: "Assembling the evidence…",
    done: () => "Evidence assembled",
  },
  compare: {
    running: "Building the side-by-side comparison…",
    done: () => "Comparison ready",
  },
  records: {
    running: "Reviewing recorded transactions…",
    done: (n) => (n !== null ? `Reviewed ${n} recorded transaction${n === 1 ? "" : "s"}` : "Recorded transactions reviewed"),
  },
  benchmark: {
    running: "Comparing the results against the market…",
    done: () => "Market comparison complete",
  },
  pulse: {
    running: "Reading the market's current state…",
    done: () => "Market state read",
  },
  notable: {
    running: "Scanning notable recent deals…",
    done: (n) => (n !== null ? `Found ${n} notable deal${n === 1 ? "" : "s"}` : "Notable deals scanned"),
  },
  analyze: {
    running: "Analyzing the data…",
    done: () => "Analysis complete",
  },
}

const AR: Record<ChatStepKey, StepCopy> = {
  screen: {
    running: "جاري البحث في المخزون المصنّف…",
    done: (n) => (n !== null ? `تم إدراج ${n} من المشاريع للتحليل` : "اكتمل البحث في المخزون"),
  },
  price: {
    running: "جاري فحص السعر مقابل الصفقات المسجّلة…",
    done: () => "اكتمل فحص السعر",
  },
  area: {
    running: "جاري مراجعة مخاطر المنطقة…",
    done: () => "اكتملت مراجعة المنطقة",
  },
  developer: {
    running: "جاري مراجعة سجل المطوّر…",
    done: () => "اكتملت مراجعة سجل المطوّر",
  },
  memo: {
    running: "جاري تجميع الأدلة…",
    done: () => "تم تجميع الأدلة",
  },
  compare: {
    running: "جاري إعداد المقارنة…",
    done: () => "أصبحت المقارنة جاهزة",
  },
  records: {
    running: "جاري مراجعة الصفقات المسجّلة…",
    done: (n) => (n !== null ? `تمت مراجعة ${n} من الصفقات المسجّلة` : "تمت مراجعة الصفقات المسجّلة"),
  },
  benchmark: {
    running: "جاري مقارنة النتائج مع السوق…",
    done: () => "اكتملت المقارنة مع السوق",
  },
  pulse: {
    running: "جاري قراءة حالة السوق الآن…",
    done: () => "تمت قراءة حالة السوق",
  },
  notable: {
    running: "جاري فحص أبرز الصفقات الأخيرة…",
    done: (n) => (n !== null ? `تم رصد ${n} من الصفقات البارزة` : "تم فحص أبرز الصفقات"),
  },
  analyze: {
    running: "جاري تحليل البيانات…",
    done: () => "اكتمل التحليل",
  },
}

const isArabic = (locale?: string | null) => (locale ?? "").toLowerCase().startsWith("ar")

export function stepRunningLabel(toolName: string, locale?: string | null): string {
  const key = STEP_FOR_TOOL[toolName] ?? "analyze"
  return (isArabic(locale) ? AR : EN)[key].running
}

export function stepDoneLabel(toolName: string, count: number | null, locale?: string | null): string {
  const key = STEP_FOR_TOOL[toolName] ?? "analyze"
  return (isArabic(locale) ? AR : EN)[key].done(count)
}

/**
 * Best-effort row count from a tool's output, for lines like
 * "تم إدراج ٤ من المشاريع للتحليل". Never throws; null means "say it without
 * a number" — a wrong count is worse than none.
 */
export function stepResultCount(output: unknown): number | null {
  if (!output || typeof output !== "object") return null
  const record = output as Record<string, unknown>
  if (record.failed === true) return null
  for (const key of ["rows", "projects", "results", "transactions", "deals", "items", "matches", "comparisons"]) {
    const value = record[key]
    if (Array.isArray(value)) return value.length
  }
  for (const key of ["row_count", "count", "total"]) {
    const value = record[key]
    if (typeof value === "number" && Number.isFinite(value) && value >= 0 && value < 100000) return value
  }
  return null
}

/**
 * A one-line human detail shown when a step is expanded — the best few names
 * in the result, never the payload itself. Raw JSON on a customer screen is
 * the thing this whole rebuild exists to remove.
 */
export function stepDetail(output: unknown, locale?: string | null): string | null {
  if (!output || typeof output !== "object") return null
  const record = output as Record<string, unknown>
  if (record.failed === true) {
    return isArabic(locale)
      ? "تعذّرت قراءة هذا المصدر — الإجابة ستقول ذلك صراحةً بدلاً من التخمين."
      : "This source could not be read — the answer will say so rather than guess."
  }
  for (const key of ["rows", "projects", "results", "transactions", "deals", "items"]) {
    const value = record[key]
    if (!Array.isArray(value) || value.length === 0) continue
    const names = value
      .slice(0, 3)
      .map((entry) => {
        if (!entry || typeof entry !== "object") return null
        const row = entry as Record<string, unknown>
        for (const nameKey of ["name", "project", "project_name", "title", "area", "developer", "headline"]) {
          const candidate = row[nameKey]
          if (typeof candidate === "string" && candidate.trim().length > 0) return candidate.trim()
        }
        return null
      })
      .filter((entry): entry is string => Boolean(entry))
    if (names.length > 0) {
      return isArabic(locale) ? `أبرز النتائج: ${names.join("، ")}` : `Top results: ${names.join(", ")}`
    }
  }
  return null
}

/** The single follow-up the answer ends with, offered as a tappable chip too. */
export function deeperAnalysisSuggestion(locale?: string | null): string {
  return isArabic(locale) ? "تحليل أعمق للنتائج" : "A deeper analysis of these results"
}
