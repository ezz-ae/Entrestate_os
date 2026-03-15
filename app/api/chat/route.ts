import { NextResponse } from "next/server"
import { generateText, tool } from "ai"
import { z } from "zod"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { resolveCopilotModel } from "@/lib/ai-provider"
import { getCurrentEntitlement } from "@/lib/account-entitlement"
import {
  safeConsumeCopilotUsage,
  getAnonymousCopilotAccountKey,
} from "@/lib/copilot-usage"
import {
  executeAreaRiskBrief,
  executeDealScreener,
  executeDldAreaBenchmark,
  executeDldMarketPulse,
  executeDldNotableDeals,
  executeDldTransactionSearch,
  executeDeveloperDueDiligence,
  executeGenerateInvestorMemo,
  executePriceRealityCheck,
} from "@/lib/copilot/executor"
import { collectGuardrailWarnings } from "@/lib/copilot/guardrails"
import {
  type AreaRiskBriefInput,
  type DealScreenerInput,
  type DeveloperDueDiligenceInput,
  type DldAreaBenchmarkInput,
  type DldNotableDealsInput,
  type DldTransactionSearchInput,
  type GenerateInvestorMemoInput,
  type PriceRealityCheckInput,
  areaRiskBriefInputSchema,
  copilotSystemPrompt,
  copilotToolDescriptions,
  dealScreenerInputSchema,
  dldAreaBenchmarkInputSchema,
  dldMarketPulseInputSchema,
  dldNotableDealsInputSchema,
  dldTransactionSearchInputSchema,
  developerDueDiligenceInputSchema,
  generateInvestorMemoInputSchema,
  priceRealityCheckInputSchema,
} from "@/lib/copilot/tools"
import {
  mcpCrossReference,
  mcpDescribeTable,
  mcpQuery,
} from "@/lib/mcp/server"
import {
  mcpCrossReferenceInputSchema,
  mcpDescribeTableInputSchema,
  mcpQueryInputSchema,
  type McpCrossReferenceInput,
  type McpDescribeTableInput,
  type McpQueryInput,
} from "@/lib/mcp/schemas"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const chatRequestSchema = z
  .object({
    intent: z.string().trim().min(1).max(500).optional(),
    message: z.string().trim().min(1).max(500).optional(),
    context: z
      .object({
        city: z.string().trim().min(1).max(120).optional(),
        area: z.string().trim().min(1).max(120).optional(),
      })
      .optional(),
  })
  .refine((data) => Boolean(data.intent || data.message), {
    message: "message or intent is required",
  })

const defaultSuggestions = [
  "Studios under AED 800K in Business Bay",
  "Compare Dubai Marina vs JBR",
  "Best areas for 1-2 year delivery",
  "Projects in Abu Dhabi under AED 2M",
]

const rawChatModelTimeoutMs = Number.parseInt(process.env.CHAT_MODEL_TIMEOUT_MS ?? "5000", 10)
const chatModelTimeoutMs = Number.isFinite(rawChatModelTimeoutMs) && rawChatModelTimeoutMs >= 1000
  ? rawChatModelTimeoutMs
  : 60000

type ChatCard = {
  type: "stat" | "area" | "project"
  title: string
  value: string
  subtitle?: string
}

type ToolResultEnvelope = {
  source?: unknown
  rows?: unknown
  count?: unknown
  data_as_of?: unknown
  guardrail_warnings?: unknown
}

type DldNotification = {
  headline: string
  subline: string
  amount: number
  badge: string | null
  reg_type: string
  prop_type: string
  is_notable: boolean
}

function withGuardrails<T extends Record<string, unknown>>(output: T): T & { guardrail_warnings: string[] } {
  const warnings = collectGuardrailWarnings(output)
  return {
    ...output,
    guardrail_warnings: warnings,
  }
}

function buildUserPrompt(message: string, context?: { city?: string; area?: string }) {
  const segments = [message.trim()]

  if (context?.city || context?.area) {
    segments.push(
      [
        "Context:",
        context.city ? `- City: ${context.city}` : null,
        context.area ? `- Area: ${context.area}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    )
  }

  return segments.join("\n\n")
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase()
    return normalized === "true" || normalized === "1" || normalized === "yes"
  }
  return false
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function toRows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.map((entry) => toRecord(entry)).filter((entry): entry is Record<string, unknown> => Boolean(entry))
}

function formatAed(value: number) {
  return `AED ${Math.round(value).toLocaleString()}`
}

function parseBudgetAed(message: string): number | null {
  const budgetMatch = message.match(/\b(?:under|below|max|budget)\s*(?:aed\s*)?([\d,.]+)\s*(k|m|mn|million)?\b/i)
  const generalMatch = message.match(/\baed\s*([\d,.]+)\s*(k|m|mn|million)?\b/i)
  const match = budgetMatch ?? generalMatch
  if (!match) return null
  const value = Number.parseFloat(match[1].replace(/,/g, ""))
  if (!Number.isFinite(value)) return null
  const unit = match[2]?.toLowerCase()
  if (unit === "k") return value * 1_000
  if (unit === "m" || unit === "mn" || unit === "million") return value * 1_000_000
  return value
}

function parseBedsFromMessage(message: string): number | null {
  const bedMatch = message.match(/\b(\d+)\s*(?:br|bed|beds|bedroom|bedrooms)\b/i)
  if (!bedMatch) return null
  const beds = Number.parseInt(bedMatch[1], 10)
  return Number.isFinite(beds) ? beds : null
}

function parseTimingSignal(message: string): "BUY" | "HOLD" | "WAIT" | undefined {
  const normalized = message.toLowerCase()
  if (normalized.includes("buy")) return "BUY"
  if (normalized.includes("hold")) return "HOLD"
  if (normalized.includes("wait")) return "WAIT"
  return undefined
}

function collectSources(toolResults: unknown[]): string[] {
  const sources = new Set<string>(["inventory_clean"])
  for (const result of toolResults) {
    const record = toRecord(result) as ToolResultEnvelope | null
    const source = typeof record?.source === "string" ? record.source.trim() : ""
    if (source.length > 0) {
      sources.add(source)
    }
  }
  return [...sources]
}

function collectToolWarnings(toolResults: unknown[]): string[] {
  const warnings = new Set<string>()

  for (const result of toolResults) {
    const record = toRecord(result) as ToolResultEnvelope | null
    if (!record) continue
    const list = Array.isArray(record.guardrail_warnings) ? record.guardrail_warnings : []
    for (const entry of list) {
      if (typeof entry === "string" && entry.trim().length > 0) {
        warnings.add(entry)
      }
    }
  }

  return [...warnings]
}

function resolveDataAsOf(toolResults: unknown[]): string {
  for (let index = toolResults.length - 1; index >= 0; index -= 1) {
    const record = toRecord(toolResults[index]) as ToolResultEnvelope | null
    if (!record) continue
    if (typeof record.data_as_of === "string" && record.data_as_of.trim().length > 0) {
      return record.data_as_of
    }
  }
  return new Date().toISOString()
}

function buildDataCardsFromRows(rows: Record<string, unknown>[]): ChatCard[] {
  if (rows.length === 0) {
    return [
      {
        type: "stat",
        title: "Matches",
        value: "0",
        subtitle: "No matching projects found",
      },
    ]
  }

  const prices = rows
    .map((row) => toFiniteNumber(row.l1_canonical_price))
    .filter((value): value is number => value !== null && value > 0)

  const areaFrequency = new Map<string, number>()
  for (const row of rows) {
    const areaValue = typeof row.final_area === "string" && row.final_area.trim().length > 0
      ? row.final_area
      : typeof row.area === "string"
        ? row.area
        : ""
    const key = areaValue.trim()
    if (!key) continue
    areaFrequency.set(key, (areaFrequency.get(key) ?? 0) + 1)
  }

  const topArea = [...areaFrequency.entries()].sort((left, right) => right[1] - left[1])[0]?.[0]
  const avgPrice = prices.length > 0 ? prices.reduce((sum, value) => sum + value, 0) / prices.length : null

  const cards: ChatCard[] = [
    {
      type: "stat",
      title: "Matches",
      value: rows.length.toLocaleString(),
      subtitle: "From live inventory",
    },
  ]

  cards.push({
    type: "stat",
    title: "Average price",
    value: avgPrice === null ? "-" : formatAed(avgPrice),
    subtitle: "From matching inventory",
  })

  if (topArea) {
    cards.push({
      type: "area",
      title: "Top area",
      value: topArea,
      subtitle: "Most frequent in results",
    })
  }

  return cards
}

function extractRowsFromToolResults(toolResults: unknown[]): Record<string, unknown>[] {
  for (let index = toolResults.length - 1; index >= 0; index -= 1) {
    const record = toRecord(toolResults[index]) as ToolResultEnvelope | null
    if (!record) continue
    const rows = toRows(record.rows)
    if (rows.length > 0) return rows
  }
  return []
}

function buildDldNotificationsFromToolResults(toolResults: unknown[]): DldNotification[] {
  const notifications: DldNotification[] = []

  for (let index = toolResults.length - 1; index >= 0; index -= 1) {
    const record = toRecord(toolResults[index]) as ToolResultEnvelope | null
    if (!record) continue

    const source = typeof record.source === "string" ? record.source : ""
    const rows = toRows(record.rows)
    if (rows.length === 0) continue

    const isDldFeedSource = source.includes("dld_transaction_feed")

    for (const row of rows) {
      const headline = typeof row.headline === "string" ? row.headline.trim() : ""
      const amount = toFiniteNumber(row.amount)

      if (!headline || amount === null) continue
      if (!isDldFeedSource && !("subline" in row || "badge" in row || "is_notable" in row)) continue

      notifications.push({
        headline,
        subline: typeof row.subline === "string" ? row.subline : "",
        amount,
        badge: typeof row.badge === "string" ? row.badge : null,
        reg_type: typeof row.reg_type === "string" ? row.reg_type : "Ready",
        prop_type: typeof row.prop_type === "string" ? row.prop_type : "Unit",
        is_notable: toBoolean(row.is_notable),
      })

      if (notifications.length >= 12) {
        return notifications
      }
    }
  }

  return notifications
}

function buildCompilerOutput(message: string) {
  const normalized = message.toLowerCase()
  const isComplexQuery =
    normalized.includes(" vs ") ||
    normalized.includes("compare") ||
    normalized.includes("built after") ||
    normalized.includes(" and ")

  const unitSignalRegex = /(high floor|seaview|sea view|\b1br\b|\b2br\b|\b3br\b|bedroom|bedrooms|floor)/i
  const signals = [
    {
      signal: unitSignalRegex.test(message) ? "unit_distribution_signal" : "decision_label_v1",
      confidence: "medium",
    },
  ]

  return {
    output_type: isComplexQuery ? "partial_spec" : "table_spec",
    table_spec: {
      signals,
    },
  }
}

function buildUsageHeaders(usage: {
  used: number
  limit: number | null
  remaining: number | null
  blocked?: boolean
  cooldownSecondsRemaining?: number | null
}) {
  return {
    "x-copilot-usage-used": String(usage.used),
    "x-copilot-usage-limit": usage.limit === null ? "unlimited" : String(usage.limit),
    "x-copilot-usage-remaining": usage.remaining === null ? "unlimited" : String(usage.remaining),
    "x-copilot-usage-blocked": String(Boolean(usage.blocked)),
    "x-copilot-cooldown-seconds": usage.cooldownSecondsRemaining === null || usage.cooldownSecondsRemaining === undefined
      ? "0"
      : String(usage.cooldownSecondsRemaining),
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    promise
      .then((value) => {
        clearTimeout(timeout)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timeout)
        reject(error)
      })
  })
}

async function buildDeterministicFallback(message: string, context?: { city?: string; area?: string }) {
  const budgetMax = parseBudgetAed(message)
  const beds = parseBedsFromMessage(message)
  const timingLabel = parseTimingSignal(message)

  const filters: DealScreenerInput["filters"] = {}
  if (context?.area) filters.area = context.area
  if (typeof budgetMax === "number") filters.budget_max_aed = budgetMax
  if (typeof beds === "number") {
    filters.beds_min = beds
    filters.beds_max = beds
  }
  if (timingLabel) filters.timing_label = timingLabel

  const result = await executeDealScreener({
    filters,
    sort_by: "investor_score_v1",
    limit: 8,
  })

  const rows = toRows(result.rows)
  const cards = buildDataCardsFromRows(rows)

  const leadArea = cards.find((card) => card.type === "area")?.value
  const content = rows.length > 0
    ? `The data shows ${rows.length.toLocaleString()} matching projects${leadArea ? `, led by ${leadArea}` : ""}.`
    : "No matching projects found."

  return {
    content,
    dataCards: cards,
    evidence: {
      sources_used: ["deal_screener"],
    },
    data_as_of: result.data_as_of,
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)

  try {
    const body = await request.json()
    const parsed = chatRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload.", requestId, request_id: requestId }, { status: 400 })
    }

    const headerAccountKey = request.headers.get("x-entrestate-account-key")?.trim() || request.headers.get("x-entrestate-user-id")?.trim()
    const entitlement = await getCurrentEntitlement(headerAccountKey)
    const usageAccountKey = entitlement.accountKey || getAnonymousCopilotAccountKey(request)
    const { allowed, usage } = await safeConsumeCopilotUsage(usageAccountKey, entitlement.tier)

    if (!allowed) {
      return NextResponse.json(
        {
          error: "Free usage is cooling down. Try again once your cooldown ends.",
          upgrade_cta: {
            label: "Upgrade for uninterrupted access",
            url: "/pricing",
          },
          tier: entitlement.tier,
          usage,
          requestId,
          request_id: requestId,
        },
        {
          status: 429,
          headers: {
            "x-request-id": requestId,
            ...buildUsageHeaders(usage),
          },
        },
      )
    }

    const model = resolveCopilotModel()

    const safeTool = <TInput,>(
      source: string,
      execute: (input: TInput) => Promise<Record<string, unknown>>,
    ) => async (input: TInput) => {
      try {
        return withGuardrails(await execute(input))
      } catch (error) {
        console.error("Chat tool failed:", { requestId, source, error })
        return withGuardrails({
          source,
          data_as_of: new Date().toISOString(),
          no_results: true,
          error: "tool_failed",
        })
      }
    }

    const safeToolNoGuard = <TInput,>(
      source: string,
      execute: (input: TInput) => Promise<Record<string, unknown>>,
    ) => async (input: TInput) => {
      try {
        return await execute(input)
      } catch (error) {
        console.error("Chat tool failed:", { requestId, source, error })
        return {
          source,
          data_as_of: new Date().toISOString(),
          no_results: true,
          error: "tool_failed",
        }
      }
    }

    const toolset = {
      deal_screener: tool({
        description: copilotToolDescriptions.deal_screener,
        inputSchema: dealScreenerInputSchema,
        execute: safeTool("deal_screener", executeDealScreener),
      }),
      price_reality_check: tool({
        description: copilotToolDescriptions.price_reality_check,
        inputSchema: priceRealityCheckInputSchema,
        execute: safeTool("price_reality_check", executePriceRealityCheck),
      }),
      area_risk_brief: tool({
        description: copilotToolDescriptions.area_risk_brief,
        inputSchema: areaRiskBriefInputSchema,
        execute: safeTool("area_risk_brief", executeAreaRiskBrief),
      }),
      developer_due_diligence: tool({
        description: copilotToolDescriptions.developer_due_diligence,
        inputSchema: developerDueDiligenceInputSchema,
        execute: safeTool("developer_due_diligence", executeDeveloperDueDiligence),
      }),
      generate_investor_memo: tool({
        description: copilotToolDescriptions.generate_investor_memo,
        inputSchema: generateInvestorMemoInputSchema,
        execute: safeTool("generate_investor_memo", executeGenerateInvestorMemo),
      }),
      dld_transaction_search: tool({
        description: copilotToolDescriptions.dld_transaction_search,
        inputSchema: dldTransactionSearchInputSchema,
        execute: safeTool("dld_transaction_search", executeDldTransactionSearch),
      }),
      dld_area_benchmark: tool({
        description: copilotToolDescriptions.dld_area_benchmark,
        inputSchema: dldAreaBenchmarkInputSchema,
        execute: safeTool("dld_area_benchmark", executeDldAreaBenchmark),
      }),
      dld_market_pulse: tool({
        description: copilotToolDescriptions.dld_market_pulse,
        inputSchema: dldMarketPulseInputSchema,
        execute: safeTool("dld_market_pulse", async (_input: unknown) => executeDldMarketPulse()),
      }),
      dld_notable_deals: tool({
        description: copilotToolDescriptions.dld_notable_deals,
        inputSchema: dldNotableDealsInputSchema,
        execute: safeTool("dld_notable_deals", executeDldNotableDeals),
      }),
      mcp_query: tool({
        description:
          "Execute a read-only SQL query against the full Entrestate database. Use for custom analytics, cross-joins, aggregations. Only SELECT/WITH allowed, max 100 rows.",
        inputSchema: mcpQueryInputSchema,
        execute: safeTool("mcp_query", mcpQuery),
      }),
      mcp_describe_table: tool({
        description: "Inspect a table's schema: column names, types, row count. Use before querying unfamiliar tables.",
        inputSchema: mcpDescribeTableInputSchema,
        execute: safeToolNoGuard("mcp_describe_table", async (input: McpDescribeTableInput) =>
          mcpDescribeTable(input.table_name),
        ),
      }),
      mcp_cross_reference: tool({
        description:
          "Run pre-built cross-reference analytics: price_vs_dld, developer_portfolio, area_intelligence, golden_visa_opportunities, stress_test_report. Optionally filter by area name.",
        inputSchema: mcpCrossReferenceInputSchema,
        execute: safeTool("mcp_cross_reference", mcpCrossReference),
      }),
    } as const

    const message = parsed.data.message ?? parsed.data.intent ?? ""
    const prompt = buildUserPrompt(message, parsed.data.context)

    if (!model) {
      const fallback = await buildDeterministicFallback(message, parsed.data.context)
      return NextResponse.json(
        {
          ...fallback,
          warning: "Live model unavailable. Returned deterministic market response.",
          suggestions: defaultSuggestions,
          compiler_output: buildCompilerOutput(message),
          requestId,
          request_id: requestId,
          usage,
        },
        {
          status: 200,
          headers: {
            "x-request-id": requestId,
            ...buildUsageHeaders(usage),
          },
        },
      )
    }

    try {
      const response = await withTimeout(
        generateText({
          model,
          system: copilotSystemPrompt,
          prompt,
          temperature: 0,
          maxSteps: 6,
          toolChoice: "auto",
          tools: toolset,
        }),
        chatModelTimeoutMs,
        "chat model",
      )

      const text = response.text.trim()
      const toolResults = ((response as { toolResults?: Array<{ result?: unknown }> }).toolResults ?? [])
        .map((entry) => entry.result)
        .filter((entry) => entry !== undefined)

      const rows = extractRowsFromToolResults(toolResults)
      const dataCards = rows.length > 0 ? buildDataCardsFromRows(rows) : undefined
      const notifications = buildDldNotificationsFromToolResults(toolResults)
      const confidenceWarnings = collectToolWarnings(toolResults)
      const toolSummary = toolResults.length > 0 ? JSON.stringify(toolResults[toolResults.length - 1]).slice(0, 1200) : ""
      const content = text.length > 0
        ? text
        : toolSummary.length > 0
          ? `The data shows: ${toolSummary}`
          : "No matching projects found."

      return NextResponse.json(
        {
          content,
          dataCards,
          notifications: notifications.length > 0 ? notifications : undefined,
          suggestions: defaultSuggestions,
          evidence: {
            sources_used: collectSources(toolResults),
            warnings: confidenceWarnings,
          },
          data_as_of: resolveDataAsOf(toolResults),
          compiler_output: buildCompilerOutput(message),
          requestId,
          request_id: requestId,
          usage,
        },
        {
          status: 200,
          headers: {
            "x-request-id": requestId,
            ...buildUsageHeaders(usage),
          },
        },
      )
    } catch (error) {
      console.error("Chat route LLM execution failed:", { requestId, error })
      const fallback = await buildDeterministicFallback(message, parsed.data.context)
      return NextResponse.json(
        {
          ...fallback,
          warning: "Live model unavailable. Returned deterministic market response.",
          suggestions: defaultSuggestions,
          compiler_output: buildCompilerOutput(message),
          requestId,
          request_id: requestId,
          usage,
        },
        {
          status: 200,
          headers: {
            "x-request-id": requestId,
            ...buildUsageHeaders(usage),
          },
        },
      )
    }
  } catch (error) {
    console.error("Chat route error:", { requestId, error })
    return NextResponse.json(
      {
        error: getPublicErrorMessage(error, "The assistant failed to process your request."),
        requestId,
        request_id: requestId,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
