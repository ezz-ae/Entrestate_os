"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react"
import { DefaultChatTransport } from "ai"
import { useChat } from "@ai-sdk/react"
import {
  BarChart3,
  BookmarkPlus,
  FileText,
  Gauge,
  Loader2,
  Radar,
  Scale,
  Search,
  SlidersHorizontal,
  Sparkles,
  WandSparkles,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type ChatInterfaceProps = {
  initialDailyLimit?: number | null
  initialRemaining?: number | null
}

type WorkspaceCard = {
  title: string
  value: string
  subtitle: string
}

type ComparisonRow = {
  label: string
  area: string
  developer: string
  confidence: string
  timingSignal: string
  stressGrade: string
  price: number | null
  yield: number | null
  score: number | null
}

type ReportDraftResult = {
  status: "idle" | "saving" | "saved" | "error"
  message?: string
  reportId?: string
}

type ShortlistResult = {
  status: "idle" | "saving" | "saved" | "error"
  message?: string
}

type SlashCommandContext = {
  selectedRow: ComparisonRow | null
  assumptions: string
}

type SlashCommand = {
  id: string
  title: string
  description: string
  icon: LucideIcon
  buildPrompt: (context: SlashCommandContext) => string
}

function messageText(message: any): string {
  if (typeof message.content === "string") return message.content
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part: any) => part.type === "text" && typeof part.text === "string")
      .map((part: any) => part.text)
      .join("\n")
      .trim()
  }
  return ""
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function toRows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.map((entry) => toRecord(entry)).filter((entry): entry is Record<string, unknown> => Boolean(entry))
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toText(value: unknown, fallback = "-") {
  if (typeof value === "string" && value.trim().length > 0) return value.trim()
  return fallback
}

function formatAed(value: number | null) {
  if (value === null) return "-"
  return `AED ${Math.round(value).toLocaleString()}`
}

function formatMetric(value: number | null, decimals = 1) {
  if (value === null) return "-"
  return value.toFixed(decimals)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function normalizeToPercent(value: number | null, max: number) {
  if (value === null || max <= 0) return 0
  return clamp((value / max) * 100, 8, 100)
}

function buildSparklinePath(values: number[], width = 220, height = 64) {
  if (values.length === 0) return ""
  if (values.length === 1) {
    const y = height / 2
    return `M0 ${y} L${width} ${y}`
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(" ")
}

function buildAreaPath(linePath: string, width = 220, height = 64) {
  if (!linePath) return ""
  return `${linePath} L${width} ${height} L0 ${height} Z`
}

function extractToolOutputs(messages: any[]): Record<string, unknown>[] {
  const outputs: Record<string, unknown>[] = []

  for (const message of messages) {
    if (Array.isArray(message.toolInvocations)) {
      for (const invocation of message.toolInvocations) {
        const result = toRecord(invocation?.result)
        if (result) outputs.push(result)
      }
    }

    if (!Array.isArray(message.parts)) continue
    for (const part of message.parts) {
      if (part?.type === "dynamic-tool" && part.output) {
        const output = toRecord(part.output)
        if (output) outputs.push(output)
      }
      if (typeof part?.type === "string" && part.type.startsWith("tool-") && part.output) {
        const output = toRecord(part.output)
        if (output) outputs.push(output)
      }
    }
  }

  return outputs
}

function deriveWorkspaceCards(toolOutputs: Record<string, unknown>[]): WorkspaceCard[] {
  const rows = toolOutputs
    .flatMap((output) => toRows(output.rows))
    .filter((row) => Object.keys(row).length > 0)

  if (rows.length === 0) {
    return [
      { title: "Matches", value: "0", subtitle: "Run a query to load inventory" },
      { title: "Average price", value: "-", subtitle: "Waiting for market response" },
      { title: "Signal", value: "-", subtitle: "No timing signal yet" },
      { title: "Confidence", value: "-", subtitle: "Awaiting source confidence" },
    ]
  }

  const prices = rows
    .map((row) => toFiniteNumber(row.l1_canonical_price))
    .filter((value): value is number => value !== null && value > 0)
  const avgPrice = prices.length > 0 ? prices.reduce((sum, value) => sum + value, 0) / prices.length : null

  const timingCounts = new Map<string, number>()
  for (const row of rows) {
    const timing = toText(row.l3_timing_signal, "")
    if (!timing) continue
    timingCounts.set(timing, (timingCounts.get(timing) ?? 0) + 1)
  }
  const topTiming = [...timingCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "-"

  const confidenceCounts = new Map<string, number>()
  for (const row of rows) {
    const confidence = toText(row.l1_confidence, "")
    if (!confidence) continue
    confidenceCounts.set(confidence, (confidenceCounts.get(confidence) ?? 0) + 1)
  }
  const topConfidence = [...confidenceCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "-"

  const scoreValues = rows
    .map((row) => toFiniteNumber(row.engine_god_metric))
    .filter((value): value is number => value !== null)
  const avgScore = scoreValues.length > 0 ? scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length : null

  return [
    { title: "Matches", value: rows.length.toLocaleString(), subtitle: "Live inventory rows" },
    { title: "Average price", value: formatAed(avgPrice), subtitle: "Current result set" },
    { title: "Signal", value: topTiming, subtitle: "Most frequent timing signal" },
    { title: "Confidence", value: topConfidence, subtitle: `Avg score ${formatMetric(avgScore)}` },
  ]
}

function deriveComparisonRows(toolOutputs: Record<string, unknown>[]): ComparisonRow[] {
  const rows = toolOutputs
    .flatMap((output) => toRows(output.rows))
    .filter((row) => typeof row.name === "string")

  const unique = new Map<string, ComparisonRow>()
  for (const row of rows) {
    const label = toText(row.name)
    if (!label || unique.has(label)) continue

    unique.set(label, {
      label,
      area: toText(row.final_area === null ? row.area : row.final_area),
      developer: toText(row.developer),
      confidence: toText(row.l1_confidence),
      timingSignal: toText(row.l3_timing_signal),
      stressGrade: toText(row.l2_stress_test_grade),
      price: toFiniteNumber(row.l1_canonical_price),
      yield: toFiniteNumber(row.l1_canonical_yield),
      score: toFiniteNumber(row.engine_god_metric),
    })

    if (unique.size >= 8) break
  }

  return [...unique.values()]
}

function resolveDataFreshness(toolOutputs: Record<string, unknown>[]) {
  for (let index = toolOutputs.length - 1; index >= 0; index -= 1) {
    const value = toolOutputs[index]?.data_as_of
    if (typeof value === "string" && value.trim().length > 0) {
      return value
    }
  }
  return null
}

const commandPrompts = [
  {
    label: "Compare",
    prompt: "Compare Dubai Marina vs JBR on price, yield, stress grade, and timing signal.",
    icon: Scale,
  },
  {
    label: "Simulate",
    prompt: "Stress-test a 2BR under AED 2M in Dubai with conservative assumptions.",
    icon: Radar,
  },
  {
    label: "Report",
    prompt: "Generate a full investor memo for Marina Vista with price reality, area risk, developer diligence, and stress test.",
    icon: FileText,
  },
]

const slashCommands: SlashCommand[] = [
  {
    id: "compare",
    title: "/compare",
    description: "Run a direct area or project comparison.",
    icon: Scale,
    buildPrompt: ({ selectedRow }) =>
      selectedRow
        ? `Compare ${selectedRow.label} with top alternatives in ${selectedRow.area} using price, yield, stress grade, and timing signal.`
        : "Compare Dubai Marina vs JBR on price, yield, stress grade, and timing signal.",
  },
  {
    id: "screen",
    title: "/screen",
    description: "Find ranked projects with constraints.",
    icon: Search,
    buildPrompt: () =>
      "Find 2BR projects under AED 2M with BUY timing signal and stress grade A or B. Rank by engine_god_metric.",
  },
  {
    id: "memo",
    title: "/memo",
    description: "Generate full investor memo.",
    icon: FileText,
    buildPrompt: ({ selectedRow }) =>
      `Generate an investor memo for ${selectedRow?.label ?? "Marina Vista"} with price reality, area risk, developer due diligence, and stress test.`,
  },
  {
    id: "simulate",
    title: "/simulate",
    description: "Run scenario stress simulation.",
    icon: SlidersHorizontal,
    buildPrompt: ({ selectedRow, assumptions }) =>
      `Run a scenario analysis for ${selectedRow?.label ?? "a target project"}. Assumptions: ${assumptions}. Return stress narrative, confidence, and what changes the conclusion.`,
  },
  {
    id: "price",
    title: "/price",
    description: "Run price reality check.",
    icon: Gauge,
    buildPrompt: ({ selectedRow }) => `Run price reality check for ${selectedRow?.label ?? "Marina Vista"}.`,
  },
]

export function ChatInterface({
  initialDailyLimit = 3,
  initialRemaining = 3,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("")
  const [dailyLimit, setDailyLimit] = useState<number | null>(initialDailyLimit)
  const [remaining, setRemaining] = useState<number | null>(initialRemaining)
  const [limitMessage, setLimitMessage] = useState<string | null>(null)
  const [reportDraft, setReportDraft] = useState<ReportDraftResult>({ status: "idle" })
  const [shortlistResult, setShortlistResult] = useState<ShortlistResult>({ status: "idle" })

  const [selectedProject, setSelectedProject] = useState<string>("")
  const [downPaymentPct, setDownPaymentPct] = useState(30)
  const [interestRatePct, setInterestRatePct] = useState(5.25)
  const [vacancyPct, setVacancyPct] = useState(6)
  const [opexPct, setOpexPct] = useState(18)
  const [slashActiveIndex, setSlashActiveIndex] = useState(0)
  const [canvasOpen, setCanvasOpen] = useState(false)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/copilot",
    }),
  })

  useEffect(() => {
    let cancelled = false

    const loadUsage = async () => {
      try {
        const response = await fetch("/api/account/chat-usage", { cache: "no-store" })
        if (!response.ok) return
        const payload = (await response.json()) as {
          usage?: { limit?: number | null; remaining?: number | null }
        }
        if (cancelled) return
        if (payload.usage) {
          setDailyLimit(payload.usage.limit ?? null)
          setRemaining(payload.usage.remaining ?? null)
        }
      } catch {
        // keep server defaults
      }
    }

    void loadUsage()
    return () => {
      cancelled = true
    }
  }, [])

  const chatBlocked = dailyLimit !== null && (remaining ?? 0) <= 0
  const usageError = error?.message ?? ""
  const isLimitError = usageError.includes("429") || usageError.toLowerCase().includes("daily limit")
  const submitBlocked = status !== "ready" || input.trim().length === 0

  const toolOutputs = useMemo(() => extractToolOutputs(messages as any[]), [messages])
  const workspaceCards = useMemo(() => deriveWorkspaceCards(toolOutputs), [toolOutputs])
  const comparisonRows = useMemo(() => deriveComparisonRows(toolOutputs), [toolOutputs])
  const dataFreshness = useMemo(() => resolveDataFreshness(toolOutputs), [toolOutputs])

  const latestAssistantMessage = useMemo(() => {
    const assistant = [...(messages as any[])].reverse().find((message) => message.role === "assistant")
    return assistant ?? null
  }, [messages])

  const latestAssistantText = useMemo(() => {
    if (!latestAssistantMessage) return ""
    return messageText(latestAssistantMessage)
  }, [latestAssistantMessage])

  const hasConversation = useMemo(() => {
    const stream = messages as any[]
    return stream.some((message) => message.role === "user" || message.role === "assistant")
  }, [messages])

  useEffect(() => {
    if (!hasConversation) setCanvasOpen(false)
  }, [hasConversation])

  useEffect(() => {
    if (comparisonRows.length === 0) {
      setSelectedProject("")
      return
    }

    setSelectedProject((current) => {
      const exists = comparisonRows.some((row) => row.label === current)
      return exists ? current : comparisonRows[0].label
    })
  }, [comparisonRows])

  const selectedRow = useMemo(
    () => comparisonRows.find((row) => row.label === selectedProject) ?? null,
    [comparisonRows, selectedProject],
  )

  const simulationAssumptions = useMemo(
    () =>
      `down payment ${downPaymentPct}%, interest ${interestRatePct.toFixed(2)}%, vacancy ${vacancyPct}%, operating cost ${opexPct}%`,
    [downPaymentPct, interestRatePct, vacancyPct, opexPct],
  )

  const simulationMetrics = useMemo(() => {
    if (!selectedRow || selectedRow.price === null || selectedRow.price <= 0) return null

    const price = selectedRow.price
    const yieldPct = selectedRow.yield ?? 0
    const loanAmount = price * (1 - downPaymentPct / 100)
    const monthlyRate = interestRatePct / 100 / 12
    const amortizationMonths = 25 * 12
    const monthlyPayment =
      monthlyRate === 0
        ? loanAmount / amortizationMonths
        : (loanAmount * monthlyRate * (1 + monthlyRate) ** amortizationMonths) /
          ((1 + monthlyRate) ** amortizationMonths - 1)

    const grossAnnualRent = price * (yieldPct / 100)
    const vacancyLoss = grossAnnualRent * (vacancyPct / 100)
    const effectiveAnnualRent = grossAnnualRent - vacancyLoss
    const operatingCost = effectiveAnnualRent * (opexPct / 100)
    const annualDebtService = monthlyPayment * 12
    const annualNetCashFlow = effectiveAnnualRent - operatingCost - annualDebtService
    const dscr = annualDebtService > 0 ? (effectiveAnnualRent - operatingCost) / annualDebtService : null

    const stressPenaltyByGrade: Record<string, number> = {
      A: 0.04,
      B: 0.08,
      C: 0.12,
      D: 0.18,
      "-": 0.1,
    }
    const stressPenalty = stressPenaltyByGrade[selectedRow.stressGrade] ?? 0.1
    const stressAdjustedCashFlow = annualNetCashFlow * (1 - stressPenalty)

    return {
      loanAmount,
      monthlyPayment,
      grossAnnualRent,
      effectiveAnnualRent,
      annualNetCashFlow,
      stressAdjustedCashFlow,
      dscr,
    }
  }, [selectedRow, downPaymentPct, interestRatePct, vacancyPct, opexPct])

  const chartCaps = useMemo(() => {
    const maxPrice = Math.max(...comparisonRows.map((row) => row.price ?? 0), 0)
    const maxYield = Math.max(...comparisonRows.map((row) => row.yield ?? 0), 0)
    const maxScore = Math.max(...comparisonRows.map((row) => row.score ?? 0), 0)
    return { maxPrice, maxYield, maxScore }
  }, [comparisonRows])

  const scoreSeries = useMemo(
    () => comparisonRows.slice(0, 6).map((row) => row.score ?? 0),
    [comparisonRows],
  )
  const yieldSeries = useMemo(
    () => comparisonRows.slice(0, 6).map((row) => row.yield ?? 0),
    [comparisonRows],
  )
  const scoreSparkPath = useMemo(() => buildSparklinePath(scoreSeries), [scoreSeries])
  const yieldSparkPath = useMemo(() => buildSparklinePath(yieldSeries), [yieldSeries])

  const dynamicSuggestions = useMemo(() => {
    if (!selectedRow) {
      return [
        "Find BUY signal projects under AED 2M in Dubai Marina.",
        "Show developers with reliability above 8 and stress grade A/B.",
      ]
    }

    return [
      `Generate an investor memo for ${selectedRow.label}.`,
      `Run price reality check for ${selectedRow.label}.`,
      `Compare ${selectedRow.label} against top alternatives in ${selectedRow.area}.`,
    ]
  }, [selectedRow])

  const slashQuery = useMemo(() => {
    const trimmed = input.trimStart()
    if (!trimmed.startsWith("/")) return ""
    return trimmed.slice(1).toLowerCase()
  }, [input])

  const filteredSlashCommands = useMemo(() => {
    if (!slashQuery) return slashCommands
    return slashCommands.filter(
      (command) =>
        command.id.includes(slashQuery) ||
        command.title.includes(slashQuery) ||
        command.description.toLowerCase().includes(slashQuery),
    )
  }, [slashQuery])

  const isSlashPaletteOpen = input.trimStart().startsWith("/")

  useEffect(() => {
    setSlashActiveIndex(0)
  }, [slashQuery])

  const sendPrompt = async (prompt: string) => {
    if (!prompt.trim() || status !== "ready") return
    if (chatBlocked) {
      setLimitMessage("You have finished your daily limit for your current plan. Subscribe to continue.")
      return
    }

    setLimitMessage(null)
    await sendMessage({ text: prompt })

    if (dailyLimit !== null) {
      setRemaining((prev) => {
        const current = prev ?? dailyLimit
        return Math.max(current - 1, 0)
      })
    }
  }

  const activateSlashCommand = async (command: SlashCommand) => {
    const prompt = command.buildPrompt({ selectedRow, assumptions: simulationAssumptions })
    setInput("")
    await sendPrompt(prompt)
  }

  const onInputKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isSlashPaletteOpen || filteredSlashCommands.length === 0) return

    if (event.key === "ArrowDown") {
      event.preventDefault()
      setSlashActiveIndex((current) => (current + 1) % filteredSlashCommands.length)
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setSlashActiveIndex((current) => (current - 1 + filteredSlashCommands.length) % filteredSlashCommands.length)
      return
    }

    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault()
      const command = filteredSlashCommands[slashActiveIndex] ?? filteredSlashCommands[0]
      if (command) {
        await activateSlashCommand(command)
      }
      return
    }

    if (event.key === "Escape") {
      event.preventDefault()
      setInput("")
    }
  }

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = input.trim()
    if (!value) return

    if (value.startsWith("/") && filteredSlashCommands.length > 0) {
      const command = filteredSlashCommands[slashActiveIndex] ?? filteredSlashCommands[0]
      if (command) await activateSlashCommand(command)
      return
    }

    await sendPrompt(value)
    setInput("")
  }

  const runSimulationInChat = async () => {
    if (!selectedRow) return

    const prompt = [
      `Run a scenario analysis for ${selectedRow.label}.`,
      `Assumptions: ${simulationAssumptions}.`,
      "Return stress narrative, what would change conclusion, and risk flags.",
    ].join(" ")

    await sendPrompt(prompt)
  }

  const saveToShortlist = async () => {
    if (!selectedRow) return

    setShortlistResult({ status: "saving" })
    try {
      const createRes = await fetch("/api/watchlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Chat Shortlist ${new Date().toISOString().slice(0, 10)}` }),
      })

      const createPayload = await createRes.json().catch(() => ({}))
      if (!createRes.ok) {
        setShortlistResult({
          status: "error",
          message:
            typeof createPayload?.error === "string"
              ? createPayload.error
              : "Could not create shortlist (Team tier may be required).",
        })
        return
      }

      const watchlistId = typeof createPayload?.watchlist?.id === "string" ? createPayload.watchlist.id : ""
      if (!watchlistId) {
        setShortlistResult({ status: "error", message: "Shortlist creation returned no identifier." })
        return
      }

      const itemRes = await fetch(`/api/watchlists/${watchlistId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: selectedRow.label }),
      })
      const itemPayload = await itemRes.json().catch(() => ({}))
      if (!itemRes.ok) {
        setShortlistResult({
          status: "error",
          message:
            typeof itemPayload?.error === "string"
              ? itemPayload.error
              : "Could not add selected project to shortlist.",
        })
        return
      }

      setShortlistResult({ status: "saved", message: "Selected project saved to shortlist." })
    } catch {
      setShortlistResult({ status: "error", message: "Could not save shortlist right now." })
    }
  }

  const saveReportDraft = async () => {
    const reportContent = latestAssistantText.trim()
    if (!reportContent) {
      setReportDraft({
        status: "error",
        message: "Ask a question first to generate report content.",
      })
      return
    }

    setReportDraft({ status: "saving" })
    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Chat Report — ${new Date().toLocaleString()}`,
          content: {
            transcript: reportContent,
            cards: workspaceCards,
            comparison: comparisonRows,
            scenario: simulationMetrics,
            generatedAt: new Date().toISOString(),
          },
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        const fallbackMessage = response.status === 403
          ? "Report export requires Team tier."
          : "Could not save report right now."
        setReportDraft({
          status: "error",
          message: typeof payload?.error === "string" ? payload.error : fallbackMessage,
        })
        return
      }

      const reportId = typeof payload?.report?.id === "string" ? payload.report.id : undefined
      setReportDraft({
        status: "saved",
        message: "Report saved.",
        reportId,
      })
    } catch {
      setReportDraft({
        status: "error",
        message: "Could not save report right now.",
      })
    }
  }

  if (!hasConversation) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <section className="rounded-2xl border border-border/70 bg-card/60 p-5 md:p-8">
          <div className="mb-6 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Chat</p>
            <h2 className="mt-2 text-2xl font-semibold text-foreground md:text-3xl">Ask anything real estate</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Start with one prompt. Type <span className="font-medium text-foreground">/</span> for command mode.
            </p>
          </div>

          <form onSubmit={submitMessage} className="space-y-3">
            <div className="relative">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  void onInputKeyDown(event)
                }}
                placeholder="Ask for project screening, price checks, area risk briefs, and full investor memos. Type / for commands."
                className="min-h-40 resize-y text-base"
              />

              {isSlashPaletteOpen ? (
                <div className="absolute bottom-[100%] left-0 right-0 mb-2 rounded-xl border border-border/70 bg-card/95 p-2 shadow-xl backdrop-blur">
                  {filteredSlashCommands.length === 0 ? (
                    <p className="px-2 py-1 text-xs text-muted-foreground">No matching commands.</p>
                  ) : (
                    filteredSlashCommands.map((command, index) => {
                      const Icon = command.icon
                      const isActive = index === slashActiveIndex
                      return (
                        <button
                          key={command.id}
                          type="button"
                          onClick={() => void activateSlashCommand(command)}
                          className={`flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition ${
                            isActive ? "bg-primary/12" : "hover:bg-background"
                          }`}
                        >
                          <Icon className="mt-0.5 h-3.5 w-3.5 text-primary" />
                          <span>
                            <span className="block text-xs font-medium text-foreground">{command.title}</span>
                            <span className="block text-[11px] text-muted-foreground">{command.description}</span>
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {dailyLimit === null
                  ? "Unlimited chats in your current plan."
                  : `${Math.max(remaining ?? 0, 0)} of ${dailyLimit} chats remaining today.`}
              </p>
              <Button type="submit" disabled={submitBlocked} className="min-w-24 px-6">
                {status === "streaming" ? "Running" : "Send"}
              </Button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {commandPrompts.map((command) => {
              const Icon = command.icon
              return (
                <button
                  key={command.label}
                  type="button"
                  onClick={() => void sendPrompt(command.prompt)}
                  disabled={status !== "ready"}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs text-foreground transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {command.label}
                </button>
              )
            })}
          </div>

          {limitMessage ? (
            <p className="mt-3 text-sm text-amber-600">
              {limitMessage} <Link href="/pricing" className="underline">Subscribe</Link>
            </p>
          ) : null}

          {isLimitError ? (
            <p className="mt-3 text-sm text-amber-600">
              You have finished your daily limit for your current plan. <Link href="/pricing" className="underline">Subscribe</Link>
            </p>
          ) : null}

          {error && !isLimitError ? <p className="mt-3 text-sm text-red-500">{error.message}</p> : null}
        </section>
      </div>
    )
  }

  return (
    <div className={canvasOpen ? "grid gap-4 xl:grid-cols-[1.25fr_0.75fr]" : "grid gap-4"}>
      <section className="rounded-2xl border border-border/70 bg-card/60 p-4 md:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/80 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Chat</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">
              <span>{status === "streaming" ? "Analyzing" : "Ready"}</span>
              {dataFreshness ? <span> • Data as of: {new Date(dataFreshness).toLocaleString()}</span> : null}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCanvasOpen((current) => !current)}
              className="h-8 px-3 text-xs"
            >
              {canvasOpen ? "Hide Canvas" : "Show Canvas"}
            </Button>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {commandPrompts.map((command) => {
            const Icon = command.icon
            return (
              <button
                key={command.label}
                type="button"
                onClick={() => void sendPrompt(command.prompt)}
                disabled={status !== "ready"}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs text-foreground transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icon className="h-3.5 w-3.5" />
                {command.label}
              </button>
            )
          })}

          {dynamicSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => void sendPrompt(suggestion)}
              disabled={status !== "ready"}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              <WandSparkles className="h-3.5 w-3.5" />
              <span className="max-w-56 truncate">{suggestion}</span>
            </button>
          ))}
        </div>

        <div className="h-[58vh] space-y-3 overflow-y-auto rounded-xl border border-border/60 bg-background/50 p-3 md:h-[60vh]">
          {(messages as any[]).length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
              Ask for anything real estate. Compare projects, simulate scenarios, draft reports, and run live intelligence from one chat.
            </div>
          ) : null}

          {(messages as any[]).map((message) => (
            <div
              key={message.id}
              className={message.role === "user" ? "ml-auto max-w-[92%]" : "mr-auto max-w-[92%]"}
            >
              <div
                className={
                  message.role === "user"
                    ? "rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground"
                    : "rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm text-foreground"
                }
              >
                {messageText(message) || (message.role === "assistant" ? "Running analysis..." : "...")}
              </div>
            </div>
          ))}

          {status === "streaming" ? (
            <div className="mr-auto max-w-[92%]">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-border/60 bg-card px-4 py-2.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Running tools and assembling response
              </div>
            </div>
          ) : null}
        </div>

        <form onSubmit={submitMessage} className="mt-4 space-y-3">
          <div className="relative">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                void onInputKeyDown(event)
              }}
              placeholder="Ask for project screening, price checks, area risk briefs, and full investor memos. Type / for commands."
              className="min-h-20 resize-y text-base"
            />

            {isSlashPaletteOpen ? (
              <div className="absolute bottom-[100%] left-0 right-0 mb-2 rounded-xl border border-border/70 bg-card/95 p-2 shadow-xl backdrop-blur">
                {filteredSlashCommands.length === 0 ? (
                  <p className="px-2 py-1 text-xs text-muted-foreground">No matching commands.</p>
                ) : (
                  filteredSlashCommands.map((command, index) => {
                    const Icon = command.icon
                    const isActive = index === slashActiveIndex
                    return (
                      <button
                        key={command.id}
                        type="button"
                        onClick={() => void activateSlashCommand(command)}
                        className={`flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition ${
                          isActive ? "bg-primary/12" : "hover:bg-background"
                        }`}
                      >
                        <Icon className="mt-0.5 h-3.5 w-3.5 text-primary" />
                        <span>
                          <span className="block text-xs font-medium text-foreground">{command.title}</span>
                          <span className="block text-[11px] text-muted-foreground">{command.description}</span>
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {dailyLimit === null
                ? "Unlimited chats in your current plan."
                : `${Math.max(remaining ?? 0, 0)} of ${dailyLimit} chats remaining today.`}
            </p>
            <Button type="submit" disabled={submitBlocked} className="min-w-24 px-6">
              {status === "streaming" ? "Running" : "Send"}
            </Button>
          </div>
        </form>

        {limitMessage ? (
          <p className="mt-3 text-sm text-amber-600">
            {limitMessage} <Link href="/pricing" className="underline">Subscribe</Link>
          </p>
        ) : null}

        {isLimitError ? (
          <p className="mt-3 text-sm text-amber-600">
            You have finished your daily limit for your current plan. <Link href="/pricing" className="underline">Subscribe</Link>
          </p>
        ) : null}

        {error && !isLimitError ? <p className="mt-3 text-sm text-red-500">{error.message}</p> : null}
      </section>

      {canvasOpen ? (
      <aside className="rounded-2xl border border-border/70 bg-card/60 p-4 md:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Intelligence Canvas</h3>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {workspaceCards.map((card) => (
            <article key={card.title} className="rounded-xl border border-border/60 bg-background/80 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{card.title}</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.subtitle}</p>
            </article>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-border/60 bg-background/80 p-3">
          <div className="mb-2 flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Signal Curves</p>
          </div>

          {comparisonRows.length < 2 ? (
            <p className="text-xs text-muted-foreground">Need at least two rows to draw trend curves.</p>
          ) : (
            <div className="space-y-2">
              <div className="rounded-lg border border-border/60 bg-card/80 p-2">
                <p className="mb-1 text-[11px] text-muted-foreground">Score trend</p>
                <svg viewBox="0 0 220 64" className="h-16 w-full">
                  <path d={buildAreaPath(scoreSparkPath)} fill="rgba(59,130,246,0.16)" />
                  <path d={scoreSparkPath} stroke="rgb(59,130,246)" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <div className="rounded-lg border border-border/60 bg-card/80 p-2">
                <p className="mb-1 text-[11px] text-muted-foreground">Yield trend</p>
                <svg viewBox="0 0 220 64" className="h-16 w-full">
                  <path d={buildAreaPath(yieldSparkPath)} fill="rgba(34,197,94,0.16)" />
                  <path d={yieldSparkPath} stroke="rgb(34,197,94)" strokeWidth="2" fill="none" />
                </svg>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-border/60 bg-background/80 p-3">
          <div className="mb-2 flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Live Compare</p>
          </div>

          {comparisonRows.length === 0 ? (
            <p className="text-xs text-muted-foreground">Run a compare query to populate live rows.</p>
          ) : (
            <div className="space-y-2">
              {comparisonRows.map((row) => (
                <button
                  key={row.label}
                  type="button"
                  onClick={() => setSelectedProject(row.label)}
                  className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${
                    row.label === selectedProject
                      ? "border-primary/60 bg-primary/10"
                      : "border-border/60 bg-card/80 hover:border-primary/30"
                  }`}
                >
                  <p className="truncate text-xs font-medium text-foreground">{row.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {row.area} • {row.stressGrade} • {row.timingSignal} • {row.confidence}
                  </p>
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 rounded-full bg-secondary">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: `${normalizeToPercent(row.score, chartCaps.maxScore)}%` }}
                      />
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary">
                      <div
                        className="h-1.5 rounded-full bg-emerald-500"
                        style={{ width: `${normalizeToPercent(row.yield, chartCaps.maxYield)}%` }}
                      />
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary">
                      <div
                        className="h-1.5 rounded-full bg-sky-500"
                        style={{ width: `${normalizeToPercent(row.price, chartCaps.maxPrice)}%` }}
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {formatAed(row.price)} • Yield {formatMetric(row.yield)}% • Score {formatMetric(row.score)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-border/60 bg-background/80 p-3">
          <div className="mb-2 flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Simulation Lab</p>
          </div>

          {!selectedRow ? (
            <p className="text-xs text-muted-foreground">Select a project from Live Compare to run a simulation.</p>
          ) : (
            <>
              <p className="text-xs font-medium text-foreground">{selectedRow.label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {selectedRow.area} • {selectedRow.developer}
              </p>

              <div className="mt-3 space-y-2.5">
                <label className="block text-[11px] text-muted-foreground">
                  Down payment ({downPaymentPct.toFixed(0)}%)
                  <input
                    type="range"
                    min={10}
                    max={60}
                    step={1}
                    value={downPaymentPct}
                    onChange={(event) => setDownPaymentPct(Number(event.target.value))}
                    className="mt-1 w-full"
                  />
                </label>

                <label className="block text-[11px] text-muted-foreground">
                  Interest ({interestRatePct.toFixed(2)}%)
                  <input
                    type="range"
                    min={2}
                    max={9}
                    step={0.05}
                    value={interestRatePct}
                    onChange={(event) => setInterestRatePct(Number(event.target.value))}
                    className="mt-1 w-full"
                  />
                </label>

                <label className="block text-[11px] text-muted-foreground">
                  Vacancy ({vacancyPct.toFixed(0)}%)
                  <input
                    type="range"
                    min={0}
                    max={15}
                    step={1}
                    value={vacancyPct}
                    onChange={(event) => setVacancyPct(Number(event.target.value))}
                    className="mt-1 w-full"
                  />
                </label>

                <label className="block text-[11px] text-muted-foreground">
                  Operating costs ({opexPct.toFixed(0)}%)
                  <input
                    type="range"
                    min={8}
                    max={35}
                    step={1}
                    value={opexPct}
                    onChange={(event) => setOpexPct(Number(event.target.value))}
                    className="mt-1 w-full"
                  />
                </label>
              </div>

              {simulationMetrics ? (
                <div className="mt-3 space-y-1.5 rounded-lg border border-border/60 bg-card/80 p-2.5 text-[11px] text-muted-foreground">
                  <p>Loan amount: <span className="text-foreground">{formatAed(simulationMetrics.loanAmount)}</span></p>
                  <p>Monthly payment: <span className="text-foreground">{formatAed(simulationMetrics.monthlyPayment)}</span></p>
                  <p>Effective annual rent: <span className="text-foreground">{formatAed(simulationMetrics.effectiveAnnualRent)}</span></p>
                  <p>Annual net cash flow: <span className="text-foreground">{formatAed(simulationMetrics.annualNetCashFlow)}</span></p>
                  <p>Stress-adjusted cash flow: <span className="text-foreground">{formatAed(simulationMetrics.stressAdjustedCashFlow)}</span></p>
                  <p>DSCR: <span className="text-foreground">{formatMetric(simulationMetrics.dscr, 2)}</span></p>
                </div>
              ) : null}

              <Button type="button" className="mt-3 w-full" variant="secondary" onClick={() => void runSimulationInChat()}>
                Push simulation to chat
              </Button>

              <Button type="button" className="mt-2 w-full" variant="outline" onClick={() => void saveToShortlist()}>
                <BookmarkPlus className="mr-1.5 h-3.5 w-3.5" />
                Save selected to shortlist
              </Button>

              {shortlistResult.message ? (
                <p className={`mt-2 text-xs ${shortlistResult.status === "error" ? "text-amber-600" : "text-muted-foreground"}`}>
                  {shortlistResult.message}
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-border/60 bg-background/80 p-3">
          <div className="mb-2 flex items-center gap-2">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Report Studio</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Save the latest assistant output as a report draft and download it.
          </p>
          <Button
            type="button"
            onClick={saveReportDraft}
            disabled={reportDraft.status === "saving"}
            className="mt-3 w-full"
            variant="secondary"
          >
            {reportDraft.status === "saving" ? "Saving report..." : "Save report draft"}
          </Button>

          {reportDraft.message ? (
            <p className={`mt-2 text-xs ${reportDraft.status === "error" ? "text-amber-600" : "text-muted-foreground"}`}>
              {reportDraft.message}
            </p>
          ) : null}

          {reportDraft.reportId ? (
            <Link
              href={`/api/reports/${reportDraft.reportId}/download`}
              className="mt-2 inline-block text-xs text-primary underline"
            >
              Download report
            </Link>
          ) : null}
        </div>

        {latestAssistantText ? (
          <div className="mt-4 rounded-xl border border-border/60 bg-background/80 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Latest output</p>
            <p className="mt-2 line-clamp-6 text-xs text-foreground">{latestAssistantText}</p>
          </div>
        ) : null}
      </aside>
      ) : null}
    </div>
  )
}
